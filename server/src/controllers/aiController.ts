import { randomUUID } from 'crypto';
import { createRequestCancellation } from '../utils/requestCancellation';
import { isCancellationError } from '../modules/loadbalancer/services/operation.service';
import { hasAnyProviderConfigured } from '../modules/ai/services/model-provider.service';
import { openSseChannel } from '../modules/ai/services/sse.service';
import { createTrace, runAgent } from '../modules/ai/services/agent.service';
import { recordAiRun } from '../modules/ai/services/audit.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

const MAX_PROMPT_LENGTH = 2000;

export const generateWithAi = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401);
    return next(new Error('Not authenticated'));
  }

  if (!hasAnyProviderConfigured()) {
    res.status(503);
    return next(new Error('AI provisioning is not configured on this server.'));
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    res.status(400);
    return next(new Error('A prompt is required'));
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    res.status(400);
    return next(new Error(`Prompt must not exceed ${MAX_PROMPT_LENGTH} characters`));
  }

  const runId = randomUUID();
  const cancellation = createRequestCancellation(req, res, runId);

  // From here the response is a stream: every outcome, including failure, is an SSE frame.
  const stagedHeaders = res.getHeaders();
  res.hijack();
  const { emit, close } = openSseChannel(res.raw, stagedHeaders);
  emit('run_start', { runId });

  const startedAt = Date.now();
  const trace = createTrace();

  try {
    const run = await runAgent({
      runId,
      userId,
      userEmail: req.user?.email ?? null,
      prompt,
      cancellation,
      emit,
      trace,
    });

    emit('done', {
      outcome: run.outcome,
      message: run.message,
      loadBalancers: run.loadBalancers,
      pendingAction: run.pendingAction ?? null,
    });

    await recordAiRun({ userId, prompt, trace, outcome: run.outcome, durationMs: Date.now() - startedAt });
  } catch (error: any) {
    const message = isCancellationError(error) || cancellation.isCancelled()
      ? 'Request cancelled'
      : error?.message ?? 'AI generation failed';

    emit('error', { message });

    await recordAiRun({
      userId,
      prompt,
      trace,
      outcome: 'failure',
      durationMs: Date.now() - startedAt,
      error: message,
    });
  } finally {
    close();
  }
};


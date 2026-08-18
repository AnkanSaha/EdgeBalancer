import { AiRun } from '../../../models/AiRun';
import type { AgentTrace } from './agent.service';
import type { AiOutcome } from '../types/ai.types';

export interface AuditRecord {
  runId: string;
  userId: string;
  prompt: string;
  trace: AgentTrace;
  outcome: AiOutcome;
  durationMs: number;
  error?: string | null;
}

// A run that walks the ladder every iteration records hundreds of attempts, and a tool result can
// be a whole fetched page. The tail of the attempt list is where the failure is.
const MAX_RESULT_CHARS = 2000;
const MAX_MODEL_ATTEMPTS = 40;

/**
 * Best-effort: a run that already deployed a Worker must not be reported as failed because the
 * audit write failed, mirroring how create.orchestrator treats its session log.
 */
export async function recordAiRun(record: AuditRecord): Promise<void> {
  try {
    await AiRun.create({
      userId: record.userId,
      runId: record.runId,
      prompt: record.prompt,
      modelsUsed: record.trace.modelAttempts
        .slice(-MAX_MODEL_ATTEMPTS)
        .map((attempt) => ({ ...attempt, error: attempt.error ?? null })),
      finalModel: record.trace.finalModel,
      toolCalls: record.trace.toolCalls.map((call) => ({ ...call, result: call.result.slice(0, MAX_RESULT_CHARS) })),
      outcome: record.outcome,
      durationMs: record.durationMs,
      error: record.error ?? null,
    });
  } catch (error: any) {
    console.error(`AI run audit failed: ${error.message}`);
  }
}

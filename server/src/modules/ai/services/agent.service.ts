import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { SYSTEM_PROMPT, RCA_PROMPT } from '../config/systemPrompt';
import { invokeWithFallback } from './model-router.service';
import { buildTools } from './tools.service';
import { logRun } from './log.service';
import type { RequestCancellation } from '../../../utils/requestCancellation';
import type { AiEmitter, AiOutcome, ModelAttempt, PendingAction, ToolCallRecord } from '../types/ai.types';

const MAX_ITERATIONS = 12;
// A model that fails the same tool twice is guessing, not converging. Stop and explain instead
// of burning the rate limit on a third identical mistake.
const MAX_FAILURES_PER_TOOL = 2;

/**
 * Bound on every call. Everything else is sent only once find_tools has loaded it, so a run pays
 * for the schemas it actually uses instead of all ~1,500 tokens of them on every iteration. The
 * trade is one extra model call per run for the discovery step.
 */
const TOOL_FINDER = 'find_tools';

/**
 * Accumulated in place so a run that throws mid-way still leaves the caller a complete audit
 * trail of the models tried and the tools already executed.
 */
export interface AgentTrace {
  modelAttempts: ModelAttempt[];
  toolCalls: ToolCallRecord[];
  loadBalancers: unknown[];
  finalModel: string | null;
}

export const createTrace = (): AgentTrace => ({
  modelAttempts: [],
  toolCalls: [],
  loadBalancers: [],
  finalModel: null,
});

export interface AgentRun {
  outcome: AiOutcome;
  message: string;
  loadBalancers: unknown[];
  pendingAction?: PendingAction;
}

const textOf = (message: AIMessage): string =>
  typeof message.content === 'string'
    ? message.content.trim()
    : (message.content as any[])
        .map((part) => (typeof part === 'string' ? part : part?.text ?? ''))
        .join('')
        .trim();

export async function runAgent(params: {
  runId: string;
  userId: string;
  userEmail: string | null;
  prompt: string;
  cancellation: RequestCancellation;
  emit: AiEmitter;
  trace: AgentTrace;
}): Promise<AgentRun> {
  const { runId, userId, userEmail, prompt, cancellation, emit, trace } = params;
  const { modelAttempts, toolCalls, loadBalancers } = trace;
  const log = logRun(runId);

  log.info(`prompt: ${prompt}`);

  const proposed: { current: PendingAction | null } = { current: null };
  const unlocked = new Set<string>();
  const tools = buildTools({ runId, userId, userEmail, cancellation, emit, log, touched: loadBalancers, proposed, unlocked });
  const toolsByName = new Map(tools.map((t) => [t.name, t]));

  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(prompt)];
  const failuresByTool = new Map<string, number>();

  const finish = (outcome: AiOutcome, message: string): AgentRun => {
    log.info(`outcome=${outcome} — ${message}`);
    return { outcome, message, loadBalancers, ...(proposed.current ? { pendingAction: proposed.current } : {}) };
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    await cancellation.throwIfCancelled();

    emit('status', {
      message: iteration === 0 ? 'Interpreting your request' : 'Deciding the next step',
      progress: progressFor(iteration),
    });

    // Only what the model *sees* is filtered — toolsByName stays complete, so a tool it remembers
    // from an earlier turn still executes rather than erroring back as unknown.
    const bound = tools.filter((t) => t.name === TOOL_FINDER || unlocked.has(t.name));
    log.info(`iteration ${iteration} — bound ${bound.length}/${tools.length}: ${bound.map((t) => t.name).join(', ')}`);

    const { response, model } = await invokeWithFallback({ messages, tools: bound, attempts: modelAttempts, emit, log });
    trace.finalModel = model;
    messages.push(response);

    const calls = response.tool_calls ?? [];
    if (calls.length === 0) {
      const message = textOf(response);
      // No tool ran at all: the model refused an out-of-scope prompt or asked for missing detail.
      if (toolCalls.length === 0) return finish('refused', message || 'Done.');

      // It stopped after using tools — success only if it actually got something done.
      const failed = toolCalls.some((call) => !call.ok);
      if (failed && loadBalancers.length === 0) {
        return finish('failure', await explain({ messages, trace, emit, log, fallback: message }));
      }
      return finish('success', message || 'Done.');
    }

    // Sequential: a create depends on the zone lookup before it, and serialised Cloudflare
    // writes keep the orchestrators' rollback semantics intact.
    for (const call of calls) {
      await cancellation.throwIfCancelled();

      const args = (call.args ?? {}) as Record<string, unknown>;
      emit('tool_start', { name: call.name, args });
      log.info(`tool ${call.name} ← ${JSON.stringify(args)}`);

      const startedAt = Date.now();
      const { result, ok, terminal } = await executeTool(toolsByName, call.name, args);
      const durationMs = Date.now() - startedAt;

      log[ok ? 'info' : 'warn'](`tool ${call.name} → ${ok ? 'ok' : 'failed'} in ${durationMs}ms: ${result.slice(0, 300)}`);

      toolCalls.push({
        name: call.name,
        args,
        result,
        ok,
        durationMs,
      });

      emit('tool_result', { name: call.name, ok, summary: summarize(result) });
      messages.push(new ToolMessage({ content: result, tool_call_id: call.id ?? call.name }));

      // A destructive step was resolved but deliberately not performed. Nothing further should
      // run — the user confirms it against the ordinary REST routes.
      if (proposed.current) {
        return finish('pending', proposed.current.summary);
      }

      if (ok) {
        failuresByTool.delete(call.name);
        continue;
      }

      // A conflict is the user's to resolve. Retrying can only "succeed" by silently changing
      // what they asked for — a different name, a different hostname — so stop and explain.
      if (terminal) {
        log.warn(`${call.name} hit a conflict — stopping without retrying`);
        return finish('failure', await explain({ messages, trace, emit, log }));
      }

      const failures = (failuresByTool.get(call.name) ?? 0) + 1;
      failuresByTool.set(call.name, failures);

      if (failures >= MAX_FAILURES_PER_TOOL) {
        log.warn(`${call.name} failed ${failures}x — stopping and explaining`);
        return finish('failure', await explain({ messages, trace, emit, log }));
      }
    }
  }

  return finish('failure', await explain({ messages, trace, emit, log }));
}

/**
 * Turns the raw tool errors into a paragraph the user can act on. One extra model call, with no
 * tools bound so it cannot try to "fix" anything — it only writes the root-cause analysis.
 */
async function explain(params: {
  messages: BaseMessage[];
  trace: AgentTrace;
  emit: AiEmitter;
  log: ReturnType<typeof logRun>;
  fallback?: string;
}): Promise<string> {
  const { messages, trace, emit, log, fallback } = params;

  const lastError = [...trace.toolCalls].reverse().find((call) => !call.ok);
  const rawError = lastError ? errorTextOf(lastError.result) : 'The request could not be completed.';

  try {
    const { response } = await invokeWithFallback({
      messages: [...messages, new HumanMessage(RCA_PROMPT)],
      tools: [],
      attempts: trace.modelAttempts,
      emit,
      log,
    });

    const text = textOf(response);
    if (text) return text;
  } catch (error: any) {
    log.warn(`RCA generation failed: ${error?.message}`);
  }

  return fallback || rawError;
}

interface ToolOutcome {
  result: string;
  ok: boolean;
  /** Retrying cannot help — stop the run and explain instead. */
  terminal?: boolean;
}

async function executeTool(
  toolsByName: Map<string, { invoke: (args: any) => Promise<any> }>,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolOutcome> {
  const selected = toolsByName.get(name);
  if (!selected) {
    return { result: JSON.stringify({ ok: false, error: `Unknown tool "${name}".` }), ok: false };
  }

  try {
    const output = await selected.invoke(args);
    const result = typeof output === 'string' ? output : JSON.stringify(output);
    return { result, ok: !result.includes('"ok":false') };
  } catch (error: any) {
    // Surfaced back to the model so it can correct itself rather than killing the run.
    // `verboseParsingErrors` on every tool makes LangChain name the offending fields here.
    const statusCode = error?.statusCode;
    return {
      result: JSON.stringify({ ok: false, error: error?.message ?? 'Tool failed', ...(statusCode ? { statusCode } : {}) }),
      ok: false,
      terminal: statusCode === 409,
    };
  }
}

const errorTextOf = (result: string): string => {
  try {
    return String(JSON.parse(result)?.error ?? result);
  } catch {
    return result;
  }
};

const summarize = (result: string): string => {
  try {
    const parsed = JSON.parse(result);
    if (parsed?.ok === false) return String(parsed.error);
    if (parsed?.data?.zones) return `${parsed.data.zones.length} zone(s) found`;
    if (parsed?.data?.loadBalancers) return `${parsed.data.loadBalancers.length} load balancer(s) found`;
    if (parsed?.data?.fullDomain) return String(parsed.data.fullDomain);
    if (parsed?.data?.message) return String(parsed.data.message);
    return 'Completed';
  } catch {
    return result.slice(0, 160);
  }
};

// Asymptotic: the loop length is unknown up front, so approach 90% without ever claiming done.
const progressFor = (iteration: number): number => Math.round(90 - 70 / (iteration + 1));

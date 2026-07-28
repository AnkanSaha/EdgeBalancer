import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { SYSTEM_PROMPT, RCA_PROMPT } from '../config/systemPrompt';
import { invokeWithFallback, createRouterState } from './model-router.service';
import { buildTools, MUTATING_TOOL_NAMES } from './tools.service';
import { RESEARCH_TOOL_NAMES } from './research.service';
import { logRun } from './log.service';
import type { RequestCancellation } from '../../../utils/requestCancellation';
import type { AiEmitter, AiOutcome, ModelAttempt, PendingAction, ToolCallRecord } from '../types/ai.types';

const MAX_ITERATIONS = 12;
// A model that fails the same tool twice is guessing, not converging. Stop and explain instead
// of burning the rate limit on a third identical mistake.
const MAX_FAILURES_PER_TOOL = 2;

// Always bound. Everything else is sent only once find_tools has loaded it, trading one discovery
// call for not re-sending ~1,500 tokens of schema on every iteration.
const TOOL_FINDER = 'find_tools';

// RCA gets its own budget so a failure at iteration 12 still gets explained.
const MAX_RCA_ITERATIONS = 3;
const RESEARCH_TOOLS = new Set<string>(RESEARCH_TOOL_NAMES);
const MUTATING_TOOLS = new Set<string>(MUTATING_TOOL_NAMES);

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
  const routerState = createRouterState();

  const finish = (outcome: AiOutcome, message: string): AgentRun => {
    log.info(`outcome=${outcome} — ${message}`);
    return { outcome, message, loadBalancers, ...(proposed.current ? { pendingAction: proposed.current } : {}) };
  };

  const rawError = (): string => {
    const failed = [...toolCalls].reverse().find((call) => !call.ok);
    return failed ? errorTextOf(failed.result) : 'The request could not be completed.';
  };

  let iteration = 0;
  let rcaStep = 0;
  let rcaMode = false;
  let rcaFallback = '';

  // Keeps the same chain — the model explains from the tool results already in it.
  const enterRca = () => {
    messages.push(new HumanMessage(RCA_PROMPT));
    rcaMode = true;
    log.info('entering RCA — research tools only');
  };

  while (true) {
    if (!rcaMode && iteration >= MAX_ITERATIONS) enterRca();
    if (rcaMode && rcaStep >= MAX_RCA_ITERATIONS) break;

    if (rcaMode) rcaStep += 1;
    else iteration += 1;

    await cancellation.throwIfCancelled();

    emit('status', {
      message: rcaMode
        ? 'Working out what went wrong'
        : iteration === 1 ? 'Interpreting your request' : 'Deciding the next step',
      progress: rcaMode ? 95 : progressFor(iteration - 1),
    });

    // Only what the model sees is filtered; toolsByName stays complete. RCA narrows to the
    // read-only web tools so it can research the failure but never retry it.
    const bound = rcaMode
      ? tools.filter((t) => RESEARCH_TOOLS.has(t.name))
      : tools.filter((t) => t.name === TOOL_FINDER || unlocked.has(t.name));
    log.info(`${rcaMode ? 'rca' : 'iteration'} ${rcaMode ? rcaStep : iteration - 1} — bound ${bound.length}/${tools.length}: ${bound.map((t) => t.name).join(', ')}`);

    let response;
    let model;
    try {
      ({ response, model } = await invokeWithFallback({ messages, tools: bound, attempts: modelAttempts, emit, log, state: routerState }));
    } catch (error: any) {
      // The run has already failed by then, so a dead ladder must not swallow the real error.
      if (!rcaMode) throw error;

      log.warn(`RCA generation failed: ${error?.message}`);
      return finish('failure', rcaFallback || rawError());
    }

    trace.finalModel = model;
    messages.push(response);

    const calls = response.tool_calls ?? [];
    if (calls.length === 0) {
      const message = textOf(response);
      if (rcaMode) return finish('failure', message || rcaFallback || rawError());

      // No tool ran at all: the model refused an out-of-scope prompt or asked for missing detail.
      if (toolCalls.length === 0) return finish('refused', message || 'Done.');

      // Loading a mutating tool is the model stating intent to change something. Ending with
      // nothing changed means it abandoned the job, whether or not a tool actually failed.
      const failed = toolCalls.some((call) => !call.ok);
      const intendedChange = [...unlocked].some((name) => MUTATING_TOOLS.has(name));

      if ((failed || intendedChange) && loadBalancers.length === 0) {
        rcaFallback = message;
        enterRca();
        continue;
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

      // A failed search during RCA is not worth a second RCA — the model writes up what it has.
      if (rcaMode) continue;

      // A conflict is the user's to resolve. Retrying can only "succeed" by silently changing
      // what they asked for — a different name, a different hostname — so stop and explain.
      if (terminal) {
        log.warn(`${call.name} hit a conflict — stopping without retrying`);
        enterRca();
        break;
      }

      const failures = (failuresByTool.get(call.name) ?? 0) + 1;
      failuresByTool.set(call.name, failures);

      if (failures >= MAX_FAILURES_PER_TOOL) {
        log.warn(`${call.name} failed ${failures}x — stopping and explaining`);
        enterRca();
        break;
      }
    }
  }

  return finish('failure', rcaFallback || rawError());
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

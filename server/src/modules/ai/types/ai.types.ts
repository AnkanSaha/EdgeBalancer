export type ModelProvider = 'mistral' | 'openrouter';

export interface ModelDescriptor {
  provider: ModelProvider;
  model: string;
  /** Requests per second this model allows. Omitted where the provider publishes no figure. */
  rps?: number;
}

export type AiEventName =
  | 'run_start'
  | 'model_switch'
  | 'status'
  | 'tool_start'
  | 'tool_result'
  | 'done'
  | 'error';

export type AiEmitter = (event: AiEventName, payload: Record<string, unknown>) => void;

export type AiOutcome = 'success' | 'failure' | 'pending' | 'refused';

export type PendingActionKind = 'delete' | 'pause' | 'resume' | 'update';

/**
 * A destructive step the agent has resolved but deliberately not performed. The client executes
 * it against the normal REST routes once the user confirms, so the run never has to pause.
 */
export interface PendingAction {
  action: PendingActionKind;
  loadBalancerId: string;
  name: string;
  fullDomain: string;
  summary: string;
  /** Body for the follow-up request — the pause mode, or the full config for an update. */
  payload?: Record<string, unknown>;
}

export interface ModelAttempt {
  provider: ModelProvider;
  model: string;
  ok: boolean;
  error?: string;
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: string;
  ok: boolean;
  durationMs: number;
}

export interface AgentRunResult {
  outcome: AiOutcome;
  message: string;
  loadBalancers: unknown[];
}

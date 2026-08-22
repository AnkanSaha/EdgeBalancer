import type { RequestCancellation } from '../../../../utils/requestCancellation';
import type { AiEmitter } from '../../types/ai.types';
import type { RunLogger } from '../log.service';

export interface ToolContext {
  runId: string;
  userId: string;
  userEmail: string | null;
  cancellation: RequestCancellation;
  emit: AiEmitter;
  log: RunLogger;
  /** Load balancers created or modified during the run, surfaced to the client on completion. */
  touched: unknown[];
  /** Tool names find_tools has loaded; the agent loop binds only these plus find_tools. */
  unlocked: Set<string>;
}

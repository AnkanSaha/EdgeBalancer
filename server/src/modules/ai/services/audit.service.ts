import { AiRun } from '../../../models/AiRun';
import type { AgentTrace } from './agent.service';
import type { AiOutcome } from '../types/ai.types';

export interface AuditRecord {
  userId: string;
  prompt: string;
  trace: AgentTrace;
  outcome: AiOutcome;
  durationMs: number;
  error?: string | null;
}

/**
 * Best-effort: a run that already deployed a Worker must not be reported as failed because the
 * audit write failed, mirroring how create.orchestrator treats its session log.
 */
export async function recordAiRun(record: AuditRecord): Promise<void> {
  try {
    await AiRun.create({
      userId: record.userId,
      prompt: record.prompt,
      modelsUsed: record.trace.modelAttempts.map((attempt) => ({ ...attempt, error: attempt.error ?? null })),
      finalModel: record.trace.finalModel,
      toolCalls: record.trace.toolCalls,
      outcome: record.outcome,
      durationMs: record.durationMs,
      error: record.error ?? null,
    });
  } catch (error: any) {
    console.error(`AI run audit failed: ${error.message}`);
  }
}

import { AiRun } from '../../../models/AiRun';
import type { AgentTrace } from './agent.service';
import type { AiOutcome, ConversationTurn } from '../types/ai.types';

export interface AuditRecord {
  runId: string;
  userId: string;
  prompt: string;
  trace: AgentTrace;
  outcome: AiOutcome;
  durationMs: number;
  error?: string | null;
  /** Conversation chain behind the run — every clarification round-trip is preserved. */
  turns?: ConversationTurn[];
  /** The agent's final answer or question, as shown to the user. */
  finalMessage?: string;
  /**
   * On continuation turns the client echoes back the runId of the conversation's first turn.
   * The existing document is then updated in place — one history entry per conversation, no
   * extra schema field. Absent on a fresh conversation.
   */
  conversationId?: string | null;
}

// A run that walks the ladder every iteration records hundreds of attempts, and a tool result can
// be a whole fetched page. The tail of the attempt list is where the failure is.
const MAX_RESULT_CHARS = 2000;
const MAX_MODEL_ATTEMPTS_PER_TURN = 40;

/**
 * Best-effort: a run that already deployed a Worker must not be reported as failed because the
 * audit write failed, mirroring how create.orchestrator treats its session log.
 */
export async function recordAiRun(record: AuditRecord): Promise<void> {
  const attempts = record.trace.modelAttempts
    .slice(-MAX_MODEL_ATTEMPTS_PER_TURN)
    .map((attempt) => ({ ...attempt, error: attempt.error ?? null }));
  const calls = record.trace.toolCalls.map((call) => ({ ...call, result: call.result.slice(0, MAX_RESULT_CHARS) }));

  try {
    if (record.conversationId) {
      // Continuation turn: append this turn's steps to the conversation's document. The prompt
      // and createdAt stay pinned to the opening request; durationMs accumulates across turns.
      const updated = await AiRun.findOneAndUpdate(
        { userId: record.userId, runId: record.conversationId },
        {
          $set: {
            turns: record.turns ?? [],
            finalModel: record.trace.finalModel,
            outcome: record.outcome,
            finalMessage: record.finalMessage ?? null,
            error: record.error ?? null,
          },
          $push: {
            modelsUsed: { $each: attempts, $slice: -200 },
            toolCalls: { $each: calls, $slice: -200 },
          },
          $inc: { durationMs: record.durationMs },
        },
        { new: true },
      );
      // Stale echo (doc deleted mid-conversation): fall through and log this turn standalone.
      if (updated) return;
    }

    await AiRun.create({
      userId: record.userId,
      runId: record.runId,
      prompt: record.prompt,
      modelsUsed: attempts,
      finalModel: record.trace.finalModel,
      toolCalls: calls,
      outcome: record.outcome,
      finalMessage: record.finalMessage ?? null,
      durationMs: record.durationMs,
      error: record.error ?? null,
      turns: record.turns ?? [],
    });
  } catch (error: any) {
    console.error(`AI run audit failed: ${error.message}`);
  }
}

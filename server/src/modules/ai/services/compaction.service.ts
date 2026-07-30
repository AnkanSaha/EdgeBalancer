import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { invokeWithFallback, createRouterState } from './model-router.service';
import type { ModelDescriptor, ModelAttempt } from '../types/ai.types';
import type { RunLogger } from './log.service';
import type { StructuredToolInterface } from '@langchain/core/tools';

const SUMMARIZE_THRESHOLD = 10;
const MAX_HISTORY_MESSAGES = 15;
const SUMMARY_MAX_CHARS = 550;

export interface CompactionResult {
  messages: BaseMessage[];
  summarized: boolean;
}

const SUMMARIZATION_SYSTEM_PROMPT = `You are a conversation summarizer for a load balancer management agent.

STRICT RULES - DO NOT VIOLATE:
1. PRESERVE ALL CRITICAL CONTEXT - zero tolerance for omissions
2. Must include: user's original intent and constraints
3. Must include: EVERY tool called, with arguments and key results
4. Must include: errors, conflicts, validation failures, and their exact details
5. Must include: current state (zones found, load balancers listed, IDs resolved)
6. Must include: any pending confirmations or unresolved decisions
7. DO NOT OMIT: specific domain names, origin URLs, strategy names, zone IDs, load balancer names, error messages
8. FORMAT: Single paragraph, past tense, third-person. No bullet points, no markdown.
9. Target length: approximately 500-600 WORDS.`;

function formatMessage(msg: BaseMessage): string {
  if (msg instanceof HumanMessage) return `User: ${msg.content}`;
  if (msg instanceof AIMessage) {
    const toolCalls = msg.tool_calls?.map((tc) => `${tc.name}(${JSON.stringify(tc.args)})`).join(', ');
    return `Assistant${toolCalls ? ` [tools: ${toolCalls}]` : ''}: ${msg.content}`;
  }
  if (msg instanceof ToolMessage) return `Tool(${msg.tool_call_id}): ${msg.content}`;
  return `${msg.constructor.name}: ${msg.content}`;
}

function findSystemMessage(messages: BaseMessage[]): SystemMessage | null {
  for (const msg of messages) {
    if (msg instanceof SystemMessage) return msg;
  }
  return null;
}

function buildUserPrompt(messages: BaseMessage[]): string {
  const formatted = messages.map(formatMessage).join('\n\n');
  return (
    `Summarize the following conversation history in approximately 500-600 WORDS.\n\n` +
    `Conversation to summarize:\n` +
    formatted
  );
}

export async function compactHistory(
  messages: BaseMessage[],
  log: RunLogger,
  systemPrompt: string,
  modelLadder: ModelDescriptor[],
): Promise<CompactionResult> {
  if (messages.length <= SUMMARIZE_THRESHOLD) {
    return { messages, summarized: false };
  }

  const systemMsg = findSystemMessage(messages);
  if (!systemMsg) {
    log.warn('No SystemMessage found in history, skipping compaction');
    return { messages, summarized: false };
  }

  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  const toSummarize = messages.slice(1, -MAX_HISTORY_MESSAGES);

  if (toSummarize.length === 0) {
    return { messages, summarized: false };
  }

  const userPrompt = buildUserPrompt(toSummarize);

  const noopEmit = () => undefined;
  const emptyTools: StructuredToolInterface[] = [];
  const emptyAttempts: ModelAttempt[] = [];

  try {
    const { response } = await invokeWithFallback({
      messages: [new SystemMessage(SUMMARIZATION_SYSTEM_PROMPT), new HumanMessage(userPrompt)],
      tools: emptyTools,
      attempts: emptyAttempts,
      emit: noopEmit,
      log,
      state: createRouterState(),
    });

    const summary = String(response.content).trim();
    const summaryMsg = new AIMessage({ content: `[Conversation Summary]: ${summary}` });

    log.info(`Compacted history: ${toSummarize.length} messages → 1 summary (${summary.split(/\s+/).length} words)`);

    return {
      messages: [systemMsg, summaryMsg, ...recent],
      summarized: true,
    };
  } catch (error: any) {
    log.warn(`Summarization failed, keeping full history: ${error?.message}`);
    return { messages, summarized: false };
  }
}
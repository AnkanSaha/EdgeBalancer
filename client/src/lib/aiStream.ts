import type { AiEvent, ConversationTurn } from '@/types/api';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'https://apiedge.nexoral.in'}/api`;

/**
 * Streams an AI Agent run. Uses fetch rather than the axios singleton in `api.ts`
 * because axios cannot expose a response body incrementally in the browser, and rather than
 * EventSource because the conversation chain has to be sent in a POST body.
 *
 * `history` is everything said so far in this conversation — earlier turns first. The server
 * appends `prompt` as the newest user message, so a clarification round-trip resumes with full
 * context.
 */
export async function streamAiGeneration(
  prompt: string,
  options: {
    history?: ConversationTurn[];
    /** runId of the conversation's first turn — continuation turns update that history entry. */
    conversationId?: string | null;
    onEvent: (event: AiEvent) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const response = await fetch(`${API_BASE}/ai/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      messages: options.history ?? [],
      conversationId: options.conversationId ?? undefined,
    }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    const message = await response
      .json()
      .then((body) => body?.message)
      .catch(() => null);
    throw new Error(message || `AI request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Frames are separated by a blank line; the tail may be a partial frame.
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseFrame(frame);
      if (parsed) options.onEvent(parsed);
      boundary = buffer.indexOf('\n\n');
    }
  }
}

function parseFrame(frame: string): AiEvent | null {
  let name = '';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith('event: ')) name = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
  }

  if (!name || dataLines.length === 0) return null;

  try {
    return { name, payload: JSON.parse(dataLines.join('\n')) } as AiEvent;
  } catch {
    return null;
  }
}

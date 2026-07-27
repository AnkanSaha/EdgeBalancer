import type { ServerResponse } from 'http';
import type { AiEmitter, AiEventName } from '../types/ai.types';

type StagedHeaders = Record<string, string | number | string[] | undefined>;

const KEEPALIVE_MS = 20000;

export interface SseChannel {
  emit: AiEmitter;
  close: () => void;
}

/**
 * `baseHeaders` carries over what Fastify hooks staged on the reply (CORS above all) — writing
 * the head directly bypasses the normal flush, and without them the browser blocks the stream.
 */
export function openSseChannel(raw: ServerResponse, baseHeaders: StagedHeaders = {}): SseChannel {
  raw.writeHead(200, {
    ...baseHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Proxies drop idle streams; a comment frame is a no-op for EventSource parsers.
  const keepalive = setInterval(() => {
    if (!raw.writableEnded) raw.write(': keepalive\n\n');
  }, KEEPALIVE_MS);

  const emit = (event: AiEventName, payload: Record<string, unknown>) => {
    if (raw.writableEnded) return;
    raw.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  const close = () => {
    clearInterval(keepalive);
    if (!raw.writableEnded) raw.end();
  };

  return { emit, close };
}

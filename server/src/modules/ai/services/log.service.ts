/**
 * Agent runs are long and mostly invisible — without this the terminal shows nothing between
 * the request line and the response. Plain console keeps it consistent with the orchestrators,
 * which already log this way, and avoids threading the Fastify logger through every service.
 */
export interface RunLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
}

const SILENT = process.env.NODE_ENV === 'test';

export function logRun(runId: string): RunLogger {
  const tag = `[ai ${runId.slice(0, 8)}]`;

  return {
    info: (message) => {
      if (!SILENT) console.log(`${tag} ${message}`);
    },
    warn: (message) => {
      if (!SILENT) console.warn(`${tag} ${message}`);
    },
  };
}

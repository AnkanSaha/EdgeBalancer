import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'crypto';

interface IdempotencyRecord {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  requestBodyHash: string;
  timestamp: number;
}

class IdempotencyStore {
  private store: Map<string, IdempotencyRecord>;
  private processingKeys: Set<string>;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    this.store = new Map();
    this.processingKeys = new Set();
    this.ttl = ttlMs;

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, record] of this.store.entries()) {
      if (now - record.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`✨ Cleaned up ${keysToDelete.length} expired idempotency keys`);
    }
  }

  isProcessing(key: string): boolean {
    return this.processingKeys.has(key);
  }

  startProcessing(key: string): void {
    this.processingKeys.add(key);
  }

  finishProcessing(key: string): void {
    this.processingKeys.delete(key);
  }

  get(key: string): IdempotencyRecord | undefined {
    const record = this.store.get(key);
    if (!record) return undefined;

    if (Date.now() - record.timestamp > this.ttl) {
      this.store.delete(key);
      return undefined;
    }

    return record;
  }

  set(key: string, record: Omit<IdempotencyRecord, 'timestamp'>): void {
    this.store.set(key, {
      ...record,
      timestamp: Date.now(),
    });
  }

  incrementHitCount(): void {
    // Track cache hits for monitoring
    (this as any).hitCount = ((this as any).hitCount || 0) + 1;
  }

  getHitCount(): number {
    return (this as any).hitCount || 0;
  }

  getStats(): { totalKeys: number; processingKeys: number; hitCount: number; hitRate: string } {
    const hitCount = this.getHitCount();
    const totalRequests = hitCount + this.store.size;
    const hitRate = totalRequests > 0 ? ((hitCount / totalRequests) * 100).toFixed(2) : '0.00';

    return {
      totalKeys: this.store.size,
      processingKeys: this.processingKeys.size,
      hitCount,
      hitRate: `${hitRate}%`,
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
    this.processingKeys.clear();
  }
}

const idempotencyStore = new IdempotencyStore();

// Graceful shutdown
process.on('SIGTERM', () => idempotencyStore.destroy());
process.on('SIGINT', () => idempotencyStore.destroy());

/**
 * Hash request body for validation
 */
function hashRequestBody(body: any): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(body || {}))
    .digest('hex');
}

async function idempotencyPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only apply to mutation methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return;
    }

    const idempotencyKey = request.headers['idempotency-key'] as string;

    // No idempotency key = skip
    if (!idempotencyKey) {
      return;
    }

    // Validate key format
    if (idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid idempotency key format. Must be 16-128 characters.',
      });
    }

    // Create composite key
    const userId = (request as any).user?.userId || 'anonymous';
    const compositeKey = crypto
      .createHash('sha256')
      .update(`${userId}:${request.url}:${idempotencyKey}`)
      .digest('hex');

    // Check if processing
    if (idempotencyStore.isProcessing(compositeKey)) {
      return reply.status(409).send({
        success: false,
        message: 'Request is already being processed. Please wait.',
      });
    }

    // Check cache
    const cachedResponse = idempotencyStore.get(compositeKey);
    if (cachedResponse) {
      // Validate request body matches cached request
      const currentBodyHash = hashRequestBody(request.body);

      if (cachedResponse.requestBodyHash !== currentBodyHash) {
        return reply.status(409).send({
          success: false,
          message: 'Idempotency key reused with different request body',
          code: 'IDEMPOTENCY_KEY_MISMATCH',
        });
      }

      console.log(`🔄 Idempotency hit: ${compositeKey.substring(0, 12)}...`);
      idempotencyStore.incrementHitCount();

      return reply
        .status(cachedResponse.statusCode)
        .headers(cachedResponse.headers)
        .send(cachedResponse.body);
    }

    // Mark as processing
    idempotencyStore.startProcessing(compositeKey);

    // Store composite key for later use
    (request as any).idempotencyKey = compositeKey;
  });

  fastify.addHook('preSerialization', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    const compositeKey = (request as any).idempotencyKey;

    if (!compositeKey) {
      return payload;
    }

    const statusCode = reply.statusCode;

    // Store successful responses (2xx) and client errors (4xx)
    // Don't cache server errors (5xx) to allow retry
    if (statusCode >= 200 && statusCode < 500) {
      const requestBodyHash = hashRequestBody(request.body);

      idempotencyStore.set(compositeKey, {
        statusCode,
        headers: reply.getHeaders() as Record<string, string>,
        body: payload,
        requestBodyHash,
      });

      console.log(`💾 Idempotency stored: ${compositeKey.substring(0, 12)}... (status: ${statusCode})`);
    }

    // Always mark as finished
    idempotencyStore.finishProcessing(compositeKey);

    return payload;
  });

  // Add stats endpoint
  fastify.get('/api/idempotency/stats', async () => ({
    success: true,
    data: idempotencyStore.getStats(),
  }));
}

export default fp(idempotencyPlugin, {
  name: 'idempotency',
  fastify: '5.x',
});

export { idempotencyStore };

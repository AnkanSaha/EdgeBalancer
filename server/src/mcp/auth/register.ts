import { randomBytes } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

const clients = new Map<string, { clientName: string; redirectUris: string[]; createdAt: number }>();

setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, c] of clients) {
    if (c.createdAt < cutoff) clients.delete(id);
  }
}, 60_000);

export async function handleRegister(request: FastifyRequest, reply: FastifyReply) {
  const body = (request.body ?? {}) as Record<string, unknown>;

  const clientName = (body.client_name as string) || 'mcp-client';
  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as string[])
    : [];

  const clientId = randomBytes(16).toString('hex');

  clients.set(clientId, { clientName, redirectUris, createdAt: Date.now() });

  return reply.code(201).send({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  });
}

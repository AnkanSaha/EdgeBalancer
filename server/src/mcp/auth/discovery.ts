import type { FastifyRequest, FastifyReply } from 'fastify';

export async function handleDiscovery(request: FastifyRequest, reply: FastifyReply) {
  const proto = request.headers['x-forwarded-proto'] as string || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const origin = `${proto}://${request.headers.host}`;

  return reply.send({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp:read', 'mcp:write'],
  });
}

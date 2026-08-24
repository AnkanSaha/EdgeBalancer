import type { FastifyRequest, FastifyReply } from 'fastify';

function getOrigin(request: FastifyRequest): string {
  const proto = request.headers['x-forwarded-proto'] as string || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${request.headers.host}`;
}

export async function handleDiscovery(request: FastifyRequest, reply: FastifyReply) {
  const origin = getOrigin(request);

  return reply.send({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp:read', 'mcp:write'],
  });
}

export async function handleAuthorizationServerMetadata(request: FastifyRequest, reply: FastifyReply) {
  const origin = getOrigin(request);

  return reply.send({
    issuer: origin,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/mcp/auth/token`,
    registration_endpoint: `${origin}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp:read', 'mcp:write'],
  });
}

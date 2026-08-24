import type { FastifyInstance } from 'fastify';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toWebRequest } from '@modelcontextprotocol/node';
import { verifyBearerToken } from './auth/verify';
import { handleDiscovery } from './auth/discovery';
import { handleToken } from './auth/token';
import { handleAuthorizeGet, handleAuthorizePost } from './auth/authorize';
import { createMcpServer } from './server';
import type { McpUserContext } from './types';

export default async function mcpPlugin(app: FastifyInstance) {
  app.get('/.well-known/oauth-protected-resource', handleDiscovery);
  app.post('/mcp/auth/token', handleToken);
  app.get('/authorize', handleAuthorizeGet);
  app.post('/authorize', handleAuthorizePost);

  const mcpHandler = createMcpHandler(async (ctx) => {
    const user = ctx.authInfo?.extra as unknown as McpUserContext;
    return createMcpServer(user);
  });

  app.all('/mcp', async (request, reply) => {
    const user = verifyBearerToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    const webRequest = await toWebRequest(request.raw, request.body);
    const webResponse = await mcpHandler.fetch(webRequest, {
      authInfo: {
        token: '',
        clientId: 'mcp-client',
        scopes: ['mcp:read', 'mcp:write'],
        extra: user as unknown as Record<string, unknown>,
      },
    });

    reply.code(webResponse.status);
    for (const [key, value] of webResponse.headers) {
      reply.header(key, value);
    }

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply.raw.write(value);
        }
        reply.raw.end();
      };
      pump().catch(() => reply.raw.destroy());
      return reply;
    }

    return reply.send(null);
  });
}

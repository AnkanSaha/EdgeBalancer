import type { FastifyInstance } from 'fastify';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toWebRequest } from '@modelcontextprotocol/node';
import { verifyBearerToken } from './auth/verify';
import { handleDiscovery, handleAuthorizationServerMetadata } from './auth/discovery';
import { handleToken } from './auth/token';
import { handleAuthorizeGet, handleAuthorizePost } from './auth/authorize';
import { handleRegister } from './auth/register';
import { createMcpServer } from './server';
import type { McpUserContext } from './types';

export default async function mcpPlugin(app: FastifyInstance) {
  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_, body, done) => {
    try {
      const params = new URLSearchParams(body as string);
      const obj: Record<string, string> = {};
      params.forEach((v, k) => { obj[k] = v; });
      done(null, obj);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  app.get('/.well-known/oauth-protected-resource', handleDiscovery);
  app.get('/.well-known/oauth-authorization-server', handleAuthorizationServerMetadata);
  app.post('/mcp/auth/token', handleToken);
  app.post('/register', handleRegister);
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

    reply.hijack();
    reply.raw.writeHead(webResponse.status, Object.fromEntries(webResponse.headers));

    if (webResponse.body) {
      const reader = webResponse.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            reply.raw.write(value);
          }
        } finally {
          reply.raw.end();
        }
      };
      pump().catch(() => reply.raw.destroy());
    } else {
      reply.raw.end();
    }
  });
}

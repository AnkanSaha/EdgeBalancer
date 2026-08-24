import { randomBytes } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { generateToken } from '../../utils/jwt';

const codes = new Map<string, { userId: string; email: string | null; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of codes) {
    if (value.expiresAt < now) codes.delete(key);
  }
}, 60_000);

export function generateAuthorizationCode(userId: string, email: string | null): string {
  const code = randomBytes(32).toString('hex');
  codes.set(code, { userId, email, expiresAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

export async function handleToken(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as Record<string, unknown> | undefined;
  const code = body?.code as string | undefined;
  const grantType = body?.grant_type as string | undefined;

  if (grantType !== 'authorization_code' || !code) {
    return reply.code(400).send({ error: 'invalid_request' });
  }

  const stored = codes.get(code);
  if (!stored || stored.expiresAt < Date.now()) {
    return reply.code(400).send({ error: 'invalid_grant' });
  }

  codes.delete(code);

  const token = generateToken({ userId: stored.userId, email: stored.email });

  return reply.send({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 86400,
  });
}

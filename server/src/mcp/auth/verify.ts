import type { FastifyRequest } from 'fastify';
import { verifyToken } from '../../utils/jwt';
import type { McpUserContext } from '../types';

export function verifyBearerToken(request: FastifyRequest): McpUserContext | null {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.stage) return null;
    return { userId: payload.userId, email: payload.email ?? null };
  } catch {
    return null;
  }
}

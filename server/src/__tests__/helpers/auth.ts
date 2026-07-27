import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import type { JwtPayload } from '../../utils/jwt';

const secret = () => process.env.JWT_SECRET!;

export function makeTestJwt(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '1h' });
}

export function authCookieHeader(token: string): Record<string, string> {
  return { cookie: `token=${token}` };
}

export async function createTestUser(overrides: {
  name?: string;
  email?: string;
  firebaseUid?: string;
} = {}) {
  const name = overrides.name ?? 'Test User';
  const rawEmail = overrides.email ?? `testuser${Date.now()}@example.com`;

  const user = await User.create({
    name,
    email: rawEmail.toLowerCase(),
    username: `u${Date.now()}${Math.floor(Math.random() * 9999)}`,
    ...(overrides.firebaseUid ? { firebaseUid: overrides.firebaseUid } : {}),
  });

  const token = makeTestJwt({
    userId: user._id.toString(),
    email: user.email ?? undefined,
  });

  return {
    user,
    token,
    cookie: authCookieHeader(token),
  };
}

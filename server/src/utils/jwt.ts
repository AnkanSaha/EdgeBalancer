import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email?: string | null;
  firebaseUid?: string | null;
  // Present only on the short-lived two-factor tokens, which must never authenticate a request.
  stage?: 'pending-2fa' | 'passkey-register';
  challenge?: string;
}

const JWT_EXPIRY = '24h';

export const generateToken = (payload: JwtPayload, expiresIn: string = JWT_EXPIRY): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

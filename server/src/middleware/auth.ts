import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      res.status(401);
      throw new Error('Authentication required');
    }

    // Verify token
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    res.status(401);
    next(error);
  }
};

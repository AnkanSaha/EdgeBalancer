import { User } from '../models/User';
import { generateUsername } from '../utils';
import {
  CHALLENGE_COOKIE,
  PASSKEY_REG_COOKIE,
  availableMethods,
  hasSecondFactor,
  issueChallengeCookie,
  issueSessionCookie,
  toUserPayload,
} from '../utils/authSession';
import { verifyFirebaseToken, isFirebaseConfigured } from '../config/firebase';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('token');
    res.clearCookie(CHALLENGE_COOKIE);
    res.clearCookie(PASSKEY_REG_COOKIE);
    res.json({
      success: true,
      message: 'Logout successful',
      data: null,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      res.status(503);
      throw new Error('Google authentication is not configured on this server');
    }

    const { idToken } = req.body;

    if (!idToken) {
      res.status(400);
      throw new Error('Google authentication requires an ID token');
    }

    // 1. Verify Firebase ID token
    const decodedToken = await verifyFirebaseToken(idToken);
    const { email, name, uid, email_verified } = decodedToken;

    if (!email || !email_verified) {
      res.status(400);
      throw new Error('A verified Google email is required');
    }

    // 2. Find or create user
    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] 
    });

    if (!user) {
      const username = await generateUsername(name || email.split('@')[0]);
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        username,
        firebaseUid: uid,
      });
    } else {
      // Sync firebaseUid if not already set (e.g., if user registered with email previously)
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // 3. Google proved the identity — with 2FA on, that only earns a challenge, not a session.
    if (hasSecondFactor(user)) {
      issueChallengeCookie(res, user);

      res.json({
        success: true,
        message: 'Confirm it is you to finish signing in',
        data: {
          twoFactorRequired: true,
          methods: availableMethods(user),
          preferred: user.preferredSecondFactor ?? null,
        },
      });
      return;
    }

    issueSessionCookie(res, user);

    res.json({
      success: true,
      message: 'Authentication successful',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

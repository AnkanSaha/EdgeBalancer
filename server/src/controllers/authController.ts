import { User } from '../models/User';
import { generateUsername, generateToken } from '../utils';
import { verifyFirebaseToken, isFirebaseConfigured } from '../config/firebase';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('token');
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
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          hasCloudflareCredentials: !!(user.cloudflareAccountId && user.cloudflareApiToken),
        },
      },
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

    // 3. Issue JWT
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      firebaseUid: user.firebaseUid,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          hasCloudflareCredentials: !!(user.cloudflareAccountId && user.cloudflareApiToken),
        },
      },
    });
  } catch (error) {
    next(error as Error);
  }
};

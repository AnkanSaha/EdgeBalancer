import { User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { getMaskedCredentials } from '../services/credentialsService';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get masked Cloudflare credentials
    const maskedCreds = await getMaskedCredentials(userId);

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          hasCloudflareCredentials: !!(user.cloudflareAccountId && user.cloudflareApiToken),
          cloudflareAccountId: maskedCreds?.accountId || null,
          cloudflareApiToken: maskedCreds?.apiToken || null,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: null,
    });
  } catch (error) {
    next(error as Error);
  }
};

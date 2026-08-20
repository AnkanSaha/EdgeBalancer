import mongoose from 'mongoose';
import { Session } from '../../../models/Session';
import { User } from '../../../models/User';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function downloadScript(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Pro check — script download is a Pro feature
    const user = await User.findById(userId).select('proExpiresAt').lean();
    if (!user?.proExpiresAt || user.proExpiresAt <= new Date()) {
      res.status(403);
      throw new Error('Script download requires an EdgeBalancer Pro subscription');
    }

    const { id } = req.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid session ID');
    }

    const session = await Session.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    if (!session.isActive) {
      res.status(403);
      throw new Error('Script is only available for active sessions');
    }

    res.json({
      success: true,
      message: 'Script retrieved successfully',
      data: { content: session.content },
    });
  } catch (error) {
    if ((error as any).statusCode) res.status((error as any).statusCode);
    next(error as Error);
  }
}

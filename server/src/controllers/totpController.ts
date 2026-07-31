import { User } from '../models/User';
import { addDevice, confirmedDevices, verifyAgainst } from '../services/totpService';
import { CHALLENGE_COOKIE, issueSessionCookie, toUserPayload } from '../utils/authSession';
import { verifyToken } from '../utils/jwt';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../types/http';

const loadUser = async (userId: string | undefined, res: Response) => {
  if (!userId) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  return user;
};

export const setupTotp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);
    const enrolment = await addDevice(user, req.body?.name);

    res.json({
      success: true,
      message: 'Scan the QR code with your authenticator app',
      data: enrolment,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const confirmTotp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);
    const { deviceId, code } = req.body;

    const device = user.totpDevices.id(deviceId);
    if (!device) {
      res.status(404);
      throw new Error('Enrolment not found — start again');
    }

    const verified = await verifyAgainst([device], code, user._id.toString());
    if (!verified) {
      res.status(400);
      throw new Error('That code is not valid. Check your authenticator app and try again.');
    }

    device.confirmed = true;
    await user.save();

    res.json({
      success: true,
      message: 'Authenticator app added',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const removeTotp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);
    const { deviceId, code } = req.body;

    const device = user.totpDevices.id(deviceId);
    if (!device) {
      res.status(404);
      throw new Error('Authenticator app not found');
    }

    // Removing a lost phone means its codes are unavailable, so another device has to authorise it.
    // Only when it is the last one does its own code count — that path turns two-factor off.
    const others = confirmedDevices(user).filter((other) => !other._id.equals(device._id));
    const candidates = others.length > 0 ? others : [device];

    const verified = await verifyAgainst(candidates, code, user._id.toString());
    if (!verified) {
      res.status(400);
      throw new Error(
        others.length > 0
          ? 'That code is not valid. Use a code from one of your other authenticator apps.'
          : 'That code is not valid. Check your authenticator app and try again.'
      );
    }

    device.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: 'Authenticator app removed',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const verifyTotpLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const challenge = req.cookies?.[CHALLENGE_COOKIE];
    if (!challenge) {
      res.status(401);
      throw new Error('Your sign-in session expired. Start again.');
    }

    let userId: string;
    try {
      const payload = verifyToken(challenge);
      if (payload.stage !== 'pending-2fa') {
        throw new Error('Invalid challenge');
      }
      userId = payload.userId;
    } catch {
      res.status(401);
      throw new Error('Your sign-in session expired. Start again.');
    }

    const user = await loadUser(userId, res);

    const verified = await verifyAgainst(confirmedDevices(user), req.body.code, userId);
    if (!verified) {
      res.status(401);
      throw new Error('That code is not valid. Check your authenticator app and try again.');
    }

    res.clearCookie(CHALLENGE_COOKIE);
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

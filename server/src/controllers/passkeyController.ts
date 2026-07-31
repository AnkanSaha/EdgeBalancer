import { User } from '../models/User';
import type { IPasskey, IUser } from '../models/User';
import {
  authenticationOptions,
  registrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from '../services/passkeyService';
import {
  CHALLENGE_COOKIE,
  PASSKEY_REG_COOKIE,
  issueChallengeCookie,
  issuePasskeyRegCookie,
  issueSessionCookie,
  toUserPayload,
} from '../utils/authSession';
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

/** Reads one of the two staged cookies and returns its user plus the challenge it carries. */
const loadStaged = async (
  req: Request,
  res: Response,
  cookieName: string,
  stage: 'pending-2fa' | 'passkey-register'
): Promise<{ user: IUser; challenge?: string }> => {
  const staged = req.cookies?.[cookieName];
  const expired = () => {
    res.status(401);
    return new Error('Your sign-in session expired. Start again.');
  };

  if (!staged) {
    throw expired();
  }

  try {
    const payload = verifyToken(staged);
    if (payload.stage !== stage) {
      throw new Error('Invalid stage');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { user, challenge: payload.challenge };
  } catch {
    throw expired();
  }
};

export const passkeyRegisterOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);
    const options = await registrationOptions(user);

    issuePasskeyRegCookie(res, user, options.challenge);

    res.json({
      success: true,
      message: 'Registration options generated',
      data: options,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const passkeyRegisterVerify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);
    const { challenge } = await loadStaged(req, res, PASSKEY_REG_COOKIE, 'passkey-register');

    const credential = await verifyRegistration(req.body.response, challenge!);
    if (!credential) {
      res.status(400);
      throw new Error('That passkey could not be verified. Try again.');
    }

    if (user.passkeys.some((passkey) => passkey.credentialId === credential.credentialId)) {
      res.status(409);
      throw new Error('That passkey is already registered on your account');
    }

    const name = req.body.name?.trim() || `Passkey ${user.passkeys.length + 1}`;

    user.passkeys.push({ name, ...credential } as IPasskey);
    await user.save();

    res.clearCookie(PASSKEY_REG_COOKIE);

    res.json({
      success: true,
      message: 'Passkey added',
      data: { passkeyId: user.passkeys[user.passkeys.length - 1]._id.toString(), user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const passkeyAuthOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = await loadStaged(req, res, CHALLENGE_COOKIE, 'pending-2fa');
    const options = await authenticationOptions(user);

    // Re-issued so the challenge we just handed out is the one we verify against.
    issueChallengeCookie(res, user, options.challenge);

    res.json({
      success: true,
      message: 'Authentication options generated',
      data: options,
    });
  } catch (error) {
    next(error as Error);
  }
};

export const passkeyAuthVerify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, challenge } = await loadStaged(req, res, CHALLENGE_COOKIE, 'pending-2fa');

    if (!challenge) {
      res.status(401);
      throw new Error('Your sign-in session expired. Start again.');
    }

    const passkey = await verifyAuthentication(user, req.body.response, challenge);
    if (!passkey) {
      res.status(401);
      throw new Error('That passkey could not be verified. Try again.');
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

export const removePasskey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);

    const passkey = user.passkeys.id(req.body.passkeyId);
    if (!passkey) {
      res.status(404);
      throw new Error('Passkey not found');
    }

    passkey.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: 'Passkey removed',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

/** The name is collected after enrolment, so both flows land on a real credential first. */
export const renameCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);
    const { kind, id, name } = req.body;

    const credential = kind === 'totp' ? user.totpDevices.id(id) : user.passkeys.id(id);
    if (!credential) {
      res.status(404);
      throw new Error('Credential not found');
    }

    credential.name = name.trim();
    await user.save();

    res.json({
      success: true,
      message: 'Name updated',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

export const setPreference = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await loadUser(req.user?.userId, res);

    user.preferredSecondFactor = req.body.method ?? null;
    await user.save();

    res.json({
      success: true,
      message: 'Preference updated',
      data: { user: toUserPayload(user) },
    });
  } catch (error) {
    next(error as Error);
  }
};

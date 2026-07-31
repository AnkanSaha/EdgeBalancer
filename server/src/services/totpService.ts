import { Secret, TOTP } from 'otpauth';
import QRCode from 'qrcode';
import type { ITotpDevice, IUser } from '../models/User';
import { decrypt, encrypt } from '../utils/encryption';
import { acquireLock } from '../utils/resourceLock';

const ISSUER = 'EdgeBalancer';

// One step either side of now, so a slightly drifted phone clock still works.
const DRIFT_WINDOW = 1;

// Outlives the 30s step plus the drift window on both sides.
const USED_CODE_TTL_SECONDS = 90;

export interface TotpEnrolment {
  deviceId: string;
  name: string;
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

const buildTotp = (secret: string, label = ISSUER) =>
  new TOTP({ issuer: ISSUER, label, secret: Secret.fromBase32(secret) });

/** Two-factor is on for a user iff at least one device finished enrolment. */
export const hasTotp = (user: IUser): boolean => user.totpDevices.some((device) => device.confirmed);

export const confirmedDevices = (user: IUser): ITotpDevice[] =>
  user.totpDevices.filter((device) => device.confirmed);

/**
 * Starts an enrolment: stores an unconfirmed device and returns what the user needs to scan.
 * The secret leaves the server exactly once, here — after this only the encrypted copy exists.
 */
export const addDevice = async (user: IUser, name?: string): Promise<TotpEnrolment> => {
  // An abandoned setup must not permanently consume one of the three slots.
  const pending = user.totpDevices.filter((device) => !device.confirmed);
  pending.forEach((device) => device.deleteOne());

  const secret = new Secret({ size: 20 }).base32;
  const label = user.email || user.username;
  const deviceName = name?.trim() || `Authenticator ${user.totpDevices.length + 1}`;
  const { encrypted, iv, tag } = encrypt(secret);

  user.totpDevices.push({ name: deviceName, secret: encrypted, iv, tag, confirmed: false } as ITotpDevice);
  await user.save();

  const otpauthUrl = buildTotp(secret, label).toString();

  return {
    deviceId: user.totpDevices[user.totpDevices.length - 1]._id.toString(),
    name: deviceName,
    secret,
    otpauthUrl,
    qrDataUrl: await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 }),
  };
};

/**
 * Returns the device the code belongs to, or null.
 *
 * Callers pass the exact candidate list they mean: every confirmed device on login, one specific
 * device when confirming an enrolment, every device but the target when removing one.
 *
 * ponytail: linear scan — one decrypt + HMAC per enrolled device. Enrolment is unbounded but
 * STRICT-rate-limited, so realistic counts stay small. Index by a secret-derived hint if that
 * ever stops being true.
 */
export const verifyAgainst = async (
  devices: ITotpDevice[],
  code: string,
  userId: string
): Promise<ITotpDevice | null> => {
  const normalised = code.replace(/\s/g, '');

  const match = devices.find((device) => {
    const secret = decrypt(device.secret, device.iv, device.tag);
    return buildTotp(secret).validate({ token: normalised, window: DRIFT_WINDOW }) !== null;
  });

  if (!match) {
    return null;
  }

  // A code is single-use: the lock is never released, it just expires.
  const claim = await acquireLock(`totp:used:${userId}:${normalised}`, USED_CODE_TTL_SECONDS);

  return claim ? match : null;
};

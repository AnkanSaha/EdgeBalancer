import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import type { IPasskey, IUser } from '../models/User';

const RP_NAME = 'EdgeBalancer';

/**
 * WebAuthn binds to the origin the page runs on, not the API's — so this is the client URL, and
 * WEBAUTHN_RP_ID exists for the case where passkeys should span sibling subdomains.
 */
export const rpConfig = () => {
  const origin = process.env.CLIENT_URL || 'http://localhost:3000';
  return { origin, rpID: process.env.WEBAUTHN_RP_ID || new URL(origin).hostname };
};

const toTransports = (transports: string[]) => transports as AuthenticatorTransportFuture[];

const descriptors = (passkeys: IPasskey[]) =>
  passkeys.map((passkey) => ({
    id: passkey.credentialId,
    transports: toTransports(passkey.transports),
  }));

export const registrationOptions = async (user: IUser) => {
  const { rpID } = rpConfig();

  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email || user.username,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: descriptors(user.passkeys),
    authenticatorSelection: {
      // No authenticatorAttachment on purpose: pinning it to 'platform' would exclude every USB
      // security key and every extension-based manager.
      residentKey: 'discouraged',
      userVerification: 'preferred',
    },
  });
};

export const verifyRegistration = async (response: any, expectedChallenge: string) => {
  const { origin, rpID } = rpConfig();

  const { verified, registrationInfo } = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
  });

  if (!verified || !registrationInfo) {
    return null;
  }

  const { credential } = registrationInfo;

  return {
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: credential.transports ?? [],
  };
};

export const authenticationOptions = async (user: IUser) => {
  const { rpID } = rpConfig();

  return generateAuthenticationOptions({
    rpID,
    allowCredentials: descriptors(user.passkeys),
    userVerification: 'preferred',
  });
};

/** Returns the passkey that signed the challenge, with its counter advanced, or null. */
export const verifyAuthentication = async (
  user: IUser,
  response: any,
  expectedChallenge: string
): Promise<IPasskey | null> => {
  const passkey = user.passkeys.find((candidate) => candidate.credentialId === response?.id);
  if (!passkey) {
    return null;
  }

  const { origin, rpID } = rpConfig();

  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64url')),
      counter: passkey.counter,
      transports: toTransports(passkey.transports),
    },
  });

  if (!verified) {
    return null;
  }

  passkey.counter = authenticationInfo.newCounter;
  await user.save();

  return passkey;
};

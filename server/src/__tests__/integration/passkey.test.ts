// A real ceremony needs a browser authenticator, so the two verify functions are mocked and
// everything around them — cookies, staging, storage, method discovery — runs for real.
const verifyRegistrationResponse = jest.fn();
const verifyAuthenticationResponse = jest.fn();

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: async () => ({ challenge: 'reg-challenge', rp: { id: 'localhost' } }),
  generateAuthenticationOptions: async () => ({ challenge: 'auth-challenge' }),
  verifyRegistrationResponse: (...args: unknown[]) => verifyRegistrationResponse(...args),
  verifyAuthenticationResponse: (...args: unknown[]) => verifyAuthenticationResponse(...args),
}));

const decodedGoogleToken = { email: '', name: 'Test User', uid: '', email_verified: true };

jest.mock('../../config/firebase', () => ({
  isFirebaseConfigured: () => true,
  verifyFirebaseToken: async () => decodedGoogleToken,
  initializeFirebaseAdmin: () => undefined,
}));

import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../app';
import { User } from '../../models/User';
import { connectTestDb, clearCollections, closeTestDb } from '../helpers/db';
import { createTestUser } from '../helpers/auth';

let app: FastifyInstance;

beforeAll(async () => {
  await connectTestDb();
  app = await buildServer();
});

afterEach(async () => {
  await clearCollections();
  jest.resetAllMocks();
});

afterAll(async () => {
  await app.close();
  await closeTestDb();
});

const setCookies = (res: { headers: Record<string, unknown> }): string[] => {
  const raw = res.headers['set-cookie'];
  return Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
};

const cookieValue = (res: { headers: Record<string, unknown> }, name: string) => {
  const raw = setCookies(res).find((c) => c.startsWith(`${name}=`));
  return raw ? raw.split(';')[0].slice(name.length + 1) : undefined;
};

const registrationInfo = (id: string) => ({
  verified: true,
  registrationInfo: {
    credential: { id, publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['usb'] },
  },
});

/** Registers a passkey end to end with the ceremony mocked out. */
async function addPasskey(cookie: Record<string, string>, name = 'YubiKey', id = 'cred-1') {
  const options = await app.inject({
    method: 'POST', url: '/api/auth/2fa/passkey/register/options', headers: cookie, payload: { name },
  });
  expect(options.statusCode).toBe(200);

  const regCookie = cookieValue(options, 'eb_pk_reg')!;
  verifyRegistrationResponse.mockResolvedValueOnce(registrationInfo(id));

  const verify = await app.inject({
    method: 'POST',
    url: '/api/auth/2fa/passkey/register/verify',
    headers: { ...cookie, cookie: `${cookie.cookie}; eb_pk_reg=${regCookie}` },
    payload: { name, response: { id } },
  });

  return { verify, regCookie };
}

describe('passkey registration', () => {
  it('stores the passkey under the name the user chose', async () => {
    const { cookie } = await createTestUser();
    const { verify } = await addPasskey(cookie, 'Bitwarden');
    expect(verify.statusCode).toBe(200);

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(me.json().data.user.passkeys).toHaveLength(1);
    expect(me.json().data.user.passkeys[0].name).toBe('Bitwarden');
  });

  it('names the passkey for you when none is given', async () => {
    const { cookie } = await createTestUser();
    const options = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/register/options', headers: cookie, payload: {},
    });
    verifyRegistrationResponse.mockResolvedValueOnce(registrationInfo('cred-noname'));

    const verify = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/register/verify',
      headers: { ...cookie, cookie: `${cookie.cookie}; eb_pk_reg=${cookieValue(options, 'eb_pk_reg')}` },
      payload: { response: { id: 'cred-noname' } },
    });

    expect(verify.statusCode).toBe(200);
    expect(verify.json().data.user.passkeys[0].name).toBe('Passkey 1');
    expect(verify.json().data.passkeyId).toMatch(/^[a-f\d]{24}$/);
  });

  it('renames a registered passkey afterwards', async () => {
    const { cookie } = await createTestUser();
    const { verify } = await addPasskey(cookie);

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/rename', headers: cookie,
      payload: { kind: 'passkey', id: verify.json().data.passkeyId, name: 'YubiKey 5C' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.passkeys[0].name).toBe('YubiKey 5C');
  });

  it('never exposes the stored public key', async () => {
    const { cookie } = await createTestUser();
    await addPasskey(cookie);

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: cookie });
    expect(JSON.stringify(me.json())).not.toContain('publicKey');
  });

  it('verifies against the challenge it issued', async () => {
    const { cookie } = await createTestUser();
    await addPasskey(cookie);

    expect(verifyRegistrationResponse).toHaveBeenCalledWith(
      expect.objectContaining({ expectedChallenge: 'reg-challenge' })
    );
  });

  it('refuses the same authenticator twice', async () => {
    const { cookie } = await createTestUser();
    await addPasskey(cookie, 'First', 'cred-dup');
    const { verify } = await addPasskey(cookie, 'Second', 'cred-dup');

    expect(verify.statusCode).toBe(409);
  });

  it('401 when the registration cookie is missing', async () => {
    const { cookie } = await createTestUser();
    verifyRegistrationResponse.mockResolvedValueOnce(registrationInfo('cred-x'));

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/register/verify',
      headers: cookie, payload: { name: 'X', response: { id: 'cred-x' } },
    });

    expect(res.statusCode).toBe(401);
  });

  it('the registration cookie cannot be used as a session', async () => {
    const { cookie } = await createTestUser();
    const options = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/register/options', headers: cookie, payload: { name: 'X' },
    });

    const res = await app.inject({
      method: 'GET', url: '/api/auth/me',
      headers: { cookie: `token=${cookieValue(options, 'eb_pk_reg')}` },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/google with a passkey enrolled', () => {
  const signIn = async (uid: string, email: string) => {
    decodedGoogleToken.email = email;
    decodedGoogleToken.uid = uid;
    return app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });
  };

  it('challenges with passkey as the only method', async () => {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-pk' });
    await addPasskey(cookie);

    const res = await signIn('uid-pk', user.email!);

    expect(res.json().data.twoFactorRequired).toBe(true);
    expect(res.json().data.methods).toEqual(['passkey']);
    expect(setCookies(res).some((c) => c.startsWith('token='))).toBe(false);
  });

  it('reports the stored preference', async () => {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-pref' });
    await addPasskey(cookie);
    await app.inject({
      method: 'POST', url: '/api/auth/2fa/preference', headers: cookie, payload: { method: 'passkey' },
    });

    const res = await signIn('uid-pref', user.email!);
    expect(res.json().data.preferred).toBe('passkey');
  });

  it('signs in directly once the last passkey is removed', async () => {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-gone' });
    await addPasskey(cookie);

    const stored = await User.findById(user._id);
    await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/remove', headers: cookie,
      payload: { passkeyId: stored!.passkeys[0]._id.toString() },
    });

    const res = await signIn('uid-gone', user.email!);
    expect(res.json().data.user).toBeDefined();
    expect(setCookies(res).some((c) => c.startsWith('token='))).toBe(true);
  });
});

describe('POST /api/auth/2fa/passkey/auth', () => {
  async function startChallenge() {
    const { user, cookie } = await createTestUser({ firebaseUid: 'uid-auth' });
    await addPasskey(cookie, 'YubiKey', 'cred-auth');

    decodedGoogleToken.email = user.email!;
    decodedGoogleToken.uid = 'uid-auth';
    const login = await app.inject({ method: 'POST', url: '/api/auth/google', payload: { idToken: 'x' } });

    return { challenge: cookieValue(login, 'eb_2fa')! };
  }

  it('trades a verified assertion for a session', async () => {
    const { challenge } = await startChallenge();

    const options = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/options',
      headers: { cookie: `eb_2fa=${challenge}` },
    });
    expect(options.json().data.challenge).toBe('auth-challenge');

    verifyAuthenticationResponse.mockResolvedValueOnce({
      verified: true, authenticationInfo: { newCounter: 5 },
    });

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/verify',
      headers: { cookie: `eb_2fa=${cookieValue(options, 'eb_2fa')}` },
      payload: { response: { id: 'cred-auth' } },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.user).toBeDefined();
    expect(setCookies(res).some((c) => c.startsWith('token='))).toBe(true);
  });

  it('rejects an assertion the library does not verify', async () => {
    const { challenge } = await startChallenge();
    const options = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/options',
      headers: { cookie: `eb_2fa=${challenge}` },
    });

    verifyAuthenticationResponse.mockResolvedValueOnce({ verified: false, authenticationInfo: {} });

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/verify',
      headers: { cookie: `eb_2fa=${cookieValue(options, 'eb_2fa')}` },
      payload: { response: { id: 'cred-auth' } },
    });

    expect(res.statusCode).toBe(401);
    expect(setCookies(res).some((c) => c.startsWith('token='))).toBe(false);
  });

  it('rejects a credential that belongs to nobody', async () => {
    const { challenge } = await startChallenge();
    const options = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/options',
      headers: { cookie: `eb_2fa=${challenge}` },
    });

    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/verify',
      headers: { cookie: `eb_2fa=${cookieValue(options, 'eb_2fa')}` },
      payload: { response: { id: 'not-mine' } },
    });

    expect(res.statusCode).toBe(401);
    expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it('401 without a challenge cookie', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/passkey/auth/verify', payload: { response: { id: 'x' } },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/2fa/preference', () => {
  it('stores totp, passkey and null', async () => {
    const { cookie } = await createTestUser();

    for (const method of ['totp', 'passkey', null]) {
      const res = await app.inject({
        method: 'POST', url: '/api/auth/2fa/preference', headers: cookie, payload: { method },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.user.preferredSecondFactor).toBe(method);
    }
  });

  it('400 on anything else', async () => {
    const { cookie } = await createTestUser();
    const res = await app.inject({
      method: 'POST', url: '/api/auth/2fa/preference', headers: cookie, payload: { method: 'sms' },
    });
    expect(res.statusCode).toBe(400);
  });
});

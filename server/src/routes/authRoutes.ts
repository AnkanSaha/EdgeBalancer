import type { FastifyInstance } from 'fastify';
import { logout, getCurrentUser, googleAuth } from '../controllers/authController';
import { setupTotp, confirmTotp, removeTotp, verifyTotpLogin } from '../controllers/totpController';
import {
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyAuthOptions,
  passkeyAuthVerify,
  removePasskey,
  renameCredential,
  setPreference,
} from '../controllers/passkeyController';
import {
  googleAuthValidation,
  credentialNameValidation,
  passkeyIdValidation,
  passkeyResponseValidation,
  preferenceValidation,
  renameValidation,
  totpCodeValidation,
  totpDeviceValidation,
} from '../middleware/validators/authValidators';
import { authenticate } from '../middleware/auth';
import { runHandlers } from '../utils/routeRunner';

const TEST = process.env.NODE_ENV === 'test';
const STRICT   = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 5,  timeWindow: '15 minutes' };
const RELAXED  = TEST ? { max: 10000, timeWindow: '1 minute' } : { max: 60, timeWindow: '1 minute'   };

export default async function authRoutes(app: FastifyInstance) {
  app.post('/google', { config: { rateLimit: STRICT  } }, async (request, reply) => runHandlers([...googleAuthValidation, googleAuth], request, reply));
  app.post('/logout', { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([logout], request, reply));
  app.get('/me',      { config: { rateLimit: RELAXED } }, async (request, reply) => runHandlers([authenticate, getCurrentUser], request, reply));

  app.post('/2fa/setup',   { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...credentialNameValidation, setupTotp], request, reply));
  app.post('/2fa/confirm', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...totpDeviceValidation, confirmTotp], request, reply));
  app.post('/2fa/remove',  { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...totpDeviceValidation, removeTotp], request, reply));
  app.post('/2fa/verify',  { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([...totpCodeValidation, verifyTotpLogin], request, reply));

  app.post('/2fa/passkey/register/options', { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, passkeyRegisterOptions], request, reply));
  app.post('/2fa/passkey/register/verify',  { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...credentialNameValidation, ...passkeyResponseValidation, passkeyRegisterVerify], request, reply));
  app.post('/2fa/passkey/auth/options',     { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([passkeyAuthOptions], request, reply));
  app.post('/2fa/passkey/auth/verify',      { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([...passkeyResponseValidation, passkeyAuthVerify], request, reply));
  app.post('/2fa/passkey/remove',           { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...passkeyIdValidation, removePasskey], request, reply));
  app.post('/2fa/rename',                   { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...renameValidation, renameCredential], request, reply));
  app.post('/2fa/preference',               { config: { rateLimit: STRICT } }, async (request, reply) => runHandlers([authenticate, ...preferenceValidation, setPreference], request, reply));
}

import { validateBody } from '../validation';

export const googleAuthValidation = [
  validateBody((body) => {
    const errors: string[] = [];
    const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : '';

    if (!idToken) {
      errors.push('Firebase ID token is required');
    }

    return errors;
  }),
];

export const credentialNameValidation = [
  validateBody((body) => {
    if (body?.name === undefined || body?.name === null) {
      return [];
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) return ['A name is required'];
    if (name.length > 30) return ['Name cannot exceed 30 characters'];

    return [];
  }),
];

const codeErrors = (body: any): string[] => {
  const code = typeof body?.code === 'string' ? body.code.replace(/\s/g, '') : '';
  return /^\d{6}$/.test(code) ? [] : ['A 6-digit authentication code is required'];
};

export const totpCodeValidation = [validateBody(codeErrors)];

export const totpDeviceValidation = [
  validateBody((body) => {
    const errors = codeErrors(body);

    if (!/^[a-f\d]{24}$/i.test(String(body?.deviceId || ''))) {
      errors.push('A valid authenticator app id is required');
    }

    return errors;
  }),
];

export const preferenceValidation = [
  validateBody((body) => {
    const method = body?.method;
    return method === null || method === 'totp' || method === 'passkey'
      ? []
      : ['Preference must be totp, passkey or null'];
  }),
];

export const passkeyIdValidation = [
  validateBody((body) =>
    /^[a-f\d]{24}$/i.test(String(body?.passkeyId || '')) ? [] : ['A valid passkey id is required']
  ),
];

export const passkeyResponseValidation = [
  validateBody((body) =>
    body?.response && typeof body.response === 'object' ? [] : ['A passkey response is required']
  ),
];

export const renameValidation = [
  validateBody((body) => {
    const errors: string[] = [];

    if (body?.kind !== 'totp' && body?.kind !== 'passkey') {
      errors.push('Kind must be totp or passkey');
    }
    if (!/^[a-f\d]{24}$/i.test(String(body?.id || ''))) {
      errors.push('A valid credential id is required');
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) errors.push('A name is required');
    if (name.length > 30) errors.push('Name cannot exceed 30 characters');

    return errors;
  }),
];

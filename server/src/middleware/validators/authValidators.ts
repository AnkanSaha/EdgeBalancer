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

export const totpSetupValidation = [
  validateBody((body) => {
    if (body?.name === undefined || body?.name === null) {
      return [];
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) return ['A name for the authenticator app is required'];
    if (name.length > 30) return ['Authenticator name cannot exceed 30 characters'];

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

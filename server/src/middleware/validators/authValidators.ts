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

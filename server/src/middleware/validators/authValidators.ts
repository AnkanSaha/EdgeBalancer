import { validateBody } from '../validation';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const registerValidation = [
  validateBody((body) => {
    const errors: string[] = [];
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!name) {
      errors.push('Name is required');
    } else if (name.length < 2 || name.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }

    if (!email) {
      errors.push('Email is required');
    } else if (!isEmail(email)) {
      errors.push('Please provide a valid email');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!confirmPassword) {
      errors.push('Please confirm your password');
    } else if (confirmPassword !== password) {
      errors.push('Passwords do not match');
    }

    return errors;
  }),
];

export const loginValidation = [
  validateBody((body) => {
    const errors: string[] = [];
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email) {
      errors.push('Email is required');
    } else if (!isEmail(email)) {
      errors.push('Please provide a valid email');
    }

    if (!password) {
      errors.push('Password is required');
    }

    return errors;
  }),
];

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

import { validateBody } from '../validation';

export const changePasswordValidation = [
  validateBody((body) => {
    const errors: string[] = [];
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    const confirmNewPassword = typeof body?.confirmNewPassword === 'string' ? body.confirmNewPassword : '';

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword) {
      errors.push('New password is required');
    } else if (newPassword.length < 8) {
      errors.push('New password must be at least 8 characters');
    }

    if (!confirmNewPassword) {
      errors.push('Please confirm your new password');
    } else if (confirmNewPassword !== newPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  }),
];

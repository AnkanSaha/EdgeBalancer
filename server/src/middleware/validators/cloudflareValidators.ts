import { body } from 'express-validator';

export const credentialsValidation = [
  body('accountId')
    .trim()
    .notEmpty().withMessage('Cloudflare Account ID is required')
    .isLength({ min: 32, max: 32 }).withMessage('Invalid Account ID format'),
  body('apiToken')
    .trim()
    .notEmpty().withMessage('Cloudflare API Token is required')
    .isLength({ min: 40 }).withMessage('Invalid API Token format'),
];

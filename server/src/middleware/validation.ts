import type { AppHandler, AppRequest } from '../types/http';

export type ValidationFunction = (body: any, request: AppRequest) => string[];

export const createValidationError = (message: string) => {
  const error = new Error(message);
  (error as any).statusCode = 400;
  return error;
};

export const validateBody = (validator: ValidationFunction): AppHandler => {
  return async (req, res, next) => {
    const messages = validator(req.body, req);

    if (messages.length > 0) {
      next(createValidationError(messages.join(', ')));
      return;
    }

    next();
  };
};

import type { FastifyInstance } from 'fastify';

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    const appError = error as Error & { statusCode?: number };

    const statusCode = appError.statusCode || (reply.statusCode !== 200 ? reply.statusCode : 500);
    const message = appError.message || 'Internal server error';

    // Only log unexpected errors (not 401 auth checks)
    const isExpectedAuthError = statusCode === 401 && request.url.includes('/auth/me');
    
    if (!isExpectedAuthError) {
      console.error('Error:', appError);
    }

    reply.code(statusCode).send({
      success: false,
      message,
      data: null,
    });
  });
};

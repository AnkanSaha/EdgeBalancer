import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

const getAllowedOrigins = () =>
  process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ||
  [process.env.CLIENT_URL || 'http://localhost:3000'];

export const registerCors = async (app: FastifyInstance) => {
  await app.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-operation-id'],
  });
};

/**
 * EdgeBalancer Server Entry Point
 * Fastify-based API server with MongoDB, JWT auth, and Firebase integration
 */
import dotenv from 'dotenv';
import { connectDatabase } from './utils/database';
import { buildServer } from './app';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'CLIENT_URL',
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Validate ENCRYPTION_KEY length (must be 64 characters for 32-byte hex)
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
  console.error('❌ ENCRYPTION_KEY must be exactly 64 characters (32-byte hex string)');
  process.exit(1);
}

const PORT = process.env.PORT || 8000;

// Bootstrap server with proper async initialization
async function bootstrap() {
  try {
    // Connect to database first
    await connectDatabase();

    // Then build and start server
    const app = await buildServer();

    await app.listen({ port: Number(PORT), host: '0.0.0.0' });

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🔄 Idempotency: Enabled (in-memory)`);
  } catch (error) {
    console.error('❌ Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();

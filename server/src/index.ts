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

// Connect to database
connectDatabase();

buildServer().then((app) => {
  app.listen({ port: Number(PORT), host: '0.0.0.0' })
    .then(() => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🔄 Idempotency: Enabled (in-memory)`);
    })
    .catch((error) => {
      console.error('❌ Failed to start server');
      console.error(error);
      process.exit(1);
    });
}).catch((error) => {
  console.error('❌ Failed to build server');
  console.error(error);
  process.exit(1);
});

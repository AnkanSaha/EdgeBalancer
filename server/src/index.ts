import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import { connectDatabase } from './utils/database';
import { corsOptions } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import cloudflareRoutes from './routes/cloudflareRoutes';
import userRoutes from './routes/userRoutes';
import loadBalancerRoutes from './routes/loadBalancerRoutes';

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

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to database
connectDatabase();

// Middleware
app.use(corsOptions);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cloudflare', cloudflareRoutes);
app.use('/api/user', userRoutes);
app.use('/api/loadbalancers', loadBalancerRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

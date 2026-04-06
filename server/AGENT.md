# EdgeBalancer Server - Backend Documentation

## Overview
Express.js backend API with TypeScript, Mongoose ODM, and MongoDB Atlas. Handles authentication, Cloudflare API integration, and Worker deployment.

## Architecture

### Folder Structure
```
server/
├── src/
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── index.ts         # Server entry point
├── dist/                # Compiled JavaScript (build output)
├── Dockerfile           # Docker configuration
├── .dockerignore
├── .env.example
├── package.json
├── tsconfig.json
└── AGENT.md            # This file
```

### Tech Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB Atlas with Mongoose ODM
- **Authentication:** JWT with httpOnly cookies
- **Encryption:** AES-256-CBC for sensitive credentials
- **Password Hashing:** bcrypt (10 rounds)

## Database Models

### User Model
```typescript
{
  name: string;
  email: string (unique, indexed);
  username: string (unique, indexed);
  password: string (hashed with bcrypt);
  cloudflareAccountId?: string (encrypted);
  cloudflareApiToken?: string (encrypted);
  cloudflareAccountIdIv?: string;
  cloudflareTokenIv?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### LoadBalancer Model
```typescript
{
  userId: ObjectId (ref to User);
  scriptName: string (unique);
  domain: string;
  subdomain?: string;
  origins: Array<{url: string, weight: number}>;
  strategy: 'round-robin' | 'weighted-round-robin';
  weightedEnabled: boolean;
  placement: {smartPlacement?: boolean, region?: string};
  zoneId: string;
  status: 'active' | 'inactive';
  workerUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Routes

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (sets httpOnly cookie)
- `POST /api/auth/logout` - User logout (clears cookie)
- `GET /api/auth/me` - Get current user (protected)

### Cloudflare Routes (`/api/cloudflare`)
- `POST /api/cloudflare/credentials` - Save CF credentials (protected)
- `PUT /api/cloudflare/credentials` - Update CF credentials (protected)
- `GET /api/cloudflare/zones` - Get user's CF zones (protected)

### Load Balancer Routes (`/api/loadbalancers`)
- `POST /api/loadbalancers` - Create load balancer (protected)
- `GET /api/loadbalancers` - List user's load balancers (protected)

### User/Profile Routes (`/api/user`)
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/password` - Change password (protected)

## Middleware

### Error Handler
- Catches all errors from async routes
- Returns consistent JSON format: `{success: boolean, data: any, message: string}`
- Logs errors to console
- Must be registered last in middleware chain

### Authentication
- Extracts JWT from httpOnly cookie
- Verifies token validity
- Attaches user payload to `req.user`
- Returns 401 if token missing or invalid

### CORS
- Allows configured origins from `CORS_ORIGIN` env variable
- Enables credentials (cookies)
- Supports GET, POST, PUT, DELETE, PATCH methods

### Validation
- Uses express-validator for input validation
- Returns 400 with error messages on validation failure

## Utilities

### Encryption (`utils/encryption.ts`)
- `encrypt(text)` - Encrypts text with AES-256-CBC, returns {encrypted, iv}
- `decrypt(encrypted, iv)` - Decrypts encrypted text using IV

### Password (`utils/password.ts`)
- `hashPassword(password)` - Hashes password with bcrypt
- `comparePassword(password, hash)` - Compares password with hash

### JWT (`utils/jwt.ts`)
- `generateToken(payload)` - Creates JWT with 24h expiry
- `verifyToken(token)` - Verifies and decodes JWT

### Username (`utils/username.ts`)
- `generateUsername(fullName)` - Generates unique username from name

### Masking (`utils/mask.ts`)
- `maskToken(token)` - Masks API token (shows last 4 chars)
- `maskAccountId(id)` - Masks account ID (shows first 4 and last 4)

## Cloudflare API Integration

All Cloudflare API calls are made from the server (never from frontend).

### Required Permissions
Cloudflare API token must have:
1. Account > Worker Scripts > Edit
2. Account > Workers KV Storage > Edit
3. Zone > Zone > Read

### Endpoints Used
- `GET /client/v4/accounts/{accountId}/workers/scripts` - Test Worker Scripts permission
- `GET /client/v4/accounts/{accountId}/storage/kv/namespaces` - Test KV permission
- `GET /client/v4/zones?account.id={accountId}` - Get zones and test Zone Read
- `PUT /client/v4/accounts/{accountId}/workers/scripts/{scriptName}` - Deploy Worker
- `PUT /client/v4/accounts/{accountId}/workers/domains` - Attach domain to Worker

## Environment Variables

See `.env.example` for all required variables.

**Critical:**
- `ENCRYPTION_KEY` must be exactly 64 characters (32-byte hex string)
- `JWT_SECRET` should be at least 32 characters
- `MONGODB_URI` must include database name and proper connection options

## Development

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Build
```bash
npm run build
```

### Run Production
```bash
npm start
```

## Docker Deployment

### Build Image
```bash
docker build -t edgebalancer-server .
```

### Run Container
```bash
docker run -p 8000:8000 --env-file .env edgebalancer-server
```

### Deploy to AWS ECS
1. Push image to ECR
2. Create ECS task definition
3. Set environment variables in task definition
4. Create ECS service with ALB
5. Configure health check endpoint: `/health`

## Security

1. **Credential Storage:** Cloudflare credentials encrypted with AES-256-CBC before storage
2. **Authentication:** JWT in httpOnly cookies prevents XSS
3. **Password Hashing:** bcrypt with 10 salt rounds
4. **CORS:** Restricted to configured origins only
5. **Input Validation:** All inputs validated with express-validator
6. **Error Messages:** No sensitive data leaked in error responses

## API Response Format

All responses follow this structure:
```json
{
  "success": true|false,
  "data": <response data>,
  "message": "Success or error message"
}
```

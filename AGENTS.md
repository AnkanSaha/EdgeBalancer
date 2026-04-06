# EdgeBalancer

## Purpose
EdgeBalancer is a SaaS control plane for deploying and managing Cloudflare Worker based load balancers without writing Worker code manually.

## Architecture
- `client/`: Next.js 16 App Router frontend with React 19, TypeScript, Tailwind CSS v4, Axios, and `react-hot-toast`
- `server/`: Express.js API with TypeScript, Mongoose, JWT auth, encrypted Cloudflare credentials, and Cloudflare Worker deployment logic
- `MongoDB`: stores users, encrypted Cloudflare credentials, and load balancer configuration state
- `Cloudflare Workers`: user-facing edge runtime where generated load balancer Workers are deployed

## Monorepo Layout
```text
EdgeBalancer/
├── AGENTS.md
├── AGENT.md
├── CLAUDE.md
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── client/
└── server/
```

## Environment

### Client
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Server
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/edgebalancer?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-key-here
ENCRYPTION_KEY=your-64-character-hex-encryption-key
PORT=8000
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

Notes:
- `ENCRYPTION_KEY` must be a 64-character hex string
- Cloudflare API tokens should include Worker Scripts edit, Workers KV edit, and Zone read permissions

## Current Product Features

### Auth And User Management
- Email/password registration and login
- JWT auth using `httpOnly` cookies
- logout
- profile access
- password change

### Cloudflare Onboarding
- guided token/account setup
- token permission validation against Cloudflare APIs
- encrypted storage of Account ID and API token
- zone discovery from the user Cloudflare account

### Load Balancer Lifecycle
- create load balancers from dashboard
- edit existing load balancers
- delete load balancers
- hostname preflight check before deploy to detect existing Worker domain conflicts
- load balancer name locked after creation so the Worker script name remains stable

### Deployment UX
- fullscreen create progress overlay
- fullscreen update progress overlay
- fullscreen delete progress overlay
- fullscreen success states for create, update, and delete
- cancel button during create and update flows
- rollback/cleanup status handling instead of immediate request abort

### Cloudflare Deployment Model
- create deploys a Worker and attaches a Worker custom domain
- update uses Worker Versions and Deployments rather than recreating the Worker script
- update rollback restores the previously active deployment if deployment work fails
- hostname/domain changes are handled through Worker Domains attach/detach operations
- create cancellation cleans up newly created Worker/domain state
- update cancellation rolls back to the previously active version

### Deployment History Hygiene
- after successful config-changing updates, old inactive deployments are pruned
- Worker version history is also pruned so only the current active deployment and the last two inactive deployments are retained

### Routing Strategies Currently Supported
- `round-robin`
- `weighted-round-robin`
- `ip-hash`
- `cookie-sticky`
- `weighted-cookie-sticky`
- `failover`
- `geo-steering`

### Strategy Behavior Summary
- `round-robin`: edge-local rotating cursor
- `weighted-round-robin`: weighted random selection using origin weights
- `ip-hash`: stable origin selection from `cf-connecting-ip`
- `cookie-sticky`: first assignment, then affinity by cookie
- `weighted-cookie-sticky`: weighted first assignment, then affinity by cookie
- `failover`: ordered upstream retry on origin failure or upstream `5xx`
- `geo-steering`: match by Cloudflare `colo`, then `country`, then `continent`, then fallback rotation

### Origin Configuration
- multiple origins per load balancer
- per-origin weights
- per-origin geo targeting fields for countries, colos, and continents

### Placement Configuration
- smart placement toggle
- optional placement hint like `aws:us-east-1`

## Important Implementation Details
- All Cloudflare API calls happen on the server only
- The client talks to Next.js API routes which proxy to the backend
- Worker code is generated from strategy-specific templates in `server/src/services/workerTemplates/`
- Strategy selection should only emit the selected strategy template
- MongoDB remains the source of truth for dashboard state
- Cloudflare remains the source of truth for deployed Worker/runtime state

## Key Backend Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/cloudflare/credentials`
- `PUT /api/cloudflare/credentials`
- `GET /api/cloudflare/zones`
- `GET /api/loadbalancers`
- `POST /api/loadbalancers`
- `GET /api/loadbalancers/:id`
- `PUT /api/loadbalancers/:id`
- `DELETE /api/loadbalancers/:id`
- `POST /api/loadbalancers/validate-hostname`
- `POST /api/loadbalancers/operations/:operationId/cancel`
- `GET /api/user/profile`
- `PUT /api/user/password`

## Development Commands

### Client
```bash
cd client
npm install
npm run dev
npx tsc --noEmit
```

### Server
```bash
cd server
npm install
npm run dev
npx tsc --ignoreDeprecations 6.0 --noEmit
npm run build
```

## Security Notes
- Cloudflare credentials are encrypted at rest with AES-256-CBC
- passwords are hashed with bcrypt
- auth cookies are `httpOnly`
- inputs are validated on both frontend and backend
- `.env` files, build outputs, caches, and local AI tooling folders should stay ignored

## Repository Hygiene
- keep `.env*`, `node_modules/`, `.next/`, `dist/`, logs, and local tooling folders ignored
- do not commit generated secrets or Cloudflare credentials
- prefer keeping root docs aligned with the actual implemented feature set
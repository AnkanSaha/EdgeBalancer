# EdgeBalancer

EdgeBalancer is a SaaS control plane for deploying Cloudflare Worker based load balancers from a visual dashboard. Users connect a Cloudflare account, configure origins and routing, and EdgeBalancer generates and deploys the Worker for them.

## Highlights
- JWT auth with `httpOnly` cookies
- encrypted Cloudflare credential storage
- create, edit, delete, cancel, and rollback flows
- Worker Versions and Deployments based updates
- Worker custom domain attachment and validation
- deployment history pruning after updates
- fullscreen deployment progress and success UX
- seven routing strategies:
  - `round-robin`
  - `weighted-round-robin`
  - `ip-hash`
  - `cookie-sticky`
  - `weighted-cookie-sticky`
  - `failover`
  - `geo-steering`

## Tech Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: Express.js, TypeScript, Mongoose
- Database: MongoDB Atlas
- Edge Runtime: Cloudflare Workers

## Project Structure
```text
.
├── client/
├── server/
├── AGENTS.md
├── AGENT.md
├── CLAUDE.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── README.md
└── SECURITY.md
```

## Quick Start

### Prerequisites
- Node.js 20+
- npm
- MongoDB Atlas account
- Cloudflare account with Worker access

### Client
```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

### Server
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

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

## Routing Strategies

### `round-robin`
Cycles requests through origins using an edge-local rotating cursor.

### `weighted-round-robin`
Routes requests proportionally based on configured origin weights.

### `ip-hash`
Maps the incoming client IP to a stable origin selection.

### `cookie-sticky`
Pins repeat visitors to the same origin using an edge-set cookie.

### `weighted-cookie-sticky`
Uses weights for first assignment, then keeps that visitor pinned by cookie.

### `failover`
Tries origins in order until one succeeds without an upstream `5xx`.

### `geo-steering`
Matches origins by Cloudflare `colo`, then `country`, then `continent`, then falls back.

## Deployment Model
- Create deploys a Worker and attaches a Worker custom domain
- Update uses Cloudflare Worker Versions and Deployments
- Update rollback restores the previous active deployment on failure
- Cancelled create/update operations trigger cleanup or rollback
- Old deployment history is pruned after successful updates

## Verification Commands

### Client
```bash
cd client
npx tsc --noEmit
```

### Server
```bash
cd server
npx tsc --ignoreDeprecations 6.0 --noEmit
npm run build
```

## Additional Docs
- [AGENTS.md](./AGENTS.md)
- [SECURITY.md](./SECURITY.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SUPPORT.md](./SUPPORT.md)

## License
[MIT](./LICENSE)

# EdgeBalancer

A SaaS control plane for deploying **Cloudflare Worker-based load balancers** from a visual dashboard. Connect your Cloudflare account, configure origins and routing strategy, and EdgeBalancer compiles and deploys a Worker to your account. Once deployed, traffic routes directly over Cloudflare's edge — it never touches EdgeBalancer.

Unlike AWS ALB ($0.0225/hr + LCU floor, billed by the hour even at zero traffic) or Cloudflare's own paid Load Balancing ($5+/mo), a Worker from the free tier costs **$0 under 100k requests/day**.

## Highlights

- **Seven routing strategies**: round-robin, weighted round-robin, ip-hash, cookie-sticky, weighted-cookie-sticky, failover, geo-steering
- **Automatic health checks** (off by default): probes each origin on an interval, disables failing backends after 3 attempts (2s/4s/8s backoff), and redeploys the Worker without them — dashboard shows "N of N origins disabled"
- **JWT auth with `httpOnly` cookies** + Google OAuth (Firebase) and optional **TOTP + Passkey (WebAuthn) two-factor**
- **Encrypted Cloudflare credentials** (AES-256-GCM at rest)
- **Create / edit / delete / cancel / rollback** flows, with deployment history sessions
- Updates use **Cloudflare Worker Versions + Deployments**, with automatic rollback on failure
- **Worker custom-domain attachment and hostname-conflict validation** (checks both Custom Domains and Worker Routes)
- Optional **AI provisioning agent** (natural-language → load balancer) via Mistral / OpenRouter (disabled if neither key is set)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Fastify, TypeScript (strict mode), Mongoose ODM
- **Database**: MongoDB Atlas
- **Queues & locks**: Redis (BullMQ for health-check scheduling, SET-NX resource locks)
- **Edge runtime**: Cloudflare Workers (user-controlled accounts)
- **Encryption**: AES-256-GCM for Cloudflare credentials
- **Passwords**: bcrypt (10 rounds)

## Project Structure

```text
.
├── client/                  # Next.js 16 frontend (App Router)
├── server/                  # Fastify backend
│   ├── src/
│   │   ├── app.ts           # buildServer() — plugins, middleware, routes
│   │   ├── index.ts         # bootstrap: DB + Redis + Worker startup
│   │   ├── modules/         # Domain modules (preferred pattern)
│   │   │   ├── loadbalancer/
│   │   │   ├── session/
│   │   │   └── healthcheck/   # Health-check scheduler + BullMQ worker
│   │   ├── models/          # Mongoose schemas
│   │   ├── services/        # Cloudflare Worker generation + deployment
│   │   ├── workers/         # Strategy-specific Worker JS templates
│   │   ├── middleware/      # auth, cors, validation, idempotency, errors
│   │   └── validators/      # Input validation
├── k8s/                     # Kubernetes manifests (server + Redis)
├── AGENTS.md                # Full product/engineering context
├── CLAUDE.md                # Mirror of AGENTS.md
└── graphify-out/            # Knowledge graph of the codebase
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- A MongoDB Atlas account
- A Cloudflare account with Worker edit access

### Client

```bash
cd client
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

### Server

```bash
cd server
npm install
cp .env.example .env
npm run dev        # http://localhost:8000
```

## Environment Variables

### Client (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Server (`.env`)

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=                  # >= 32 chars
ENCRYPTION_KEY=              # exactly 64 hex chars (32-byte AES key)
PORT=8000
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
REDIS_URL=redis://localhost:6379
MISTRAL_API_KEY=             # AI provisioning — at least one of these two
OPENROUTER_API_KEY=          # enables POST /api/ai/generate (503 otherwise)
WEBAUTHN_RP_ID=              # optional — defaults to CLIENT_URL hostname
```

## Routing Strategies

| Strategy | Behavior |
|---|---|
| `round-robin` | Edge-local rotating cursor (in-memory, per instance) |
| `weighted-round-robin` | Weighted random selection by origin weight |
| `ip-hash` | Stable origin from `cf-connecting-ip` |
| `cookie-sticky` | First request assigns origin; affinity by cookie |
| `weighted-cookie-sticky` | Weighted first assignment, then affinity by cookie |
| `failover` | Ordered retry; advances on 5xx or connection failure |
| `geo-steering` | Match by CF `colo` → `country` → `continent` → fallback |

## Deployment Model

- **Create** deploys a Worker and attaches a custom domain (or Worker Route).
- **Update** uses Cloudflare Worker Versions + Deployments; the previous version is kept as a rollback target and old history is pruned.
- Cancelled create/update operations trigger cleanup or rollback via the cancellation token pattern.
- Health checks (when enabled) redeploy the Worker to drop failed origins, and auto-pause the balancer if every origin goes down.

## API

All responses use a consistent envelope: `{ success, data, message }`.

- **Auth** (`POST /api/auth/google`, `/logout`, `/me`, plus 2FA routes)
- **Cloudflare** (`POST /credentials`, `PUT /credentials`, `GET /credentials`, `GET /zones`)
- **Load Balancers** (`GET /api/loadbalancers`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /validate-hostname`, `POST /operations/:id/cancel`, `POST /:id/pause`, `POST /:id/resume`)
- **Sessions** (`GET /api/sessions`, `GET /:id/script`)
- **AI** (`POST /api/ai/generate`, SSE — 3 runs per 15 min, disabled without keys)
- **Health** (`GET /health`)

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
npm test
```

## Additional Docs

- [AGENTS.md](./AGENTS.md) — full product & engineering context
- [SECURITY.md](./SECURITY.md) — vulnerability reporting
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SUPPORT.md](./SUPPORT.md)

## License

[MIT](./LICENSE)

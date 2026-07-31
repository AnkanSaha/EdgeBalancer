# EdgeBalancer — Project Context

## What It Is
SaaS control plane for deploying and managing Cloudflare Worker-based load balancers without writing Worker code manually. Users connect their Cloudflare account, configure origins + strategy, and EdgeBalancer generates and deploys the Worker.

---

## Monorepo Layout

```
EdgeBalancer/
├── client/          # Next.js 16 frontend (App Router)
├── server/          # Fastify API backend
├── config/          # Nginx config (edgebalancer.conf)
├── AGENTS.md        # canonical context
└── CLAUDE.md        # identical copy — keep both in sync when editing either
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Axios |
| Backend | Fastify, TypeScript (strict), Mongoose ODM |
| Database | MongoDB Atlas |
| Auth | JWT in httpOnly cookies + Firebase (Google OAuth) |
| Edge Runtime | Cloudflare Workers (user-controlled accounts) |
| Encryption | AES-256-GCM for Cloudflare credentials at rest |
| Password | bcrypt (10 rounds) |
| Tests (client) | Jest + React Testing Library — run with `--runInBand` |
| Tests (server) | Jest integration tests — real DB, mocked Cloudflare/Firebase |

---

## Client Structure (`client/src/`)

```
app/                         # Next.js App Router pages
  page.tsx                   # Landing page
  layout.tsx                 # Root layout (AuthProvider, ToastProvider)
  dashboard/page.tsx         # Load balancer list dashboard
  loadbalancers/
    create/page.tsx          # Create flow
    [id]/edit/page.tsx       # Edit flow
  sessions/page.tsx          # Deployment history
  settings/page.tsx          # User settings / password change
  login/page.tsx
  register/page.tsx
  onboarding/page.tsx        # Cloudflare credential setup

components/
  auth/                      # AuthLayout, GoogleAuthButton
  dashboard/                 # LoadBalancerCard, SessionCard, Sidebar, AiBuilder
  landing/                   # FlowDiagram
  layout/                    # ProtectedRoute
  loadbalancers/             # DeploymentExperience, LoadBalancerVisualization, PauseModal
  providers/                 # ToastProvider
  shared/                    # Icons, Logo
  ui/                        # Badge, Button, Card, Input, Modal, MultiSelect

contexts/
  AuthContext.tsx             # Global auth state (user, loading, signOut)

lib/
  api.ts                     # Singleton ApiClient (Axios) — calls backend directly
  aiStream.ts                # fetch-based SSE reader for POST /api/ai/generate
  firebase.ts                # Firebase app init
  cloudRegions.ts            # Cloudflare region list
  geoData.ts                 # Geo targeting data
  utils.ts                   # Generic helpers

types/
  api.ts                     # All shared TypeScript interfaces
```

**Client → Backend:** `api.ts` calls `NEXT_PUBLIC_API_URL/api/*` directly (no Next.js proxy). Credentials sent as httpOnly cookies via `withCredentials: true`.

---

## Server Structure (`server/src/`)

```
index.ts                     # Entry: connects MongoDB, starts Fastify
app.ts                       # buildServer() — registers plugins, middleware, routes

config/
  firebase.ts                # Firebase Admin SDK init

middleware/
  auth.ts                    # JWT extraction + verification → attaches req.user
  cors.ts                    # CORS for configured CLIENT_URL
  errorHandler.ts            # Global error handler (last in chain)
  fastifyIdempotency.ts      # Idempotency plugin for POST/PUT
  validation.ts              # Input validation helpers
  validators/
    authValidators.ts
    cloudflareValidators.ts
    loadBalancerValidators.ts
    userValidators.ts

models/
  User.ts                    # IUser Mongoose schema
  LoadBalancer.ts            # ILoadBalancer Mongoose schema
  Session.ts                 # ISession Mongoose schema
  AiRun.ts                   # IAiRun — audit trail for AI provisioning runs

routes/                      # Flat route handlers (auth, cloudflare, user, ai)
  authRoutes.ts
  cloudflareRoutes.ts
  loadBalancerRoutes.ts      # Legacy — active routes are in modules/
  userRoutes.ts
  aiRoutes.ts

controllers/                 # Flat controllers (auth, cloudflare, user, ai)
  authController.ts
  cloudflareController.ts
  loadBalancerController.ts  # Legacy
  userController.ts
  aiController.ts            # generateWithAi (SSE)

modules/                     # Domain-module pattern (preferred)
  loadbalancer/
    loadbalancer.routes.ts   # Fastify route registrations
    controllers/             # One file per operation (kebab-case.controller.ts)
      create.controller.ts
      update.controller.ts
      delete.controller.ts
      list.controller.ts
      get.controller.ts
      cancel.controller.ts
      validate.controller.ts
      pause.controller.ts
      resume.controller.ts
      assign-domain.controller.ts
    orchestrators/           # Multi-step workflows with rollback
      create.orchestrator.ts
      update.orchestrator.ts
      delete.orchestrator.ts
      pause.orchestrator.ts
      resume.orchestrator.ts
      assign-domain.orchestrator.ts
      release-domain.orchestrator.ts
    services/                # Pure domain logic (*.service.ts)
      credentials.service.ts
      validation.service.ts
      strategy.service.ts
      formatter.service.ts
      hostname.service.ts
      operation.service.ts
      snapshot.service.ts
    types/
      loadBalancer.types.ts
  session/
    session.routes.ts
    controllers/
      list.controller.ts
      script.controller.ts
  ai/                        # Natural-language provisioning agent (LangChain.js)
                             # routes + controllers live in the flat folders above
    config/
      models.ts              # MISTRAL_MODELS + FREE_MODELS + MODEL_LADDER
      systemPrompt.ts        # guardrails — service scope only, no chat
    services/
      model-provider.service.ts   # ladder entry → ChatOpenAI (both providers are OpenAI-compatible)
      quota.service.ts            # global cooldowns — 24h provider, 60s model
      rate-limit.service.ts       # per-model rps pacing (falls through, never queues)
      model-router.service.ts     # walk ladder, skip open breakers, fall through on failure
      tools.service.ts            # LB tools, bound to the JWT userId
      agent.service.ts            # tool-calling loop, emits SSE events
      audit.service.ts            # persists the AiRun record
      sse.service.ts              # SSE frame writer
    types/
      ai.types.ts

services/                    # Cross-cutting infra services
  cloudflareClient.ts        # Cloudflare REST API wrapper
  workerGenerator.ts         # Generates Worker JS from templates
  workerDeployment.ts        # CF Worker upload
  workerDomain.ts            # CF Worker domain attach/detach
  workerDeletion.ts          # CF Worker delete
  sessionService.ts          # Session CRUD
  credentialsService.ts      # Legacy
  workerTemplates/           # Strategy-specific Worker JS templates
    roundRobin.js
    weightedRoundRobin.js
    ipHash.js
    cookieSticky.js
    weightedCookieSticky.js
    failover.js
    geoSteering.js
    paused.js
    maintenance.js

utils/
  resourceLock.ts            # Redis SET NX mutex — serialises same-name concurrent creates
  encryption.ts              # AES-256-GCM encrypt/decrypt
  password.ts                # bcrypt hash/compare
  jwt.ts                     # JWT generate/verify
  database.ts                # Mongoose connect
  workerName.ts              # Script name generation + WORKER_SCRIPT_NAME_REGEX
  loadBalancerOperationStore.ts  # In-memory operation tracking for cancel
  requestCancellation.ts     # Cancellation token pattern
  mask.ts                    # Token/ID masking for API responses
  username.ts                # Username generation from name
  retry.ts                   # Retry with backoff
  routeRunner.ts             # runHandlers() chains Fastify middleware + handler

types/
  http.ts                    # Fastify request/reply extensions
```

---

## Naming Conventions

### Files
| Context | Convention | Example |
|---|---|---|
| Module controllers | `kebab-case.controller.ts` | `assign-domain.controller.ts` |
| Module orchestrators | `kebab-case.orchestrator.ts` | `create.orchestrator.ts` |
| Module services | `kebab-case.service.ts` | `credentials.service.ts` |
| Module routes | `[module].routes.ts` | `loadbalancer.routes.ts` |
| Module types | `[module].types.ts` | `loadBalancer.types.ts` |
| Flat controllers | `camelCase` | `authController.ts` |
| Flat routes | `camelCase` | `authRoutes.ts` |
| Client components | `PascalCase.tsx` | `LoadBalancerCard.tsx` |
| Client lib/utils | `camelCase.ts` | `cloudRegions.ts` |
| Test files | mirror source path under `__tests__/` | `__tests__/unit/jwt.test.ts` |

### Folders
| Scope | Convention | Example |
|---|---|---|
| Server modules | `camelCase` | `loadbalancer/`, `session/` |
| Client components | `camelCase` | `dashboard/`, `loadbalancers/` |
| Client pages (App Router) | `camelCase` or `[param]` | `loadbalancers/[id]/edit/` |

### TypeScript
- Interfaces: `PascalCase` prefixed with `I` for Mongoose docs (`IUser`, `ILoadBalancer`)
- Types: `PascalCase` (`LoadBalancerStrategy`, `ApiResponse<T>`)
- Functions: `camelCase` for functions, `PascalCase` for React components

---

## Database Models

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required, 2–100 chars |
| email | String | unique, sparse (null for Google-only) |
| username | String | unique, lowercase |
| password | String | nullable (null for Google-only users) |
| firebaseUid | String | unique, sparse (Google OAuth users) |
| cloudflareAccountId | String | AES-256-GCM encrypted |
| cloudflareApiToken | String | AES-256-GCM encrypted |
| cloudflareAccountIdIv / Tag | String | IV + GCM tag for accountId |
| cloudflareTokenIv / Tag | String | IV + GCM tag for apiToken |
| totpDevices | Array\<ITotpDevice\> | unbounded; each `{ name, secret, iv, tag, confirmed, createdAt }`, secret AES-256-GCM encrypted |
| passkeys | Array\<IPasskey\> | unbounded; each `{ name, credentialId, publicKey, counter, transports, createdAt }` |
| preferredSecondFactor | String | `totp` \| `passkey` \| null — which method sign-in opens on |

### LoadBalancer
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | ref User |
| name | String | 3–50 chars, lowercase + hyphens only, locked after creation |
| scriptName | String | derived from name at creation; unique per user (compound index with `userId`) |
| domain | String | CF zone domain |
| subdomain | String | optional prefix |
| origins | Array\<IOriginServer\> | min 1, each has url, weight, geo fields, isFallback |
| strategy | String | enum (see strategies) |
| weightedEnabled | Boolean | derived from strategy |
| exposeRealOrigin | Boolean | adds X-Origin-Url header in Worker |
| placement | Object | { smartPlacement, region } |
| zoneId | String | Cloudflare zone ID |
| status | String | `active` \| `paused` \| `inactive` |
| pauseMode | String | `release-domain` \| `keep-domain` |
| workerUrl | String | deployed Worker URL |

### Session
Stores deployment history snapshots (Worker JS + config) per load balancer action.

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | |
| email | String | nullable |
| content | String | full Worker script at time of deploy |
| loadBalancerName | String | |
| domain / subdomain | String | |
| strategy | String | |
| placement | Object | nullable |
| exposeRealOrigin | Boolean | nullable |
| actionType | String | `create` \| `edit` |
| isActive | Boolean | false once LB deleted/updated |
| loadBalancerId | ObjectId | nullable |

---

## API Routes

### Auth (`/api/auth`)
| Method | Path | Notes |
|---|---|---|
| POST | `/google` | Firebase ID token → JWT. **The only credential** — there is no password login. |
| POST | `/logout` | clears session + challenge cookies |
| GET | `/me` | current user (protected) |
| POST | `/2fa/setup` | `{ name }` → `{ deviceId, name, secret, otpauthUrl, qrDataUrl }` (protected) |
| POST | `/2fa/confirm` | `{ deviceId, code }` → activates the device (protected) |
| POST | `/2fa/remove` | `{ deviceId, code }` → revokes a device (protected) |
| POST | `/2fa/verify` | `{ code }` → trades the challenge cookie for a session |
| POST | `/2fa/passkey/register/options` | → WebAuthn creation options (protected) |
| POST | `/2fa/passkey/register/verify` | `{ name, response }` → stores the passkey (protected) |
| POST | `/2fa/passkey/auth/options` | → WebAuthn request options (gated by `eb_2fa`) |
| POST | `/2fa/passkey/auth/verify` | `{ response }` → trades the challenge for a session |
| POST | `/2fa/passkey/remove` | `{ passkeyId }` (protected) |
| POST | `/2fa/preference` | `{ method: 'totp' \| 'passkey' \| null }` (protected) |

### Two-Factor Authentication (TOTP + Passkeys)

Authenticator apps only — no SMS, no email, **no recovery codes**. Redundancy comes from enrolling
**any number of apps**, each a separate `totpDevices[]` subdocument with its own AES-256-GCM
encrypted secret and a user-chosen name (required, ≤30 chars), so a lost phone is revoked without
disturbing the others. Verification is a linear scan over enrolled devices; growth is bounded only
by the `STRICT` rate limit on `/2fa/setup`.

There is no `totpEnabled` column: 2FA is on iff at least one device is `confirmed` (`hasTotp()` in
`services/totpService.ts` is the single definition).

**Login is two-stage when 2FA is on.** `POST /auth/google` issues an `eb_2fa` cookie (5 min, JWT
carrying `stage: 'pending-2fa'`) and returns `{ totpRequired: true }` *instead of* the `token`
cookie. `POST /auth/2fa/verify` exchanges it. The challenge deliberately uses a different cookie
name, and `authenticate` rejects any token carrying `stage` — otherwise a user could rename their
own challenge cookie and skip the code screen.

**Removal rule:** the code must come from a *different* confirmed device than the target — the
lost-phone case, where the target's codes are gone. Only when it is the last device is its own code
accepted; that path turns 2FA off.

Codes are single-use for 90s via `acquireLock('totp:used:{userId}:{code}')` — no new Redis code, the
key just expires. Drift window is ±1 step. All four routes use the `STRICT` rate limit.

Client: `components/auth/OtpInput.tsx` is one transparent input over six boxes (paste, backspace,
`one-time-code` autofill work for free) and auto-submits on the sixth digit — there is no submit
button anywhere in the 2FA flow.

#### Passkeys (WebAuthn)

A second, parallel method — never a password replacement. Unlimited named passkeys in
`passkeys[]`, verified through `@simplewebauthn/server` in `services/passkeyService.ts` (the only
file importing it).

**`authenticatorSelection` deliberately omits `authenticatorAttachment`.** Pinning it to
`'platform'` — the common tutorial default — silently excludes every USB security key and every
extension-based manager (Bitwarden, 1Password). Paired with `residentKey: 'discouraged'` (Google
already identified the user, so no discoverable credential is needed, which keeps limited-slot and
U2F-era keys working) and `userVerification: 'preferred'` (a PIN-less key still passes).

**Challenges are stateless.** Rather than a Redis entry, the WebAuthn challenge rides inside the
signed JWT cookie: `eb_2fa` for login (re-issued by `/passkey/auth/options`), `eb_pk_reg` for
enrolment. Both carry `stage`, which `authenticate` rejects — so neither can be renamed into a
session.

**`rpID`** comes from the `CLIENT_URL` hostname, since WebAuthn binds to the origin the page runs
on, not the API's. `WEBAUTHN_RP_ID` overrides it when passkeys should span sibling subdomains.

**Login is symmetric between the two methods.** `POST /auth/google` returns
`{ twoFactorRequired, methods, preferred }`; the client opens on `preferred`, and both the passkey
and TOTP screens carry the same **Try another way** control, hidden when only one method exists.
Removing a passkey needs only the session plus a confirm (standard passkey UX); removing a TOTP app
still demands a live code, because a code is the only thing that proves possession there.

### Cloudflare (`/api/cloudflare`)
| Method | Path | Notes |
|---|---|---|
| POST | `/credentials` | save CF account ID + API token |
| PUT | `/credentials` | update CF credentials |
| GET | `/credentials` | get masked credentials |
| GET | `/zones` | list CF zones from user account |

### Load Balancers (`/api/loadbalancers`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | list user's LBs |
| POST | `/` | create (validates hostname, deploys Worker) |
| GET | `/:id` | get single LB |
| PUT | `/:id` | update (uses CF Worker Versions, rollback on failure) |
| DELETE | `/:id` | delete (removes Worker + domain) |
| POST | `/validate-hostname` | preflight hostname conflict check |
| POST | `/operations/:operationId/cancel` | cancel in-flight create/update |
| POST | `/:id/pause` | pause (release-domain or keep-domain) |
| POST | `/:id/resume` | resume paused LB |

### Sessions (`/api/sessions`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | cursor-paginated list (filter: all/active/inactive) |
| GET | `/:id/script` | raw Worker JS for a session |

### AI (`/api/ai`)
| Method | Path | Notes |
|---|---|---|
| POST | `/generate` | `{ prompt }` → SSE stream of the agent run. 3 per 15 min. |

**SSE events:** `run_start`, `model_switch`, `status`, `tool_start`, `tool_result`, `done`, `error`.

**Tools:** `list_zones`, `list_load_balancers`, `create_load_balancer`, `update_load_balancer`,
`delete_load_balancer`, `pause_load_balancer`, `resume_load_balancer`.

`create_load_balancer` **executes directly** — it calls `createLoadBalancerOrchestrator` which deploys the Worker, attaches the hostname, and saves to MongoDB. The four destructive tools (`update_load_balancer`, `delete_load_balancer`, `pause_load_balancer`, `resume_load_balancer`) **never touch Cloudflare**: they resolve the target and return a `PendingAction` for user confirmation via REST API. Nothing irreversible happens inside an agent run.

**Failure handling:** a tool that fails twice stops the run; a 409 conflict stops it on the first
attempt — the agent must never rename or re-target to work around a conflict. Either way a final
model call with `RCA_PROMPT` (no tools bound) writes the root-cause paragraph shown to the user.

**Model ladder:** the OpenRouter free tier first (`openrouter/free` last within it), then all
Mistral models best-first — the free quota is capped per day, so it is spent before the metered one.
Failures are classified, and only quota exhaustion is shared with other users:

| Disposition | Trigger | Effect |
|---|---|---|
| `provider-exhausted` | OpenRouter 429 matching `DAILY_QUOTA_PATTERN` | 24h Redis cooldown, **global** |
| `model-exhausted` | Mistral 429 | 60s Redis cooldown on that model, **global** |
| `provider-dead` | 401/403 | provider skipped for **this run only** |
| `transient` | anything else, incl. burst 429 | model skipped for **this run only** |

Cooldown durations are defaults: a `Retry-After` header on the 429 overrides them, clamped to 24h.
Mistral publishes limits **per model** (requests-per-second, which clears in a second, and
tokens-per-minute, which clears within the minute) and also enforces them per workspace, shared
across every API key in it — which is why one key means one shared budget for all users here.

Mistral entries carry their published `rps`; `tryConsume` paces them in Redis and the router moves
down the ladder rather than waiting. Both providers are reached through `ChatOpenAI` with a
different `baseURL`.

**Concurrency:** runs are fully independent — separate HTTP calls, separate `trace`, separate tool
instances. They share only the one server-wide API key per provider, so they share that upstream
quota.

### User (`/api/user`)
| Method | Path | Notes |
|---|---|---|
| GET | `/profile` | user profile |
| PUT | `/password` | change password |

### Health
| Method | Path |
|---|---|
| GET | `/health` |

---

## Routing Strategies

| Strategy | Behavior |
|---|---|
| `round-robin` | Edge-local rotating cursor |
| `weighted-round-robin` | Weighted random selection by origin weight |
| `ip-hash` | Stable origin from `cf-connecting-ip` |
| `cookie-sticky` | First request assigns origin, affinity by cookie |
| `weighted-cookie-sticky` | Weighted first assignment, then affinity by cookie |
| `failover` | Ordered retry; advances on 5xx or connection failure |
| `geo-steering` | Match by CF `colo` → `country` → `continent` → fallback rotation |

---

## Cloudflare Integration

All Cloudflare API calls are **server-only** (never from client).

**Required token permissions** — every one maps to an endpoint the code actually calls:

| Permission | Used by |
|---|---|
| Account > Workers Scripts > Edit | `/accounts/{id}/workers/scripts` (deploy, versions, deployments, delete) and `/accounts/{id}/workers/domains` |
| Account > Account Analytics > Read | `/client/v4/graphql` — request/error counts |
| Zone > Zone > Read | `/zones` — zone list for the domain picker |
| Zone > DNS > Edit | `/zones/{id}/dns_records` — grey-cloud records for raw-IP origins |

**Optional:** Zone > Workers Routes > Read — `/zones/{id}/workers/routes`, the Worker Routes half of
the hostname conflict check. Without it that check is skipped with a warning; deploys still work.

**Not needed:** Workers KV Storage. Nothing binds or reads KV — it was only ever probed by its own
validation check, which has been removed.

**Hostname conflict detection:** `assertHostnameAvailable` checks two independent bindings —
`GET /accounts/{id}/workers/domains` (Custom Domains) and `GET /zones/{id}/workers/routes` (Worker
Routes). A Custom Domain silently takes precedence over a route covering the same hostname, so
checking only the former would move live traffic off whatever Worker the route points at. Route
patterns are matched with `routePatternCoversHostname` (`*` = zero or more chars, path ignored);
routes with no `script` attached are bypass rules and are not conflicts. The route check needs a
`zoneId` and is skipped when the caller has none. It is also skipped — with a warning, never an
error — when the token returns 403/404 for the routes endpoint, since that permission is not part
of the documented minimum and a missing safety net must not block deploys.

**Key CF operations:**
- `PUT /accounts/{id}/workers/scripts/{name}` — deploy Worker
- `PUT /accounts/{id}/workers/domains` — attach hostname
- Worker Versions + Deployments API — used for updates (not script re-deploy)
- Domain detach → re-attach for hostname changes on update

---

## Request Flow: Create Load Balancer

```
Client → POST /api/loadbalancers
  → authenticate middleware
  → createLoadBalancer controller
    → createLoadBalancerOrchestrator
      1. getCloudflareCredentialsForUser (decrypt from DB)
      2. generateScriptName(name)
      3. ensureWorkerNameAvailability (CF API check)
      4. generateWorkerCode (from strategy template)
      5. deployWorker → CF API
      6. assertHostnameAvailable (CF API check — Custom Domains AND Worker Routes)
      7. attachDomainToWorker → CF API → returns workerUrl
      8. LoadBalancer.create() → MongoDB
      9. createSession() → MongoDB (non-blocking, failure ignored)
    ← formatted LB response
  ← { success, data, message }
```

Step 2 first claims `lb:create:{accountId}:{scriptName}` via `acquireLock`, released in a
`finally`. Cloudflare's script PUT is an upsert and `{userId, scriptName}` is uniquely indexed, so
without the lock two concurrent creates of the same name overwrite each other's Worker and the
loser's rollback deletes the winner's. The rollback is gated on holding that lock for the same
reason. Redis being unreachable fails open — the create proceeds unlocked.

The index is compound rather than global: Worker names only have to be unique within a Cloudflare
account. **Migration** — Mongo does not drop the old global index automatically, so run
`db.loadbalancers.dropIndex('scriptName_1')` once per environment.

On any failure after Worker deploy: full rollback (delete Worker + DB record).

---

## Response Format

All API responses:
```json
{ "success": true|false, "data": <payload>, "message": "..." }
```

---

## Environment Variables

### Client (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Server (`.env`)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=                  # min 32 chars
ENCRYPTION_KEY=              # exactly 64-char hex (32-byte AES key)
PORT=8000
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
REDIS_URL=redis://localhost:6379
MISTRAL_API_KEY=             # AI provisioning — at least one of these two
OPENROUTER_API_KEY=          # enables POST /api/ai/generate, else it returns 503
WEBAUTHN_RP_ID=              # optional — defaults to the CLIENT_URL hostname
```

### Kubernetes
`k8s/deployment.yaml` pulls the whole server env from one secret via `envFrom.secretRef:
edgebalancer-env`. That secret is rebuilt on every deploy from GitHub Actions secrets in
`.github/workflows/deploy.yml`, so **a new variable is added there, not in the manifest**.
`PORT` and `REDIS_URL` are the exceptions — they are literals in the deployment.

Repository secrets required for the AI feature: `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`.

---

## Development Commands

### Client
```bash
cd client
npm install
npm run dev                  # localhost:3000
npx tsc --noEmit             # type check
npm test -- --runInBand      # tests (must use --runInBand)
```

### Server
```bash
cd server
npm install
npm run dev                  # localhost:8000 with pino-pretty
npx tsc --ignoreDeprecations 6.0 --noEmit
npm run build
npm test                     # integration tests (requires DB + env)
```

---

## Security Invariants

- Cloudflare credentials: AES-256-GCM encrypted before MongoDB write; IV + GCM tag stored alongside
- JWT: httpOnly cookie, 24h expiry
- Passwords: bcrypt 10 rounds; null for Google-only users
- CORS: restricted to `CORS_ORIGIN` env value
- All inputs validated server-side before DB/CF operations
- Error responses never leak credentials, stack traces, or internal IDs
- `ENCRYPTION_KEY` must be exactly 64 hex chars; fail fast if wrong length

---

## Idempotency

POST and PUT routes on load balancers use the `fastifyIdempotency` plugin. Clients should send an `Idempotency-Key` header to safely retry in-flight operations.

---

## Cancellation Pattern

Long-running operations (create, update) register an `operationId` in `loadBalancerOperationStore`. The cancel endpoint calls `cancellation.cancel()` which sets a flag; orchestrators call `cancellation.throwIfCancelled()` between steps, triggering rollback cleanup.

---

## Deployment History (Sessions)

Every successful create/edit saves a `Session` record with the full generated Worker JS and config snapshot. Sessions are immutable logs — they are marked `isActive: false` when the LB is updated or deleted, never modified.

---

## Responsive Layout (Client)

| Breakpoint | Label | Behavior |
|---|---|---|
| < 640px | phone | sidebar hidden, full-width panels |
| 640–1023px | tablet | collapsed sidebar |
| ≥ 1024px | desktop | sidebar visible; create/edit panels use `.hide-lg` on list |

---

## Test Notes

- Client tests: `--runInBand` required; Cloudflare and Firebase are mocked
- Server tests: integration only (real MongoDB); `firebaseUid` uses a unique index — two users in one test must be given distinct values, since nulls collide
- AI tests need **no API keys** and make no network calls: `model-provider.service` and `model-router.service` are mocked, and no test exercises `/api/ai/generate`
- Worker generator tests: unit-level, verify template output per strategy

---

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- Use `graphify query "<question>"` as the DEFAULT codebase search: run it before any grep/glob/file-read, and fall back to raw search only when the graph returns nothing
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current

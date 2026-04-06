# Contributing

## Local Setup

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

## Before Opening A PR
- run `npx tsc --noEmit` in `client/`
- run `npx tsc --ignoreDeprecations 6.0 --noEmit` in `server/`
- run `npm run build` in `server/` when backend deployment logic changes
- verify create, update, and delete flows when changing load balancer behavior
- update root docs when features or repo expectations change

## Contribution Standards
- keep Worker generation changes aligned with the selected strategy only
- do not commit secrets, `.env` files, or local tooling state
- preserve backward compatibility for persisted strategy values where practical
- prefer small, focused changes over unrelated refactors

## Documentation
- `AGENTS.md` is the canonical project context file
- `CLAUDE.md` points tools back to `AGENTS.md`
- `README.md` should stay user-facing and high level

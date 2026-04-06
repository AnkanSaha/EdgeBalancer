# AGENT.md

Canonical agent instructions for this repository live in [AGENTS.md](./AGENTS.md).

## Current Feature Snapshot
- Visual dashboard for Cloudflare Worker load balancers
- Create, edit, delete, cancel, rollback, and deployment history pruning
- Routing strategies:
  - `round-robin`
  - `weighted-round-robin`
  - `ip-hash`
  - `cookie-sticky`
  - `weighted-cookie-sticky`
  - `failover`
  - `geo-steering`
- Fullscreen deployment UX for create, update, and delete
- Hostname availability preflight checks
- Worker Versions and Deployments based update flow

See [AGENTS.md](./AGENTS.md) for the full project context, architecture, environment, and operational notes.

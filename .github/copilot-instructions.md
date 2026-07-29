# GitHub Copilot Instructions - EdgeBalancer

You are assisting with EdgeBalancer, a SaaS control plane for deploying and managing Cloudflare Worker-based load balancers.

## Graphify Directives (Check First)
This project has a graphify knowledge graph at `graphify-out/`.
- Before answering architecture or codebase questions, read [GRAPH_REPORT.md](file:///home/ankan/Documents/Projects/EdgeBalancer/graphify-out/GRAPH_REPORT.md) for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- Always use `graphify query` or graph search ahead of grep/read for tracing modular relationships and finding connections.
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current.

## Project Context
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Axios.
- **Backend**: Fastify, TypeScript (strict), Mongoose ODM, MongoDB Atlas.
- **Edge**: Cloudflare Workers (user-controlled accounts) with AES-256-GCM encrypted credentials at rest.

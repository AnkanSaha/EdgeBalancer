# Security Policy

## Reporting A Vulnerability

Do not open a public issue for security vulnerabilities.

Instead, report the issue privately to the project maintainer with:
- a clear summary of the issue
- affected area or file path
- reproduction steps
- expected impact
- any suggested mitigation

## Scope

The most security-sensitive parts of this project are:
- JWT authentication and cookie handling
- encrypted storage of Cloudflare credentials
- Cloudflare API token permissions and onboarding flow
- Worker domain attachment and hostname validation
- deployment rollback and cleanup logic
- environment variable and secret handling

## Operational Guidance
- never commit `.env` files
- never expose Cloudflare API tokens to the frontend
- keep `ENCRYPTION_KEY` secret and 64 hex characters long
- use least-privilege Cloudflare API tokens
- review Worker template changes carefully because they affect live request routing

## Hardening Checklist
- rotate leaked Cloudflare tokens immediately
- revoke compromised user sessions
- validate all user input on both frontend and backend
- verify rollback and cleanup logic after deployment pipeline changes
- keep ignored files and build artifacts out of version control

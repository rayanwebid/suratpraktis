# Deployment configuration

See [README.md](README.md) for installation, Cloudflare Workers/D1 deployment, GitHub Actions, OAuth configuration, and superadmin creation.

`.env.example` lists supported variable names without credentials. Keep populated files out of Git.

The original Site was owner-private and had a D1-backed backend. This export does not change its audience or move its existing database contents. Standalone deployment creates a separate runtime/database and must use `SITES_HOSTED_AUTH=0`. Set up a superadmin with `pnpm admin:create`.

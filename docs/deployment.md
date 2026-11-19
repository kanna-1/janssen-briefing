# Deployment Guide

Janssen's Briefing is designed for a long-running container host because the full version includes a scheduler, PostgreSQL extensions, and an optional PDF service. A stable portfolio deployment can disable the ingestion scheduler and use seeded data.

## Required services

- Node.js 24 or the included application container
- PostgreSQL with the `vector` and `pg_trgm` extensions
- Optional Gotenberg service for PDF export
- Optional OpenAI and Gemini API keys for AI features

## Environment

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
ENABLE_PIPELINE=false
OPENAI_API_KEY=
GEMINI_API_KEY=
GOTENBERG_URL=
```

Use a secret manager provided by the hosting platform. Never commit production values.

## Container deployment

1. Provision PostgreSQL and enable `vector` and `pg_trgm`.
2. Configure the environment variables.
3. Build and start the application with `docker compose up -d --build`.
4. Confirm that startup migrations complete successfully.
5. Run `npm run seed:demo` inside the application environment for a portfolio instance.
6. Place the application behind the provider's TLS-enabled reverse proxy or tunnel.

The included Compose file binds the application to `127.0.0.1:3002` so it is not exposed directly without a reverse proxy.

## Production safeguards

- Keep the database on a private network.
- Restrict ingestion and maintenance routes before enabling the scheduler publicly.
- Back up the PostgreSQL volume and test restoration.
- Add health checks and structured application logs.
- Apply rate limits to AI endpoints.
- Rotate model and database credentials regularly.
- Pin image versions instead of relying on mutable tags.

## Portfolio deployment

For a public demonstration:

1. Set `ENABLE_PIPELINE=false`.
2. Seed only synthetic or publicly licensed content.
3. Leave model keys unset if AI usage costs should be avoided.
4. Clearly label unavailable AI and PDF features in the deployment description.

# Deployment Guide

Janssen's Briefing supports both long-running containers and serverless deployment. Containers can use the process scheduler; Vercel invokes the authenticated ingestion route through `vercel.json`.

## Required services

- Node.js 24 or the included application container
- PostgreSQL with the `vector` and `pg_trgm` extensions
- Optional Gotenberg service for PDF export
- Optional OpenRouter and Gemini API keys for AI features

## Environment

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
RUN_MIGRATIONS=true
ENABLE_PIPELINE=false
ENABLE_SCHEDULER=true
CRON_SECRET=generate-a-long-random-value
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
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

## Vercel deployment

1. Provision PostgreSQL with `vector` and `pg_trgm`, then apply migrations once.
2. Set `RUN_MIGRATIONS=false`, `ENABLE_PIPELINE=true`, and `ENABLE_SCHEDULER=false`.
3. Set a long random `CRON_SECRET`; Vercel sends it as a bearer token to `/api/cron/ingest`.
4. Add `OPENROUTER_API_KEY` to enable Ask and article chat. Gemini remains optional.
5. Deploy with `vercel.json`; ingestion runs daily at 06:00 Singapore time.

## Production safeguards

- Keep the database on a private network.
- Keep ingestion and maintenance routes authenticated before enabling a public scheduler.
- Back up the PostgreSQL volume and test restoration.
- Add health checks and structured application logs.
- Apply rate limits to AI endpoints.
- Rotate model and database credentials regularly.
- Pin image versions instead of relying on mutable tags.

## Portfolio deployment

For a public demonstration:

1. Apply the Drizzle migrations once using the direct database connection.
2. Set `RUN_MIGRATIONS=false` on serverless platforms so cold starts do not run migrations.
3. Set `ENABLE_PIPELINE=false`, or enable the authenticated platform cron.
4. Seed only synthetic or publicly licensed content.
5. Leave model keys unset if AI features should be disabled. The default OpenRouter model is the free router, subject to provider limits and availability.
6. Clearly label unavailable AI and PDF features in the deployment description.

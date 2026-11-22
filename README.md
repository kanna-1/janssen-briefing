# Janssen's Briefing

A focused, self-hosted news reader that collects complete articles, groups related coverage, ranks stories by personal relevance, and supports search and grounded AI questions.

**Live demo:** [janssen-briefing.vercel.app](https://janssen-briefing.vercel.app)

## Product tour

- **Daily feed:** browse one day at a time, rank by relevance, and collapse outlets covering the same event.
- **Article reader:** read cleaned full text, export Markdown or PDF, and ask questions grounded in one article.
- **Archive search:** combine PostgreSQL full-text search, highlighted matches, filters, and typo tolerance.
- **Ask:** answer general questions directly or retrieve relevant archive articles for a sourced news answer.
- **Personal library:** save feed articles for later, then search and sort the reading list.
- **Source controls:** enable or disable individual feeds without deleting collected articles.

```text
RSS feeds -> ingest pipeline -> Postgres + pgvector -> feed / search / library
                   |                       |
          clip, score, embed        hybrid retrieval -> AI answers
```

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 and HeroUI
- PostgreSQL 18 with `pgvector`, `pg_trgm`, and generated `tsvector` search
- Drizzle ORM and startup migrations
- OpenRouter for chat and Gemini for optional scoring and embeddings
- Readability, Cheerio, and JSDOM for article extraction
- Docker Compose and Gotenberg for PDF export

## Live deployment

The public deployment ingests 20 feeds from TLDR, CNA, The Straits Times, The Guardian, The Verge, TechCrunch, Ars Technica, and Al Jazeera once each morning through an authenticated Vercel Cron route. Page visits never start a crawl. Articles are deduplicated, clipped into readable Markdown, grouped by story, and stored in PostgreSQL.

Ask uses OpenRouter's free model router. It can answer general questions directly and call archive search tools when a question needs collected news. `GEMINI_API_KEY` is optional: when omitted, relevance scoring and vector embeddings are skipped and archive retrieval falls back to PostgreSQL lexical search.

For a stable local demo without external crawling, keep `ENABLE_PIPELINE=false` and seed the sample archive:

Seed the sample archive with:

```bash
npm run seed:demo
```

## Local setup

The recommended runtime is Node 24.

1. Install dependencies:

```bash
npm install
```

2. Create the persistent Postgres volume and start the local database:

```bash
docker volume create newsapp_pg18_data
docker compose -f docker-compose.local.yml up -d
```

3. Create `.env` from the example:

```bash
cp .env.example .env
```

For the provided local Compose database, use:

```env
DATABASE_URL=postgresql://newsapp:newsapp@localhost:5433/newsapp
ENABLE_PIPELINE=false
ENABLE_SCHEDULER=true
```

4. Start the application once to apply migrations, then seed the demo:

```bash
npm run dev
npm run seed:demo
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run build
```

## Deployment

The application supports a standalone container scheduler or an authenticated Vercel Cron deployment. See [docs/deployment.md](docs/deployment.md) for the required environment variables and safeguards.

## Architecture

[docs/architecture.md](docs/architecture.md) explains the data model, ingestion pipeline, retrieval strategy, routes, caching, and design decisions.

## Implementation highlights

- Built a full news workflow from RSS ingestion and article extraction through search and reading
- Added PostgreSQL full-text and vector retrieval for archive search and grounded AI answers
- Implemented article grouping, relevance scoring, filtering, clipping, and a personal library
- Added authenticated scheduled ingestion that is independent of page traffic
- Made the production build and Docker configuration portable
- Documented the product, architecture, local setup, and deployment process

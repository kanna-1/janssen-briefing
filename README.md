# Janssen's Briefing

A focused, self-hosted news reader that collects complete articles, groups related coverage, ranks stories by personal relevance, and supports search and grounded AI questions.

## Product tour

- **Daily feed:** browse one day at a time, rank by relevance, and collapse outlets covering the same event.
- **Article reader:** read cleaned full text, export Markdown or PDF, and ask questions grounded in one article.
- **Archive search:** combine PostgreSQL full-text search, highlighted matches, filters, and typo tolerance.
- **Ask the archive:** retrieve relevant articles using lexical and vector search before generating a cited answer.
- **Personal library:** clip a URL or save an article for later.
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
- OpenAI for grounded answers and Gemini for scoring and embeddings
- Readability, Cheerio, and JSDOM for article extraction
- Docker Compose and Gotenberg for PDF export

## Demo mode

The public deployment uses `ENABLE_PIPELINE=false` and seeded articles. This keeps the demo stable and prevents a public instance from continuously crawling external feeds. Search, reading, grouping, filtering, and the library remain available. AI answers require model keys.

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

The application can run as a standalone Next.js container alongside PostgreSQL and Gotenberg. See [docs/deployment.md](docs/deployment.md) for a provider-neutral deployment checklist.

## Architecture

[docs/architecture.md](docs/architecture.md) explains the data model, ingestion pipeline, retrieval strategy, routes, caching, and design decisions.

## Implementation highlights

- Built a full news workflow from RSS ingestion and article extraction through search and reading
- Added PostgreSQL full-text and vector retrieval for archive search and grounded AI answers
- Implemented article grouping, relevance scoring, filtering, clipping, and a personal library
- Added a deterministic demo dataset with public background crawling disabled
- Made the production build and Docker configuration portable
- Documented the product, architecture, local setup, and deployment process

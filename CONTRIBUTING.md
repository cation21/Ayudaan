# Contributing

## Setup

1. `cp .env.example .env` (root) and `cp apps/web/.env.example apps/web/.env`, filling in local values (defaults work with the bundled `docker-compose.yml` Postgres).
2. `docker compose up -d postgres`
3. `npm install` (root — npm workspaces monorepo, one install covers
   everything under `apps/` and `packages/`).
4. `npm run db:generate --workspace=apps/api` then
   `npm run db:migrate --workspace=apps/api`, then
   `npm run db:seed --workspace=apps/api` for sample posts to show in the feed.
5. `npm run dev:api`, and in a second terminal, `npm run dev:web`.

## Demo credentials (after seeding)

| Login | Email | Password |
|---|---|---|
| Individual (`/login`) | `arjun@example.com` | `password123` |
| Organization (`/org-login`, Relief Warriors admin) | `priya@reliefwarriors.org` | `password123` |
| Admin (`/dev-login`, gates `/admin`) | `dev@example.com` | `devpassword123` |

The Admin password hash in `.env.example` is real bcrypt output for
`devpassword123` — it works out of the box, it's not a placeholder you
need to replace before testing locally. Change it (and every other secret
in `.env.example`) before this is anywhere but your own machine.

## Conventions

- One responsibility per service (`apps/api/src/services`). If you're adding
  a second concern to an existing service, it probably belongs in a new one.
- New payment rails / identity verifiers / anchor chains are new
  implementations of the relevant interface in `apps/api/src/interfaces` (or
  `@ayudaan/chain-anchor`), never a conditional inside an existing service.
- `packages/fraud-heuristics` is intentionally minimal here — read its
  README before assuming it's incomplete by accident.
- If a change reflects a real architectural decision (not just an
  implementation detail), add a short ADR under `docs/adr/` following the
  existing numbering.
- Every new required environment variable gets added to `.env.example` in
  the same PR that introduces it.

## Where things live

See `docs/ARCHITECTURE.md` for the current service/interface map, and
`docs/spec/ayudaan-spec-v0.3.md` for the full product and technical spec this
scaffold is built from.

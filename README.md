# Metro Memory 🚇
[Metro Memory is a modified fork of the original game by Benjamin TD](https://github.com/benjamintd/metro-memory.com)

Metro Memory is a map-based station memory game with hundreds of playable rail systems.

## Overview 🧠
- 🎯 Guess stations from memory on interactive transit maps.
- 🌍 Play cities and regions from around the world.
- 📊 Track your progress and stats.

## Tech Stack ⚙️
- Next.js 16 (App Router), React 18, TypeScript
- Tailwind CSS
- Mapbox GL + Turf.js + Fuse.js
- Prisma + PostgreSQL

## Getting Started 🚀
### Prerequisites
- Node.js 18+
- npm 9+
- A Mapbox token (`NEXT_PUBLIC_MAPBOX_TOKEN`)

### Install
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Then open:
- `http://localhost:3000/`

### Production Build
```bash
npm run build
npm run start
```

## Environment Variables 🔐
Copy `.env.example` to `.env.local` and fill in the values:

```bash
# required for map rendering
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token-here

# optional map styles
NEXT_PUBLIC_MAPBOX_STYLE=mapbox://styles/your-account/light-style
NEXT_PUBLIC_MAPBOX_STYLE_DARK=mapbox://styles/your-account/dark-style

# optional analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# optional stats backends
KV_REST_API_URL=https://<region>.kv.vercel-storage.com
KV_REST_API_TOKEN=<vercel-kv-token>
KV_REST_API_READ_ONLY_TOKEN=<vercel-kv-readonly-token>
UPSTASH_REDIS_REST_URL=https://<upstash-endpoint>
UPSTASH_REDIS_REST_TOKEN=<upstash-token>

# shared Prisma + auth/email database (Neon example)
# DATABASE_URL = pooled Neon URL for the running app
# DIRECT_URL = direct Neon URL for Prisma CLI commands
DATABASE_URL=postgresql://<user>:<password>@<project>-pooler.<region>.aws.neon.tech/<database>?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://<user>:<password>@<project>.<region>.aws.neon.tech/<database>?sslmode=require&channel_binding=require
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=<brevo-user>
BREVO_PASS=<brevo-pass>
MAIL_FROM_NAME="Metro Memory"
MAIL_FROM_EMAIL=no-reply@your-domain.com
APP_BASE_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
AUTH_EMAIL_CAPTURE_DIR=/tmp/metro-memory-auth-emails

# optional gameplay controls
SOLUTIONS_PASSWORD=change-me

# optional automation review gate
AUTOMATION_ADMIN_ALLOWED_EMAILS=you@example.com
AUTOMATION_ADMIN_LABEL=ops-admin
AUTOMATION_GIT_USER_NAME="Metro Memory Automation"
AUTOMATION_GIT_USER_EMAIL=automation@metro-memory.local
AUTOMATION_GITHUB_TOKEN=<github-token-with-actions-write-and-pr-write>
AUTOMATION_GITHUB_REPO=owner/repo
AUTOMATION_BASE_BRANCH=main
AUTOMATION_APPLY_MODE=github-actions
AUTOMATION_APPLY_WORKFLOW_FILE=automation-apply.yml
AUTOMATION_RUN_REQUEST_MODE=github-actions
AUTOMATION_RUN_REQUEST_WORKFLOW_FILE=automation-run-request.yml
AUTOMATION_WORKFLOW_REF=main
AUTOMATION_AUTO_APPLY_LABEL=automation-policy
AUTOMATION_LLM_API_KEY=
AUTOMATION_LLM_MODEL=
AUTOMATION_LLM_BASE_URL=https://api.openai.com/v1
AUTOMATION_LLM_TIMEOUT_MS=45000
AUTOMATION_TIMEOUT_CEILING_MS=60000
METRO_SYNC_AUTO_APPLY_GREEN=0
METRO_SYNC_DEEP_RESEARCH_MODE=batch
METRO_SYNC_ENABLE_BROWSER_COLLECTOR=0
METRO_SYNC_BROWSER_TIMEOUT_MS=30000
METRO_SYNC_ENABLE_MEMORY=1
METRO_SYNC_MAX_CITIES_PER_RUN=
METRO_SYNC_MAX_RESEARCH_TASKS_PER_RUN=
METRO_SYNC_MAX_RESEARCH_RUN_ATTEMPTS_PER_CLAIM=4
METRO_SYNC_MAX_FETCHES_PER_DOMAIN=
METRO_SYNC_HTTP_TIMEOUT_MS=20000
METRO_SYNC_CITY_SLUGS=
METRO_SYNC_SCOPE=all
METRO_SYNC_CLAIM_TYPES=
METRO_SYNC_MANUAL_UPDATE_MODE=0
METRO_SYNC_MONTH_INDEX_OVERRIDE=
```

### Sync Local `.env` To Codespaces + Vercel
If your desktop copy of `.env.local` is the canonical source of truth, you can push the same keys into GitHub Codespaces secrets and Vercel with:

```bash
npm run env:sync
```

Useful variants:

```bash
# preview exactly what would be changed
npm run env:sync -- --dry-run

# keep watching the local .env.local file and re-push after each save
npm run env:sync -- --watch

# sync only to Vercel development + preview
npm run env:sync -- --vercel-envs development,preview

# sync only to Codespaces
npm run env:sync -- --codespaces-only

# override the repo access list when auto-detection is not enough
npm run env:sync -- --codespaces-repo owner/repo

# point at a specific env file
npm run env:sync -- --file .env
```

Requirements:
- `gh` CLI installed and authenticated
- `vercel` CLI installed and authenticated
- your repo already linked to the correct Vercel project with `vercel link`

Behavior:
- local `.env.local` is the default source of truth, with `.env` as fallback
- when `--codespaces-repo` is omitted, the script auto-detects `owner/repo` from `GITHUB_REPOSITORY` or `git remote origin`
- Codespaces sync updates GitHub Codespaces user secrets for the selected repo access list
- Vercel sync upserts the same keys into the selected Vercel environment(s)
- remote edits made directly in Vercel or GitHub are not pulled back into the local env file
- existing shells, `next dev`, and already-running processes will usually need a restart to see updated values

## City Asset Workflow
City and line images live under `public/images/<continent>/<country>/<city>/`.

Commands:

```bash
# sync city icons/Open Graph images and regenerate the asset manifest
npm run sync:city-assets

# sync compatibility icon/card mirrors after changing images
npm run sync:icons
```

City-level images:
- `icon.ico` is the city favicon/icon, for example `public/images/asia/indonesia/jakarta/icon.ico`.
- `opengraph-image.jpg` is the city preview/social card image. `.jpeg`, `.png`, and `.webp` also work.
- `src/lib/cityAssetManifest.json` is generated from these files.
- `public/city-cards/*.jpg` and `public/city-icons/*.ico` are compatibility mirrors derived from `public/images`.

Line badge images:
- Put line/operator images in the same city image folder, for example `public/images/asia/indonesia/jakarta/MRTNorth-South.png`.
- Reference them from `lines.json` or `config.ts` with a path like `asia/indonesia/jakarta/MRTNorth-South.png`.
- Use `badgeShape` (`circle`, `square`, `capsule`, or `wide`) and `badgeFit` (`contain` or `cover`) in the line metadata when the default badge shape is wrong.

After changing images:
1. Run `npm run sync:city-assets`.
2. Run `npm run sync:icons` if city-card or icon mirrors need refreshing.
3. Restart `next dev` or rerun the build if metadata output was already cached.

## Local Translation Workflow
The repo now includes a zero-cost translation pipeline for the existing Rosetta catalog in `src/lib/i18n.tsx`.

Commands:

```bash
# extract the current catalog into reviewable JSON
npm run i18n:extract

# check locale parity using src/lib/i18n.tsx plus generated JSON overrides
npm run i18n:check

# fill missing plain-text keys with English fallbacks
npm run i18n:translate -- --backend copy

# fill missing plain-text keys with a local Ollama model instead
npm run i18n:translate -- --backend ollama --model qwen2.5:7b-instruct
```

How it works:
- `src/lib/i18n.tsx` remains the live source for complex formatter and JSX entries
- `src/lib/i18nAutoOverrides.json` stores generated plain-text overrides and is loaded at runtime
- `zh-TW` can be derived from `zh-CN` locally with `opencc-js`, so no paid API is needed for that pair
- legacy saved `jp` preferences are normalized to `ja`, while the existing Rosetta table still resolves safely

Recommended workflow:
- edit English in `src/lib/i18n.tsx`
- run `npm run i18n:check`
- run `npm run i18n:translate -- --backend ollama` if new plain-text keys are missing
- review `src/lib/i18nAutoOverrides.json`
- rerun `npm run i18n:check`

## Useful Scripts 🛠️
- `npm run dev` - Start dev server
- `npm run dev:core` - Core dev command (used by `dev`)
- `npm run dev:turbo` - Turbopack dev command
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Regenerate Prisma client
- `npm run db:migrate:dev` - Create/apply a local development migration using `DIRECT_URL` when set
- `npm run db:migrate:deploy` - Apply committed Prisma migrations to the configured database using `DIRECT_URL` when set
- `npm run db:push` - Push the current Prisma schema without creating a migration, preferring `DIRECT_URL` when set
- `npm run db:studio` - Open Prisma Studio
- `npm run check:auth-env` - Validate the production auth/mail/database environment and test DB connectivity
- `npm run test:e2e` - Run Playwright auth/browser smoke tests
- `npm run test:e2e:headed` - Run Playwright smoke tests with a visible browser
- `npm run generate:station-totals` - Rebuild station totals
- `npm run sync:city-assets` - Sync canonical city icons/Open Graph assets into `public/images/<continent>/<country>/<city>` and regenerate the manifest
- `npm run sync:icons` - Sync city icons
- `npm run sync:images` - Sync city image folders
- `npm run generate:city-data` - Export city data
- `npm run generate:available-city-data` - Regenerate availability registry
- `npm run upcoming:run` - Research upcoming stations and add any that have opened (see `upcoming/README.md`)
- `npm run routes:check -- --city=<slug>` - List stations that sit off their line's drawn route, and lines split into pieces
- `npm run routes:fill -- --city=<slug>` - Fill those gaps along track that is already drawn (never with straight lines)
- `node scripts/routes/osm-route.js --city=<slug>` - Draw lines listed in `data-sources/<slug>/osm-routes.json` along their OpenStreetMap right-of-way (needs network; runs in CI)

## Project Layout 🗂️
```text
.
|-- prisma/                 # Prisma schema + Postgres migrations (+ archived local SQLite files)
|-- public/                 # Static assets
|-- scripts/                # Data/build helper scripts
|-- src/
|   |-- app/
|   |   |-- (game)/         # City routes + gameplay configs/data
|   |   `-- (website)/      # Site routes (Metro Memory homepage at /)
|   |-- components/         # Shared UI + game components
|   |-- lib/                # Config, auth, stats, utilities
|   `-- styles/             # Global and Tailwind styles
|-- next.config.mjs
|-- package.json
`-- README.md
```

## Metro Memory Data Workflow 🗺️
City data typically lives at:
- `src/app/(game)/<region>/<country>/<city>/config.ts`
- `src/app/(game)/<region>/<country>/<city>/data/`

When adding or updating a city:
1. Export and clean source map data.
2. Regenerate `features.json`, `routes.json`, and `lines.json`.
3. Update `config.ts` metadata.
4. Register/update the city in shared config files.
5. Run `npm run generate:station-totals`.

Branched services:
- There is no special branch syntax. Treat each public branch/service as its own line id in `lines.json` (for example, Rome `Metro B` and `Metro B1`).
- Shared trunk stations should appear once per service in `features.json`, using that service's `properties.line`.
- Route geometry in `routes.json` should also be assigned to the matching service id; shared trunk segments can be duplicated for each service.
- Add every service id to the city `config.ts` `LINE_GROUPS`.
- If duplicated station entries represent the same physical station, give them the same `cluster_key` so they behave as one complex.

## Upcoming Stations Auto-Updater 🔭
A daily GitHub Action (`.github/workflows/upcoming-stations.yml`) researches future stations on its own using OpenStreetMap and Wikidata, with an optional web + LLM check. It tracks them in `upcoming/<city>.json`, records every opening-date change, and adds each station to the city's `features.json` once it has actually opened. Results come as one rolling PR. Details, statuses and manual overrides are in `upcoming/README.md`.

## Contributing 🤝
- Keep the app compiling and lint-clean.
- Document data sources for city updates.
- Never commit tokens or private credentials.

## License & Credits 📝
- MIT License unless otherwise noted in-file (`LICENSE.md`).
- Original Metro Memory concept and major assets by Benjamin Tran Dinh.
- Map data courtesy of OpenStreetMap contributors.

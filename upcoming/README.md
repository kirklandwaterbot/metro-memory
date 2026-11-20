# Upcoming stations

This folder is written by the **upcoming-stations auto-updater**
(`scripts/upcoming/run.js`, run daily by `.github/workflows/upcoming-stations.yml`).
Each `<city>.json` lists stations that are announced or under construction but not yet in the game.

## How it works

1. **Research.** Each day it checks a rotating batch of cities (about 20), plus every city with a station due within two weeks. Sources:
   - **OpenStreetMap** (Overpass): stations tagged under construction, planned with an `opening_date`, or opened this year or last. It also reads nearby route relations, stop positions and track names to work out the line.
   - **Wikidata**: stations marked "under construction" or with an official opening date, plus their "connecting line" and local-language labels.
   - **Web + LLM** (optional): only when `SERPAPI_API_KEY`, `AUTOMATION_LLM_API_KEY` and `AUTOMATION_LLM_MODEL` are set. It checks whether a due station has really opened and picks up exact dates and announced delays.
2. **Tracking.** New finds get an entry here. Stations already in the game and plain regional-rail halts are skipped. Every change to an expected opening date is logged in `dateHistory`.
3. **Adding to the game.** A tracked station is written into `features.json` once there's evidence it **opened**:
   - OSM now tags it as an operating station, or
   - a tier 1–2 web source says it's open, or
   - OSM and Wikidata both give the same exact opening day and that day has passed. This is flagged ⚠️ *scheduled* in the PR and is never auto-merged.

   If the line's drawn route doesn't reach the new station, a straight connector is added to `routes.json` (`"auto_generated": "upcoming-stations"`). `src/lib/stationTotals.ts` is then regenerated.
4. **Review.** Everything lands in one rolling PR (`auto/upcoming-stations`), with a report of what was added, any date changes, and what is waiting. Each station has links to its OSM/Wikidata sources and an **OpenRailwayMap** view of the spot. OpenRailwayMap draws the same OSM data, but its railway layer makes track and stations under construction easy to check.

## Statuses

| status | meaning |
| --- | --- |
| `scheduled` | expected in the future (or under construction with no date yet) |
| `due` | the opening window has started; waiting for confirmation |
| `overdue` | more than 30 days past the expected date and still unconfirmed (probably delayed) |
| `needs-line` | no matching line in the game, usually a brand-new line; set up `lines.json`/`LINE_GROUPS` or set `lineOverride` |
| `check` | OSM now says disused or the element was deleted; possibly cancelled |
| `promoted` | added to the game on `promotedOn` as feature `featureId` |
| `in-game` | someone added it to the game data by hand |
| `ignored` | dismissed by you; never touched again |

## The admin page

Open **/admin/upcoming** (admin accounts only). It lists every tracked station in six tabs: *Due now*, *Needs a line*, *Check*, *Coming later*, *Added* and *Ignored*. Each row links to its OSM, Wikidata, web and OpenRailwayMap sources.

On the local dev server (`npm run dev`) the page can also make changes:

- **Add**: put the station into the game now (same as the automatic promotion; station totals and city data are regenerated).
- **Pick line**: choose the line (★ marks the tracker's best guesses).
- **Ignore / Restore**: dismiss a false positive, or undo that.
- **Re-check a city now**: run the tracker for one city.

The deployed site shows the page read-only (its files can't be written); set `UPCOMING_ADMIN_WRITE=1` to allow changes anyway. The same actions work from the terminal: `node scripts/upcoming/act.js --city=<slug> --id=<id> --action=add|line|ignore|restore [--line=<lineId>]`.

## Correcting it by hand

Edit the entry in `<city>.json`:

- `"status": "ignored"`: dismiss a false positive.
- `"lineOverride": "<lineId>"`: fix or choose the line (used when `line` is wrong or `null`).
- `"nameOverride": "..."`: use your own spelling of the name.

The updater keeps these on later runs.

## Running it locally

```bash
npm run upcoming:run -- --cities=boston,tokyo --dry-run   # research, print report, write nothing
npm run upcoming:run -- --cities=boston                   # research + update files
npm run upcoming:run -- --skip-discover                   # re-evaluate tracked entries only (no network)
npm run test:automation                                   # includes the updater's tests
```

Other flags: `--all`, `--batch=N`, `--skip-promote`, `--no-web`, `--no-route-stubs`, `--today=YYYY-MM-DD`, `--report=FILE`.

Repository settings that change its behaviour:

- `UPCOMING_AUTO_MERGE=1` (Actions variable): merge the PR automatically when every added station is confirmed open.
- `UPCOMING_BATCH_SIZE` (Actions variable): number of cities checked per day.

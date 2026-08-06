# FrostBorn Lions [FL2] Last Z Command Center

Mobile-first Last Z planning tools and FL2's eight-language Season 2 guide library.

## Connected Last Z Tools

- `/tools.html` is the player command center and all-profile backup/restore screen.
- `/calculator.html` recommends Cores, Red Stones, both, orange gear, or saving Merit Medals using the selected hero, role, equipment level, stars, sections, forge stage, owned materials, and current shelf stock.
- `/research.html` tracks 10 trees with independent node levels by default, optional path auto-fill, goals, stats, and visibly unpublished costs.
- `/tank.html` tracks all 49 stages and 70,700 published wrenches, vehicle milestones, and pace from either an account start date or the consecutive login day shown in Last Z.
- `/hq.html` plans HQ 1–35 resource deficits, required buildings, and hero-level caps.
- `/heroes.html` plans hero XP, universal fragments, skill books, and season-exclusive fragments through the verified level-175/five-star boundary, with real hero art and Merit handoff.
- `/daily.html` converts Apocalypse Time, shows the Alliance Duel theme and Full Preparedness windows, and saves a per-profile daily checklist.
- `/shops.html` gives account-aware Buy/Hold/Situational/Skip guidance across seven community-documented shops without hard-coding rotating prices.

All user progress is stored in `localStorage` under separate Main, Farm, Alt, or custom profiles. No login or per-user server database is required. The command center exports and restores one small versioned JSON backup containing every local profile; the Research and Tank pages retain compatible focused backup controls. A service worker keeps the core planners usable after they have been installed/visited.

The only server-side analytics added for the command center are aggregate page-event counts at `/api/event`; the endpoint receives no player profile, form values, device identifier, or IP-derived key. Existing visit-counter behavior remains separate at `/api/visit`.

The checked-in requirement snapshots live in `public/data/research-trees.json` and `public/data/tank-modifications.json`. Their versioned browser requests are cached for repeat visits, while HTML stays uncached so deployments appear immediately. Refresh and normalize those public community datasets with:

```bash
node scripts/snapshot_lastz_tools.mjs
```

The refresh script preserves unknown research values as unknown and applies the currently verified Stresswar Shooter Training correction documented in the script.

## Local Preview

```bash
npm run serve
```

Open `http://localhost:4173`.

The local preview uses the same Node server as production. It serves `public/` and exposes `/api/visit` for the footer visit counter.

Run all calculator, profile, HQ, hero, shop, daily, research, and tank correctness checks with:

```bash
npm test
```

## Content Model

- Public browser assets live in `public/assets/guides/s2`.
- Browser-viewable uploads live in `public/assets/uploads`.
- Browser text data lives in `public/data/docs.json`.
- Original DOCX files can be kept locally in `source-documents/s2`; this folder is intentionally not committed or served by Render.
- Source guide PNGs are copied byte-for-byte by `scripts/import_s2_guides.py`; the importer does not resize or recompress them.
- The Everfrost master guide PDFs are copied per language and rendered into responsive page images for the in-browser reader.
- The S2 daily guide area is modeled as a 7-day collection. Missing day folders are shown as `Upcoming`.
- Other clan resources can be added to `manifest.uploads` and linked from `public/assets/uploads` or another browser-viewable public path.

To refresh from `/Users/davidprice/Downloads/S2 Guide`:

```bash
npm run import:s2
```

## Render

This repo includes `render.yaml` for a Render Node web service. The server serves `./public` and powers the bottom visit counter.

The Render config uses the `starter` instance type, sets `DATA_DIR=/var/data`, and attaches a 1 GB persistent disk at `/var/data`. This keeps the service from sleeping and preserves the visit counter across deploys and normal restarts. Render can still briefly restart services during deploys or platform maintenance.

## Protected Mass Communications

The Mass Communications reader supports independently protected archives with long-lived, HttpOnly device cookies. The original alliance archive uses `MASS_COMMS_PASSWORD` and `MASS_COMMS_CONTENT_KEY`; the State 630 SvS Strategy sections use `SVS_STRATEGY_PASSWORD` and `SVS_STRATEGY_CONTENT_KEY`. Both access scopes use `MASS_COMMS_SESSION_SECRET` for signed sessions, but their cookies and signatures are isolated.

Plaintext translations are never committed. To encrypt the three SvS Strategy sections from a local translation directory:

```bash
node scripts/encrypt_svs_strategy.js /path/to/svs-strategy-translations /path/to/private-content-key
```

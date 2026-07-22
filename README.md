# FrostBorn Lions [FL2] Season 2 Library

Static, mobile-friendly guide library for FL2 clan resources.

## Last Z Tools

- `/calculator.html` recommends whether merit badges should go to Legendary Gear Cores or Forging Stones.
- `/research.html` tracks all 10 research trees, prerequisites, goals, stats, and published badge costs.
- `/tank.html` tracks the 49-stage tank path, wrench totals, vehicle milestones, and completion pace.

Research and tank progress is stored only in the visitor's browser. The checked-in requirement snapshots live in `public/data/research-trees.json` and `public/data/tank-modifications.json`. Refresh and normalize those public community datasets with:

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

Run all calculator, research, and tank correctness checks with:

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

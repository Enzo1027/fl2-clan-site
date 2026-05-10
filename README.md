# FrostBorn Lions [FL2] Season 2 Library

Static, mobile-friendly guide library for FL2 clan resources.

## Local Preview

```bash
npm run serve
```

Open `http://localhost:4173`.

The local preview uses the same Node server as production. It serves `public/` and exposes `/api/visit` for the footer visit counter.

## Content Model

- Public browser assets live in `public/assets/guides/s2`.
- Browser text data lives in `public/data/docs.json`.
- Original DOCX files can be kept locally in `source-documents/s2`; this folder is intentionally not committed or served by Render.
- Source guide PNGs are copied byte-for-byte by `scripts/import_s2_guides.py`; the importer does not resize or recompress them.
- The S2 daily guide area is modeled as a 10-day collection. Missing day folders are shown as `Upcoming`.
- Other clan resources can be added to `manifest.uploads` and linked from `public/assets/uploads` or another browser-viewable public path.

To refresh from `/Users/davidprice/Downloads/S2 Guide`:

```bash
npm run import:s2
```

## Render

This repo includes `render.yaml` for a Render Node web service. The server serves `./public` and powers the bottom visit counter.

The visit counter stores counts in `.data/visits.json` by default, or in `DATA_DIR` if that environment variable is set. On Render's free ephemeral filesystem, counts can reset after deploys/restarts. Attach a persistent disk and set `DATA_DIR` to that mount path if long-term counter persistence matters.

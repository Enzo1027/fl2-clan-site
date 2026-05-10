# FrostBorn Lions [FL2] Season 2 Library

Static, mobile-friendly guide library for FL2 clan resources.

## Local Preview

```bash
npm run serve
```

Open `http://localhost:4173`.

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

This repo includes `render.yaml` for a Render Static Site. Render publishes `./public`, with no app server or database required.

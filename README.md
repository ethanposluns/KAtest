# Auto Process Notes — prototype

A small front-end prototype (not connected to Pega, no backend) that shows what a case view could
look like if it fetched its "process notes" automatically, instead of an analyst manually asking
an assistant something like *"What are the notes for TSLA?"* every time a case is opened.

## What the demo shows

- A mock case queue on the left, where each case already carries a **document type** (`Summary`
  or `News`) and a **client ID** (stock ticker) — the two fields the real workflow system already
  attaches to every case today.
- Selecting a case simulates the automated lookup: it shows a short "trace" of the document
  type + client ID being matched to a notes source, then renders the notes immediately, with a
  citation for where they came from — the same source link an analyst would otherwise have opened
  by hand.
- Summary-type cases render company stats and an overview; News-type cases render recent
  headlines. Both are keyed off the ticker.
- All case, price, and news data is hardcoded sample data in `app.js` for illustration only — there
  is no live feed or real backend behind it.

## Running locally

```bash
npm install
npm run dev
```

This starts a local Vite dev server (with hot reload) and prints a URL to open in your browser.

## Building for deployment

```bash
npm run build
```

This produces a static, deployable site in `dist/`. You can preview the production build locally
with:

```bash
npm run preview
```

## Project structure

```
index.html    Page markup
styles.css    All styling
app.js        Mock data + rendering/interaction logic
```

# Auto Process Notes — prototype

A small front-end prototype (not connected to Pega, no backend) that shows what a case view could
look like if it fetched its "process notes" for you, instead of an analyst manually asking an
assistant something like *"What are the Pre Assessment notes for TSLA?"* every time a case needs them.

## What the demo shows

- A mock case queue on the left. Each case carries a **document type** (`Contribution` or
  `Withdrawal`) and a **status** (`Pre Assessment` or `Process`) — case metadata a real workflow
  system already attaches to every case today — plus a **client ID** (stock ticker).
- Selecting a case opens it blank, with a single tab matching that case's status: a
  `Pre Assessment` case only offers Pre Assessment notes, a `Process` case only offers Process
  notes. Clicking the tab runs a short automation "trace" (client ID matched to a notes source)
  and then renders the notes, with a citation link to where they came from — the same source an
  analyst would otherwise have opened by hand.
- **Pre Assessment** notes render the full Yahoo Finance Summary quote-stats table (Previous
  Close, Day's Range, Market Cap, Beta, PE Ratio, EPS, 1y Target Est, etc.), a company overview
  line, and a business description.
- **Process** notes render the 3 most recent news headlines for that ticker.
- The market stats and news content in `app.js` are a **real, fixed snapshot** pulled from
  `finance.yahoo.com/quote/{TICKER}/` and `/news/` on **2026-09-01** — not fabricated numbers and
  not a live feed. Re-running the same lookup today will show different, more current figures.
  The case queue metadata itself (case IDs, statuses, submitted times) is invented sample data.

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
app.js        Data (case queue + Yahoo Finance snapshot) + rendering/interaction logic
```

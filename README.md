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
- **Pre Assessment** notes render a live price/change/market-cap/sector-industry card plus a
  company description.
- **Process** notes render the 3 most recent news headlines for that ticker from the last 7 days.
- Market stats and news are fetched **live from the [Finnhub](https://finnhub.io) API** at the
  moment a case is opened, via the `netlify/functions/case-data.js` serverless function — not
  fabricated numbers and not a fixed snapshot. The case queue metadata itself (case IDs, statuses,
  submitted times) is invented sample data; only the ticker symbols in it are real.
- If the Finnhub request fails (bad ticker, rate limit, missing API key), the case view shows a
  friendly inline error instead of breaking the page.

## Live data: Finnhub API key

The case view fetches real market data and news from [Finnhub](https://finnhub.io) through the
`netlify/functions/case-data.js` serverless function, which keeps the API key server-side.

- **On the deployed (Netlify) site**, set a `FINNHUB_API_KEY` environment variable in the site's
  Netlify dashboard under **Site configuration → Environment variables**. Without it, the function
  returns a 500 error and the case view shows a friendly inline error message.
- **For local testing**, plain `npm run dev` (Vite alone) cannot run the Netlify serverless
  function, so case data fetches will fail. Use the [Netlify CLI](https://docs.netlify.com/cli/get-started/)
  instead:

  ```bash
  npm install -g netlify-cli   # if you don't have it yet
  netlify dev
  ```

  `netlify dev` runs Vite and serves `netlify/functions/case-data.js` together behind one local
  URL. Set `FINNHUB_API_KEY` in a local `.env` file (untracked) or via `netlify env:set` before
  running it.

## Running locally

```bash
npm install
npm run dev
```

This starts a local Vite dev server (with hot reload) and prints a URL to open in your browser.
Note: this alone won't serve `/.netlify/functions/case-data`, so case data fetches will fail — see
[Live data: Finnhub API key](#live-data-finnhub-api-key) above for `netlify dev` instead.

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
index.html                          Page markup
styles.css                          All styling
app.js                              Case queue data + rendering/interaction/fetch logic
netlify/functions/case-data.js      Serverless proxy to the Finnhub API
netlify.toml                        Netlify build/dev config (functions directory, etc.)
```

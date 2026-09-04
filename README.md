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

## Integration guide: swapping Finnhub for a real internal system

This prototype is built so that **all** external data access goes through one file:
`netlify/functions/case-data.js`. Everything else — `app.js`, the queue, the trace animation, the
card/news-list markup — talks only to that one function and doesn't know or care that Finnhub is
behind it. Adapting this to a real workflow system means replacing what's inside that function,
not how it's called.

**1. The integration point.** `case-data.js` receives two query params, `ticker` (client ID) and
`type` (`summary` or `news`), and returns JSON. Today it maps those into two Finnhub calls
(`quote`/`stock/profile2` for `summary`, `company-news` for `news`). To point this at an internal
system instead, keep the same function signature — accept a client ID and a notes type, fetch from
a source, return JSON in the shape below — and swap the Finnhub `fetch()` calls for calls to the
internal process-notes link (or whatever internal API serves that case's notes). `app.js` would
need no changes as long as the response shape stays the same.

**2. Response shape `app.js` expects.**

For `type=summary`, `VIEWS.preassessment.body()` (in `app.js`) reads:

```json
{
  "name": "Apple Inc.",
  "price": 315.42,
  "change": -4.28,
  "changePercent": -1.34,
  "marketCap": "4.62T",
  "industry": "Consumer Electronics",
  "description": "Apple Inc. is listed on NASDAQ and operates in the Consumer Electronics industry."
}
```

`price`/`change`/`changePercent` are numbers (or `null`); everything else is a display string.
Missing/`null` fields render as `--` rather than breaking the page.

For `type=news`, `VIEWS.process.body()` reads:

```json
{
  "articles": [
    {
      "headline": "Headline text",
      "source": "Publisher name",
      "datetime": 1750000000,
      "summary": "One or two sentence summary."
    }
  ]
}
```

`articles` is an array (up to 3 are rendered); `datetime` is a Unix timestamp in seconds.

On failure, the function should return a non-2xx status with `{"error": "human-readable message"}`
— `app.js` surfaces that string directly in the inline error box, so keep it end-user-friendly.

**3. Authentication.** Right now `case-data.js` reads a single secret, `FINNHUB_API_KEY`, from
`process.env` and passes it as a query-string token — appropriate for a public third-party API
with a static key. A real internal system almost certainly needs something different: an SSO/OAuth
token minted per request, an internal API key with its own header scheme, mTLS, or an endpoint
only reachable from inside a VPN or private network Netlify's functions can't reach directly (which
would instead push this toward a backend-for-frontend or an internal gateway the function calls
out to). Whatever the real auth model is, it replaces the `token` query param and the
`FINNHUB_API_KEY` env var — the rest of the function (parse params, fetch, shape JSON, handle
errors) stays structurally the same.

**4. What this is (and isn't).** This is a proof of concept demonstrating one interaction pattern —
click a case, auto-fetch its notes, render them inline with a loading state and a citation — so a
real system's UX can be prototyped against it before wiring up production infrastructure. It is
**not** production-ready: there's no response caching, no retry/backoff on transient failures, no
timeout handling beyond what `fetch` does by default, no structured logging or error monitoring,
and no rate limiting of outbound calls. All of that would need to be added before this pattern
carries real traffic.

## Project structure

```
index.html                          Page markup
styles.css                          All styling
app.js                              Case queue data + rendering/interaction/fetch logic
netlify/functions/case-data.js      Serverless proxy to the Finnhub API
netlify.toml                        Netlify build/dev config (functions directory, etc.)
```

# Auto Process Notes — prototype

A small front-end prototype (not connected to Pega, no backend) that shows what a case view could
look like if it fetched its "process notes" for you, instead of an analyst manually asking an
assistant something like *"What are the Pre Assessment notes for TSLA?"* every time a case needs them.

## What the demo shows

- A mock case queue on the left. Each case carries a **document type** (`Contribution` or
  `Withdrawal`) and a **status** (`Pre Assessment` or `Process`) — case metadata a real workflow
  system already attaches to every case today — plus a **client ID** (stock ticker). Document type
  is what determines the notes source below; status is just the case's descriptive stage and has
  no bearing on that.
- Selecting a case opens it blank, with a single tab matching that case's **document type**: a
  `Contribution` case only offers the Pre Assessment (Wikipedia) tab, a `Withdrawal` case only
  offers the Process (Hacker News) tab — regardless of the case's status. Clicking the tab runs a
  short automation "trace" (client ID matched to a notes source) and then renders the notes, with
  a citation link to where they came from — the same source an analyst would otherwise have opened
  by hand.
- **Pre Assessment** notes render a company's [Wikipedia](https://www.wikipedia.org/) summary —
  its thumbnail (if one exists), short description, and opening extract.
- **Process** notes render the top 3 [Hacker News](https://news.ycombinator.com/) stories matching
  the company name, via the [Algolia HN Search API](https://hn.algolia.com/api) — title, points,
  and a link.
- Both are fetched **live, directly from the browser**, at the moment a case is opened — not
  fabricated data and not a fixed snapshot. Neither API requires a key: both are free, public, and
  CORS-enabled, so `app.js` calls them straight with `fetch()`, no backend involved. The case queue
  metadata itself (case IDs, statuses, submitted times) is invented sample data; only the company
  names looked up are real.
- If a lookup fails (company not found on Wikipedia, no matching Hacker News stories, network
  error), the case view shows a friendly inline error instead of breaking the page.

## Running locally

```bash
npm install
npm run dev
```

This starts a local Vite dev server (with hot reload) and prints a URL to open in your browser.
Since there's no API key to keep server-side and no serverless function involved, plain
`npm run dev` is all you need — there's nothing else to configure.

## Building for deployment

```bash
npm run build
```

This produces a static, deployable site in `dist/`. You can preview the production build locally
with:

```bash
npm run preview
```

Because everything runs client-side, the output in `dist/` can be hosted on any static file host
(Netlify, S3, GitHub Pages, etc.) with no server-side configuration.

## Integration guide: swapping in real internal systems

This prototype is built so that **all** external data access goes through two functions in
`app.js`: `fetchWikipediaSummary(name)` and `fetchHNStories(name)`. Everything else — the queue,
the trace animation, the card/news-list markup — only calls those two functions and doesn't know
or care that Wikipedia and Hacker News are behind them. Adapting this to a real workflow system
means replacing what's inside those two functions, not how they're called.

**1. The integration points.** Both functions take a company name (or, in a real system, whatever
identifier — client ID, ticker — the case carries) and return a promise that resolves to the JSON
shape below. Today they call Wikipedia's REST API and the HN Algolia search API directly from the
browser. To point this at an internal system instead, keep the same function signatures — accept
an identifier, fetch from a source, resolve to JSON in the shape below — and swap the `fetch()`
call for one against the internal process-notes link (or whatever internal API serves that case's
notes). `VIEWS.preassessment.body()` / `VIEWS.process.body()` and the rest of `app.js` would need
no changes as long as the resolved shape stays the same.

**2. Response shape `app.js` expects.**

`fetchWikipediaSummary()` should resolve to what `VIEWS.preassessment.body()` reads:

```json
{
  "title": "Apple Inc.",
  "description": "American multinational technology company",
  "extract": "Apple Inc. is an American multinational technology company headquartered in Cupertino, California...",
  "thumbnail": { "source": "https://example.com/thumb.png" }
}
```

`description` and `thumbnail` are optional — omit or set to `null`/`undefined` and they're simply
not rendered. `extract` is the body text shown; missing it renders a "No summary available"
fallback rather than breaking the page.

`fetchHNStories()` should resolve to what `VIEWS.process.body()` reads:

```json
{
  "articles": [
    { "title": "Headline text", "points": 42, "url": "https://example.com/article", "objectID": "12345" }
  ]
}
```

`articles` is an array (up to 3 are rendered). If `url` is empty, the headline links to
`https://news.ycombinator.com/item?id=<objectID>` instead — an internal integration returning its
own article/discussion links wouldn't need `objectID` at all, just a non-empty `url` per item.

On failure, throw an `Error` with a human-readable `message` — `ensureCaseData()` in `app.js`
catches it and puts that message straight into the inline error box, so keep it end-user-friendly
(see the existing `throw new Error(...)` calls in both fetch functions for the pattern).

**3. Authentication.** Wikipedia and the HN Algolia API are public and keyless, so today there's no
auth at all — `fetch()` is called directly from the browser with nothing to hide. A real internal
system almost certainly needs something: an SSO/OAuth token, an internal API key, or an endpoint
only reachable from inside a VPN or private network (which a browser can't reach directly — that
case would need routing the request through a small backend/proxy the browser *can* reach, unlike
today's fully client-side setup). Whatever the real auth model is, it lives inside
`fetchWikipediaSummary()`/`fetchHNStories()` (or their real-system replacements); the rest of the
app doesn't need to know about it.

**4. What this is (and isn't).** This is a proof of concept demonstrating one interaction pattern —
click a case, auto-fetch its notes, render them inline with a loading state and a citation — so a
real system's UX can be prototyped against it before wiring up production infrastructure. It is
**not** production-ready: there's no response caching beyond the in-memory per-session cache, no
retry/backoff on transient failures, no timeout handling beyond what `fetch` does by default, no
structured logging or error monitoring, and no rate limiting of outbound calls. All of that would
need to be added before this pattern carries real traffic.

## Project structure

```
index.html    Page markup
styles.css    All styling
app.js        Case queue data + rendering/interaction/fetch logic
```

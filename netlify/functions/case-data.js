"use strict";

// Serverless proxy in front of Finnhub so FINNHUB_API_KEY never reaches the
// browser. Called as /.netlify/functions/case-data?ticker=AAPL&type=summary
// (or type=news) from app.js when a case is opened.

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const NEWS_LOOKBACK_DAYS = 7;
const MAX_ARTICLES = 3;

class FinnhubError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const ticker = (params.ticker || "").trim().toUpperCase();
  const type = (params.type || "").trim().toLowerCase();

  if (!ticker) {
    return jsonResponse(400, { error: "Missing required 'ticker' query parameter." });
  }
  if (type !== "summary" && type !== "news") {
    return jsonResponse(400, { error: "Query parameter 'type' must be 'summary' or 'news'." });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "FINNHUB_API_KEY is not configured on the server." });
  }

  try {
    const body = type === "summary" ? await getSummary(ticker, apiKey) : await getNews(ticker, apiKey);
    return jsonResponse(200, body);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return jsonResponse(err.statusCode, { error: err.message });
    }
    return jsonResponse(502, { error: "Unexpected error fetching data from Finnhub." });
  }
};

async function getSummary(ticker, apiKey) {
  const [quote, profile] = await Promise.all([
    finnhubGet("/quote", { symbol: ticker }, apiKey),
    finnhubGet("/stock/profile2", { symbol: ticker }, apiKey)
  ]);

  const hasQuote = quote && typeof quote.c === "number" && quote.c !== 0;
  const hasProfile = profile && Object.keys(profile).length > 0;

  if (!hasQuote && !hasProfile) {
    throw new FinnhubError(404, 'No data found for ticker "' + ticker + '". Check that it\'s a valid symbol.');
  }

  const industry = hasProfile ? profile.finnhubIndustry : null;
  const name = hasProfile ? profile.name : ticker;
  const description = hasProfile
    ? name +
      " is listed on " +
      (profile.exchange || "an exchange") +
      (industry ? " and operates in the " + industry + " industry." : ".")
    : "No company profile available for " + ticker + ".";

  return {
    ticker,
    name,
    price: hasQuote ? quote.c : null,
    change: hasQuote ? quote.d : null,
    changePercent: hasQuote ? quote.dp : null,
    marketCap: hasProfile ? formatMarketCap(profile.marketCapitalization) : null,
    industry,
    description
  };
}

async function getNews(ticker, apiKey) {
  const to = new Date();
  const from = new Date(to.getTime() - NEWS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const articles = await finnhubGet(
    "/company-news",
    { symbol: ticker, from: toDateStr(from), to: toDateStr(to) },
    apiKey
  );

  if (!Array.isArray(articles)) {
    throw new FinnhubError(502, "Unexpected response from Finnhub news endpoint.");
  }
  if (articles.length === 0) {
    throw new FinnhubError(404, 'No recent news found for "' + ticker + '". Check that it\'s a valid symbol.');
  }

  const top = articles
    .slice()
    .sort(function (a, b) {
      return b.datetime - a.datetime;
    })
    .slice(0, MAX_ARTICLES)
    .map(function (a) {
      return {
        headline: a.headline,
        source: a.source,
        datetime: a.datetime,
        summary: a.summary
      };
    });

  return { ticker, articles: top };
}

async function finnhubGet(path, params, apiKey) {
  const url = new URL(FINNHUB_BASE + path);
  Object.keys(params).forEach(function (key) {
    url.searchParams.set(key, params[key]);
  });
  url.searchParams.set("token", apiKey);

  let res;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    throw new FinnhubError(502, "Couldn't reach Finnhub. Please try again shortly.");
  }

  if (res.status === 429) {
    throw new FinnhubError(429, "Finnhub rate limit reached. Please wait a moment and try again.");
  }
  if (!res.ok) {
    throw new FinnhubError(502, "Finnhub returned an error (" + res.status + ").");
  }
  return res.json();
}

function formatMarketCap(millions) {
  if (typeof millions !== "number" || millions <= 0) return null;
  if (millions >= 1e6) return (millions / 1e6).toFixed(2) + "T";
  if (millions >= 1e3) return (millions / 1e3).toFixed(2) + "B";
  return millions.toFixed(0) + "M";
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

"use strict";

// ---------------------------------------------------------------
// Mock "process notes" source data, keyed by client ID (ticker).
// In production this lookup would hit the actual process-notes
// link tied to the case's document type + client ID, instead of
// an analyst finding and pasting it into the assistant by hand.
// ---------------------------------------------------------------
var TICKERS = {
  AAPL: {
    name: "Apple Inc.",
    price: "227.44", change: "+1.82", changePct: "+0.81%", up: true,
    marketCap: "3.41T", sector: "Technology", industry: "Consumer Electronics",
    summary: "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide, and offers services including AppleCare, iCloud, and the App Store ecosystem.",
    news: [
      { headline: "Apple expands on-device AI features in latest iOS update", time: "3h ago", snippet: "The release broadens Apple Intelligence to more languages and adds new writing and photo tools across iPhone and iPad." },
      { headline: "Services revenue hits new quarterly record", time: "1d ago", snippet: "App Store, iCloud, and AppleCare subscriptions continue to outpace hardware growth, with the segment topping $24B for the quarter." },
      { headline: "Supplier shifts more assembly outside China", time: "2d ago", snippet: "Contract manufacturers are ramping capacity in India and Vietnam ahead of the next product cycle." }
    ]
  },
  TSLA: {
    name: "Tesla, Inc.",
    price: "268.90", change: "-4.15", changePct: "-1.52%", up: false,
    marketCap: "858.2B", sector: "Consumer Cyclical", industry: "Auto Manufacturers",
    summary: "Tesla designs, manufactures, and sells electric vehicles and energy generation and storage systems, and provides related service, charging, insurance, and software.",
    news: [
      { headline: "Delivery numbers top estimates for the quarter", time: "5h ago", snippet: "Model Y and Model 3 shipments drove the beat, though average selling prices continued to soften." },
      { headline: "Energy storage deployments double year-over-year", time: "1d ago", snippet: "Megapack installations are now a larger share of gross profit than in any prior quarter." },
      { headline: "Company outlines next-generation manufacturing line", time: "3d ago", snippet: "Executives described a lower-cost production process aimed at a more affordable model." }
    ]
  },
  MSFT: {
    name: "Microsoft Corporation",
    price: "512.30", change: "+3.05", changePct: "+0.60%", up: true,
    marketCap: "3.80T", sector: "Technology", industry: "Software—Infrastructure",
    summary: "Microsoft develops, licenses, and supports software, services, and devices worldwide, including Azure cloud computing, Microsoft 365 productivity software, and Xbox gaming.",
    news: [
      { headline: "Azure growth accelerates on AI infrastructure demand", time: "2h ago", snippet: "Cloud revenue growth reaccelerated as enterprise customers expanded committed AI workloads." },
      { headline: "Copilot seat growth cited as key enterprise driver", time: "1d ago", snippet: "Management pointed to expanding Copilot adoption across Microsoft 365 customers as a growth lever." },
      { headline: "Company announces new data center investment", time: "4d ago", snippet: "The build-out adds capacity across three regions to support growing compute demand." }
    ]
  },
  NVDA: {
    name: "NVIDIA Corporation",
    price: "189.75", change: "+6.40", changePct: "+3.49%", up: true,
    marketCap: "4.62T", sector: "Technology", industry: "Semiconductors",
    summary: "NVIDIA designs graphics, compute, and networking solutions, including GPUs for gaming and data centers, and platforms for AI, autonomous machines, and robotics.",
    news: [
      { headline: "Next-generation AI chip enters full production", time: "6h ago", snippet: "The new platform is shipping to major cloud customers ahead of the prior schedule." },
      { headline: "Data center segment remains primary growth driver", time: "1d ago", snippet: "Data center revenue again outpaced gaming and professional visualization combined." },
      { headline: "Company deepens partnership with cloud providers", time: "2d ago", snippet: "New agreements expand reserved capacity for AI training clusters into next year." }
    ]
  },
  AMZN: {
    name: "Amazon.com, Inc.",
    price: "231.18", change: "+0.94", changePct: "+0.41%", up: true,
    marketCap: "2.46T", sector: "Consumer Cyclical", industry: "Internet Retail",
    summary: "Amazon operates online and physical retail stores, offers cloud computing through AWS, and provides advertising, subscription, and logistics services worldwide.",
    news: [
      { headline: "AWS backlog grows as enterprise AI workloads expand", time: "4h ago", snippet: "Remaining performance obligations rose again as customers signed longer-term cloud commitments." },
      { headline: "Holiday hiring plans point to a busier season", time: "1d ago", snippet: "The company said it would add seasonal roles across its fulfillment and delivery networks." },
      { headline: "Advertising business continues double-digit growth", time: "3d ago", snippet: "Sponsored product placements remained the fastest-growing part of the ad segment." }
    ]
  },
  JPM: {
    name: "JPMorgan Chase & Co.",
    price: "312.60", change: "-1.10", changePct: "-0.35%", up: false,
    marketCap: "890.5B", sector: "Financial Services", industry: "Banks—Diversified",
    summary: "JPMorgan Chase provides investment banking, consumer and commercial banking, and asset and wealth management services worldwide.",
    news: [
      { headline: "Net interest income guidance revised for the year", time: "1d ago", snippet: "Management nudged full-year guidance higher, citing steadier deposit costs." },
      { headline: "Investment banking fees rebound", time: "2d ago", snippet: "Advisory and underwriting activity picked up from the prior quarter's pace." },
      { headline: "Firm expands branch footprint in new markets", time: "5d ago", snippet: "The expansion continues a multi-year push into regions outside its traditional base." }
    ]
  }
};

// ---------------------------------------------------------------
// Case queue. Each case already carries a document type ("Summary"
// or "News") and a client ID (ticker) — the same two fields the
// real workflow system separates cases by today.
// ---------------------------------------------------------------
var CASES = [
  { id: "CASE-20481", ticker: "AAPL", docType: "Summary", status: "New",    submitted: "Aug 25 · 9:14 AM" },
  { id: "CASE-20482", ticker: "TSLA", docType: "News",    status: "New",    submitted: "Aug 25 · 9:47 AM" },
  { id: "CASE-20483", ticker: "MSFT", docType: "Summary", status: "Review", submitted: "Aug 24 · 4:02 PM" },
  { id: "CASE-20484", ticker: "NVDA", docType: "News",    status: "New",    submitted: "Aug 26 · 8:03 AM" },
  { id: "CASE-20485", ticker: "AMZN", docType: "Summary", status: "New",    submitted: "Aug 26 · 8:22 AM" },
  { id: "CASE-20486", ticker: "JPM",  docType: "News",    status: "Review", submitted: "Aug 23 · 2:37 PM" },
  { id: "CASE-20487", ticker: "TSLA", docType: "Summary", status: "New",    submitted: "Aug 26 · 9:01 AM" },
  { id: "CASE-20488", ticker: "NVDA", docType: "Summary", status: "New",    submitted: "Aug 26 · 9:10 AM" },
  { id: "CASE-20489", ticker: "AAPL", docType: "News",    status: "Review", submitted: "Aug 25 · 11:45 AM" }
];

var ICONS = {
  summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z"/><path d="M8 9h7M8 13h7M19 8v9a2 2 0 0 1-2 2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 15 15 9M10 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M14 18l-1 1a3.5 3.5 0 0 1-5-5l1-1"/></svg>'
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
  });
}

var queueEl = document.getElementById("queue");
var detailEl = document.getElementById("detail");
var selectedId = null;

function renderQueue() {
  document.getElementById("queueCount").textContent = CASES.length + " open";
  queueEl.innerHTML = CASES.map(function (c) {
    var ticker = TICKERS[c.ticker];
    var statusClass = c.status === "New" ? "new" : "review";
    var icon = c.docType === "News" ? ICONS.news : ICONS.summary;
    return (
      '<li>' +
        '<button type="button" class="case-row' + (c.id === selectedId ? " is-selected" : "") + '" ' +
          'data-id="' + c.id + '" role="option" aria-selected="' + (c.id === selectedId) + '">' +
          '<span class="row-top">' +
            '<span class="case-id mono">' + c.id + '</span>' +
            '<span class="status ' + statusClass + '">' + escapeHtml(c.status) + '</span>' +
          '</span>' +
          '<span class="row-mid">' +
            '<span class="ticker-chip mono">' + c.ticker + '</span>' +
            '<span class="company-name">' + escapeHtml(ticker.name) + '</span>' +
          '</span>' +
          '<span class="row-bottom">' +
            '<span class="doctype-pill">' + icon + escapeHtml(c.docType) + '</span>' +
            '<span class="mono">' + c.submitted + '</span>' +
          '</span>' +
        '</button>' +
      '</li>'
    );
  }).join("");
}

function renderDetail(c) {
  var t = TICKERS[c.ticker];
  var isNews = c.docType === "News";
  var docIcon = isNews ? ICONS.news : ICONS.summary;

  var traceHtml =
    '<div class="trace">' +
      '<div class="trace-line" style="animation-delay:0ms"><span class="dot"></span>Skips manually asking: <span class="mono">&ldquo;What are the notes for ' + c.ticker + '?&rdquo;</span></div>' +
      '<div class="trace-line" style="animation-delay:110ms"><span class="dot"></span>Document type: <span class="mono">' + escapeHtml(c.docType) + '</span> &middot; Client ID: <span class="mono">' + c.ticker + '</span></div>' +
      '<div class="trace-line" style="animation-delay:220ms"><span class="dot"></span>Fetching Yahoo Finance ' + escapeHtml(c.docType) + ' for ' + c.ticker + '&hellip;</div>' +
    '</div>';

  var bodyHtml;
  if (isNews) {
    bodyHtml =
      '<ul class="news-list">' +
        t.news.map(function (n) {
          return (
            '<li class="news-item">' +
              '<p class="headline">' + escapeHtml(n.headline) + '</p>' +
              '<p class="meta">Yahoo Finance &middot; ' + n.time + '</p>' +
              '<p class="snippet">' + escapeHtml(n.snippet) + '</p>' +
            '</li>'
          );
        }).join("") +
      '</ul>' +
      '<a class="citation" href="https://finance.yahoo.com/quote/' + c.ticker + '/news/" target="_blank" rel="noopener noreferrer">' + ICONS.link + 'Source: Yahoo Finance — News for ' + c.ticker + '</a>';
  } else {
    bodyHtml =
      '<div class="stat-grid">' +
        '<div class="stat"><p class="k">Market Cap</p><p class="v">' + t.marketCap + '</p></div>' +
        '<div class="stat"><p class="k">Sector</p><p class="v" style="font-size:12px">' + escapeHtml(t.sector) + '</p></div>' +
        '<div class="stat"><p class="k">Industry</p><p class="v" style="font-size:12px">' + escapeHtml(t.industry) + '</p></div>' +
      '</div>' +
      '<p class="summary-text">' + escapeHtml(t.summary) + '</p>' +
      '<a class="citation" href="https://finance.yahoo.com/quote/' + c.ticker + '/" target="_blank" rel="noopener noreferrer">' + ICONS.link + 'Source: Yahoo Finance — Summary for ' + c.ticker + '</a>';
  }

  detailEl.innerHTML =
    '<div class="detail-head">' +
      '<div>' +
        '<p class="id mono">' + c.id + '</p>' +
        '<h2><span class="ticker-chip mono">' + c.ticker + '</span>' + escapeHtml(t.name) + '</h2>' +
        '<p class="sub"><span class="sub-icon">' + docIcon + '</span>Document type: ' + escapeHtml(c.docType) + ' &middot; Submitted ' + c.submitted + '</p>' +
      '</div>' +
      '<div class="price-block">' +
        '<p class="px mono">$' + t.price + '</p>' +
        '<p class="chg mono ' + (t.up ? "up" : "down") + '">' + t.change + ' (' + t.changePct + ')</p>' +
      '</div>' +
    '</div>' +
    traceHtml +
    '<div class="content content-in" style="animation-delay:300ms">' + bodyHtml + '</div>';
}

function selectCase(id) {
  selectedId = id;
  renderQueue();
  var c = CASES.filter(function (x) { return x.id === id; })[0];
  if (c) renderDetail(c);
}

queueEl.addEventListener("click", function (e) {
  var btn = e.target.closest(".case-row");
  if (btn) selectCase(btn.getAttribute("data-id"));
});

renderQueue();

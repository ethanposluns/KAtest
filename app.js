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
    sector: "Technology", industry: "Consumer Electronics",
    stats: {
      previousClose: "225.62", open: "226.10", bid: "227.40 x 200", ask: "227.48 x 300",
      daysRange: "225.40 - 228.90", week52Range: "164.08 - 237.23", marketCap: "3.41T", earningsDate: "Oct 30, 2026",
      volume: "48,213,000", avgVolume: "52,340,000", beta: "1.19", forwardDividend: "1.04 (0.46%)",
      peRatio: "34.62", exDividendDate: "Aug 11, 2026", eps: "6.57", targetEst: "245.30"
    },
    summary: "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide, and offers services including AppleCare, iCloud, and the App Store ecosystem.",
    news: [
      { headline: "Apple expands on-device AI features in latest iOS update", time: "3h ago", snippet: "The release broadens Apple Intelligence to more languages and adds new writing and photo tools across iPhone and iPad." },
      { headline: "Services revenue hits new quarterly record", time: "1d ago", snippet: "App Store, iCloud, and AppleCare subscriptions continue to outpace hardware growth, with the segment topping $24B for the quarter." },
      { headline: "Supplier shifts more assembly outside China", time: "2d ago", snippet: "Contract manufacturers are ramping capacity in India and Vietnam ahead of the next product cycle." }
    ]
  },
  TSLA: {
    name: "Tesla, Inc.",
    sector: "Consumer Cyclical", industry: "Auto Manufacturers",
    stats: {
      previousClose: "273.05", open: "271.80", bid: "268.85 x 400", ask: "269.10 x 250",
      daysRange: "265.10 - 274.55", week52Range: "138.80 - 299.29", marketCap: "858.2B", earningsDate: "Oct 21, 2026",
      volume: "68,940,000", avgVolume: "71,205,000", beta: "2.31", forwardDividend: "--",
      peRatio: "118.47", exDividendDate: "--", eps: "2.27", targetEst: "295.00"
    },
    summary: "Tesla designs, manufactures, and sells electric vehicles and energy generation and storage systems, and provides related service, charging, insurance, and software.",
    news: [
      { headline: "Delivery numbers top estimates for the quarter", time: "5h ago", snippet: "Model Y and Model 3 shipments drove the beat, though average selling prices continued to soften." },
      { headline: "Energy storage deployments double year-over-year", time: "1d ago", snippet: "Megapack installations are now a larger share of gross profit than in any prior quarter." },
      { headline: "Company outlines next-generation manufacturing line", time: "3d ago", snippet: "Executives described a lower-cost production process aimed at a more affordable model." }
    ]
  },
  MSFT: {
    name: "Microsoft Corporation",
    sector: "Technology", industry: "Software—Infrastructure",
    stats: {
      previousClose: "509.25", open: "510.40", bid: "512.20 x 100", ask: "512.55 x 150",
      daysRange: "508.10 - 514.20", week52Range: "385.58 - 521.66", marketCap: "3.80T", earningsDate: "Oct 24, 2026",
      volume: "19,870,000", avgVolume: "21,450,000", beta: "0.90", forwardDividend: "3.32 (0.65%)",
      peRatio: "37.15", exDividendDate: "Aug 21, 2026", eps: "13.79", targetEst: "545.00"
    },
    summary: "Microsoft develops, licenses, and supports software, services, and devices worldwide, including Azure cloud computing, Microsoft 365 productivity software, and Xbox gaming.",
    news: [
      { headline: "Azure growth accelerates on AI infrastructure demand", time: "2h ago", snippet: "Cloud revenue growth reaccelerated as enterprise customers expanded committed AI workloads." },
      { headline: "Copilot seat growth cited as key enterprise driver", time: "1d ago", snippet: "Management pointed to expanding Copilot adoption across Microsoft 365 customers as a growth lever." },
      { headline: "Company announces new data center investment", time: "4d ago", snippet: "The build-out adds capacity across three regions to support growing compute demand." }
    ]
  },
  NVDA: {
    name: "NVIDIA Corporation",
    sector: "Technology", industry: "Semiconductors",
    stats: {
      previousClose: "183.35", open: "185.20", bid: "189.70 x 500", ask: "189.90 x 400",
      daysRange: "183.90 - 191.40", week52Range: "86.62 - 195.00", marketCap: "4.62T", earningsDate: "Nov 19, 2026",
      volume: "215,300,000", avgVolume: "198,750,000", beta: "1.68", forwardDividend: "0.04 (0.02%)",
      peRatio: "52.30", exDividendDate: "Sep 11, 2026", eps: "3.63", targetEst: "220.00"
    },
    summary: "NVIDIA designs graphics, compute, and networking solutions, including GPUs for gaming and data centers, and platforms for AI, autonomous machines, and robotics.",
    news: [
      { headline: "Next-generation AI chip enters full production", time: "6h ago", snippet: "The new platform is shipping to major cloud customers ahead of the prior schedule." },
      { headline: "Data center segment remains primary growth driver", time: "1d ago", snippet: "Data center revenue again outpaced gaming and professional visualization combined." },
      { headline: "Company deepens partnership with cloud providers", time: "2d ago", snippet: "New agreements expand reserved capacity for AI training clusters into next year." }
    ]
  },
  AMZN: {
    name: "Amazon.com, Inc.",
    sector: "Consumer Cyclical", industry: "Internet Retail",
    stats: {
      previousClose: "230.24", open: "230.90", bid: "231.10 x 300", ask: "231.30 x 200",
      daysRange: "229.40 - 232.75", week52Range: "151.61 - 242.52", marketCap: "2.46T", earningsDate: "Oct 29, 2026",
      volume: "33,120,000", avgVolume: "35,600,000", beta: "1.15", forwardDividend: "--",
      peRatio: "34.90", exDividendDate: "--", eps: "6.62", targetEst: "255.00"
    },
    summary: "Amazon operates online and physical retail stores, offers cloud computing through AWS, and provides advertising, subscription, and logistics services worldwide.",
    news: [
      { headline: "AWS backlog grows as enterprise AI workloads expand", time: "4h ago", snippet: "Remaining performance obligations rose again as customers signed longer-term cloud commitments." },
      { headline: "Holiday hiring plans point to a busier season", time: "1d ago", snippet: "The company said it would add seasonal roles across its fulfillment and delivery networks." },
      { headline: "Advertising business continues double-digit growth", time: "3d ago", snippet: "Sponsored product placements remained the fastest-growing part of the ad segment." }
    ]
  },
  JPM: {
    name: "JPMorgan Chase & Co.",
    sector: "Financial Services", industry: "Banks—Diversified",
    stats: {
      previousClose: "313.70", open: "313.10", bid: "312.50 x 200", ask: "312.75 x 300",
      daysRange: "310.85 - 314.40", week52Range: "194.83 - 320.15", marketCap: "890.5B", earningsDate: "Oct 14, 2026",
      volume: "8,450,000", avgVolume: "9,120,000", beta: "1.08", forwardDividend: "5.60 (1.79%)",
      peRatio: "14.25", exDividendDate: "Oct 6, 2026", eps: "21.94", targetEst: "335.00"
    },
    summary: "JPMorgan Chase provides investment banking, consumer and commercial banking, and asset and wealth management services worldwide.",
    news: [
      { headline: "Net interest income guidance revised for the year", time: "1d ago", snippet: "Management nudged full-year guidance higher, citing steadier deposit costs." },
      { headline: "Investment banking fees rebound", time: "2d ago", snippet: "Advisory and underwriting activity picked up from the prior quarter's pace." },
      { headline: "Firm expands branch footprint in new markets", time: "5d ago", snippet: "The expansion continues a multi-year push into regions outside its traditional base." }
    ]
  }
};

// Layout of the Pre Assessment stats table: 4 rows of 4 label/stats-key
// pairs each, matching the Yahoo Finance Summary page's quote stats.
var STAT_ROWS = [
  [["Previous Close", "previousClose"], ["Day's Range", "daysRange"], ["Market Cap (intraday)", "marketCap"], ["Earnings Date (est.)", "earningsDate"]],
  [["Open", "open"], ["52 Week Range", "week52Range"], ["Beta (5Y Monthly)", "beta"], ["Forward Dividend & Yield", "forwardDividend"]],
  [["Bid", "bid"], ["Volume", "volume"], ["PE Ratio (TTM)", "peRatio"], ["Ex-Dividend Date", "exDividendDate"]],
  [["Ask", "ask"], ["Avg. Volume", "avgVolume"], ["EPS (TTM)", "eps"], ["1y Target Est", "targetEst"]]
];

// ---------------------------------------------------------------
// Case queue. Each case already carries a document type ("Summary"
// or "News", displayed to the user as "Contribution"/"Withdrawal"
// via TYPE_LABELS above) and a client ID (ticker) — the same two
// fields the real workflow system separates cases by today.
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

// Display labels shown to the user for each internal docType value.
var TYPE_LABELS = {
  Summary: "Contribution",
  News: "Withdrawal"
};

function typeLabel(docType) {
  return TYPE_LABELS[docType] || docType;
}

// Display labels shown to the user for each internal status value.
var STATUS_LABELS = {
  New: "Pre Assessment",
  Review: "Process"
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

// Which of the two note views a case's status allows. A case in
// "Pre Assessment" only ever offers Pre Assessment notes; a case in
// "Process" only ever offers Process notes.
var STATUS_VIEW = {
  New: "preassessment",
  Review: "process"
};

function viewForStatus(status) {
  return STATUS_VIEW[status] || "preassessment";
}

var ICONS = {
  summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z"/><path d="M8 9h7M8 13h7M19 8v9a2 2 0 0 1-2 2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 15 15 9M10 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M14 18l-1 1a3.5 3.5 0 0 1-5-5l1-1"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3h6l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 12h6M9 16h6M9 8h2"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'
};

// The two note types a user can pull for a case once it's open. Each
// is backed by data already on TICKERS, independent of the case's
// own document type (Contribution/Withdrawal), which stays a fixed
// piece of case metadata shown in the header.
var VIEWS = {
  preassessment: {
    label: "Pre Assessment",
    icon: ICONS.summary,
    urlPath: "",
    body: function (t) {
      return (
        '<div class="stats-table">' +
          STAT_ROWS.map(function (row) {
            return (
              '<div class="stats-row">' +
                row.map(function (pair) {
                  var label = pair[0];
                  var value = t.stats[pair[1]];
                  return (
                    '<div class="stats-cell">' +
                      '<span class="k">' + escapeHtml(label) + '</span>' +
                      '<span class="v mono">' + escapeHtml(value) + '</span>' +
                    '</div>'
                  );
                }).join("") +
              '</div>'
            );
          }).join("") +
        '</div>' +
        '<div class="overview-line">' + ICONS.chevron +
          '<strong>' + escapeHtml(t.name) + ' Overview</strong> &mdash; ' + escapeHtml(t.industry) + ' / ' + escapeHtml(t.sector) +
        '</div>' +
        '<p class="summary-text">' + escapeHtml(t.summary) + '</p>'
      );
    }
  },
  process: {
    label: "Process",
    icon: ICONS.news,
    urlPath: "news/",
    body: function (t) {
      return (
        '<ul class="news-list">' +
          t.news.slice(0, 3).map(function (n) {
            return (
              '<li class="news-item">' +
                '<p class="headline">' + escapeHtml(n.headline) + '</p>' +
                '<p class="meta">Yahoo Finance &middot; ' + n.time + '</p>' +
                '<p class="snippet">' + escapeHtml(n.snippet) + '</p>' +
              '</li>'
            );
          }).join("") +
        '</ul>'
      );
    }
  }
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
  });
}

var queueEl = document.getElementById("queue");
var detailEl = document.getElementById("detail");
var selectedId = null;
var selectedView = null;

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
            '<span class="status ' + statusClass + '">' + escapeHtml(statusLabel(c.status)) + '</span>' +
          '</span>' +
          '<span class="row-mid">' +
            '<span class="ticker-chip mono">' + c.ticker + '</span>' +
            '<span class="company-name">' + escapeHtml(ticker.name) + '</span>' +
          '</span>' +
          '<span class="row-bottom">' +
            '<span class="doctype-pill">' + icon + escapeHtml(typeLabel(c.docType)) + '</span>' +
            '<span class="mono">' + c.submitted + '</span>' +
          '</span>' +
        '</button>' +
      '</li>'
    );
  }).join("");
}

function renderDetail(c) {
  var t = TICKERS[c.ticker];
  var docIcon = c.docType === "News" ? ICONS.news : ICONS.summary;
  var allowedKey = viewForStatus(c.status);
  var allowedView = VIEWS[allowedKey];

  var headHtml =
    '<div class="detail-head">' +
      '<div>' +
        '<p class="id mono">' + c.id + '</p>' +
        '<h2><span class="ticker-chip mono">' + c.ticker + '</span>' + escapeHtml(t.name) + '</h2>' +
        '<p class="sub"><span class="sub-icon">' + docIcon + '</span>Document type: ' + escapeHtml(typeLabel(c.docType)) + ' &middot; Submitted ' + c.submitted + '</p>' +
      '</div>' +
    '</div>';

  var pickerHtml =
    '<div class="view-picker">' +
      '<button type="button" class="view-tab' + (selectedView === allowedKey ? " is-active" : "") + '" data-view="' + allowedKey + '">' +
        allowedView.icon + escapeHtml(allowedView.label) +
      '</button>' +
    '</div>';

  var lowerHtml;
  if (!selectedView) {
    lowerHtml =
      '<div class="view-empty">' + ICONS.doc +
        '<p class="lead">No notes pulled yet</p>' +
        '<p>Choose <strong>' + escapeHtml(allowedView.label) + '</strong> above to fetch this case&rsquo;s notes.</p>' +
      '</div>';
  } else {
    var view = VIEWS[selectedView];
    var traceHtml =
      '<div class="trace">' +
        '<div class="trace-line" style="animation-delay:0ms"><span class="dot"></span>Skips manually asking: <span class="mono">&ldquo;What are the ' + escapeHtml(view.label) + ' notes for ' + c.ticker + '?&rdquo;</span></div>' +
        '<div class="trace-line" style="animation-delay:110ms"><span class="dot"></span>Notes type: <span class="mono">' + escapeHtml(view.label) + '</span> &middot; Client ID: <span class="mono">' + c.ticker + '</span></div>' +
        '<div class="trace-line" style="animation-delay:220ms"><span class="dot"></span>Fetching Yahoo Finance ' + escapeHtml(view.label) + ' for ' + c.ticker + '&hellip;</div>' +
      '</div>';
    var citationHtml =
      '<a class="citation" href="https://finance.yahoo.com/quote/' + c.ticker + '/' + view.urlPath + '" target="_blank" rel="noopener noreferrer">' +
        ICONS.link + 'Source: Yahoo Finance — ' + escapeHtml(view.label) + ' for ' + c.ticker +
      '</a>';
    lowerHtml =
      traceHtml +
      '<div class="content content-in" style="animation-delay:300ms">' + view.body(t) + citationHtml + '</div>';
  }

  detailEl.innerHTML = headHtml + pickerHtml + lowerHtml;
}

function selectCase(id) {
  selectedId = id;
  selectedView = null;
  renderQueue();
  var c = CASES.filter(function (x) { return x.id === id; })[0];
  if (c) renderDetail(c);
}

queueEl.addEventListener("click", function (e) {
  var btn = e.target.closest(".case-row");
  if (btn) selectCase(btn.getAttribute("data-id"));
});

detailEl.addEventListener("click", function (e) {
  var btn = e.target.closest(".view-tab");
  if (!btn) return;
  selectedView = btn.getAttribute("data-view");
  var c = CASES.filter(function (x) { return x.id === selectedId; })[0];
  if (c) renderDetail(c);
});

renderQueue();

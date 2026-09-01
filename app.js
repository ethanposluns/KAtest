"use strict";

// ---------------------------------------------------------------
// "Process notes" source data, keyed by client ID (ticker). This is
// a live snapshot pulled from finance.yahoo.com/quote/{TICKER}/ and
// /news/ on 2026-09-01 (see README) — not a real-time feed. In
// production this lookup would hit the actual process-notes link
// tied to the case's document type + client ID, instead of an
// analyst finding and pasting it into the assistant by hand.
// ---------------------------------------------------------------
var TICKERS = {
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology", industry: "Consumer Electronics",
    stats: {
      previousClose: "319.70", open: "319.56", bid: "312.00 x 300", ask: "315.96 x 4000",
      daysRange: "312.85 - 321.23", week52Range: "225.95 - 344.57", marketCap: "4.624T", earningsDate: "Oct 29, 2026",
      volume: "40,667,429", avgVolume: "54,939,019", beta: "1.09", forwardDividend: "1.08 (0.34%)",
      peRatio: "36.29", exDividendDate: "Aug 10, 2026", eps: "8.73", targetEst: "324.45"
    },
    summary: "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories globally. The company offers iPhone, Mac, iPad, and various services including the App Store, Apple Music, and Apple TV+.",
    news: [
      { headline: "Apple's new CEO inherits a fortune and an AI question", time: "1h ago", snippet: "New Apple CEO John Ternus takes over amid questions about the company's artificial intelligence strategy and initiatives." },
      { headline: "New Apple CEO John Ternus Inherits AI Test as AAPL Stock Slips", time: "2h ago", snippet: "The leadership transition occurs as Apple's stock experiences a decline and AI remains a central challenge for the company." },
      { headline: "What Tim Cook told employees on his last day at Apple", time: "12h ago", snippet: "Tim Cook addressed staff members as he concluded his 15-year tenure as CEO of the tech giant." }
    ]
  },
  TSLA: {
    name: "Tesla, Inc.",
    sector: "Consumer Cyclical", industry: "Auto Manufacturers",
    stats: {
      previousClose: "348.75", open: "347.15", bid: "366.18 x 200", ask: "369.00 x 200",
      daysRange: "347.15 - 368.92", week52Range: "297.38 - 498.83", marketCap: "1.453T", earningsDate: "Oct 21, 2026",
      volume: "61,157,428", avgVolume: "41,543,255", beta: "1.83", forwardDividend: "--",
      peRatio: "322.76", exDividendDate: "--", eps: "1.14", targetEst: "390.09"
    },
    summary: "Tesla designs, develops, manufactures, and sells electric vehicles and energy generation and storage systems globally. The company operates in Automotive and Energy Generation segments, offering EVs, solar products, and battery storage solutions.",
    news: [
      { headline: "Tesla Stock Crushes Rivian, Chinese EV Rivals In August — Wall Street Sees More Upside Before Cybercab Event", time: "30m ago", snippet: "Tesla's stock significantly outperformed competitors during August, with analysts expecting continued gains leading up to the company's upcoming Cybercab event." },
      { headline: "AMD vs. Nvidia: SpaceX and Tesla CEO Elon Musk Weighs In on His Top Pick", time: "15m ago", snippet: "Elon Musk shared his preference between chip manufacturers AMD and Nvidia in a recent discussion about semiconductor choices." },
      { headline: "Here comes the AI capex shocker, Goldman Sachs says", time: "12h ago", snippet: "Goldman Sachs analysts predict a significant surprise related to artificial intelligence capital expenditures, with implications for tech stocks including Tesla." }
    ]
  },
  MSFT: {
    name: "Microsoft Corporation",
    sector: "Technology", industry: "Software—Infrastructure",
    stats: {
      previousClose: "513.53", open: "510.33", bid: "505.03 x 600", ask: "509.47 x 500",
      daysRange: "506.40 - 512.19", week52Range: "349.20 - 553.72", marketCap: "3.767T", earningsDate: "Oct 28, 2026",
      volume: "26,637,042", avgVolume: "38,141,796", beta: "1.10", forwardDividend: "3.64 (0.71%)",
      peRatio: "28.56", exDividendDate: "Aug 20, 2026", eps: "17.76", targetEst: "569.45"
    },
    summary: "Microsoft develops and supports technology solutions including operating systems, server applications, business software, development tools, and devices like PCs and gaming consoles. The company operates across three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.",
    news: [
      { headline: "Here comes the AI capex shocker, Goldman Sachs says", time: "12h ago", snippet: "Goldman Sachs discusses anticipated surprises regarding artificial intelligence capital expenditure trends affecting major tech companies." },
      { headline: "Agentic AI Has Arrived. Is Your Workforce Ready to Leverage It?", time: "2h ago", snippet: "An examination of how organizations can prepare their employees to work alongside and benefit from autonomous AI systems." },
      { headline: "This Bitcoin Miner Says It Has $4 Billion of Contracted AI ARR", time: "2h ago", snippet: "A cryptocurrency mining firm reports substantial contracted annual recurring revenue from AI services, with analyst projections suggesting significant growth potential." }
    ]
  },
  NVDA: {
    name: "NVIDIA Corporation",
    sector: "Technology", industry: "Semiconductors",
    stats: {
      previousClose: "217.55", open: "218.86", bid: "220.10 x 4000", ask: "221.48 x 200",
      daysRange: "216.21 - 221.29", week52Range: "164.07 - 236.54", marketCap: "5.331T", earningsDate: "Nov 17, 2026",
      volume: "124,033,835", avgVolume: "138,830,287", beta: "2.21", forwardDividend: "1.00 (0.46%)",
      peRatio: "27.88", exDividendDate: "Sep 10, 2026", eps: "7.92", targetEst: "323.42"
    },
    summary: "NVIDIA operates as a data center scale AI infrastructure company providing accelerated computing platforms, AI solutions, and automotive technologies across multiple markets including gaming, professional visualization, and data centers.",
    news: [
      { headline: "AMD vs. Nvidia: SpaceX and Tesla CEO Elon Musk Weighs In on His Top Pick", time: "15m ago", snippet: "Motley Fool article discussing Elon Musk's perspective on the competitive landscape between AMD and NVIDIA in the chip market." },
      { headline: "What Nvidia's stellar Q2 earnings represent for AI in the rest of 2026", time: "14h ago", snippet: "Yahoo Finance Video examining how NVIDIA's strong quarterly results signal momentum for artificial intelligence development through 2026." },
      { headline: "Nvidia Just Put $3.5 Billion Behind Its Next AI Expansion", time: "3h ago", snippet: "GuruFocus.com report covering NVIDIA's substantial capital commitment toward advancing its artificial intelligence initiatives." }
    ]
  },
  AMZN: {
    name: "Amazon.com, Inc.",
    sector: "Consumer Cyclical", industry: "Internet Retail",
    stats: {
      previousClose: "266.43", open: "263.83", bid: "255.00 x 300", ask: "259.50 x 100",
      daysRange: "257.15 - 264.36", week52Range: "196.00 - 287.20", marketCap: "2.802T", earningsDate: "Oct 29, 2026",
      volume: "45,422,317", avgVolume: "48,954,106", beta: "1.45", forwardDividend: "--",
      peRatio: "20.88", exDividendDate: "--", eps: "12.44", targetEst: "327.67"
    },
    summary: "Amazon engages in retail sales of consumer products, advertising, and subscription services through online and physical stores. The company operates three segments: North America, International, and Amazon Web Services (AWS), along with electronic devices and media content production.",
    news: [
      { headline: "Here comes the AI capex shocker, Goldman Sachs says", time: "12h ago", snippet: "Analysis of significant capital expenditure implications related to artificial intelligence investments among major tech companies." },
      { headline: "ZonPrep Acquires FNSKU Studio and Wizard-Industries, Deepening Its Investment in Amazon Inbound Logistics", time: "1h ago", snippet: "ZonPrep expanded its Amazon logistics capabilities through acquisitions focused on inbound logistics optimization." },
      { headline: "FTC sues Amazon, alleging it overcharged advertisers", time: "3h ago", snippet: "The Federal Trade Commission filed legal action against Amazon, claiming the company manipulated advertising auctions to “secretly upcharge” advertisers." }
    ]
  },
  JPM: {
    name: "JPMorgan Chase & Co.",
    sector: "Financial Services", industry: "Banks—Diversified",
    stats: {
      previousClose: "357.62", open: "355.90", bid: "--", ask: "--",
      daysRange: "354.77 - 357.75", week52Range: "279.10 - 366.50", marketCap: "946.367B", earningsDate: "Oct 13, 2026",
      volume: "7,742,145", avgVolume: "8,380,647", beta: "0.98", forwardDividend: "6.00 (1.68%)",
      peRatio: "15.25", exDividendDate: "Jul 6, 2026", eps: "23.35", targetEst: "374.57"
    },
    summary: "JPMorgan Chase operates as a diversified banking and financial holding company with operations across 66 countries. The firm generates revenue through consumer and community banking, commercial and investment banking, and asset and wealth management divisions, managing over $7.6 trillion in client assets.",
    news: [
      { headline: "How Investors May Respond To JPMorgan Chase (JPM) Bond Issuance, Branch Expansion and Higher Payouts", time: "9h ago", snippet: "The article discusses potential investor reactions to JPMorgan's bond offerings, branch expansion plans, and increased payouts to shareholders." },
      { headline: "JPMorgan Drops 'Bullish' Stance On US Stocks After Warsh's Hawkish Tone At Jackson Hole, Shifts To 'Tactically Cautious'", time: "10h ago", snippet: "Following hawkish commentary at Jackson Hole, JPMorgan adjusted its market outlook from bullish to a more cautious tactical position on U.S. equities." },
      { headline: "JPMorgan Slips as 60% Hike Odds Cut Both Ways", time: "12h ago", snippet: "The article examines how interest rate hike probability estimates are creating mixed signals affecting JPMorgan's stock performance." }
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

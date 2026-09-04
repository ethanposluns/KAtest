"use strict";

// ---------------------------------------------------------------
// Client-facing names for the queue list and case header, keyed by
// client ID (ticker). Everything else — price, market cap, sector/
// industry, description, and news — is fetched live from Finnhub
// (via the case-data Netlify function) when a case is opened, instead
// of an analyst finding and pasting it into the assistant by hand.
// ---------------------------------------------------------------
var TICKER_NAMES = {
  AAPL: "Apple Inc.",
  TSLA: "Tesla, Inc.",
  MSFT: "Microsoft Corporation",
  NVDA: "NVIDIA Corporation",
  AMZN: "Amazon.com, Inc.",
  JPM: "JPMorgan Chase & Co."
};

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
// renders the live payload fetched from the case-data function, keyed
// by case status — independent of the case's own document type
// (Contribution/Withdrawal), which stays a fixed piece of case
// metadata shown in the header.
var VIEWS = {
  preassessment: {
    label: "Pre Assessment",
    icon: ICONS.summary,
    body: function (data) {
      var hasChange = typeof data.change === "number";
      var changeClass = hasChange ? (data.change >= 0 ? "up" : "down") : "";
      var changeText = hasChange
        ? (data.change >= 0 ? "+" : "") + data.change.toFixed(2) +
          (typeof data.changePercent === "number" ? " (" + (data.changePercent >= 0 ? "+" : "") + data.changePercent.toFixed(2) + "%)" : "")
        : "--";
      return (
        '<div class="stats-table">' +
          '<div class="stats-row">' +
            '<div class="stats-cell"><span class="k">Price</span><span class="v mono">' +
              (typeof data.price === "number" ? "$" + data.price.toFixed(2) : "--") + '</span></div>' +
            '<div class="stats-cell"><span class="k">Change</span><span class="v mono ' + changeClass + '">' + escapeHtml(changeText) + '</span></div>' +
            '<div class="stats-cell"><span class="k">Market Cap</span><span class="v mono">' + escapeHtml(data.marketCap || "--") + '</span></div>' +
            '<div class="stats-cell"><span class="k">Sector / Industry</span><span class="v mono">' + escapeHtml(data.industry || "--") + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="overview-line">' + ICONS.chevron +
          '<strong>' + escapeHtml(data.name) + ' Overview</strong>' +
        '</div>' +
        '<p class="summary-text">' + escapeHtml(data.description || "No description available.") + '</p>'
      );
    }
  },
  process: {
    label: "Process",
    icon: ICONS.news,
    body: function (data) {
      var articles = (data && data.articles) || [];
      if (!articles.length) {
        return '<p class="summary-text">No recent news found for this ticker in the last 7 days.</p>';
      }
      return (
        '<ul class="news-list">' +
          articles.map(function (n) {
            return (
              '<li class="news-item">' +
                '<p class="headline">' + escapeHtml(n.headline || "(untitled)") + '</p>' +
                '<p class="meta">' + escapeHtml(n.source || "Finnhub") + ' &middot; ' + formatNewsDate(n.datetime) + '</p>' +
                '<p class="snippet">' + escapeHtml(n.summary || "") + '</p>' +
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

function formatNewsDate(unixSeconds) {
  if (!unixSeconds) return "";
  var d = new Date(unixSeconds * 1000);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fetchCaseData(ticker, type) {
  var url = "/.netlify/functions/case-data?ticker=" + encodeURIComponent(ticker) + "&type=" + encodeURIComponent(type);
  return fetch(url)
    .catch(function () {
      throw new Error("Couldn't reach the data service. Check your connection and try again.");
    })
    .then(function (res) {
      return res
        .json()
        .catch(function () { return {}; })
        .then(function (body) {
          if (!res.ok) {
            throw new Error((body && body.error) || ("Request failed with status " + res.status + "."));
          }
          return body;
        });
    });
}

var queueEl = document.getElementById("queue");
var detailEl = document.getElementById("detail");
var selectedId = null;
var selectedView = null;
// Cache of fetched case-data responses, keyed by "<caseId>:<view>", so
// re-selecting an already-loaded view doesn't refetch it.
var caseDataCache = {};

function renderQueue() {
  document.getElementById("queueCount").textContent = CASES.length + " open";
  queueEl.innerHTML = CASES.map(function (c) {
    var name = TICKER_NAMES[c.ticker] || c.ticker;
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
            '<span class="company-name">' + escapeHtml(name) + '</span>' +
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

function traceHtml(view, ticker, statusLine) {
  return (
    '<div class="trace">' +
      '<div class="trace-line" style="animation-delay:0ms"><span class="dot"></span>Skips manually asking: <span class="mono">&ldquo;What are the ' + escapeHtml(view.label) + ' notes for ' + ticker + '?&rdquo;</span></div>' +
      '<div class="trace-line" style="animation-delay:110ms"><span class="dot"></span>Notes type: <span class="mono">' + escapeHtml(view.label) + '</span> &middot; Client ID: <span class="mono">' + ticker + '</span></div>' +
      '<div class="trace-line" style="animation-delay:220ms"><span class="dot"></span>' + statusLine + '</div>' +
    '</div>'
  );
}

function citationHtml(view, ticker) {
  return (
    '<a class="citation" href="https://finnhub.io/quote/' + ticker + '" target="_blank" rel="noopener noreferrer">' +
      ICONS.link + 'Source: Finnhub — ' + escapeHtml(view.label) + ' for ' + ticker +
    '</a>'
  );
}

function renderDetail(c) {
  var name = TICKER_NAMES[c.ticker] || c.ticker;
  var docIcon = c.docType === "News" ? ICONS.news : ICONS.summary;
  var allowedKey = viewForStatus(c.status);
  var allowedView = VIEWS[allowedKey];

  var headHtml =
    '<div class="detail-head">' +
      '<div>' +
        '<p class="id mono">' + c.id + '</p>' +
        '<h2><span class="ticker-chip mono">' + c.ticker + '</span>' + escapeHtml(name) + '</h2>' +
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
    var key = c.id + ":" + selectedView;
    var entry = caseDataCache[key] || { status: "loading" };

    if (entry.status === "error") {
      lowerHtml =
        traceHtml(view, c.ticker, 'Finnhub ' + escapeHtml(view.label) + ' lookup for ' + c.ticker + ' failed.') +
        '<div class="content content-in" style="animation-delay:80ms">' +
          '<div class="error-box">' + ICONS.doc + '<span>' + escapeHtml(entry.message) + '</span></div>' +
        '</div>';
    } else if (entry.status === "ready") {
      lowerHtml =
        traceHtml(view, c.ticker, 'Fetched Finnhub ' + escapeHtml(view.label) + ' for ' + c.ticker + '.') +
        '<div class="content content-in" style="animation-delay:80ms">' + view.body(entry.data) + citationHtml(view, c.ticker) + '</div>';
    } else {
      lowerHtml = traceHtml(view, c.ticker, 'Fetching Finnhub ' + escapeHtml(view.label) + ' for ' + c.ticker + '&hellip;');
    }
  }

  detailEl.innerHTML = headHtml + pickerHtml + lowerHtml;
}

function ensureCaseData(c, view) {
  var key = c.id + ":" + view;
  var entry = caseDataCache[key];
  if (entry && (entry.status === "ready" || entry.status === "loading")) return;

  caseDataCache[key] = { status: "loading" };
  var type = view === "preassessment" ? "summary" : "news";
  fetchCaseData(c.ticker, type)
    .then(function (data) {
      caseDataCache[key] = { status: "ready", data: data };
      if (selectedId === c.id && selectedView === view) renderDetail(c);
    })
    .catch(function (err) {
      caseDataCache[key] = { status: "error", message: (err && err.message) || "Something went wrong." };
      if (selectedId === c.id && selectedView === view) renderDetail(c);
    });
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
  var view = btn.getAttribute("data-view");
  var c = CASES.filter(function (x) { return x.id === selectedId; })[0];
  if (!c) return;
  selectedView = view;
  ensureCaseData(c, view);
  renderDetail(c);
});

renderQueue();

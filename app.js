"use strict";

// ---------------------------------------------------------------
// Client-facing names for the queue list and case header, keyed by
// client ID (ticker). Everything else — the Wikipedia summary and
// the Hacker News stories — is fetched live, directly from those
// public APIs, when a case is opened, instead of an analyst finding
// and pasting it into the assistant by hand.
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

// Which of the two note views a case's document type maps to. A
// "Contribution" case always pulls its Wikipedia summary; a
// "Withdrawal" case always pulls its Hacker News discussion. The
// case's stage (Pre Assessment vs. Process) has no bearing on this.
var DOCTYPE_VIEW = {
  Summary: "preassessment",
  News: "process"
};

function viewForDocType(docType) {
  return DOCTYPE_VIEW[docType] || "preassessment";
}

var ICONS = {
  summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z"/><path d="M8 9h7M8 13h7M19 8v9a2 2 0 0 1-2 2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 15 15 9M10 6l1-1a3.5 3.5 0 0 1 5 5l-1 1M14 18l-1 1a3.5 3.5 0 0 1-5-5l1-1"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3h6l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 12h6M9 16h6M9 8h2"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>'
};

// The two note types a user can pull for a case once it's open. Each
// renders the live payload fetched straight from a public API, keyed
// by the case's document type (Contribution/Withdrawal) — independent
// of the case's stage (Pre Assessment/Process), which stays a fixed,
// purely descriptive piece of case metadata shown in the queue.
var VIEWS = {
  preassessment: {
    label: "Pre Assessment",
    icon: ICONS.summary,
    body: function (data) {
      var thumbHtml = data.thumbnail && data.thumbnail.source
        ? '<img class="wiki-thumb" src="' + escapeHtml(data.thumbnail.source) + '" alt="' + escapeHtml(data.title || "") + '" />'
        : "";
      return (
        thumbHtml +
        '<div class="overview-line">' + ICONS.chevron +
          '<strong>' + escapeHtml(data.title || "") + '</strong>' +
          (data.description ? ' &mdash; ' + escapeHtml(data.description) : "") +
        '</div>' +
        '<p class="summary-text">' + escapeHtml(data.extract || "No summary available.") + '</p>'
      );
    }
  },
  process: {
    label: "Process",
    icon: ICONS.news,
    body: function (data) {
      var articles = (data && data.articles) || [];
      return (
        '<ul class="news-list">' +
          articles.map(function (a) {
            var link = a.url || "https://news.ycombinator.com/item?id=" + a.objectID;
            return (
              '<li class="news-item">' +
                '<p class="headline"><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">' +
                  escapeHtml(a.title || "(untitled)") + '</a></p>' +
                '<p class="meta">' + (typeof a.points === "number" ? a.points + " points" : "--") + ' &middot; Hacker News</p>' +
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

// Wikipedia article titles use underscores for spaces; everything else
// (commas, periods, ampersands) is percent-encoded.
function wikipediaTitle(name) {
  return encodeURIComponent(name.trim().replace(/\s+/g, "_"));
}

function fetchWikipediaSummary(name) {
  var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + wikipediaTitle(name);
  return fetch(url)
    .catch(function () {
      throw new Error("Couldn't reach Wikipedia. Check your connection and try again.");
    })
    .then(function (res) {
      if (res.status === 404) {
        throw new Error('No Wikipedia page found for "' + name + '".');
      }
      if (!res.ok) {
        throw new Error("Wikipedia lookup failed (status " + res.status + ").");
      }
      return res.json();
    });
}

function fetchHNStories(name) {
  var url = "https://hn.algolia.com/api/v1/search?query=" + encodeURIComponent(name) + "&tags=story";
  return fetch(url)
    .catch(function () {
      throw new Error("Couldn't reach Hacker News. Check your connection and try again.");
    })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Hacker News search failed (status " + res.status + ").");
      }
      return res.json();
    })
    .then(function (body) {
      var hits = (body && body.hits) || [];
      if (!hits.length) {
        throw new Error('No Hacker News stories found for "' + name + '".');
      }
      return {
        articles: hits.slice(0, 3).map(function (h) {
          return { title: h.title, points: h.points, url: h.url, objectID: h.objectID };
        })
      };
    });
}

var queueEl = document.getElementById("queue");
var detailEl = document.getElementById("detail");
var selectedId = null;
var selectedView = null;
// Cache of fetched Wikipedia/HN responses, keyed by "<caseId>:<view>",
// so re-selecting an already-loaded view doesn't refetch it.
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

function sourceName(viewKey) {
  return viewKey === "preassessment" ? "Wikipedia" : "Hacker News";
}

function citationHtml(viewKey, name) {
  var href = viewKey === "preassessment"
    ? "https://en.wikipedia.org/wiki/" + wikipediaTitle(name)
    : "https://hn.algolia.com/?q=" + encodeURIComponent(name) + "&type=story";
  return (
    '<a class="citation" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer">' +
      ICONS.link + 'Source: ' + escapeHtml(sourceName(viewKey)) +
    '</a>'
  );
}

function renderDetail(c) {
  var name = TICKER_NAMES[c.ticker] || c.ticker;
  var docIcon = c.docType === "News" ? ICONS.news : ICONS.summary;
  var allowedKey = viewForDocType(c.docType);
  var allowedView = VIEWS[allowedKey];
  // Display label only — must mirror the queue badge (statusLabel(c.status)),
  // not the docType-driven view/source routing above.
  var stageLabel = statusLabel(c.status);

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
        allowedView.icon + escapeHtml(stageLabel) +
      '</button>' +
    '</div>';

  var lowerHtml;
  if (!selectedView) {
    lowerHtml =
      '<div class="view-empty">' + ICONS.doc +
        '<p class="lead">No notes pulled yet</p>' +
        '<p>Choose <strong>' + escapeHtml(stageLabel) + '</strong> above to fetch this case&rsquo;s notes.</p>' +
      '</div>';
  } else {
    var view = VIEWS[selectedView];
    var key = c.id + ":" + selectedView;
    var entry = caseDataCache[key] || { status: "loading" };
    var source = sourceName(selectedView);

    if (entry.status === "error") {
      lowerHtml =
        traceHtml(view, c.ticker, escapeHtml(source) + ' lookup for ' + c.ticker + ' failed.') +
        '<div class="content content-in" style="animation-delay:80ms">' +
          '<div class="error-box">' + ICONS.doc + '<span>' + escapeHtml(entry.message) + '</span></div>' +
        '</div>';
    } else if (entry.status === "ready") {
      lowerHtml =
        traceHtml(view, c.ticker, 'Fetched ' + escapeHtml(source) + ' for ' + c.ticker + '.') +
        '<div class="content content-in" style="animation-delay:80ms">' + view.body(entry.data) + citationHtml(selectedView, name) + '</div>';
    } else {
      lowerHtml = traceHtml(view, c.ticker, 'Fetching ' + escapeHtml(source) + ' for ' + c.ticker + '&hellip;');
    }
  }

  detailEl.innerHTML = headHtml + pickerHtml + lowerHtml;
}

function ensureCaseData(c, view) {
  var key = c.id + ":" + view;
  var entry = caseDataCache[key];
  if (entry && (entry.status === "ready" || entry.status === "loading")) return;

  caseDataCache[key] = { status: "loading" };
  var name = TICKER_NAMES[c.ticker] || c.ticker;
  var request = view === "preassessment" ? fetchWikipediaSummary(name) : fetchHNStories(name);
  request
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

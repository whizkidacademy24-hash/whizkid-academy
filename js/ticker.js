/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Live Market Ticker
   Builds the scrolling ticker strip from forex/index data
   ═══════════════════════════════════════════════════════════════ */

// ── Ticker data pairs ─────────────────────────────────────────────
var TICKERS = [
  { p: 'EUR/USD', v: 1.0842, d: 4, up: true  },
  { p: 'GBP/USD', v: 1.2634, d: 4, up: false },
  { p: 'USD/JPY', v: 149.82, d: 2, up: true  },
  { p: 'USD/CHF', v: 0.9018, d: 4, up: false },
  { p: 'AUD/USD', v: 0.6521, d: 4, up: true  },
  { p: 'USD/CAD', v: 1.3647, d: 4, up: true  },
  { p: 'NZD/USD', v: 0.6089, d: 4, up: false },
  { p: 'EUR/GBP', v: 0.8581, d: 4, up: true  },
  { p: 'EUR/JPY', v: 162.41, d: 2, up: true  },
  { p: 'GBP/JPY', v: 189.22, d: 2, up: true  },
  { p: 'XAU/USD', v: 2318.4, d: 2, up: true  },
  { p: 'US500',   v: 5204.34,d: 2, up: true  }
];

// ── Build and inject the ticker DOM ──────────────────────────────
(function buildTicker() {
  var track = document.getElementById('tickerTrack');
  if (!track) return;

  // Duplicate array so it scrolls seamlessly (fills both halves)
  var items = TICKERS.concat(TICKERS);

  track.innerHTML = items.map(function(x) {
    var changePct = (Math.random() * 0.7 + 0.08).toFixed(2);
    var arrow = x.up ? '▲' : '▼';
    var cls = x.up ? 'ti-up' : 'ti-dn';
    return (
      '<span class="ti">' +
        '<span class="ti-pair">' + x.p + '</span>' +
        '<span class="ti-price">' + fmt(x.v, x.d) + '</span>' +
        '<span class="' + cls + '">' + arrow + ' ' + changePct + '%</span>' +
      '</span>'
    );
  }).join('');
})();

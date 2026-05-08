/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Shared Utilities
   localStorage helpers · Formatters · Generators · Default data
   ═══════════════════════════════════════════════════════════════ */

// ── localStorage namespaced helpers ──────────────────────────────
var WK = {
  get: function(key) {
    try {
      return JSON.parse(localStorage.getItem('wk_' + key)) || null;
    } catch (e) {
      return null;
    }
  },

  set: function(key, val) {
    localStorage.setItem('wk_' + key, JSON.stringify(val));
  },

  push: function(key, item) {
    var arr = WK.get(key) || [];
    arr.push(item);
    WK.set(key, arr);
    return arr;
  },

  update: function(key, id, changes) {
    var arr = WK.get(key) || [];
    var idx = arr.findIndex(function(x) { return x.id === id; });
    if (idx > -1) {
      arr[idx] = Object.assign({}, arr[idx], changes);
      WK.set(key, arr);
    }
    return arr;
  },

  remove: function(key) {
    localStorage.removeItem('wk_' + key);
  }
};

// ── Number formatter ──────────────────────────────────────────────
function fmt(v, d) {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });
}

// ── Generate a random reference code (e.g. WKA-AB12CD) ───────────
function genRef(prefix) {
  prefix = prefix || 'WKA';
  return prefix + '-' + Math.random().toString(36).toUpperCase().slice(2, 8);
}

// ── Generate a 6-character alphanumeric access code ───────────────
function genCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Convert YouTube watch URL to embed URL ────────────────────────
function toEmbed(url) {
  if (!url) return '';
  if (url.indexOf('embed') !== -1) return url;
  var match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? 'https://www.youtube.com/embed/' + match[1] : url;
}

// ── HTML escape helper (for dynamic innerHTML generation) ─────────
function escHtml(s) {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Default course modules ────────────────────────────────────────
var DEFAULT_MODULES = [
  {
    id: 'm1',
    title: 'Welcome & Framework Overview',
    desc: 'Introduction to the WhizKid macro trading framework and what you will learn throughout the course.',
    duration: '15 min',
    tier: 'starter',
    video_url: '',
    order: 1,
    completed: false
  },
  {
    id: 'm2',
    title: 'Central Bank Policy — The Foundation',
    desc: 'How the Fed, ECB, BOJ and other central banks drive currency markets through monetary policy decisions.',
    duration: '52 min',
    tier: 'starter',
    video_url: '',
    order: 2,
    completed: false
  },
  {
    id: 'm3',
    title: 'Reading Economic Data',
    desc: 'CPI, NFP, PMI, GDP — which data matters most, how to interpret it, and how markets typically respond.',
    duration: '48 min',
    tier: 'starter',
    video_url: '',
    order: 3,
    completed: false
  },
  {
    id: 'm4',
    title: 'Geopolitics & Market Risk',
    desc: 'How global events, elections, and geopolitical shifts create risk-on/risk-off flows in forex markets.',
    duration: '44 min',
    tier: 'intermediate',
    video_url: '',
    order: 4,
    completed: false
  },
  {
    id: 'm5',
    title: 'Fiscal Policy Deep Dive',
    desc: 'Government spending, debt levels, and how fiscal policy shapes long-term currency trends.',
    duration: '39 min',
    tier: 'intermediate',
    video_url: '',
    order: 5,
    completed: false
  },
  {
    id: 'm6',
    title: 'EUR/USD — Complete Macro Analysis',
    desc: 'Full fundamental breakdown of EUR/USD: drivers, correlations, and analytical frameworks.',
    duration: '61 min',
    tier: 'intermediate',
    video_url: '',
    order: 6,
    completed: false
  },
  {
    id: 'm7',
    title: 'GBP/USD & Cable Mechanics',
    desc: 'Understanding the pound — BOE policy, UK economic data, and GBP analytical patterns.',
    duration: '55 min',
    tier: 'master',
    video_url: '',
    order: 7,
    completed: false
  },
  {
    id: 'm8',
    title: 'USD/JPY & Carry Trade Dynamics',
    desc: 'Yen dynamics, BOJ policy, and analytical frameworks for carry trade setups.',
    duration: '49 min',
    tier: 'master',
    video_url: '',
    order: 8,
    completed: false
  },
  {
    id: 'm9',
    title: 'Building a Trade Analysis Plan',
    desc: 'How to structure a complete macro analysis plan from research to decision framework.',
    duration: '67 min',
    tier: 'master',
    video_url: '',
    order: 9,
    completed: false
  },
  {
    id: 'm10',
    title: 'Monday Live Analysis — Framework',
    desc: 'How Joseph structures the weekly Monday live market analysis sessions.',
    duration: '38 min',
    tier: 'master',
    video_url: '',
    order: 10,
    completed: false
  }
];

// ── Initialize default modules on first load ──────────────────────
if (!WK.get('modules')) {
  WK.set('modules', DEFAULT_MODULES);
}

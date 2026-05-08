/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Canvas Charts
   makeData · drawChart · switchTab (EUR/USD macro divergence demo)
   ═══════════════════════════════════════════════════════════════ */

// ── Data generator ────────────────────────────────────────────────
function mkData(n, start, drift, noise) {
  var data = [];
  var v = start;
  for (var i = 0; i < n; i++) {
    v += drift + (Math.random() - 0.5) * noise;
    data.push(v);
  }
  return data;
}

// ── Draw a gradient line chart on a <canvas> element ─────────────
function drawChart(id, data, color) {
  var canvas = document.getElementById(id);
  if (!canvas) return;

  var dpr = window.devicePixelRatio || 1;
  var W = canvas.clientWidth || canvas.offsetWidth || 500;
  var H = canvas.clientHeight || 190;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var pad = { t: 10, r: 8, b: 18, l: 8 };
  var iW  = W - pad.l - pad.r;
  var iH  = H - pad.t - pad.b;

  var mn  = Math.min.apply(null, data) - 0.005;
  var mx  = Math.max.apply(null, data) + 0.005;
  var rng = mx - mn;

  // Map data point → canvas coordinates
  function tx(i) { return pad.l + (i / (data.length - 1)) * iW; }
  function ty(v) { return pad.t + iH - ((v - mn) / rng) * iH; }

  // ── Horizontal grid lines ──
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (var r = 0; r < 4; r++) {
    var y = pad.t + (r / 3) * iH;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + iW, y);
    ctx.stroke();
  }

  // ── Gradient fill under line ──
  var grd = ctx.createLinearGradient(0, pad.t, 0, pad.t + iH);
  // Convert "rgb(r,g,b)" → "rgba(r,g,b,alpha)" for the gradient stops
  var colorAlpha = function(alpha) {
    return color.replace('rgb(', 'rgba(').replace(')', ',' + alpha + ')');
  };
  grd.addColorStop(0, colorAlpha(0.2));
  grd.addColorStop(1, colorAlpha(0));

  ctx.beginPath();
  ctx.moveTo(tx(0), ty(data[0]));
  data.forEach(function(v, i) { ctx.lineTo(tx(i), ty(v)); });
  ctx.lineTo(tx(data.length - 1), pad.t + iH);
  ctx.lineTo(tx(0), pad.t + iH);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();

  // ── Chart line ──
  ctx.beginPath();
  ctx.moveTo(tx(0), ty(data[0]));
  data.forEach(function(v, i) { ctx.lineTo(tx(i), ty(v)); });
  ctx.strokeStyle  = color;
  ctx.lineWidth    = 2;
  ctx.lineJoin     = 'round';
  ctx.stroke();

  // ── End-point dot ──
  var lx = tx(data.length - 1);
  var ly = ty(data[data.length - 1]);

  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(lx, ly, 8, 0, Math.PI * 2);
  ctx.fillStyle = colorAlpha(0.2);
  ctx.fill();
}

// ── Active chart data (home page EUR/USD demo) ────────────────────
var chartData = mkData(60, 1.06, 0.00015, 0.004);

// ── Render the main chart ─────────────────────────────────────────
function renderMain() {
  drawChart('mainChart', chartData, 'rgb(168,85,247)');
}

// ── Tab switcher (1W / 1M / 3M) ──────────────────────────────────
function switchTab(el, range) {
  document.querySelectorAll('.ctab').forEach(function(t) {
    t.classList.remove('on');
  });
  el.classList.add('on');

  var n = range === '1W' ? 60 : range === '1M' ? 120 : 240;
  chartData = mkData(n, 1.04, 0.0001, 0.003);
  renderMain();
}

// ── Init on load + re-render on resize ───────────────────────────
window.addEventListener('load', function() {
  setTimeout(renderMain, 80);
});

window.addEventListener('resize', function() {
  setTimeout(renderMain, 80);
});

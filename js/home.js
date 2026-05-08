/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Home / Landing Page Logic
   Hero slideshow · About photo cycle · Market grid · Booking form
   ═══════════════════════════════════════════════════════════════ */

// ── Hero Background Slideshow ─────────────────────────────────────
(function initSlideshow() {
  var slides   = document.querySelectorAll('.slide');
  var dotsWrap = document.getElementById('slideDots');
  if (!slides.length || !dotsWrap) return;

  var curSlide = 0;

  // Build dot indicators
  slides.forEach(function(_, i) {
    var d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = function() { goTo(i); };
    dotsWrap.appendChild(d);
  });

  function goTo(n) {
    slides[curSlide].classList.remove('active');
    dotsWrap.children[curSlide].classList.remove('active');
    curSlide = n;
    slides[curSlide].classList.add('active');
    dotsWrap.children[curSlide].classList.add('active');
  }

  // Auto-advance every 5 seconds
  setInterval(function() {
    goTo((curSlide + 1) % slides.length);
  }, 5000);
})();


// ── About Section Photo Slideshow (3-second cycle) ────────────────
(function initPhotoSlideshow() {
  var photos = document.querySelectorAll('#aboutPhotos .photo-slide');
  if (!photos.length) return;

  var cur = 0;

  setInterval(function() {
    photos[cur].classList.remove('active');
    cur = (cur + 1) % photos.length;
    photos[cur].classList.add('active');
  }, 3000);
})();


// ── Market Cards with Sparklines ──────────────────────────────────
var MKT = [
  { p: 'EUR/USD', v: 1.0842, d: 4, up: true,  h: '1.0868', l: '1.0811' },
  { p: 'GBP/USD', v: 1.2634, d: 4, up: false, h: '1.2681', l: '1.2619' },
  { p: 'USD/JPY', v: 149.82, d: 2, up: true,  h: '150.21', l: '149.44' },
  { p: 'EUR/JPY', v: 162.41, d: 2, up: true,  h: '163.14', l: '161.88' },
  { p: 'XAU/USD', v: 2318.4, d: 2, up: true,  h: '2331.6', l: '2298.5' },
  { p: 'US500',   v: 5204.34,d: 2, up: true,  h: '5218.9', l: '5182.1' }
];

// Generate an SVG sparkline path
function spark(up) {
  var pts = [];
  var y = up ? 30 : 10;

  for (var x = 0; x <= 100; x += 10) {
    y += (Math.random() - (up ? 0.42 : 0.58)) * 9;
    y = Math.max(4, Math.min(36, y));
    pts.push(x + ',' + y);
  }

  var c = up ? '#00d264' : '#f66';
  var f = up ? 'rgba(0,210,100,.12)' : 'rgba(255,100,100,.12)';

  return (
    '<polygon points="0,40 ' + pts.join(' ') + ' 100,40" fill="' + f + '"/>' +
    '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + c + '" stroke-width="1.5"/>'
  );
}

(function buildMarketGrid() {
  var grid = document.getElementById('mktGrid');
  if (!grid) return;

  grid.innerHTML = MKT.map(function(m) {
    return (
      '<div class="mc">' +
        '<div class="mc-top">' +
          '<span class="mc-pair">' + m.p + '</span>' +
          '<span class="mc-badge ' + (m.up ? 'up' : 'dn') + '">' + (m.up ? '▲' : '▼') + '</span>' +
        '</div>' +
        '<div class="mc-price ' + (m.up ? 'up' : 'dn') + '" data-base="' + m.v + '" data-dec="' + m.d + '">' +
          fmt(m.v, m.d) +
        '</div>' +
        '<svg class="sparksvg" viewBox="0 0 100 40" preserveAspectRatio="none">' + spark(m.up) + '</svg>' +
        '<div class="mc-hl"><span>H: ' + m.h + '</span><span>L: ' + m.l + '</span></div>' +
      '</div>'
    );
  }).join('');
})();


// ── Price Jitter (live price simulation) ─────────────────────────
setInterval(function() {
  document.querySelectorAll('.mc-price').forEach(function(el) {
    var base = parseFloat(el.dataset.base);
    var dec  = parseInt(el.dataset.dec);
    if (isNaN(base)) return;
    el.textContent = fmt(base + (Math.random() - 0.5) * base * 0.0003, dec);
  });
}, 2400);


// ── Booking Form Submit ───────────────────────────────────────────
(function initBookingForm() {
  var btn = document.getElementById('bkBtn');
  if (!btn) return;

  btn.addEventListener('click', function() {
    this.textContent = "✓ Request sent — we'll be in touch within 24 hours!";
    this.style.background = 'var(--green)';

    var self = this;
    setTimeout(function() {
      self.textContent = 'Book My Free Call';
      self.style.background = '';
    }, 5000);
  });
})();

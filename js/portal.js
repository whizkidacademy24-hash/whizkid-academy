/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Student Portal
   Access gate · Session management · Module rendering
   Video player · Progress tracking · Sidebar
   ═══════════════════════════════════════════════════════════════ */

// ── Tier hierarchy (used to determine module access) ──────────────
var TIER_RANK = { starter: 1, intermediate: 2, master: 3 };

// ── Runtime state ─────────────────────────────────────────────────
var session        = null;
var activeModuleId = null;
var modules        = [];


// ── Storage bootstrap ─────────────────────────────────────────────
function initStorage() {
  if (!localStorage.getItem('wk_modules')) {
    localStorage.setItem('wk_modules', JSON.stringify(DEFAULT_MODULES));
  }
  if (!localStorage.getItem('wk_codes')) {
    localStorage.setItem('wk_codes', JSON.stringify([]));
  }
}


// ── Load modules from localStorage ───────────────────────────────
function loadModules() {
  modules = JSON.parse(localStorage.getItem('wk_modules') || JSON.stringify(DEFAULT_MODULES));
  modules.sort(function(a, b) { return a.order - b.order; });
}


// ── Check if a module is accessible for the current session tier ──
function isModuleUnlocked(mod) {
  if (!session) return false;
  return TIER_RANK[session.tier] >= TIER_RANK[mod.tier];
}


// ── Access gate: attempt login ────────────────────────────────────
function attemptLogin() {
  var email  = document.getElementById('login-email').value.trim().toLowerCase();
  var code   = document.getElementById('login-code').value.trim().toUpperCase();
  var errEl  = document.getElementById('login-error');

  if (!email || !code) {
    errEl.style.display = 'block';
    errEl.textContent   = 'Please enter both email and access code.';
    return;
  }

  var codes = JSON.parse(localStorage.getItem('wk_codes') || '[]');
  var match = null;

  for (var i = 0; i < codes.length; i++) {
    if (
      codes[i].code.toUpperCase() === code &&
      codes[i].email.toLowerCase() === email &&
      !codes[i].revoked
    ) {
      match = codes[i];
      break;
    }
  }

  if (!match) {
    errEl.style.display = 'block';
    errEl.textContent   = 'Invalid email or access code. Please check and try again.';
    return;
  }

  errEl.style.display = 'none';
  session = { email: match.email, tier: match.tier, name: match.name, code: match.code };
  localStorage.setItem('wk_portal_session', JSON.stringify(session));
  showPortal();
}


// ── Show the portal and hide the login gate ───────────────────────
function showPortal() {
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('portal-app').style.display = 'block';
  initPortal();
}


// ── Initialise portal UI after login ─────────────────────────────
function initPortal() {
  loadModules();

  // Student info in sidebar
  document.getElementById('sb-name').textContent  = session.name;
  document.getElementById('sb-email').textContent = session.email;

  var badge = document.getElementById('sb-badge');
  badge.textContent = session.tier.charAt(0).toUpperCase() + session.tier.slice(1);
  badge.className   = 'student-badge badge-' + session.tier;

  // Welcome heading
  document.getElementById('welcome-msg').textContent =
    'Welcome back, ' + session.name.split(' ')[0] + '!';

  // Today's date
  var d    = new Date();
  var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('today-date').textContent = d.toLocaleDateString('en-US', opts);

  renderModules();
  updateProgress();
  loadMondaySession();
}


// ── Render module grid + sidebar list ────────────────────────────
function renderModules() {
  var grid   = document.getElementById('modules-grid');
  var sbList = document.getElementById('modules-sidebar-list');
  grid.innerHTML   = '';
  sbList.innerHTML = '';

  modules.forEach(function(mod) {
    var unlocked    = isModuleUnlocked(mod);
    var isCompleted = mod.completed;
    var isActive    = mod.id === activeModuleId;
    var tierLabel   = mod.tier.charAt(0).toUpperCase() + mod.tier.slice(1);

    // ── Grid card ──
    var card = document.createElement('div');
    var cardClasses = 'module-card';
    if (isActive)    cardClasses += ' active-module';
    if (isCompleted) cardClasses += ' completed-module';
    if (!unlocked)   cardClasses += ' locked';
    card.className = cardClasses;

    var lockMsg    = !unlocked ? '<div class="lock-msg">🔒 Requires ' + tierLabel + ' access</div>' : '';
    var statusIcon = '';
    if (isCompleted)     statusIcon = '<span class="module-status done">✓ Done</span>';
    else if (!unlocked)  statusIcon = '<span class="module-status locked-icon">🔒</span>';
    else if (isActive)   statusIcon = '<span class="module-status active-icon">▶ Playing</span>';
    else                 statusIcon = '<span class="module-status">▶</span>';

    card.innerHTML =
      '<div class="module-tier-badge tier-' + mod.tier + '">' + tierLabel + '</div>' +
      '<div class="module-num">Module ' + mod.order + '</div>' +
      '<div class="module-title">' + mod.title + '</div>' +
      '<div class="module-footer">' +
        '<span class="module-dur">⏱ ' + mod.duration + '</span>' +
        statusIcon +
      '</div>' +
      lockMsg;

    if (unlocked) {
      card.onclick = (function(m) {
        return function() { playModule(m.id); };
      })(mod);
    }

    grid.appendChild(card);

    // ── Sidebar nav item ──
    var li = document.createElement('li');
    var a  = document.createElement('a');
    a.href      = '#';
    a.className = isActive ? 'active' : '';
    a.innerHTML =
      '<span class="sidebar-icon">' +
        (isCompleted ? '✅' : unlocked ? '▶' : '🔒') +
      '</span>' + mod.title;

    if (unlocked) {
      a.onclick = (function(m) {
        return function(e) {
          e.preventDefault();
          playModule(m.id);
        };
      })(mod);
    } else {
      a.onclick = function(e) {
        e.preventDefault();
        showToast('This module requires a higher tier access.');
      };
    }

    li.appendChild(a);
    sbList.appendChild(li);
  });
}


// ── Play a module (load video, update UI) ─────────────────────────
function playModule(id) {
  activeModuleId = id;
  var mod = modules.find(function(m) { return m.id === id; });
  if (!mod) return;

  // Update video info panel
  document.getElementById('active-title').textContent = mod.title;
  document.getElementById('active-desc').textContent  = mod.desc;

  var durBadge = document.getElementById('active-dur');
  durBadge.textContent = '⏱ ' + mod.duration;
  durBadge.style.display = '';

  // Complete button
  var completeBtn = document.getElementById('complete-btn');
  completeBtn.style.display = '';
  if (mod.completed) {
    completeBtn.textContent = '✓ Completed';
    completeBtn.classList.add('completed');
  } else {
    completeBtn.textContent = 'Mark as Complete ✓';
    completeBtn.classList.remove('completed');
  }

  // Video iframe vs placeholder
  var iframe      = document.getElementById('video-iframe');
  var placeholder = document.getElementById('video-placeholder');

  if (mod.video_url) {
    iframe.src             = toEmbed(mod.video_url);
    iframe.style.display   = '';
    placeholder.style.display = 'none';
  } else {
    iframe.style.display   = 'none';
    iframe.src             = '';
    placeholder.style.display = 'flex';
    placeholder.querySelector('.video-placeholder-text').textContent =
      'Video for this module will be available soon.';
  }

  renderModules();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeSidebar();
}


// ── Mark current module as complete ──────────────────────────────
function markComplete() {
  if (!activeModuleId) return;
  var mod = modules.find(function(m) { return m.id === activeModuleId; });
  if (!mod || mod.completed) return;

  mod.completed = true;
  localStorage.setItem('wk_modules', JSON.stringify(modules));

  var btn = document.getElementById('complete-btn');
  btn.textContent = '✓ Completed';
  btn.classList.add('completed');

  updateProgress();
  renderModules();
  showToast('Module marked as complete!');
}


// ── Update progress bar ───────────────────────────────────────────
function updateProgress() {
  loadModules();
  var accessible = modules.filter(function(m) { return isModuleUnlocked(m); });
  var completed  = accessible.filter(function(m) { return m.completed; });
  var pct        = accessible.length > 0
    ? Math.round(completed.length / accessible.length * 100)
    : 0;

  document.getElementById('progress-text').textContent = completed.length + ' / ' + accessible.length;
  document.getElementById('progress-fill').style.width = pct + '%';
}


// ── Load next Monday session from admin data ──────────────────────
function loadMondaySession() {
  var sessions = JSON.parse(localStorage.getItem('wk_sessions') || '[]');
  var now      = new Date();
  var upcoming = sessions
    .filter(function(s) { return new Date(s.date) >= now; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

  if (upcoming.length > 0) {
    document.getElementById('sb-monday-title').textContent = upcoming[0].title;
    document.getElementById('sb-monday-date').textContent  = upcoming[0].date;
  }
}


// ── Logout ────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('wk_portal_session');
  session        = null;
  activeModuleId = null;

  document.getElementById('portal-app').style.display  = 'none';
  document.getElementById('login-gate').style.display  = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-code').value  = '';
}


// ── Mobile sidebar ────────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}


// ── Toast notification ────────────────────────────────────────────
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent        = msg;
  t.style.opacity      = '1';
  t.style.transform    = 'translateX(-50%) translateY(0)';

  setTimeout(function() {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(-50%) translateY(80px)';
  }, 3000);
}


// ── Initialise on page load ───────────────────────────────────────
initStorage();

var savedSession = localStorage.getItem('wk_portal_session');
if (savedSession) {
  try {
    session = JSON.parse(savedSession);
    showPortal();
  } catch (e) {
    localStorage.removeItem('wk_portal_session');
  }
}

// Allow Enter key to submit login
document.getElementById('login-code').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') attemptLogin();
});
document.getElementById('login-email').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') attemptLogin();
});

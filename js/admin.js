/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Admin Panel
   Login · Tab navigation · Enrollment management · Access codes
   Course content CRUD · Monday sessions · Modals
   ═══════════════════════════════════════════════════════════════ */

// ── Program → tier mapping ────────────────────────────────────────
var TIER_MAP = {
  starter:     'starter',
  fundamentals:'intermediate',
  masterclass: 'master',
  ladderized:  'master'
};

// ── Runtime state ─────────────────────────────────────────────────
var currentFilter    = 'all';
var currentModalCode = '';


// ── Storage bootstrap ─────────────────────────────────────────────
function initStorage() {
  if (!localStorage.getItem('wk_modules'))     localStorage.setItem('wk_modules',     JSON.stringify(DEFAULT_MODULES));
  if (!localStorage.getItem('wk_enrollments')) localStorage.setItem('wk_enrollments', JSON.stringify([]));
  if (!localStorage.getItem('wk_codes'))       localStorage.setItem('wk_codes',       JSON.stringify([]));
  if (!localStorage.getItem('wk_sessions'))    localStorage.setItem('wk_sessions',    JSON.stringify([]));
}


// ── Admin login ───────────────────────────────────────────────────
function adminLogin() {
  var u   = document.getElementById('admin-user').value.trim();
  var p   = document.getElementById('admin-pass').value.trim();
  var err = document.getElementById('admin-error');

  if (u === 'whizkid' && p === 'admin2025') {
    err.style.display = 'none';
    localStorage.setItem('wk_admin_session', '1');
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-app').style.display   = 'block';
    initAdmin();
  } else {
    err.style.display = 'block';
  }
}

function adminLogout() {
  localStorage.removeItem('wk_admin_session');
  document.getElementById('admin-app').style.display   = 'none';
  document.getElementById('admin-login').style.display = 'flex';
  document.getElementById('admin-user').value = '';
  document.getElementById('admin-pass').value = '';
}

function initAdmin() {
  initStorage();
  renderEnrollments();
  renderModules();
  renderCodes();
  renderSessions();
  updateCounts();
}


// ── Tab navigation ────────────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll('.tab-panel').forEach(function(p) {
    p.classList.remove('active');
  });
  document.getElementById('tab-' + name).classList.add('active');

  document.querySelectorAll('.admin-nav li a').forEach(function(a) {
    a.classList.remove('active');
  });
  if (el) el.classList.add('active');

  var headings = {
    enrollments: ['Enrollments',      'Manage student enrollment requests'],
    content:     ['Course Content',   'Manage modules and video links'],
    codes:       ['Access Codes',     'View and manage student access codes'],
    sessions:    ['Monday Sessions',  'Manage weekly live analysis sessions']
  };

  document.getElementById('tab-heading').textContent  = headings[name][0];
  document.getElementById('tab-subhead').textContent  = headings[name][1];

  closeAdminSidebar();
  return false;
}


// ── Update dashboard counts ───────────────────────────────────────
function updateCounts() {
  var enrollments = JSON.parse(localStorage.getItem('wk_enrollments') || '[]');
  var codes       = JSON.parse(localStorage.getItem('wk_codes')       || '[]');

  var pending  = enrollments.filter(function(e) { return e.status === 'pending';  }).length;
  var verified = enrollments.filter(function(e) { return e.status === 'verified'; }).length;
  var rejected = enrollments.filter(function(e) { return e.status === 'rejected'; }).length;
  var revenue  = enrollments
    .filter(function(e) { return e.status === 'verified'; })
    .reduce(function(s, e) { return s + (e.price || 0); }, 0);

  document.getElementById('stat-total').textContent    = enrollments.length;
  document.getElementById('stat-pending').textContent  = pending;
  document.getElementById('stat-verified').textContent = verified;
  document.getElementById('stat-revenue').textContent  = '₱' + revenue.toLocaleString();

  document.getElementById('tc-pending').textContent = pending;
  document.getElementById('tc-codes').textContent   = codes.filter(function(c) { return !c.revoked; }).length;

  document.getElementById('fc-all').textContent      = enrollments.length;
  document.getElementById('fc-pending').textContent  = pending;
  document.getElementById('fc-verified').textContent = verified;
  document.getElementById('fc-rejected').textContent = rejected;
}


// ── Enrollment list ───────────────────────────────────────────────
function filterEnrollments(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(function(t) {
    t.classList.remove('active');
  });
  if (el) el.classList.add('active');
  renderEnrollments();
}

function renderEnrollments() {
  var enrollments = JSON.parse(localStorage.getItem('wk_enrollments') || '[]');
  var list        = document.getElementById('enroll-list');

  var filtered = currentFilter === 'all'
    ? enrollments
    : enrollments.filter(function(e) { return e.status === currentFilter; });
  filtered = filtered.slice().reverse();

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No enrollments found.</div></div>';
    return;
  }

  list.innerHTML = '';

  filtered.forEach(function(e) {
    var card    = document.createElement('div');
    card.className = 'enroll-card';
    card.id        = 'ec-' + e.ref;

    var statusBadge = '<span class="enroll-status-badge badge-' + e.status + '">' + e.status + '</span>';
    var dateStr     = e.createdAt
      ? new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';

    var progNames   = { starter: 'Starter', fundamentals: 'Fundamentals', masterclass: 'Master Class', ladderized: 'Ladderized' };
    var progDisplay = progNames[e.program] || e.program;

    var verifyBtn = e.status === 'pending'
      ? '<button class="action-btn btn-verify" onclick="verifyEnrollment(\'' + e.ref + '\')">✓ Verify & Generate Code</button>'
      : '';
    var rejectBtn = e.status !== 'rejected'
      ? '<button class="action-btn btn-reject" onclick="rejectEnrollment(\'' + e.ref + '\')">Reject</button>'
      : '';
    var proofBtn  = e.proof
      ? '<button class="action-btn btn-view-proof" onclick="viewProof(\'' + e.ref + '\')">View Proof</button>'
      : '<span style="font-size:13px;color:var(--text-muted);">No proof uploaded</span>';

    var goalsRow = e.goals
      ? '<div class="detail-item" style="grid-column:1/-1;"><div class="detail-label">Goals</div><div class="detail-value" style="font-weight:400;">' + e.goals + '</div></div>'
      : '';

    card.innerHTML =
      '<div class="enroll-header" onclick="toggleEnroll(\'' + e.ref + '\')">' +
        '<span class="enroll-ref">'    + e.ref                     + '</span>' +
        '<span class="enroll-name">'   + (e.name || '—')           + '</span>' +
        '<span class="enroll-prog">'   + progDisplay               + '</span>' +
        statusBadge +
        '<span class="enroll-date">'   + dateStr                   + '</span>' +
        '<span class="enroll-expand">▼</span>' +
      '</div>' +
      '<div class="enroll-body">' +
        '<div class="enroll-details-grid">' +
          '<div class="detail-item"><div class="detail-label">Email</div><div class="detail-value">'  + (e.email || '—')   + '</div></div>' +
          '<div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">'  + (e.phone || '—')   + '</div></div>' +
          '<div class="detail-item"><div class="detail-label">Facebook</div><div class="detail-value" style="word-break:break-all;">' + (e.facebook || '—') + '</div></div>' +
          '<div class="detail-item"><div class="detail-label">Experience</div><div class="detail-value">' + (e.experience || '—') + '</div></div>' +
          '<div class="detail-item"><div class="detail-label">Payment Method</div><div class="detail-value">' + (e.payMethod || '—') + (e.bank ? ' (' + e.bank.toUpperCase() + ')' : '') + '</div></div>' +
          '<div class="detail-item"><div class="detail-label">Amount</div><div class="detail-value">₱' + (e.price ? e.price.toLocaleString() : '—') + '</div></div>' +
          goalsRow +
        '</div>' +
        '<div class="enroll-actions">' + verifyBtn + rejectBtn + proofBtn + '</div>' +
      '</div>';

    list.appendChild(card);
  });

  updateCounts();
}

function toggleEnroll(ref) {
  var card = document.getElementById('ec-' + ref);
  if (card) card.classList.toggle('expanded');
}

function verifyEnrollment(ref) {
  var enrollments = JSON.parse(localStorage.getItem('wk_enrollments') || '[]');
  var idx         = enrollments.findIndex(function(e) { return e.ref === ref; });
  if (idx === -1) return;

  var e    = enrollments[idx];
  var code = genCode();
  var tier = TIER_MAP[e.program] || 'starter';

  enrollments[idx].status     = 'verified';
  enrollments[idx].accessCode = code;
  localStorage.setItem('wk_enrollments', JSON.stringify(enrollments));

  // Save the access code
  var codes = JSON.parse(localStorage.getItem('wk_codes') || '[]');
  codes.push({
    code:       code,
    email:      e.email,
    name:       e.name,
    tier:       tier,
    created_at: new Date().toISOString(),
    revoked:    false
  });
  localStorage.setItem('wk_codes', JSON.stringify(codes));

  // Show code modal
  document.getElementById('modal-code-val').textContent   = code;
  document.getElementById('code-modal-msg').textContent   = 'Send this code to ' + e.name + ' via email or Facebook.';
  document.getElementById('modal-student-info').innerHTML =
    '<strong>Student:</strong> ' + e.name + '<br>' +
    '<strong>Email:</strong> '   + e.email + '<br>' +
    '<strong>Tier:</strong> '    + tier.charAt(0).toUpperCase() + tier.slice(1) + '<br>' +
    '<strong>Program:</strong> ' + e.programName;

  currentModalCode = code;
  document.getElementById('code-modal').classList.add('open');

  renderEnrollments();
  renderCodes();
}

function rejectEnrollment(ref) {
  if (!confirm('Are you sure you want to reject this enrollment?')) return;

  var enrollments = JSON.parse(localStorage.getItem('wk_enrollments') || '[]');
  var idx         = enrollments.findIndex(function(e) { return e.ref === ref; });

  if (idx !== -1) {
    enrollments[idx].status = 'rejected';
    localStorage.setItem('wk_enrollments', JSON.stringify(enrollments));
    renderEnrollments();
    showToast('Enrollment rejected.');
  }
}

function viewProof(ref) {
  var enrollments = JSON.parse(localStorage.getItem('wk_enrollments') || '[]');
  var e = enrollments.find(function(e) { return e.ref === ref; });
  if (!e || !e.proof) return;
  document.getElementById('proof-modal-img').src = e.proof;
  document.getElementById('proof-modal').classList.add('open');
}


// ── Module rendering & CRUD ───────────────────────────────────────
function renderModules() {
  var modules = JSON.parse(localStorage.getItem('wk_modules') || JSON.stringify(DEFAULT_MODULES));
  modules.sort(function(a, b) { return a.order - b.order; });

  var list = document.getElementById('module-admin-list');
  list.innerHTML = '';

  modules.forEach(function(mod, idx) {
    var card = document.createElement('div');
    card.className = 'module-admin-card';
    card.id        = 'mac-' + mod.id;

    var tierLabel    = mod.tier.charAt(0).toUpperCase() + mod.tier.slice(1);
    var videoStatus  = mod.video_url
      ? '<span class="mod-video-status has-video">✓ Has Video</span>'
      : '<span class="mod-video-status no-video">○ No Video</span>';
    var upDisabled   = idx === 0                  ? 'disabled' : '';
    var downDisabled = idx === modules.length - 1 ? 'disabled' : '';

    card.innerHTML =
      '<div class="module-admin-header">' +
        '<div class="mod-order">' + mod.order + '</div>' +
        '<div class="mod-title">'  + mod.title  + '</div>' +
        '<span class="mod-tier tier-' + mod.tier + '">' + tierLabel + '</span>' +
        '<span class="mod-dur">'   + mod.duration + '</span>' +
        videoStatus +
        '<div class="mod-actions">' +
          '<button class="mod-btn mod-btn-up"   onclick="moveModule(\'' + mod.id + '\',-1)" ' + upDisabled   + '>↑</button>' +
          '<button class="mod-btn mod-btn-down" onclick="moveModule(\'' + mod.id + '\', 1)" ' + downDisabled + '>↓</button>' +
          '<button class="mod-btn mod-btn-edit" onclick="editModule(\'' + mod.id + '\')">Edit</button>' +
          '<button class="mod-btn mod-btn-del"  onclick="deleteModule(\'' + mod.id + '\')">Delete</button>' +
        '</div>' +
      '</div>' +
      '<div class="module-edit-form" id="mef-' + mod.id + '">' +
        '<div class="edit-grid">' +
          '<div class="edit-group"><label>Title *</label><input type="text" id="ef-title-' + mod.id + '" value="' + escHtml(mod.title) + '"></div>' +
          '<div class="edit-group"><label>Duration</label><input type="text" id="ef-dur-' + mod.id + '" value="' + escHtml(mod.duration) + '"></div>' +
          '<div class="edit-group"><label>Tier</label><select id="ef-tier-' + mod.id + '">' +
            '<option value="starter"'      + (mod.tier === 'starter'      ? ' selected' : '') + '>Starter</option>' +
            '<option value="intermediate"' + (mod.tier === 'intermediate' ? ' selected' : '') + '>Intermediate</option>' +
            '<option value="master"'       + (mod.tier === 'master'       ? ' selected' : '') + '>Master</option>' +
          '</select></div>' +
          '<div class="edit-group"><label>YouTube Video URL</label>' +
            '<input type="text" id="ef-video-' + mod.id + '" value="' + escHtml(mod.video_url || '') + '" placeholder="https://youtube.com/watch?v=...">' +
            '<div class="url-helper">Paste any YouTube URL — auto-converted to embed format</div>' +
          '</div>' +
          '<div class="edit-group full"><label>Description</label><textarea id="ef-desc-' + mod.id + '">' + escHtml(mod.desc || '') + '</textarea></div>' +
        '</div>' +
        '<div class="edit-actions">' +
          '<button class="btn-save"   onclick="saveModule(\'' + mod.id + '\')">Save Changes</button>' +
          '<button class="btn-cancel" onclick="cancelEdit(\'' + mod.id + '\')">Cancel</button>' +
        '</div>' +
      '</div>';

    list.appendChild(card);
  });
}

function editModule(id) {
  var card = document.getElementById('mac-' + id);
  if (card) card.classList.toggle('editing');
}

function cancelEdit(id) {
  var card = document.getElementById('mac-' + id);
  if (card) card.classList.remove('editing');
}

function saveModule(id) {
  var modules = JSON.parse(localStorage.getItem('wk_modules') || JSON.stringify(DEFAULT_MODULES));
  var idx     = modules.findIndex(function(m) { return m.id === id; });
  if (idx === -1) return;

  var title = document.getElementById('ef-title-' + id).value.trim();
  if (!title) { showToast('Title is required.'); return; }

  modules[idx].title     = title;
  modules[idx].duration  = document.getElementById('ef-dur-'   + id).value.trim();
  modules[idx].tier      = document.getElementById('ef-tier-'  + id).value;
  modules[idx].desc      = document.getElementById('ef-desc-'  + id).value.trim();
  modules[idx].video_url = toEmbed(document.getElementById('ef-video-' + id).value.trim());

  localStorage.setItem('wk_modules', JSON.stringify(modules));
  renderModules();
  showToast('Module saved!');
}

function deleteModule(id) {
  if (!confirm('Delete this module? This cannot be undone.')) return;

  var modules = JSON.parse(localStorage.getItem('wk_modules') || '[]');
  modules     = modules.filter(function(m) { return m.id !== id; });
  localStorage.setItem('wk_modules', JSON.stringify(modules));
  renderModules();
  showToast('Module deleted.');
}

function moveModule(id, dir) {
  var modules = JSON.parse(localStorage.getItem('wk_modules') || JSON.stringify(DEFAULT_MODULES));
  modules.sort(function(a, b) { return a.order - b.order; });

  var idx     = modules.findIndex(function(m) { return m.id === id; });
  var swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= modules.length) return;

  var tempOrder         = modules[idx].order;
  modules[idx].order    = modules[swapIdx].order;
  modules[swapIdx].order = tempOrder;

  localStorage.setItem('wk_modules', JSON.stringify(modules));
  renderModules();
}

function openAddModule() {
  document.getElementById('add-module-form-wrap').style.display = 'block';
  document.getElementById('add-title').focus();
}

function closeAddModule() {
  document.getElementById('add-module-form-wrap').style.display = 'none';
  document.getElementById('add-title').value = '';
  document.getElementById('add-dur').value   = '';
  document.getElementById('add-video').value = '';
  document.getElementById('add-desc').value  = '';
}

function saveNewModule() {
  var title = document.getElementById('add-title').value.trim();
  if (!title) { showToast('Title is required.'); return; }

  var modules  = JSON.parse(localStorage.getItem('wk_modules') || JSON.stringify(DEFAULT_MODULES));
  var maxOrder = modules.reduce(function(m, mod) { return Math.max(m, mod.order); }, 0);
  var newId    = 'm' + Date.now();

  modules.push({
    id:        newId,
    title:     title,
    desc:      document.getElementById('add-desc').value.trim(),
    duration:  document.getElementById('add-dur').value.trim() || '—',
    tier:      document.getElementById('add-tier').value,
    video_url: toEmbed(document.getElementById('add-video').value.trim()),
    order:     maxOrder + 1,
    completed: false
  });

  localStorage.setItem('wk_modules', JSON.stringify(modules));
  closeAddModule();
  renderModules();
  showToast('Module added!');
}


// ── Access Codes ──────────────────────────────────────────────────
function renderCodes() {
  var codes = JSON.parse(localStorage.getItem('wk_codes') || '[]');
  var tbody = document.getElementById('codes-tbody');
  var empty = document.getElementById('codes-empty');

  if (codes.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = '';

  codes.slice().reverse().forEach(function(c, i) {
    var realIdx   = codes.length - 1 - i;
    var tierLabel = c.tier ? (c.tier.charAt(0).toUpperCase() + c.tier.slice(1)) : '—';
    var dateStr   = c.created_at
      ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
    var statusHtml = c.revoked
      ? '<span class="code-status-revoked">Revoked</span>'
      : '<span class="code-status-active">Active</span>';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="code-val">' + c.code + '</span></td>' +
      '<td>' + (c.name || '—') + '</td>' +
      '<td style="font-size:13px;color:var(--text-sec);">' + (c.email || '—') + '</td>' +
      '<td><span class="mod-tier tier-' + (c.tier || 'starter') + '" style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;">' + tierLabel + '</span></td>' +
      '<td style="font-size:13px;color:var(--text-muted);">' + dateStr + '</td>' +
      '<td>' + statusHtml + '</td>' +
      '<td style="display:flex;gap:6px;flex-wrap:wrap;">' +
        (!c.revoked ? '<button class="btn-copy" onclick="copyCode(\'' + c.code + '\')">Copy</button>' : '') +
        (!c.revoked ? '<button class="btn-revoke" onclick="revokeCode(' + realIdx + ')">Revoke</button>' : '') +
      '</td>';
    tbody.appendChild(tr);
  });

  updateCounts();
}

function copyCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function() {
      showToast('Copied: ' + code);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied: ' + code);
  }
}

function revokeCode(idx) {
  if (!confirm('Revoke this access code? The student will lose portal access.')) return;

  var codes = JSON.parse(localStorage.getItem('wk_codes') || '[]');
  if (codes[idx]) {
    codes[idx].revoked = true;
    localStorage.setItem('wk_codes', JSON.stringify(codes));
    renderCodes();
    showToast('Code revoked.');
  }
}


// ── Monday Sessions ───────────────────────────────────────────────
function renderSessions() {
  var sessions = JSON.parse(localStorage.getItem('wk_sessions') || '[]');
  var list     = document.getElementById('sessions-list');
  var empty    = document.getElementById('sessions-empty');

  sessions.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  if (sessions.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = '';

  sessions.forEach(function(s, i) {
    var isUpcoming = new Date(s.date) >= new Date();
    var card       = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML =
      '<div class="session-dot ' + (isUpcoming ? 'upcoming' : 'past') + '"></div>' +
      '<div class="session-title">' + s.title + '</div>' +
      '<div class="session-date">'  + s.date  + '</div>' +
      (s.video_url ? '<a href="' + s.video_url + '" target="_blank" style="font-size:13px;color:var(--violet-light);text-decoration:none;flex-shrink:0;">▶ Watch</a>' : '') +
      '<div class="session-actions"><button class="btn-session-del" onclick="deleteSession(' + i + ')">Delete</button></div>';
    list.appendChild(card);
  });
}

function toggleAddSession() {
  document.getElementById('add-session-form').classList.toggle('open');
}

function saveSession() {
  var title = document.getElementById('sess-title').value.trim();
  var date  = document.getElementById('sess-date').value;
  if (!title || !date) { showToast('Title and date are required.'); return; }

  var sessions = JSON.parse(localStorage.getItem('wk_sessions') || '[]');
  sessions.push({
    title:     title,
    date:      date,
    video_url: toEmbed(document.getElementById('sess-video').value.trim())
  });
  localStorage.setItem('wk_sessions', JSON.stringify(sessions));

  document.getElementById('sess-title').value = '';
  document.getElementById('sess-date').value  = '';
  document.getElementById('sess-video').value = '';
  document.getElementById('add-session-form').classList.remove('open');

  renderSessions();
  showToast('Session saved!');
}

function deleteSession(idx) {
  if (!confirm('Delete this session?')) return;

  var sessions = JSON.parse(localStorage.getItem('wk_sessions') || '[]');
  sessions.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  sessions.splice(idx, 1);
  localStorage.setItem('wk_sessions', JSON.stringify(sessions));
  renderSessions();
  showToast('Session deleted.');
}


// ── Modals ────────────────────────────────────────────────────────
function closeCodeModal() {
  document.getElementById('code-modal').classList.remove('open');
}

function closeProofModal() {
  document.getElementById('proof-modal').classList.remove('open');
}

function copyModalCode() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentModalCode).then(function() {
      showToast('Code copied: ' + currentModalCode);
    });
  } else {
    var ta = document.createElement('textarea');
    ta.value = currentModalCode;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Code copied: ' + currentModalCode);
  }
}


// ── Mobile sidebar ────────────────────────────────────────────────
function openAdminSidebar() {
  document.getElementById('admin-sidebar').classList.add('open');
  document.getElementById('admin-overlay').classList.add('open');
}

function closeAdminSidebar() {
  document.getElementById('admin-sidebar').classList.remove('open');
  document.getElementById('admin-overlay').classList.remove('open');
}


// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent     = msg;
  t.style.opacity   = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';

  setTimeout(function() {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(-50%) translateY(80px)';
  }, 3000);
}


// ── Enter key on login form ───────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var loginEl = document.getElementById('admin-login');
    if (loginEl && loginEl.style.display !== 'none') {
      adminLogin();
    }
  }
});


// ── Initialise on page load ───────────────────────────────────────
initStorage();

if (localStorage.getItem('wk_admin_session') === '1') {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-app').style.display   = 'block';
  initAdmin();
}

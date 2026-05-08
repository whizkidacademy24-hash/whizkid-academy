/* ═══════════════════════════════════════════════════════════════
   WhizKid Academy — Enrollment Wizard
   4-step flow: Program → Details → Payment → Confirmation
   ═══════════════════════════════════════════════════════════════ */

// ── Wizard state ──────────────────────────────────────────────────
var state = {
  currentStep:     1,
  selectedProgram: null,
  programPrice:    0,
  programName:     '',
  programSub:      '',
  payMethod:       'gcash',
  selectedBank:    null,
  gcashProof:      null,
  bankProof:       null
};


// ── Program selection ─────────────────────────────────────────────
function selectProgram(id, price, name, sub) {
  state.selectedProgram = id;
  state.programPrice    = price;
  state.programName     = name;
  state.programSub      = sub;

  document.querySelectorAll('.program-card').forEach(function(c) {
    c.classList.remove('selected');
  });

  document.getElementById('card-' + id).classList.add('selected');
  document.getElementById('program-error').style.display = 'none';
}


// ── Step navigation ───────────────────────────────────────────────
function goStep(n) {
  // Validate before moving forward
  if (n > state.currentStep) {
    if (!validateStep(state.currentStep)) return;
  }

  state.currentStep = n;

  // Show only the active panel
  document.querySelectorAll('.step-panel').forEach(function(p) {
    p.classList.remove('active');
  });
  document.getElementById('step-' + n).classList.add('active');

  updateProgressBar(n);

  if (n === 3) updatePaymentDisplay();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar(current) {
  for (var i = 1; i <= 4; i++) {
    var si = document.getElementById('si-' + i);
    var sc = document.getElementById('sc-' + i);
    si.classList.remove('active', 'done');

    if (i < current) {
      si.classList.add('done');
      sc.innerHTML = '✓';
    } else if (i === current) {
      si.classList.add('active');
      sc.innerHTML = i;
    } else {
      sc.innerHTML = i;
    }
  }
}


// ── Validation ────────────────────────────────────────────────────
function validateStep(step) {
  if (step === 1) {
    if (!state.selectedProgram) {
      document.getElementById('program-error').style.display = 'block';
      return false;
    }
    return true;
  }

  if (step === 2) {
    var valid = true;
    var fields = [
      {
        id: 'f-name',
        fg: 'fg-name',
        check: function(v) { return v.trim().length > 1; }
      },
      {
        id: 'f-email',
        fg: 'fg-email',
        check: function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
      },
      {
        id: 'f-phone',
        fg: 'fg-phone',
        check: function(v) { return v.trim().length > 7; }
      },
      {
        id: 'f-facebook',
        fg: 'fg-facebook',
        check: function(v) { return v.trim().length > 1; }
      },
      {
        id: 'f-experience',
        fg: 'fg-experience',
        check: function(v) { return v !== ''; }
      }
    ];

    fields.forEach(function(f) {
      var el = document.getElementById(f.id);
      var fg = document.getElementById(f.fg);
      if (!f.check(el.value)) {
        fg.classList.add('has-error');
        valid = false;
      } else {
        fg.classList.remove('has-error');
      }
    });

    return valid;
  }

  if (step === 3) {
    if (state.payMethod === 'gcash') {
      if (!state.gcashProof) {
        document.getElementById('fg-gcash-upload').classList.add('has-error');
        return false;
      }
      document.getElementById('fg-gcash-upload').classList.remove('has-error');
    } else {
      if (!state.bankProof) {
        document.getElementById('fg-bank-upload').classList.add('has-error');
        return false;
      }
      document.getElementById('fg-bank-upload').classList.remove('has-error');
    }
    return true;
  }

  return true;
}


// ── Payment display update ────────────────────────────────────────
function updatePaymentDisplay() {
  var fmtd = '₱' + state.programPrice.toLocaleString();
  document.getElementById('pay-amount').textContent      = fmtd;
  document.getElementById('pay-prog-name').textContent   = state.programName;
  document.getElementById('gcash-amount-show').textContent = fmtd;
}


// ── Payment tab switching ─────────────────────────────────────────
function switchPayTab(tab) {
  state.payMethod = tab;

  document.querySelectorAll('.pay-tab').forEach(function(t, i) {
    t.classList.toggle('active', (i === 0 && tab === 'gcash') || (i === 1 && tab === 'bank'));
  });

  document.getElementById('panel-gcash').classList.toggle('active', tab === 'gcash');
  document.getElementById('panel-bank').classList.toggle('active', tab === 'bank');
}


// ── Bank selection ────────────────────────────────────────────────
function selectBank(bank) {
  state.selectedBank = bank;

  document.querySelectorAll('.bank-card').forEach(function(c) {
    c.classList.remove('selected');
  });

  document.getElementById('bc-' + bank).classList.add('selected');

  var box = document.getElementById('bank-details-box');
  box.classList.add('visible');

  if (bank === 'bpi') {
    document.getElementById('bank-acct-num').textContent  = 'XXXX-XXXX-XX';
    document.getElementById('bank-full-name').textContent = 'Bank of the Philippine Islands';
  } else {
    document.getElementById('bank-acct-num').textContent  = 'XXXX-XXXX-XX';
    document.getElementById('bank-full-name').textContent = 'Banco de Oro';
  }
}


// ── File upload preview ───────────────────────────────────────────
function handleUpload(input, type) {
  var file = input.files[0];
  if (!file) return;

  var reader = new FileReader();

  reader.onload = function(e) {
    var data = e.target.result;

    if (type === 'gcash') {
      state.gcashProof = data;
      document.getElementById('gcash-preview-img').src = data;
      document.getElementById('gcash-preview').style.display = 'block';
      document.getElementById('fg-gcash-upload').classList.remove('has-error');
    } else {
      state.bankProof = data;
      document.getElementById('bank-preview-img').src = data;
      document.getElementById('bank-preview').style.display = 'block';
      document.getElementById('fg-bank-upload').classList.remove('has-error');
    }
  };

  reader.readAsDataURL(file);
}


// ── Submit enrollment ─────────────────────────────────────────────
function submitEnrollment() {
  if (!validateStep(3)) return;

  var ref = genRef('WKA');

  var enrollment = {
    ref:         ref,
    name:        document.getElementById('f-name').value.trim(),
    email:       document.getElementById('f-email').value.trim(),
    phone:       document.getElementById('f-phone').value.trim(),
    facebook:    document.getElementById('f-facebook').value.trim(),
    experience:  document.getElementById('f-experience').value,
    referral:    document.getElementById('f-referral').value,
    goals:       document.getElementById('f-goals').value.trim(),
    program:     state.selectedProgram,
    programName: state.programName,
    price:       state.programPrice,
    payMethod:   state.payMethod,
    bank:        state.selectedBank,
    proof:       state.payMethod === 'gcash' ? state.gcashProof : state.bankProof,
    status:      'pending',
    createdAt:   new Date().toISOString()
  };

  // Persist to localStorage
  var enrollments = JSON.parse(localStorage.getItem('wk_enrollments') || '[]');
  enrollments.push(enrollment);
  localStorage.setItem('wk_enrollments', JSON.stringify(enrollments));

  // Update confirmation screen
  document.getElementById('confirm-ref').textContent      = ref;
  document.getElementById('confirm-name-msg').textContent =
    'Thank you, ' + enrollment.name + "! We've received your enrollment request.";
  document.getElementById('confirm-prog').textContent     = state.programName;

  goStep(4);
}

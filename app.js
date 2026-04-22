// Meeting Cost App — vanilla JS, no build, localStorage only.

const STORAGE_KEYS = {
  roles: 'meetingCost:roles',
  settings: 'meetingCost:settings',
};

const DEFAULT_ROLES = [
  { name: 'Manager', rate: 120, count: 0 },
  { name: 'Senior',  rate: 100, count: 0 },
  { name: 'Mid',     rate:  70, count: 0 },
  { name: 'Junior',  rate:  50, count: 0 },
];

const DEFAULT_SETTINGS = { currency: 'PLN' };

const CURRENCY_LOCALE = {
  PLN: 'pl-PL',
  EUR: 'de-DE',
  USD: 'en-US',
};

// ---------- Storage ----------

function loadRoles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.roles);
    if (!raw) return cloneDefaultRoles();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneDefaultRoles();
    return parsed.map(r => ({
      name: String(r.name ?? 'Role'),
      rate: Number.isFinite(+r.rate) && +r.rate >= 0 ? +r.rate : 0,
      count: Number.isFinite(+r.count) && +r.count >= 0 ? Math.floor(+r.count) : 0,
    }));
  } catch {
    return cloneDefaultRoles();
  }
}

function saveRoles(roles) {
  try {
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(roles));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const currency = ['PLN', 'EUR', 'USD'].includes(parsed?.currency) ? parsed.currency : DEFAULT_SETTINGS.currency;
    return { currency };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    // Ignore.
  }
}

function cloneDefaultRoles() {
  return DEFAULT_ROLES.map(r => ({ ...r }));
}

// ---------- Derived values ----------

function totalParticipants(roles) {
  return roles.reduce((sum, r) => sum + r.count, 0);
}

function totalHourlyRate(roles) {
  return roles.reduce((sum, r) => sum + r.rate * r.count, 0);
}

// ---------- Formatting ----------

function formatMoney(amount, currency) {
  const locale = CURRENCY_LOCALE[currency] ?? 'en-US';
  const fractionDigits = amount >= 10000 ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${amount.toFixed(fractionDigits)} ${currency}`;
  }
}

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// ---------- App state ----------

const state = {
  roles: loadRoles(),
  settings: loadSettings(),
  timer: {
    startTime: null,
    pausedAt: null,
    totalPausedMs: 0,
    isRunning: false,
  },
  view: 'main', // 'main' | 'active' | 'settings'
  renderIntervalId: null,
};

// ---------- DOM refs ----------

const el = {
  viewMain: document.getElementById('view-main'),
  viewActive: document.getElementById('view-active'),
  viewSettings: document.getElementById('view-settings'),

  roleList: document.getElementById('role-list'),
  totalParticipants: document.getElementById('total-participants'),
  totalHourlyRate: document.getElementById('total-hourly-rate'),
  btnStart: document.getElementById('btn-start'),
  btnOpenSettings: document.getElementById('btn-open-settings'),

  costValue: document.getElementById('cost-value'),
  timerValue: document.getElementById('timer-value'),
  miniParticipants: document.getElementById('mini-participants'),
  miniHourly: document.getElementById('mini-hourly'),
  btnPauseResume: document.getElementById('btn-pause-resume'),
  btnReset: document.getElementById('btn-reset'),

  btnCloseSettings: document.getElementById('btn-close-settings'),
  settingsForm: document.getElementById('settings-form'),
  currencySelect: document.getElementById('currency-select'),
  rolesEditor: document.getElementById('roles-editor'),
  btnRestoreDefaults: document.getElementById('btn-restore-defaults'),
};

// ---------- View switching ----------

function setView(name) {
  state.view = name;
  el.viewMain.classList.toggle('hidden', name !== 'main');
  el.viewActive.classList.toggle('hidden', name !== 'active');
  el.viewSettings.classList.toggle('hidden', name !== 'settings');
}

// ---------- Main view ----------

function renderRoleList() {
  el.roleList.replaceChildren();
  state.roles.forEach((role, index) => {
    const li = document.createElement('li');
    li.className = 'role-tile';

    const info = document.createElement('div');
    info.className = 'role-tile-info';

    const name = document.createElement('span');
    name.className = 'role-tile-name';
    name.textContent = role.name;

    const rate = document.createElement('span');
    rate.className = 'role-tile-rate';
    rate.textContent = `${formatMoney(role.rate, state.settings.currency)} / h`;

    info.append(name, rate);

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'count-btn';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Decrease ${role.name}`);
    minus.disabled = role.count <= 0;
    minus.addEventListener('click', () => changeCount(index, -1));

    const count = document.createElement('span');
    count.className = 'role-tile-count';
    count.textContent = String(role.count);

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'count-btn';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Increase ${role.name}`);
    plus.addEventListener('click', () => changeCount(index, +1));

    li.append(info, minus, count, plus);
    el.roleList.appendChild(li);
  });
}

function renderTotals() {
  const participants = totalParticipants(state.roles);
  const hourly = totalHourlyRate(state.roles);
  el.totalParticipants.textContent = String(participants);
  el.totalHourlyRate.textContent = formatMoney(hourly, state.settings.currency);
  el.btnStart.disabled = participants === 0;
}

function changeCount(index, delta) {
  const next = state.roles[index].count + delta;
  state.roles[index].count = Math.max(0, next);
  saveRoles(state.roles);
  renderRoleList();
  renderTotals();
}

// ---------- Timer ----------

function elapsedMs() {
  const t = state.timer;
  if (!t.startTime) return 0;
  const now = Date.now();
  const activePause = t.pausedAt ? now - t.pausedAt : 0;
  return Math.max(0, now - t.startTime - t.totalPausedMs - activePause);
}

function startTimer() {
  state.timer = {
    startTime: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
    isRunning: true,
  };
  beginRenderLoop();
}

function pauseTimer() {
  if (!state.timer.isRunning) return;
  state.timer.pausedAt = Date.now();
  state.timer.isRunning = false;
  stopRenderLoop();
  renderActive(); // freeze-frame
  renderPauseResumeLabel();
}

function resumeTimer() {
  if (state.timer.isRunning || !state.timer.pausedAt) return;
  state.timer.totalPausedMs += Date.now() - state.timer.pausedAt;
  state.timer.pausedAt = null;
  state.timer.isRunning = true;
  beginRenderLoop();
  renderPauseResumeLabel();
}

function resetTimer() {
  stopRenderLoop();
  state.timer = {
    startTime: null,
    pausedAt: null,
    totalPausedMs: 0,
    isRunning: false,
  };
}

function beginRenderLoop() {
  stopRenderLoop();
  renderActive();
  state.renderIntervalId = setInterval(renderActive, 400);
}

function stopRenderLoop() {
  if (state.renderIntervalId !== null) {
    clearInterval(state.renderIntervalId);
    state.renderIntervalId = null;
  }
}

// ---------- Active view ----------

function renderActive() {
  const ms = elapsedMs();
  const hourly = totalHourlyRate(state.roles);
  const cost = hourly * (ms / 3600000);
  el.costValue.textContent = formatMoney(cost, state.settings.currency);
  el.timerValue.textContent = formatDuration(ms);
  el.miniParticipants.textContent = String(totalParticipants(state.roles));
  el.miniHourly.textContent = formatMoney(hourly, state.settings.currency);
}

function renderPauseResumeLabel() {
  el.btnPauseResume.textContent = state.timer.isRunning ? 'Pause' : 'Resume';
}

// ---------- Settings ----------

function renderSettings() {
  el.currencySelect.value = state.settings.currency;
  el.rolesEditor.replaceChildren();
  state.roles.forEach((role, index) => {
    const li = document.createElement('li');
    li.className = 'role-edit-row';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'input-label';
    nameLabel.textContent = 'Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = role.name;
    nameInput.maxLength = 30;
    nameInput.dataset.index = String(index);
    nameInput.dataset.field = 'name';
    nameLabel.appendChild(nameInput);

    const rateLabel = document.createElement('label');
    rateLabel.className = 'input-label';
    rateLabel.textContent = 'Rate / h';
    const rateInput = document.createElement('input');
    rateInput.type = 'number';
    rateInput.min = '0';
    rateInput.step = '1';
    rateInput.inputMode = 'decimal';
    rateInput.value = String(role.rate);
    rateInput.dataset.index = String(index);
    rateInput.dataset.field = 'rate';
    rateLabel.appendChild(rateInput);

    li.append(nameLabel, rateLabel);
    el.rolesEditor.appendChild(li);
  });
}

function collectSettingsFromForm() {
  const currency = el.currencySelect.value;
  const nextRoles = state.roles.map(r => ({ ...r }));
  const inputs = el.rolesEditor.querySelectorAll('input');
  let valid = true;
  inputs.forEach(input => {
    const i = Number(input.dataset.index);
    const field = input.dataset.field;
    if (field === 'name') {
      const v = input.value.trim() || nextRoles[i].name;
      nextRoles[i].name = v;
    } else if (field === 'rate') {
      const num = Number(input.value);
      if (!Number.isFinite(num) || num < 0) {
        valid = false;
        input.setCustomValidity('Rate must be a non-negative number');
      } else {
        input.setCustomValidity('');
        nextRoles[i].rate = num;
      }
    }
  });
  return { valid, currency, roles: nextRoles };
}

// ---------- Event wiring ----------

el.btnStart.addEventListener('click', () => {
  if (totalParticipants(state.roles) === 0) return;
  startTimer();
  renderPauseResumeLabel();
  setView('active');
});

el.btnPauseResume.addEventListener('click', () => {
  if (state.timer.isRunning) {
    pauseTimer();
  } else {
    resumeTimer();
  }
});

el.btnReset.addEventListener('click', () => {
  const confirmed = window.confirm('Reset the meeting? This will stop the timer.');
  if (!confirmed) return;
  resetTimer();
  setView('main');
  renderRoleList();
  renderTotals();
});

el.btnOpenSettings.addEventListener('click', () => {
  renderSettings();
  setView('settings');
});

el.btnCloseSettings.addEventListener('click', () => {
  setView('main');
});

el.settingsForm.addEventListener('submit', event => {
  event.preventDefault();
  const { valid, currency, roles } = collectSettingsFromForm();
  if (!valid) {
    el.settingsForm.reportValidity();
    return;
  }
  state.settings = { currency };
  state.roles = roles;
  saveSettings(state.settings);
  saveRoles(state.roles);
  renderRoleList();
  renderTotals();
  setView('main');
});

el.btnRestoreDefaults.addEventListener('click', () => {
  const confirmed = window.confirm('Restore default roles, rates, and currency?');
  if (!confirmed) return;
  state.roles = cloneDefaultRoles();
  state.settings = { ...DEFAULT_SETTINGS };
  saveRoles(state.roles);
  saveSettings(state.settings);
  renderSettings();
  renderRoleList();
  renderTotals();
});

// ---------- Initial render ----------

renderRoleList();
renderTotals();
setView('main');

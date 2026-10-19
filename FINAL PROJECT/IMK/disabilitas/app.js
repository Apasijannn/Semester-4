'use strict';

// ── Device state ───────────────────────────────────────────
const state = {
  ac:   { on: false, temp: 24 },
  lamp: { on: false },
  door: { locked: true },
  tv:   { on: false, volume: 50, channel: 1 },
  successReturn: 'dashboard',
};

// ── Auto-scan state ────────────────────────────────────────
const scanState = {
  active:       false,
  currentIndex: 0,
  items:        [],
  interval:     null,
  speed:        2000,
};

const RING_CIRC = 87.96;

// ══════════════════════════════════════════════════════════════
//  RING HELPERS
// ══════════════════════════════════════════════════════════════

// Mulai animasi fill ring dari kosong → penuh selama 2 detik
function startRing(btn) {
  const fill = btn.querySelector('.ring-fill');
  if (!fill) return;
  fill.style.transition      = 'none';
  fill.style.strokeDashoffset = String(RING_CIRC);
  btn.getBoundingClientRect();                    // force reflow
  fill.style.transition      = 'stroke-dashoffset 2s linear';
  fill.style.strokeDashoffset = '0';
}

// Reset ring ke posisi kosong (tanpa animasi)
function resetRing(btn) {
  const fill = btn.querySelector('.ring-fill');
  if (!fill) return;
  fill.style.transition      = 'none';
  fill.style.strokeDashoffset = String(RING_CIRC);
}

// ══════════════════════════════════════════════════════════════
//  AUTO-SCAN FUNCTIONS
// ══════════════════════════════════════════════════════════════

function getScanItems() {
  const activeScreen = document.querySelector('.screen.active');
  if (!activeScreen) return [];
  return Array.from(activeScreen.querySelectorAll('.card'));
}

// Sorot tombol pada index — ring langsung mulai animasi 2 detik
function highlightScanItem(index) {
  scanState.items.forEach(btn => {
    btn.classList.remove('is-scanning');
    resetRing(btn);
  });

  const target = scanState.items[index];
  if (target) {
    target.classList.add('is-scanning');
    target.scrollIntoView({ block: 'nearest' });
    startRing(target);   // ring fill berjalan selama 2 detik scan
  }
}

function startScanning() {
  stopScanning();
  scanState.items = getScanItems();
  if (scanState.items.length === 0) return;

  scanState.currentIndex = 0;
  scanState.active       = true;
  highlightScanItem(0);

  scanState.interval = setInterval(() => {
    scanState.currentIndex =
      (scanState.currentIndex + 1) % scanState.items.length;
    highlightScanItem(scanState.currentIndex);
  }, scanState.speed);
}

function stopScanning() {
  clearInterval(scanState.interval);
  scanState.interval = null;
  scanState.active   = false;
  scanState.items.forEach(btn => {
    btn.classList.remove('is-scanning');
    resetRing(btn);
  });
  scanState.items = [];
}

function selectCurrentItem() {
  const btn = scanState.items[scanState.currentIndex];
  if (btn) btn.click();
}

// ══════════════════════════════════════════════════════════════
//  KEYBOARD LISTENER
// ══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    selectCurrentItem();
  }
});

// ══════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════
function navigate(screenId) {
  stopScanning();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + screenId);
  if (target) target.classList.add('active');
  updateUI();
  setTimeout(() => startScanning(), 250);
}

function showSuccess(returnTo) {
  stopScanning();
  state.successReturn = returnTo;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const successScreen = document.getElementById('screen-success');
  if (successScreen) successScreen.classList.add('active');
  updateUI();
  setTimeout(() => navigate(returnTo), 1800);
}

// ══════════════════════════════════════════════════════════════
//  UI UPDATE
// ══════════════════════════════════════════════════════════════
function updateUI() {
  applyCardState('card-ac',   state.ac.on,       'status-ac',   state.ac.on   ? 'ON' : 'OFF');
  applyCardState('card-lamp', state.lamp.on,      'status-lamp', state.lamp.on ? 'ON' : 'OFF');
  applyCardState('card-door', !state.door.locked, 'status-door', state.door.locked ? 'LOCKED' : 'UNLOCKED');
  applyCardState('card-tv',   state.tv.on,        'status-tv',   state.tv.on   ? 'ON' : 'OFF');

  applyCardState('btn-ac-power', state.ac.on, null, null);
  setText('temp-display',    state.ac.temp + '');
  setText('ac-status-label', state.ac.on ? 'ON' : 'OFF');

  applyCardState('btn-lamp-power', state.lamp.on, null, null);

  applyCardState('btn-door-lock',   state.door.locked,  null, null);
  applyCardState('btn-door-unlock', !state.door.locked, null, null);

  applyCardState('btn-tv-power', state.tv.on, null, null);
  setText('tv-status-label', state.tv.on  ? 'ON' : 'OFF');
  setText('tv-ch-label',     state.tv.channel + '');
  setText('tv-vol-label',    state.tv.volume  + '');

  setText('volume-display', state.tv.volume + '');
  const bar = document.getElementById('volume-bar');
  if (bar) bar.style.width = state.tv.volume + '%';

  setText('channel-display', state.tv.channel + '');

  syncClock();
}

function applyCardState(id, active, statusId, statusText) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('is-active', active);
  if (statusId) setText(statusId, statusText);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ══════════════════════════════════════════════════════════════
//  ACTION HANDLERS  — eksekusi langsung, ring sudah berjalan
//  saat auto-scan; tidak ada loading tambahan setelah klik
// ══════════════════════════════════════════════════════════════

// AC
function toggleAC(btn)  { state.ac.on = !state.ac.on;                    stopScanning(); showSuccess('ac'); }
function tempUp(btn)    { state.ac.temp = Math.min(30, state.ac.temp+1); stopScanning(); showSuccess('ac'); }
function tempDown(btn)  { state.ac.temp = Math.max(16, state.ac.temp-1); stopScanning(); showSuccess('ac'); }

// Lamp
function toggleLamp(btn) { state.lamp.on = !state.lamp.on; stopScanning(); showSuccess('lamp'); }

// Door
function lockDoor(btn)   { state.door.locked = true;  stopScanning(); showSuccess('door'); }
function unlockDoor(btn) { state.door.locked = false; stopScanning(); showSuccess('door'); }

// TV
function toggleTV(btn)    { state.tv.on = !state.tv.on;                           stopScanning(); showSuccess('tv');      }
function volumeUp(btn)    { state.tv.volume  = Math.min(100, state.tv.volume+10); stopScanning(); showSuccess('volume'); }
function volumeDown(btn)  { state.tv.volume  = Math.max(0,   state.tv.volume-10); stopScanning(); showSuccess('volume'); }
function nextChannel(btn) { state.tv.channel = state.tv.channel >= 99 ? 1  : state.tv.channel+1; stopScanning(); showSuccess('channel'); }
function prevChannel(btn) { state.tv.channel = state.tv.channel <= 1  ? 99 : state.tv.channel-1; stopScanning(); showSuccess('channel'); }

// ══════════════════════════════════════════════════════════════
//  CLOCK
// ══════════════════════════════════════════════════════════════
function syncClock() {
  const now  = new Date();
  const time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  document.querySelectorAll('.clock').forEach(el => (el.textContent = time));
}
setInterval(syncClock, 10000);

// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════
updateUI();
setTimeout(() => startScanning(), 250);

// Karsa — myITS Connector
// Background service worker: simpan, dedupe, jadwalkan reminder, jawab popup

const STORAGE_KEY = 'karsa_tasks';
const ALARM_PREFIX = 'deadline-';
const H_MINUS_1_MS = 24 * 60 * 60 * 1000;

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

// Normalise URL ke "origin+pathname?id=X" agar deduplicate kebal parameter tambahan
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('id');
    return id ? `${u.origin}${u.pathname}?id=${id}` : url;
  } catch {
    return url;
  }
}

function makeTaskId(title, course, url) {
  return simpleHash(`${title}|${course}|${normalizeUrl(url)}`);
}

function dedupeKey(task) {
  return `${task.title}|${task.course}|${normalizeUrl(task.url)}`;
}

function getStoredTasks() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (r) => resolve(r[STORAGE_KEY] || []));
  });
}

function setStoredTasks(tasks) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: tasks }, resolve);
  });
}

async function scheduleAlarmForTask(task) {
  if (!task.deadline || task.status === 'done') return;
  const deadlineMs = Date.parse(task.deadline);
  if (isNaN(deadlineMs)) return;
  const triggerAt = deadlineMs - H_MINUS_1_MS;
  if (triggerAt <= Date.now()) return;
  chrome.alarms.create(`${ALARM_PREFIX}${task.id}`, { when: triggerAt });
}

// ── Handler: TASKS_SCRAPED (dari halaman course / dashboard) ─────────────────
async function handleTasksScraped(scrapedTasks) {
  const existing = await getStoredTasks();
  const byKey = new Map(existing.map((t) => [dedupeKey(t), t]));

  for (const raw of scrapedTasks) {
    const id = makeTaskId(raw.title, raw.course, raw.url);
    const key = dedupeKey(raw);
    const prev = byKey.get(key);

    const merged = {
      id,
      title: raw.title,
      course: raw.course,
      deadline: raw.deadline || prev?.deadline || null,
      url: normalizeUrl(raw.url),
      // Pertahankan status 'done' yang sudah ditandai user; jangan reset ke 'pending'
      status: prev?.status ?? 'pending',
      scrapedAt: raw.scrapedAt || Date.now()
    };

    byKey.set(key, merged);
    await scheduleAlarmForTask(merged);
  }

  const merged = Array.from(byKey.values());
  await setStoredTasks(merged);
  return merged;
}

// ── Handler: TASK_UPDATE (dari halaman /mod/assign/view.php) ─────────────────
// Memperbarui satu task: deadline jika ada, dan status berdasarkan isSubmitted.
async function handleTaskUpdate(raw) {
  const existing = await getStoredTasks();
  const byKey = new Map(existing.map((t) => [dedupeKey(t), t]));

  const id = makeTaskId(raw.title, raw.course, raw.url);
  const key = dedupeKey(raw);
  const prev = byKey.get(key);

  // Tentukan status:
  // - Kalau isSubmitted=true → 'done' (override apapun yang ada)
  // - Kalau isSubmitted=false → jangan downgrade 'done' ke 'pending'
  //   (mungkin user menekan centang manual sebelumnya)
  const newStatus = raw.isSubmitted ? 'done' : (prev?.status ?? 'pending');

  const merged = {
    id,
    title: raw.title,
    course: raw.course,
    deadline: raw.deadline || prev?.deadline || null,
    url: normalizeUrl(raw.url),
    status: newStatus,
    scrapedAt: raw.scrapedAt || Date.now()
  };

  byKey.set(key, merged);

  if (merged.status !== 'done') {
    await scheduleAlarmForTask(merged);
  } else {
    // Tugas sudah selesai, batalkan alarm jika ada
    chrome.alarms.clear(`${ALARM_PREFIX}${id}`);
  }

  const updated = Array.from(byKey.values());
  await setStoredTasks(updated);
  return merged;
}

// ── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'TASKS_SCRAPED') {
    handleTasksScraped(message.tasks).then((tasks) => {
      sendResponse({ ok: true, count: tasks.length });
    });
    return true;
  }

  if (message?.type === 'TASK_UPDATE') {
    handleTaskUpdate(message.task).then((task) => {
      sendResponse({ ok: true, task });
    });
    return true;
  }

  if (message?.type === 'GET_TASKS') {
    getStoredTasks().then((tasks) => sendResponse({ ok: true, tasks }));
    return true;
  }

  if (message?.type === 'SET_TASK_STATUS') {
    getStoredTasks().then(async (tasks) => {
      const updated = tasks.map((t) =>
        t.id === message.id ? { ...t, status: message.status } : t
      );
      await setStoredTasks(updated);
      sendResponse({ ok: true, tasks: updated });
    });
    return true;
  }

  if (message?.type === 'CLEAR_TASKS') {
    chrome.storage.sync.remove([STORAGE_KEY], () => {
      chrome.alarms.clearAll();
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

// ── Alarm → notifikasi ───────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;

  const taskId = alarm.name.slice(ALARM_PREFIX.length);
  const tasks = await getStoredTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.status === 'done') return;

  chrome.notifications.create(`karsa-${taskId}`, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Deadline besok!',
    message: `${task.title} (${task.course}) jatuh tempo besok.`,
    priority: 2
  });
});

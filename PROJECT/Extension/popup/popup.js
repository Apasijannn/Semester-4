// Karsa — myITS Connector
// Popup script: render task list, handle sync/filter/mark-as-done

const KARSA_APP_URL = 'http://localhost:5173'; // ganti ke URL deploy saat production

let allTasks = [];
let activeFilter = 'all';

const els = {
  taskList: document.getElementById('taskList'),
  counterText: document.getElementById('counterText'),
  badgeCount: document.getElementById('badgeCount'),
  syncBtn: document.getElementById('syncBtn'),
  syncStatus: document.getElementById('syncStatus'),
  tabs: document.getElementById('tabs'),
  openAppBtn: document.getElementById('openAppBtn'),
  clearBtn: document.getElementById('clearBtn')
};

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => resolve(response));
  });
}

function getUrgency(deadlineIso) {
  if (!deadlineIso) return null;
  const ms = Date.parse(deadlineIso);
  if (isNaN(ms)) return null;

  const diffDays = (ms - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 3) return 'red';
  if (diffDays < 7) return 'yellow';
  return 'green';
}

function formatDeadline(deadlineIso) {
  if (!deadlineIso) return 'Tanpa deadline';
  const ms = Date.parse(deadlineIso);
  if (isNaN(ms)) return deadlineIso;

  const target = new Date(ms);
  const now = new Date();

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfDay(target) - startOfDay(now)) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return 'Lewat tenggat';
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays <= 6) return `${diffDays} hari lagi`;

  const bulan = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return `${target.getDate()} ${bulan[target.getMonth()]} ${target.getFullYear()}`;
}

function applyFilter(tasks, filter) {
  if (filter === 'pending') return tasks.filter((t) => t.status !== 'done');
  if (filter === 'done') return tasks.filter((t) => t.status === 'done');
  return tasks;
}

function render() {
  const filtered = applyFilter(allTasks, activeFilter);

  els.counterText.textContent = `${allTasks.length} tugas ditemukan`;
  els.badgeCount.textContent = String(allTasks.filter((t) => t.status !== 'done').length);

  els.taskList.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Belum ada tugas di kategori ini.';
    els.taskList.appendChild(empty);
    return;
  }

  // Urutkan: belum ada deadline di akhir, sisanya berdasarkan deadline terdekat
  const sorted = [...filtered].sort((a, b) => {
    const aMs = a.deadline ? Date.parse(a.deadline) : Infinity;
    const bMs = b.deadline ? Date.parse(b.deadline) : Infinity;
    return aMs - bMs;
  });

  sorted.forEach((task) => {
    const urgency = getUrgency(task.deadline);
    const isDone = task.status === 'done';

    const li = document.createElement('li');
    li.className = `task-card${urgency ? ` urgency-${urgency}` : ''}${isDone ? ' is-done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = isDone;
    checkbox.addEventListener('change', () => toggleDone(task.id, checkbox.checked));

    const body = document.createElement('div');
    body.className = 'task-body';

    const title = document.createElement('p');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const course = document.createElement('span');
    course.className = 'task-course';
    course.textContent = task.course || 'Unknown';

    const deadline = document.createElement('span');
    deadline.className = `task-deadline${urgency ? ` urgency-${urgency}` : ''}`;
    deadline.textContent = formatDeadline(task.deadline);

    meta.append(course, deadline);
    body.append(title, meta);

    if (task.url) {
      title.style.cursor = 'pointer';
      title.title = 'Buka tugas';
      title.addEventListener('click', () => chrome.tabs.create({ url: task.url }));
    }

    li.append(checkbox, body);
    els.taskList.appendChild(li);
  });
}

async function loadTasks() {
  const response = await sendMessage({ type: 'GET_TASKS' });
  allTasks = response?.tasks || [];
  render();
}

async function toggleDone(id, checked) {
  const status = checked ? 'done' : 'pending';
  const response = await sendMessage({ type: 'SET_TASK_STATUS', id, status });
  allTasks = response?.tasks || allTasks;
  render();
}

async function handleSync() {
  els.syncStatus.textContent = 'Menyinkronkan...';
  els.syncBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || !tab.url.includes('classroom.its.ac.id')) {
      els.syncStatus.textContent = 'Buka classroom.its.ac.id terlebih dahulu.';
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Beri waktu sebentar untuk content script mengirim TASKS_SCRAPED ke background
    setTimeout(async () => {
      await loadTasks();
      els.syncStatus.textContent = 'Sinkron selesai.';
    }, 500);
  } catch (err) {
    els.syncStatus.textContent = 'Gagal sync. Coba reload halaman classroom.';
  } finally {
    els.syncBtn.disabled = false;
  }
}

function handleTabClick(e) {
  const btn = e.target.closest('.tab');
  if (!btn) return;

  activeFilter = btn.dataset.filter;
  els.tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
  render();
}

async function handleClear() {
  if (!confirm('Hapus semua data tugas yang tersimpan?')) return;
  await sendMessage({ type: 'CLEAR_TASKS' });
  allTasks = [];
  render();
}

function handleOpenApp() {
  chrome.tabs.create({ url: KARSA_APP_URL });
}

els.syncBtn.addEventListener('click', handleSync);
els.tabs.addEventListener('click', handleTabClick);
els.clearBtn.addEventListener('click', handleClear);
els.openAppBtn.addEventListener('click', handleOpenApp);

loadTasks();

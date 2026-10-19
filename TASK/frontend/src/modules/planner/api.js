// Client API modul AI Planner — semua request lewat proxy Vite /api
const BASE = "/api/planner";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string" ? body.detail : `HTTP ${res.status}`;
    throw new Error(detail);
  }
  return res.json();
}

// Mode personal: identitas user dipegang backend (DEFAULT_USER_ID di .env),
// jadi tidak ada user_id yang dikirim dari frontend.

/** Orkestrator chat: klasifikasi konfirmasi ATAU extraction + reply Prompt B. */
export function sendChat(message) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/** Keputusan eksplisit dari tombol "Ya, simpan" / "Batal". */
export function confirmAction(pendingActionId, decision) {
  return request("/confirm", {
    method: "POST",
    body: JSON.stringify({ pending_action_id: pendingActionId, decision }),
  });
}

export function fetchPending() {
  return request("/pending");
}

/**
 * Riwayat chat, terurut lama → baru, dengan pagination cursor.
 * `before` = created_at pesan paling lama yang sudah dimuat (load more).
 */
export function fetchHistory({ limit = 50, before } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  return request(`/history?${params}`);
}

export function fetchReminders() {
  return request("/reminders");
}

/** Occurrence kalender sebulan (recurring sudah di-expand backend). */
export function fetchCalendar(month) {
  return request(`/calendar?month=${month}`);
}

/**
 * Edit langsung dari kalender — bypass pending_actions.
 * Juga dipakai untuk tandai selesai ({status:"done"}) dan
 * hapus/soft-delete ({status:"cancelled"}).
 */
export function patchReminder(reminderId, fields) {
  return request(`/reminders/${reminderId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

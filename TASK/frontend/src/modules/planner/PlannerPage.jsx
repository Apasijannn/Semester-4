import { useCallback, useEffect, useState } from "react";
import ChatPanel from "./components/ChatPanel.jsx";
import ReminderListView from "./components/ReminderListView.jsx";
import PendingActionsIndicator from "./components/PendingActionsIndicator.jsx";
import CalendarView from "./components/CalendarView.jsx";
import { fetchPending, fetchReminders } from "./api.js";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "list", label: "List" },
  { id: "calendar", label: "Kalender" },
];

/**
 * Halaman utama modul AI Planner — mode personal (single-user).
 * Identitas user dipegang backend lewat DEFAULT_USER_ID di backend/.env.
 */
export default function PlannerPage() {
  const [tab, setTab] = useState("chat");
  const [reminders, setReminders] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // naik setiap ada perubahan data — dipakai CalendarView untuk buang cache
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDataVersion((v) => v + 1);
    try {
      const [remindersRes, pendingRes] = await Promise.all([
        fetchReminders(),
        fetchPending(),
      ]);
      setReminders(remindersRes.reminders);
      setPending(pendingRes.pending_actions);
    } catch (err) {
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="flex flex-col gap-[22px]">
      {/* pola PageTitle Karsa (PERSONAL ASSISTANT/src/layout/Layout.jsx) */}
      <div className="flex items-end justify-between gap-5">
        <div>
          <h1 className="m-0 font-display text-[42px] leading-none tracking-tight">
            AI Planner
          </h1>
          <p className="mt-3 text-[15px] text-neutral-700 dark:text-neutral-400">
            Atur reminder &amp; rutinitas cukup lewat chat — Karsa yang merapikan.
          </p>
        </div>
        <PendingActionsIndicator pending={pending} onDataChanged={refreshData} />
      </div>

      {/* tab switcher: Chat / List / Kalender */}
      <div className="flex gap-2.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`cursor-pointer rounded-xl border-[2.5px] border-line px-4 py-2 text-sm font-bold transition ${
              tab === t.id
                ? "bg-lilac shadow-sticker-sm"
                : "bg-paper text-neutral-400 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChatPanel onDataChanged={refreshData} />
          <ReminderListView reminders={reminders} loading={loading} error={error} />
        </div>
      )}
      {tab === "list" && (
        <ReminderListView reminders={reminders} loading={loading} error={error} />
      )}
      {tab === "calendar" && (
        <CalendarView dataVersion={dataVersion} onChanged={refreshData} />
      )}
    </div>
  );
}

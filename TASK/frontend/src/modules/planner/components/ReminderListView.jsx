import { Badge, Card } from "../../../components/primitives.jsx";

// Aksen kategori mengikuti aksen modul Karsa (nav.js):
// health -> Health Manager (green), finance -> Finance Manager (yellow),
// task -> Task Manager (blue); general memakai lilac (aksen modul AI Planner).
const CATEGORY_ACCENTS = {
  health: "green",
  finance: "yellow",
  task: "blue",
  general: "lilac",
};

const CATEGORY_LABELS = {
  health: "Health",
  finance: "Finance",
  task: "Task",
  general: "General",
};

// ISO weekday (konvensi backend): 1=Senin … 7=Minggu
const DAY_SHORT = { 1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam", 5: "Jum", 6: "Sab", 7: "Min" };

const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function recurrenceLabel(reminder) {
  switch (reminder.recurrence) {
    case "daily":
      return "Tiap hari";
    case "weekly": {
      const days = (reminder.recurrence_days || [])
        .map((d) => DAY_SHORT[d])
        .filter(Boolean);
      return days.length ? days.join(", ") : "Tiap minggu";
    }
    case "monthly":
      return "Tiap bulan";
    default:
      return null;
  }
}

function dateGroupLabel(isoString) {
  const date = new Date(isoString);
  const today = new Date();
  const dayDiff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000
  );
  if (dayDiff === 0) return "Hari ini";
  if (dayDiff === 1) return "Besok";
  return dateFmt.format(date);
}

/** Kelompokkan: reminder berulang jadi satu grup "Rutin", sisanya per tanggal. */
function groupReminders(reminders) {
  const recurring = [];
  const dated = new Map(); // key tanggal -> { label, items }
  const unscheduled = [];

  for (const r of reminders) {
    if (r.recurrence !== "none") {
      recurring.push(r);
    } else if (r.scheduled_at) {
      const key = new Date(r.scheduled_at).toDateString();
      if (!dated.has(key)) {
        dated.set(key, { label: dateGroupLabel(r.scheduled_at), items: [] });
      }
      dated.get(key).items.push(r);
    } else {
      unscheduled.push(r);
    }
  }

  const groups = [...dated.values()]; // backend sudah urut scheduled_at asc
  if (recurring.length) groups.push({ label: "Rutin", items: recurring });
  if (unscheduled.length) groups.push({ label: "Tanpa jadwal", items: unscheduled });
  return groups;
}

export default function ReminderListView({ reminders, loading, error }) {
  const groups = groupReminders(reminders);

  return (
    <Card className="bg-paper shadow-sticker-lg flex h-[36rem] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b-[2.5px] border-line px-5 py-3.5">
        <div>
          <div className="font-display text-xl">Reminder aktif</div>
          <div className="mt-0.5 text-[13px] text-neutral-500">
            Jadwal &amp; rutinitas dari chat
          </div>
        </div>
        <Badge color="cream">{reminders.length} AKTIF</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-3 rounded-[13px] border-[2.5px] border-line bg-pink px-3.5 py-2.5 text-[13px] font-medium">
            {error}
          </div>
        )}
        {loading && (
          <p className="animate-pulse font-mono text-[11px] text-neutral-500">Memuat…</p>
        )}
        {!loading && !error && groups.length === 0 && (
          <p className="text-[14.5px] font-medium text-neutral-500">
            Belum ada reminder aktif. Coba minta lewat chat di samping!
          </p>
        )}

        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            {/* header grup mengikuti header tabel Recent transactions (Finance) */}
            <div className="border-b-[2.5px] border-line pb-2 font-mono text-[11px] font-bold tracking-wide text-neutral-400 uppercase">
              {group.label}
            </div>
            <ul className="m-0 list-none p-0">
              {group.items.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Pola baris mengikuti list transaksi FinanceManager: meta font-mono,
// judul font-semibold, Badge kategori berwarna aksen modul, divider sand.
function ReminderRow({ reminder }) {
  const recurrence = recurrenceLabel(reminder);
  const accent = CATEGORY_ACCENTS[reminder.category] || CATEGORY_ACCENTS.general;
  return (
    <li className="flex items-center gap-3 border-b border-sand py-3">
      <div className="w-[52px] shrink-0 font-mono text-[12.5px] text-neutral-500">
        {reminder.scheduled_at ? timeFmt.format(new Date(reminder.scheduled_at)) : "—"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{reminder.title}</div>
        {(recurrence || reminder.description) && (
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-neutral-500">
            {recurrence && (
              <span className="inline-flex items-center gap-1">
                <RepeatIcon /> {recurrence}
              </span>
            )}
            {reminder.description && <span className="truncate">{reminder.description}</span>}
          </div>
        )}
      </div>
      <Badge color={accent} className="whitespace-nowrap">
        {CATEGORY_LABELS[reminder.category] || reminder.category}
      </Badge>
    </li>
  );
}

function RepeatIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

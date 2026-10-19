import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card } from "../../../components/primitives.jsx";
import { fetchCalendar, patchReminder } from "../api.js";

// Aksen kategori = aksen modul Karsa (sama dengan ReminderListView)
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

const DAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const WEEK_HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 05:00–22:00

const monthTitleFmt = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const dayTitleFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

const pad2 = (n) => String(n).padStart(2, "0");
const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toMonthKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

/** Senin pada minggu yang memuat tanggal d (kalender ISO, Senin dulu). */
function mondayOf(d) {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

/** 42 sel (6 minggu) month view, mulai Senin sebelum/awal bulan. */
function monthCells(anchor) {
  const start = mondayOf(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function weekDays(anchor) {
  const start = mondayOf(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** value untuk <input type="datetime-local"> dari ISO string (waktu lokal). */
function toLocalInputValue(iso) {
  const d = new Date(iso);
  return `${toDateKey(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function CalendarView({ dataVersion, onChanged }) {
  const [view, setView] = useState("month"); // "month" | "week"
  const [anchor, setAnchor] = useState(() => new Date());
  const [byMonth, setByMonth] = useState({}); // "YYYY-MM" -> occurrences[]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // "YYYY-MM-DD"
  const cacheRef = useRef({});

  // Bulan yang perlu dimuat: month view = 1; week view bisa lintas bulan
  const neededMonths = useMemo(() => {
    const keys = view === "month"
      ? [toMonthKey(anchor)]
      : weekDays(anchor).map(toMonthKey);
    return [...new Set(keys)];
  }, [view, anchor]);

  const loadMonths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const missing = neededMonths.filter((k) => !cacheRef.current[k]);
      const results = await Promise.all(missing.map((k) => fetchCalendar(k)));
      results.forEach((res, i) => {
        cacheRef.current[missing[i]] = res.occurrences;
      });
      setByMonth({ ...cacheRef.current });
    } catch (err) {
      setError(`Gagal memuat kalender: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [neededMonths]);

  // dataVersion naik = ada perubahan data (chat/edit) -> buang cache, muat ulang
  useEffect(() => {
    cacheRef.current = {};
    setByMonth({});
    loadMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  const occByDate = useMemo(() => {
    const map = {};
    for (const key of neededMonths) {
      for (const occ of byMonth[key] || []) {
        (map[occ.date] ||= []).push(occ);
      }
    }
    return map;
  }, [byMonth, neededMonths]);

  function shift(direction) {
    setAnchor((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(next.getMonth() + direction, 1);
      else next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }

  async function applyPatch(reminderId, fields) {
    await patchReminder(reminderId, fields);
    onChanged(); // refresh list/pending + bump dataVersion -> kalender refetch
  }

  const todayKey = toDateKey(new Date());
  const title =
    view === "month"
      ? monthTitleFmt.format(anchor)
      : weekRangeLabel(weekDays(anchor));

  return (
    <Card className="bg-paper shadow-sticker-lg overflow-hidden">
      {/* toolbar: judul + nav + toggle view */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[2.5px] border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl capitalize">{title}</span>
          {loading && (
            <span className="animate-pulse font-mono text-[11px] text-neutral-500">
              memuat…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NavButton onClick={() => shift(-1)} label="‹" />
          <button
            onClick={() => setAnchor(new Date())}
            className="cursor-pointer rounded-[10px] border-[2.5px] border-line bg-cream px-3 py-1.5 text-[12px] font-bold shadow-sticker-sm transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Hari ini
          </button>
          <NavButton onClick={() => shift(1)} label="›" />
          <div className="ml-2 flex overflow-hidden rounded-[10px] border-[2.5px] border-line">
            {["month", "week"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`cursor-pointer px-3 py-1.5 font-mono text-[11px] font-bold uppercase ${
                  view === v ? "bg-lilac" : "bg-paper text-neutral-400"
                }`}
              >
                {v === "month" ? "Bulan" : "Minggu"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 rounded-[13px] border-[2.5px] border-line bg-pink px-3.5 py-2.5 text-[13px] font-medium">
          {error}
        </div>
      )}

      {view === "month" ? (
        <MonthGrid
          anchor={anchor}
          occByDate={occByDate}
          todayKey={todayKey}
          onPickDate={setSelectedDate}
        />
      ) : (
        <WeekGrid
          anchor={anchor}
          occByDate={occByDate}
          todayKey={todayKey}
          onPickDate={setSelectedDate}
        />
      )}

      {selectedDate && (
        <DayPanel
          dateKey={selectedDate}
          occurrences={occByDate[selectedDate] || []}
          onClose={() => setSelectedDate(null)}
          onPatch={applyPatch}
        />
      )}
    </Card>
  );
}

function NavButton({ onClick, label }) {
  // pola tombol kecil Stepper di HealthManager
  return (
    <button
      onClick={onClick}
      className="h-[34px] w-[34px] cursor-pointer rounded-[10px] border-[2.5px] border-line bg-paper font-display text-[18px] leading-none shadow-sticker-sm transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
    >
      {label}
    </button>
  );
}

function weekRangeLabel(days) {
  const opts = { day: "numeric", month: "short" };
  const first = days[0].toLocaleDateString("id-ID", opts);
  const last = days[6].toLocaleDateString("id-ID", { ...opts, year: "numeric" });
  return `${first} – ${last}`;
}

/* ------------------------------------------------------------------------ */
/* Month view                                                                */
/* ------------------------------------------------------------------------ */

function MonthGrid({ anchor, occByDate, todayKey, onPickDate }) {
  const cells = monthCells(anchor);
  const month = anchor.getMonth();
  return (
    <div className="p-4">
      <div className="grid grid-cols-7">
        {DAY_SHORT.map((d) => (
          <div
            key={d}
            className="border-b-[2.5px] border-line pb-2 text-center font-mono text-[11px] font-bold tracking-wide text-neutral-400 uppercase"
          >
            {d}
          </div>
        ))}
        {cells.map((d) => {
          const key = toDateKey(d);
          const occs = occByDate[key] || [];
          const inMonth = d.getMonth() === month;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              onClick={() => onPickDate(key)}
              className={`min-h-[76px] cursor-pointer border-b border-sand p-1.5 text-left align-top transition hover:bg-cream ${
                inMonth ? "" : "opacity-35"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px] font-bold ${
                  isToday ? "border-2 border-line bg-yellow" : ""
                }`}
              >
                {d.getDate()}
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {occs.slice(0, 3).map((o, i) => (
                  <span
                    key={`${o.reminder_id}-${i}`}
                    title={o.title}
                    className={`h-2.5 w-2.5 rounded-full border-[1.5px] border-line bg-${
                      CATEGORY_ACCENTS[o.category] || "lilac"
                    }`}
                  />
                ))}
                {occs.length > 3 && (
                  <span className="font-mono text-[10px] font-bold text-neutral-500">
                    +{occs.length - 3} lagi
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Week view                                                                 */
/* ------------------------------------------------------------------------ */

function WeekGrid({ anchor, occByDate, todayKey, onPickDate }) {
  const days = weekDays(anchor);
  return (
    <div className="max-h-[34rem] overflow-y-auto p-4">
      <div className="grid grid-cols-[48px_repeat(7,1fr)]">
        <div />
        {days.map((d) => {
          const key = toDateKey(d);
          return (
            <button
              key={key}
              onClick={() => onPickDate(key)}
              className="cursor-pointer border-b-[2.5px] border-line pb-2 text-center hover:bg-cream"
            >
              <div className="font-mono text-[11px] font-bold tracking-wide text-neutral-400 uppercase">
                {DAY_SHORT[(d.getDay() + 6) % 7]}
              </div>
              <span
                className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px] font-bold ${
                  key === todayKey ? "border-2 border-line bg-yellow" : ""
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}

        {WEEK_HOURS.map((hour) => (
          <HourRow
            key={hour}
            hour={hour}
            days={days}
            occByDate={occByDate}
            onPickDate={onPickDate}
          />
        ))}
      </div>
    </div>
  );
}

function HourRow({ hour, days, occByDate, onPickDate }) {
  return (
    <>
      <div className="border-b border-sand py-1 pr-2 text-right font-mono text-[10px] text-neutral-400">
        {pad2(hour)}:00
      </div>
      {days.map((d) => {
        const key = toDateKey(d);
        const occs = (occByDate[key] || []).filter(
          (o) => new Date(o.scheduled_at).getHours() === hour
        );
        return (
          <div key={key} className="min-h-[34px] space-y-1 border-b border-sand p-0.5">
            {occs.map((o, i) => (
              <button
                key={`${o.reminder_id}-${i}`}
                onClick={() => onPickDate(key)}
                title={`${o.title} · ${timeFmt.format(new Date(o.scheduled_at))}`}
                className={`block w-full cursor-pointer truncate rounded-[7px] border-2 border-line px-1.5 py-0.5 text-left text-[10.5px] font-bold bg-${
                  CATEGORY_ACCENTS[o.category] || "lilac"
                }`}
              >
                {o.title}
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Panel detail per tanggal + edit/selesai/hapus                             */
/* ------------------------------------------------------------------------ */

function DayPanel({ dateKey, occurrences, onClose, onPatch }) {
  const [editing, setEditing] = useState(null); // occurrence yang sedang diedit
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const dateLabel = dayTitleFmt.format(new Date(`${dateKey}T00:00:00`));

  async function run(reminderId, fields) {
    setBusyId(reminderId);
    setError(null);
    try {
      await onPatch(reminderId, fields);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <Card
        className="max-h-[85vh] w-[440px] overflow-y-auto bg-paper p-5 shadow-sticker-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="font-display text-[19px] leading-tight">{dateLabel}</div>
          <button
            onClick={onClose}
            className="h-[30px] w-[30px] shrink-0 cursor-pointer rounded-[9px] border-[2.5px] border-line bg-cream font-display text-[14px] leading-none shadow-sticker-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-[10px] border-2 border-line bg-pink px-2.5 py-1.5 text-[12px] font-medium">
            {error}
          </div>
        )}

        {occurrences.length === 0 && (
          <p className="text-[14px] font-medium text-neutral-500">
            Tidak ada reminder di tanggal ini.
          </p>
        )}

        <ul className="m-0 list-none space-y-3 p-0">
          {occurrences.map((o, i) => (
            <li
              key={`${o.reminder_id}-${i}`}
              className="rounded-[13px] border-[2.5px] border-line bg-cream p-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[12.5px] text-neutral-500">
                  {timeFmt.format(new Date(o.scheduled_at))}
                </span>
                <span className="flex-1 truncate text-sm font-semibold">{o.title}</span>
                <Badge color={CATEGORY_ACCENTS[o.category] || "lilac"}>
                  {CATEGORY_LABELS[o.category] || o.category}
                </Badge>
              </div>
              {o.recurrence !== "none" && (
                <div className="mt-1 font-mono text-[10.5px] text-neutral-500">
                  ↻ berulang ({o.recurrence}) · status {o.status}
                </div>
              )}

              {editing?.reminder_id === o.reminder_id ? (
                <EditForm
                  occurrence={o}
                  busy={busyId === o.reminder_id}
                  onCancel={() => setEditing(null)}
                  onSave={async (fields) => {
                    await run(o.reminder_id, fields);
                    setEditing(null);
                  }}
                />
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <SmallButton color="bg-yellow" onClick={() => setEditing(o)}>
                    ✎ Edit
                  </SmallButton>
                  <SmallButton
                    color="bg-green"
                    disabled={busyId === o.reminder_id}
                    onClick={() => run(o.reminder_id, { status: "done" })}
                  >
                    ✓ Selesai
                  </SmallButton>
                  {confirmDeleteId === o.reminder_id ? (
                    <SmallButton
                      color="bg-pink"
                      disabled={busyId === o.reminder_id}
                      onClick={() => run(o.reminder_id, { status: "cancelled" })}
                    >
                      {o.recurrence !== "none"
                        ? "Yakin? Semua jadwal berulang ikut terhapus"
                        : "Yakin hapus?"}
                    </SmallButton>
                  ) : (
                    <SmallButton
                      color="bg-pink"
                      onClick={() => setConfirmDeleteId(o.reminder_id)}
                    >
                      ✕ Hapus
                    </SmallButton>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// Tombol aksi kecil — pola tombol Stepper HealthManager (bukan Button penuh,
// supaya muat tiga sejajar di panel sempit)
function SmallButton({ color, disabled, onClick, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-[10px] border-[2.5px] border-line px-2.5 py-1.5 text-[12px] font-bold shadow-sticker-sm transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 ${color}`}
    >
      {children}
    </button>
  );
}

function EditForm({ occurrence, busy, onCancel, onSave }) {
  const [title, setTitle] = useState(occurrence.title);
  const [when, setWhen] = useState(toLocalInputValue(occurrence.scheduled_at));
  const [category, setCategory] = useState(occurrence.category);
  const [recurrence, setRecurrence] = useState(occurrence.recurrence);
  const [days, setDays] = useState(occurrence.recurrence_days || []);

  const inputCls =
    "w-full rounded-[10px] border-[2.5px] border-line bg-paper px-3 py-2 font-sans text-sm outline-none";

  function toggleDay(d) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  function handleSave() {
    const fields = {
      title: title.trim(),
      scheduled_at: new Date(when).toISOString(),
      category,
      recurrence,
      recurrence_days: recurrence === "weekly" && days.length ? days : null,
    };
    onSave(fields);
  }

  return (
    <div className="mt-2.5 space-y-2.5 border-t-2 border-dashed border-line pt-2.5">
      {occurrence.recurrence !== "none" && (
        <div className="rounded-[10px] border-2 border-line bg-yellow px-2.5 py-1.5 font-mono text-[10.5px] font-bold">
          ⚠ PERUBAHAN BERLAKU UNTUK SEMUA JADWAL BERULANG RANGKAIAN INI
        </div>
      )}
      <label className="block">
        <span className="font-mono text-[10.5px] font-bold text-neutral-500">JUDUL</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </label>
      <label className="block">
        <span className="font-mono text-[10.5px] font-bold text-neutral-500">WAKTU</span>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={inputCls}
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="font-mono text-[10.5px] font-bold text-neutral-500">KATEGORI</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {Object.keys(CATEGORY_LABELS).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10.5px] font-bold text-neutral-500">RECURRENCE</span>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className={inputCls}
          >
            <option value="none">Sekali</option>
            <option value="daily">Tiap hari</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
        </label>
      </div>
      {recurrence === "weekly" && (
        <div className="flex flex-wrap gap-1.5">
          {DAY_SHORT.map((label, i) => {
            const d = i + 1; // ISO: 1=Senin
            const active = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`cursor-pointer rounded-full border-2 border-line px-2.5 py-[3px] font-mono text-[10.5px] font-bold ${
                  active ? "bg-blue shadow-sticker-sm" : "bg-paper text-neutral-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2.5 pt-1">
        <Button
          color="green"
          disabled={busy || !title.trim() || !when}
          onClick={handleSave}
          className="flex-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Simpan
        </Button>
        <Button color="pink" disabled={busy} onClick={onCancel} className="flex-1">
          Batal
        </Button>
      </div>
    </div>
  );
}

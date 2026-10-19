import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "../../../components/primitives.jsx";
import { confirmAction, fetchHistory, sendChat } from "../api.js";

let nextId = 1;
const msgId = () => `local-${nextId++}`;

const HISTORY_PAGE = 50;

const WELCOME = {
  id: "welcome",
  role: "assistant",
  text:
    "Halo! Aku Karsa. Ceritakan aja mau diingatkan soal apa — " +
    'misal "besok olahraga jam 6 pagi" atau "tiap senin rabu jumat les jam 4 sore".',
  confirmables: [],
};

// Row chat_logs dari GET /history -> bentuk message internal ChatPanel.
// createdAt disimpan untuk dipakai sebagai cursor "load more".
function fromHistoryRow(row) {
  return {
    id: row.id,
    role: row.role,
    text: row.message,
    createdAt: row.created_at,
    confirmables: [],
  };
}

export default function ChatPanel({ onDataChanged }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // loading terpisah: initial mengganti isi panel, loadMore hanya tombolnya
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const didInitRef = useRef(false); // guard double-mount StrictMode (dev)
  const stickToBottomRef = useRef(true);
  const scrollAdjustRef = useRef(null); // jarak-dari-bawah saat prepend history

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    (async () => {
      try {
        const res = await fetchHistory({ limit: HISTORY_PAGE });
        const history = res.messages.map(fromHistoryRow);
        setMessages(history.length ? history : [WELCOME]);
        setHasMore(res.has_more);
      } catch (err) {
        setMessages([
          WELCOME,
          {
            id: msgId(),
            role: "assistant",
            text: `Gagal memuat riwayat: ${err.message}`,
            error: true,
            confirmables: [],
          },
        ]);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // Saat prepend history lama: pertahankan posisi baca (jarak dari bawah tetap)
  useLayoutEffect(() => {
    if (scrollAdjustRef.current !== null && listRef.current) {
      const el = listRef.current;
      el.scrollTop = el.scrollHeight - scrollAdjustRef.current;
      scrollAdjustRef.current = null;
    }
  }, [messages]);

  // Auto-scroll ke bawah untuk initial load & pesan baru — bukan saat load more
  useEffect(() => {
    if (stickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    stickToBottomRef.current = true;
  }, [messages, busy]);

  function push(message) {
    setMessages((prev) => [...prev, { confirmables: [], ...message, id: msgId() }]);
  }

  async function handleLoadMore() {
    if (loadingMore) return;
    const oldest = messages.find((m) => m.createdAt);
    if (!oldest) return;

    setLoadingMore(true);
    try {
      const res = await fetchHistory({
        limit: HISTORY_PAGE,
        before: oldest.createdAt,
      });
      const older = res.messages.map(fromHistoryRow);
      if (listRef.current) {
        const el = listRef.current;
        scrollAdjustRef.current = el.scrollHeight - el.scrollTop;
      }
      stickToBottomRef.current = false;
      setMessages((prev) => [...older, ...prev]);
      setHasMore(res.has_more);
    } catch (err) {
      push({
        role: "assistant",
        text: `Gagal memuat chat lama: ${err.message}`,
        error: true,
      });
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    push({ role: "user", text });
    setBusy(true);
    try {
      const res = await sendChat(text);
      // Action yang sudah masuk staging → tampilkan tombol konfirmasi inline
      const confirmables = (res.actions || [])
        .filter((a) => a.pending_action_id)
        .map((a) => ({
          pendingActionId: a.pending_action_id,
          confirmationText: a.confirmation_text,
          resolved: null,
        }));
      push({ role: "assistant", text: res.reply_text, confirmables });
      // "ya"/"gajadi" via chat juga mengubah data → refresh list & badge
      if (res.intent === "confirm" || res.intent === "reject") onDataChanged();
    } catch (err) {
      push({ role: "assistant", text: `Waduh, ada masalah: ${err.message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(messageId, pendingActionId, decision) {
    try {
      const res = await confirmAction(pendingActionId, decision);
      setMessages((prev) =>
        prev.map((m) =>
          m.id !== messageId
            ? m
            : {
                ...m,
                confirmables: m.confirmables.map((c) =>
                  c.pendingActionId === pendingActionId
                    ? { ...c, resolved: res.status }
                    : c
                ),
              }
        )
      );
      push({ role: "assistant", text: res.reply_text });
      onDataChanged();
    } catch (err) {
      push({ role: "assistant", text: `Gagal memproses: ${err.message}`, error: true });
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Card className="bg-paper shadow-sticker-lg flex h-[36rem] flex-col overflow-hidden">
      {/* header ala AITip: chip bot ink + badge KARSA AI + judul display */}
      <div className="flex items-center gap-2.5 border-b-[2.5px] border-line bg-lilac px-5 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border-[2.5px] border-line bg-ink text-white">
          <BotIcon />
        </div>
        <Badge color="ink" className="!text-white">KARSA AI</Badge>
        <span className="font-display text-[17px]">Chat Planner</span>
      </div>

      <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto p-4">
        {initialLoading ? (
          <p className="animate-pulse font-mono text-[11px] text-neutral-500">
            Memuat riwayat chat…
          </p>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="cursor-pointer rounded-full border-2 border-line bg-cream px-3 py-[3px] font-mono text-[10.5px] font-bold shadow-sticker-sm transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-40"
                >
                  {loadingMore ? "MEMUAT…" : "↑ MUAT PERCAKAPAN SEBELUMNYA"}
                </button>
              </div>
            )}
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} onDecision={handleDecision} />
            ))}
            {busy && (
              <p className="animate-pulse font-mono text-[11px] text-neutral-500">
                Karsa lagi mikir…
              </p>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2.5 border-t-[2.5px] border-line bg-paper p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder='Tulis di sini… (Enter untuk kirim, contoh: "besok olahraga jam 6 pagi")'
          className="flex-1 resize-none rounded-xl border-[2.5px] border-line bg-cream px-3.5 py-2.5 font-sans text-[14.5px] outline-none placeholder:text-neutral-400"
        />
        <Button
          color="lilac"
          onClick={handleSend}
          disabled={busy || !input.trim()}
          className="disabled:cursor-not-allowed disabled:opacity-40"
        >
          Kirim
        </Button>
      </div>
    </Card>
  );
}

function ChatBubble({ message, onDecision }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[15px] rounded-br-md border-[2.5px] border-line bg-lilac px-3.5 py-2.5 text-[14.5px] font-medium whitespace-pre-wrap shadow-sticker-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-[2.5px] border-line bg-ink text-white">
        <BotIcon size={16} />
      </div>
      <div className="max-w-[85%]">
        <div
          className={`rounded-[15px] rounded-tl-md border-[2.5px] border-line px-3.5 py-2.5 text-[14.5px] font-medium whitespace-pre-wrap ${
            message.error ? "bg-pink" : "bg-cream"
          }`}
        >
          {message.text}
        </div>

        {message.confirmables.map((c) => (
          <div
            key={c.pendingActionId}
            className="mt-2.5 rounded-[13px] border-[2.5px] border-line bg-paper p-3 shadow-sticker-sm"
          >
            {c.confirmationText && (
              <p className="m-0 mb-2.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-400">
                {c.confirmationText}
              </p>
            )}
            {c.resolved === null ? (
              <div className="flex gap-2.5">
                <Button
                  color="green"
                  onClick={() => onDecision(message.id, c.pendingActionId, "confirm")}
                >
                  Ya, simpan
                </Button>
                <Button
                  color="pink"
                  onClick={() => onDecision(message.id, c.pendingActionId, "reject")}
                >
                  Batal
                </Button>
              </div>
            ) : c.resolved === "confirmed" ? (
              <Badge color="green">✓ TERSIMPAN</Badge>
            ) : (
              <Badge color="pink">✗ DIBATALKAN</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BotIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 8V5" />
      <circle cx="12" cy="3.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.5 16.5h5" />
    </svg>
  );
}

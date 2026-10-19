import { useState } from "react";
import { Badge, Button, Card } from "../../../components/primitives.jsx";
import { confirmAction } from "../api.js";

/**
 * Badge jumlah pending_actions yang masih waiting_confirmation.
 * Pola visual mengikuti tombol notifikasi lonceng di Header Karsa
 * (PERSONAL ASSISTANT/src/layout/Header.jsx): kotak aksen + dot pink
 * bulat ber-border dengan angka font-mono.
 */
export default function PendingActionsIndicator({ pending, onDataChanged }) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [errorText, setErrorText] = useState(null);

  if (pending.length === 0) return null;

  async function handleDecision(pendingActionId, decision) {
    setBusyId(pendingActionId);
    setErrorText(null);
    try {
      await confirmAction(pendingActionId, decision);
      onDataChanged();
    } catch (err) {
      setErrorText(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Konfirmasi yang belum dijawab"
        className="relative flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] border-3 border-line bg-lilac text-ink shadow-sticker transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <BellIcon />
        <span className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[2.5px] border-line bg-pink font-mono text-[10px] font-bold text-ink">
          {pending.length}
        </span>
      </button>

      {open && (
        <Card className="absolute right-0 z-10 mt-3 w-80 bg-paper p-4 shadow-sticker-lg">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-display text-[17px]">Menunggu konfirmasi</span>
            <Badge color="pink">{pending.length}</Badge>
          </div>
          {errorText && (
            <div className="mb-2.5 rounded-[10px] border-2 border-line bg-pink px-2.5 py-1.5 text-[12px] font-medium">
              {errorText}
            </div>
          )}
          <ul className="m-0 max-h-72 list-none space-y-2.5 overflow-y-auto p-0">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-[13px] border-[2.5px] border-line bg-cream p-3"
              >
                <p className="m-0 mb-2.5 text-[13px] font-medium">
                  {p.confirmation_text || p.payload?.title || p.action_type}
                </p>
                <div className="flex gap-2">
                  <Button
                    color="green"
                    disabled={busyId === p.id}
                    onClick={() => handleDecision(p.id, "confirm")}
                    className="flex-1 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ya, simpan
                  </Button>
                  <Button
                    color="pink"
                    disabled={busyId === p.id}
                    onClick={() => handleDecision(p.id, "reject")}
                    className="flex-1 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Batal
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

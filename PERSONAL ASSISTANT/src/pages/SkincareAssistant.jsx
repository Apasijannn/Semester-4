import { useState } from "react";
import { Icon } from "../components/icons.jsx";
import { Card, Button, Badge } from "../components/primitives.jsx";
import { PageTitle } from "../layout/Layout.jsx";

const CONSULTS = [
  ["Jul 02","Barrier repair check-in","Dryness","pink","Switched AM to cream cleanser. Redness improving."],
  ["Jun 24","Niacinamide introduced","Redness","blue","Added 5% niacinamide serum, PM only."],
  ["Jun 15","Routine reset","Breakouts","yellow","Cut back actives to 2×/week to calm skin."],
  ["Jun 03","First consultation","Baseline","green","Combination skin, mild sensitivity noted."]
];

export function SkincareAssistant() {
  const [chat, setChat] = useState([
    { role:"ai", text:"Hi Maya! I'm your skincare assistant. How's your skin feeling today?" },
    { role:"user", text:"A bit dry around my cheeks, and some redness after cleansing." },
    { role:"ai", text:"Dryness plus post-cleanse redness often points to a barrier that needs gentler care. Are you using a foaming cleanser right now?" },
    { role:"user", text:"Yes, a foaming one twice a day." },
    { role:"ai", text:"That's likely stripping your skin. Try a cream cleanser in the morning, keep foaming to PM only, and layer a niacinamide serum before moisturiser. Want me to set an evening reminder?" }
  ]);
  const [draft, setDraft] = useState("");
  const send = () => {
    const t = draft.trim(); if (!t) return;
    setChat((c) => [...c, { role:"user", text:t }]); setDraft("");
    setTimeout(() => setChat((c) => [...c, { role:"ai", text:"Got it — I'll factor that in. Consistency matters most, so let's keep your routine simple and track how your skin responds over the next week." }]), 700);
  };
  return (
    <>
      <PageTitle title="Skincare Assistant" subtitle="Chat about your routine — I remember your past consultations.">
        <div className="flex gap-4 shrink-0"><Icon name="drop" size={30} /><Icon name="drop" size={30} /></div>
      </PageTitle>

      <div className="grid grid-cols-[280px_1fr] gap-5 items-stretch">
        <Card as="aside" className="bg-paper shadow-sticker-lg p-[18px] flex flex-col gap-3.5">
          <div className="font-display text-[17px]">Skin history</div>
          {CONSULTS.map(([date,title,tag,bg,note]) => (
            <Card key={title} className="bg-cream text-ink shadow-sticker-sm p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5"><span className="font-mono text-[11px] font-bold text-neutral-400">{date}</span><Badge color={bg} className="!text-[9.5px]">{tag}</Badge></div>
              <div className="font-bold text-[13.5px] leading-tight">{title}</div>
              <div className="text-[12px] text-neutral-500 mt-1 leading-snug">{note}</div>
            </Card>
          ))}
        </Card>

        <Card className="bg-pink shadow-sticker-lg overflow-hidden flex flex-col h-[560px] p-0">
          <div className="flex items-center gap-3 px-[18px] py-3.5 border-b-3 border-line bg-paper">
            <div className="w-10 h-10 bg-ink rounded-[11px] flex items-center justify-center"><Icon name="bot" size={21} sw={2.2} stroke="#F9C2D6" /></div>
            <div className="leading-tight"><div className="font-display text-[15px]">Karsa Assistant</div><div className="flex items-center gap-1.5 text-[11.5px] text-neutral-500 font-semibold"><span className="w-2 h-2 rounded-full bg-green-600 border-[1.5px] border-line" />Online</div></div>
          </div>
          <div className="flex-1 overflow-y-auto p-[18px] flex flex-col gap-4">
            {chat.map((m,i) => {
              const u = m.role === "user";
              return (
                <div key={i} className={`flex ${u ? "justify-end" : "justify-start"}`}>
                  <div>
                    <div className={`font-mono text-[9.5px] font-bold mb-1.5 ${u ? "text-right text-pink-900" : "text-neutral-500"}`}>{u ? "YOU" : "KARSA AI"}</div>
                    <div className={`max-w-[74ch] px-4 py-3 border-3 border-line rounded-2xl shadow-sticker text-[14.5px] leading-snug font-medium ${u ? "bg-pink text-ink rounded-br-[5px]" : "bg-paper rounded-bl-[5px]"}`}>{m.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-t-3 border-line bg-paper">
            <input value={draft} onChange={(e)=>setDraft(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
              placeholder="Ask about your routine…" className="flex-1 border-3 border-line rounded-[13px] px-4 py-3 font-sans text-[14.5px] outline-none bg-cream text-ink" />
            <Button color="pink" onClick={send} className="shrink-0">Send <Icon name="send" size={17} sw={2.6} /></Button>
          </div>
        </Card>
      </div>
    </>
  );
}

import { useState } from "react";
import { Icon, Star } from "../components/icons.jsx";
import { Card, Button, Badge } from "../components/primitives.jsx";
import { PageTitle } from "../layout/Layout.jsx";

const PRIO_BG = { High: "pink", Medium: "yellow", Low: "green" };
const TASKS = [
  { id:"t1", title:"Submit Data Structures Assignment", due:"Due today · Jul 6", priority:"High", diff:4, source:"myITS Classroom" },
  { id:"t2", title:"Weekly grocery budget review", due:"Tomorrow · Jul 7", priority:"Medium", diff:2, source:"Finance Manager" },
  { id:"t3", title:"Read Chapter 5 — Algorithms", due:"Wed · Jul 8", priority:"Medium", diff:3, source:"myITS Classroom" },
  { id:"t4", title:"Book dermatologist appointment", due:"Thu · Jul 9", priority:"Low", diff:1, source:"Skincare Assistant" },
  { id:"t5", title:"Prepare project presentation slides", due:"Fri · Jul 10", priority:"High", diff:5, source:"Team Project" }
];
const DEADLINES = { 6:"pink", 7:"yellow", 8:"yellow", 9:"green", 10:"pink" };

function CalendarGrid({ mini }) {
  const cells = [];
  for (let i = 0; i < 3; i++) cells.push(null);
  for (let d = 1; d <= 31; d++) cells.push(d);
  return (
    <div className={`grid grid-cols-7 ${mini ? "gap-0.5" : "gap-2"}`}>
      {cells.map((d, i) => {
        if (!d) return <div key={i} />;
        const dc = DEADLINES[d], today = d === 6;
        if (mini) return (
          <div key={i} className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-semibold ${today ? "bg-blue border-2 border-line text-ink" : ""}`}>
            {d}{dc && <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-${dc} border border-line`} />}
          </div>
        );
        return (
          <div key={i} className={`min-h-[66px] border-[2.5px] border-line rounded-[11px] px-2 py-1.5 ${today ? "bg-blue text-ink" : "bg-paper"}`}>
            <span className="font-sans font-bold text-sm">{d}</span>
            {dc && <span className={`block mt-1.5 h-1.5 rounded-md bg-${dc} border-[1.5px] border-line`} />}
          </div>
        );
      })}
    </div>
  );
}

export function TaskManager() {
  const [done, setDone] = useState({});
  const [view, setView] = useState("List");
  const open = TASKS.filter((t) => !done[t.id]).length;
  const tog = (id) => setDone((s) => ({ ...s, [id]: !s[id] }));
  const WD = ["S","M","T","W","T","F","S"];
  return (
    <>
      <PageTitle title="Task Manager" subtitle={<>You have <b>{open}</b> open tasks · 2 due today.</>}>
        <div className="flex items-center gap-3.5">
          <div className="flex gap-1 bg-paper border-3 border-line rounded-[14px] shadow-sticker p-1">
            {["List","Calendar"].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`font-sans font-bold text-sm px-[18px] py-2 rounded-[10px] cursor-pointer border-[2.5px] ${view===v ? "bg-blue border-line shadow-sticker-sm text-ink" : "bg-transparent border-transparent text-neutral-500"}`}>{v}</button>
            ))}
          </div>
          <Button color="blue"><Icon name="plus" size={18} sw={3} /> Add Task</Button>
        </div>
      </PageTitle>

      {view === "List" ? (
        <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
          <div className="flex flex-col gap-4">
            {TASKS.map((t) => {
              const d = done[t.id];
              return (
                <Card key={t.id} className="bg-paper shadow-sticker-lg p-4 flex items-center gap-4">
                  <div className={`w-2 self-stretch rounded-md border-2 border-line bg-${PRIO_BG[t.priority]}`} />
                  <button onClick={() => tog(t.id)}
                    className={`shrink-0 w-7 h-7 border-[2.5px] border-line rounded-lg cursor-pointer flex items-center justify-center shadow-sticker-sm ${d ? "bg-ink" : "bg-white"}`}>
                    {d && <Icon name="check2" size={16} sw={3.2} stroke="#fff" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <Badge color={PRIO_BG[t.priority]}>{t.priority.toUpperCase()}</Badge>
                      <Badge color="cream">{t.source}</Badge>
                    </div>
                    <h3 className={`m-0 font-display text-[17px] tracking-tight ${d ? "line-through text-neutral-400" : ""}`}>{t.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[13px] text-neutral-500 font-semibold">
                      <Icon name="clock" size={15} sw={2.4} stroke="#5a5a5a" />{t.due}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-mono font-bold text-neutral-400 mb-1.5">DIFFICULTY {t.diff}/5</div>
                    <div className="flex gap-0.5 justify-end">{[1,2,3,4,5].map((n) => <Star key={n} filled={n<=t.diff} />)}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card as="aside" className="bg-paper shadow-sticker-lg p-[18px]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-[17px]">July 2026</span>
              <div className="flex gap-1.5">
                {["chevL","chevR"].map((c) => <div key={c} className="w-[26px] h-[26px] border-[2.5px] border-line rounded-lg flex items-center justify-center"><Icon name={c} size={13} sw={3} /></div>)}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">{WD.map((w,i) => <div key={i} className="text-center font-mono text-[10px] font-bold text-neutral-400">{w}</div>)}</div>
            <CalendarGrid mini />
            <div className="border-t-[2.5px] border-line my-4" />
            <div className="font-mono text-[11px] font-bold text-neutral-400 mb-2.5">UPCOMING DEADLINES</div>
            <div className="flex flex-col gap-2.5">
              {[["06","JUL","Data Structures Assignment","pink"],["07","JUL","Grocery budget review","yellow"],["10","JUL","Presentation slides","pink"]].map(([d,m,l,c]) => (
                <div key={d+l} className="flex items-center gap-3">
                  <div className="shrink-0 w-[42px] text-center bg-cream text-ink border-[2.5px] border-line rounded-[10px] py-1"><div className="font-display text-base leading-none">{d}</div><div className="font-mono text-[8.5px]">{m}</div></div>
                  <div className="flex items-center gap-2 text-[13px] font-semibold leading-tight"><span className={`shrink-0 w-2.5 h-2.5 rounded-full border-2 border-line bg-${c}`} />{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-paper shadow-sticker-lg p-[22px]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-2xl">July 2026</span>
            <div className="flex items-center gap-3.5 text-xs font-mono font-bold">
              {[["High","pink"],["Med","yellow"],["Low","green"]].map(([l,c]) => <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-[3px] border-2 border-line bg-${c}`} />{l.toUpperCase()}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map((w) => <div key={w} className="text-center font-mono text-xs font-bold text-neutral-400">{w}</div>)}</div>
          <CalendarGrid />
        </Card>
      )}
    </>
  );
}

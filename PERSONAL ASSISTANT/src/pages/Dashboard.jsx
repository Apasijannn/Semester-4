import { Icon } from "../components/icons.jsx";
import { Card } from "../components/primitives.jsx";
import { PageTitle } from "../layout/Layout.jsx";

const SUMMARY = [
  { key: "tasks", bg: "blue", icon: "check", tag: "TODAY", big: <>3<span className="text-[18px] text-[#2c3e46]">/5</span></>, label: "Today's Tasks",
    extra: <div className="h-[9px] bg-cream border-2 border-line rounded-full overflow-hidden"><div className="w-3/5 h-full bg-ink" /></div> },
  { key: "spend", bg: "yellow", icon: "dollar", tag: "WEEK", big: "$284", label: "Weekly Spending",
    extra: <div className="flex items-end gap-1.5 h-[30px]">{[40,70,50,90,60,35,55].map((h,i)=><div key={i} className={`flex-1 rounded-t-[3px] border-line ${i>4?"bg-pink border-[1.5px]":"bg-ink"}`} style={{height:h+"%"}} />)}</div> },
  { key: "skin", bg: "pink", icon: "drop", tag: "PM", big: <span className="text-[27px]">9:00 PM</span>, label: "Skincare Reminder",
    extra: <div className="text-[12.5px] bg-cream border-2 border-line rounded-[10px] px-2.5 py-[7px] font-semibold">Next: Niacinamide serum</div> },
  { key: "health", bg: "green", icon: "activity", tag: "TODAY", big: "7.2k", label: "Health Stats · Steps",
    extra: <div className="flex gap-2">{[["6/8","WATER"],["7.5h","SLEEP"]].map(([a,b])=><div key={b} className="flex-1 bg-cream border-2 border-line rounded-[10px] px-2 py-1.5 text-center"><div className="font-display text-[15px]">{a}</div><div className="text-[10px] font-mono">{b}</div></div>)}</div> }
];

export function Dashboard() {
  return (
    <>
      <PageTitle title="Hello, Maya." subtitle="Here's what your day looks like — Sunday, July 6. You've got 5 tasks and 2 reminders lined up.">
        <Icon name="clock" size={40} className="shrink-0" />
      </PageTitle>

      <div className="grid grid-cols-4 gap-[18px]">
        {SUMMARY.map((c) => (
          <Card key={c.key} className={`bg-${c.bg} shadow-sticker-lg p-[18px] flex flex-col gap-3.5 text-ink`}>
            <div className="flex items-center justify-between">
              <div className="w-[42px] h-[42px] bg-cream border-[2.5px] border-line rounded-xl flex items-center justify-center"><Icon name={c.icon} /></div>
              <span className="font-mono text-[11px] font-bold bg-ink text-white px-2 py-[3px] rounded-full">{c.tag}</span>
            </div>
            <div>
              <div className="font-display text-[38px] leading-none">{c.big}</div>
              <div className="font-bold text-sm mt-1">{c.label}</div>
            </div>
            {c.extra}
          </Card>
        ))}
      </div>

      <div className="mt-1">
        <h2 className="font-display text-[22px] mb-3.5">Quick links</h2>
        <div className="grid grid-cols-4 gap-4">
          {[["Add Task","blue"],["Log Expense","yellow"],["Log Water","green"],["New Note","pink"]].map(([l,bg]) => (
            <button key={l} className={`flex items-center justify-between w-full px-[18px] py-[15px] bg-${bg} text-ink border-3 border-line rounded-[14px] shadow-sticker cursor-pointer font-sans font-bold text-[15px]`}>
              {l}<Icon name="arrow" size={18} sw={2.6} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

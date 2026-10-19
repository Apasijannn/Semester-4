import { Icon } from "../components/icons.jsx";
import { Card, Button, Badge } from "../components/primitives.jsx";
import { AITip } from "../components/AITip.jsx";
import { PageTitle } from "../layout/Layout.jsx";

const CHART = [["Mon",42],["Tue",68],["Wed",31],["Thu",90],["Fri",54],["Sat",76],["Sun",23]];
const CATS = [
  { name:"Food & Drink", amount:"$118", pct:"41%", bg:"yellow", icon:"food" },
  { name:"Transport", amount:"$64", pct:"22%", bg:"blue", icon:"car" },
  { name:"Shopping", amount:"$71", pct:"25%", bg:"pink", icon:"bag" },
  { name:"Bills", amount:"$31", pct:"12%", bg:"green", icon:"receipt" }
];
const TX = [
  ["Jul 05","Warung Bu Sri — lunch","Food & Drink","-$6.20","yellow"],
  ["Jul 05","GoRide to campus","Transport","-$2.10","blue"],
  ["Jul 04","Tokopedia — notebook","Shopping","-$14.90","pink"],
  ["Jul 04","Electricity top-up","Bills","-$9.00","green"],
  ["Jul 03","Kopi Kenangan","Food & Drink","-$3.40","yellow"],
  ["Jul 03","GoPay cashback","Income","+$1.50","green"]
];

export function FinanceManager() {
  const max = 100;
  return (
    <>
      <PageTitle title="Finance Manager" subtitle={<>You've spent <b>$284</b> this week across 4 categories.</>}>
        <Button color="yellow"><Icon name="upload" size={18} sw={2.6} /> Upload PDF <span className="font-mono text-[10px] font-bold bg-ink text-white px-1.5 py-0.5 rounded-full">GoPay</span></Button>
      </PageTitle>

      <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
        <Card className="bg-paper shadow-sticker-lg p-[22px] relative">
          <div className="absolute inset-[7px] border-2 border-dashed border-line rounded-[15px] opacity-30 pointer-events-none" />
          <div className="flex items-end justify-between mb-5 relative">
            <div><div className="font-display text-xl">Spending overview</div><div className="text-[13px] text-neutral-500 mt-0.5">Last 7 days · daily total</div></div>
            <div className="font-display text-[26px]">$284</div>
          </div>
          <div className="flex items-end gap-3.5 h-[180px] relative">
            {CHART.map(([m,v],i) => (
              <div key={m} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="font-mono text-[11px] font-bold">${v}</span>
                <div className={`w-full border-[2.5px] border-line rounded-t-lg shadow-sticker-sm ${i===3?"bg-pink":"bg-yellow"}`} style={{ height: Math.round((v/max)*150)+"px" }} />
                <span className="font-mono text-[11px] text-neutral-500">{m}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <div className="font-display text-lg">By category</div>
          {CATS.map((c) => (
            <Card key={c.name} className="bg-paper shadow-sticker p-3.5 flex items-center gap-3.5">
              <div className={`w-11 h-11 bg-${c.bg} text-ink border-[2.5px] border-line rounded-xl flex items-center justify-center shrink-0`}><Icon name={c.icon} size={22} /></div>
              <div className="flex-1 min-w-0"><div className="font-bold text-[14.5px]">{c.name}</div><div className="text-[11.5px] text-neutral-500 font-mono">{c.pct} of spend</div></div>
              <div className="font-display text-lg">{c.amount}</div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-paper shadow-sticker-lg p-[22px] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-xl">Recent transactions</div>
          <Badge color="cream">imported · GoPay.pdf</Badge>
        </div>
        <div className="grid grid-cols-[90px_1fr_150px_100px] gap-3 px-1 pb-2.5 border-b-[2.5px] border-line font-mono text-[11px] font-bold text-neutral-400">
          <div>DATE</div><div>DESCRIPTION</div><div>CATEGORY</div><div className="text-right">AMOUNT</div>
        </div>
        {TX.map(([date,desc,cat,amt,bg]) => (
          <div key={desc} className="grid grid-cols-[90px_1fr_150px_100px] gap-3 items-center py-3 px-1 border-b border-sand">
            <div className="font-mono text-[12.5px] text-neutral-500">{date}</div>
            <div className="font-semibold text-sm">{desc}</div>
            <div><Badge color={bg} className="whitespace-nowrap">{cat}</Badge></div>
            <div className="text-right"><span className={`font-display text-[15px] ${amt[0]==="+"?"text-green-700 dark:text-green-400":""}`}>{amt}</span></div>
          </div>
        ))}
      </Card>

      <AITip accent="yellow" title="Money tip" action="Set goal">
        Food &amp; Drink is <b>41%</b> of your week — up 12% from last week. Setting a <b>$90 weekly limit</b> would save you around <b>$28/week</b>. Want me to add it as a budget goal?
      </AITip>
    </>
  );
}

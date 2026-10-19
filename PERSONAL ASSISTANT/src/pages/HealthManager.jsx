import { useState } from "react";
import { Icon } from "../components/icons.jsx";
import { Card } from "../components/primitives.jsx";
import { AITip } from "../components/AITip.jsx";
import { PageTitle } from "../layout/Layout.jsx";

function Stepper({ value, unit, dec, inc }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={dec} className="w-[34px] h-[34px] bg-white border-[2.5px] border-line rounded-[10px] shadow-sticker-sm cursor-pointer font-display text-[18px] leading-none">–</button>
      <div className="font-display text-[26px] leading-none">{value}<span className="text-[13px]">{unit}</span></div>
      <button onClick={inc} className="w-[34px] h-[34px] bg-white border-[2.5px] border-line rounded-[10px] shadow-sticker-sm cursor-pointer font-display text-[18px] leading-none">+</button>
    </div>
  );
}

function Face({ mood }) {
  const D = { bad:"M8 16.5c1.2-1.5 6.8-1.5 8 0", meh:"M8.5 15.5h7", good:"M8 14c1.2 1.5 6.8 1.5 8 0", great:"M7.5 13.5c1.5 2.5 7.5 2.5 9 0" };
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" /><circle cx="8.5" cy="10" r="1.1" fill="#1a1a1a" /><circle cx="15.5" cy="10" r="1.1" fill="#1a1a1a" /><path d={D[mood]} />
    </svg>
  );
}

export function HealthManager() {
  const [sleep, setSleep] = useState(7.5);
  const [water, setWater] = useState(6);
  const [ex, setEx] = useState(30);
  const [mood, setMood] = useState("good");
  const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, Math.round(v*10)/10));
  const wk = [6.5,7,5.5,8,7,6.5,sleep];
  const cw=660, ch=190, padL=30, padR=20, padT=20, padB=34, lo=4, hi=10;
  const px = (i) => padL + i*((cw-padL-padR)/6);
  const py = (v) => padT + (1-(clamp(v,lo,hi)-lo)/(hi-lo))*(ch-padT-padB);
  let poly="", area=`M${px(0)} ${py(wk[0])}`;
  wk.forEach((v,i)=>{ poly += (i===0?"M":"L")+px(i).toFixed(1)+" "+py(v).toFixed(1)+" "; if(i>0) area+=` L${px(i).toFixed(1)} ${py(v).toFixed(1)}`; });
  area += ` L${px(6).toFixed(1)} ${ch-padB} L${px(0).toFixed(1)} ${ch-padB} Z`;
  const WD=["M","T","W","T","F","S","S"];
  return (
    <>
      <PageTitle title="Health Manager" subtitle={<>Log today's habits — you're on a <b>4-day streak</b>. Keep it up!</>}>
        <Icon name="dumbbell" size={42} className="shrink-0" />
      </PageTitle>

      <div className="grid grid-cols-4 gap-[18px]">
        <Card className="bg-green shadow-sticker-lg p-[18px] flex flex-col gap-3.5 text-ink">
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-cream border-[2.5px] border-line rounded-[11px] flex items-center justify-center"><Icon name="moon" size={19} /></div><span className="font-mono text-[10px] font-bold text-green-800">Goal 8h</span></div>
          <div className="font-bold text-sm">Sleep</div>
          <Stepper value={sleep} unit="h" dec={()=>setSleep(v=>clamp(v-0.5,0,14))} inc={()=>setSleep(v=>clamp(v+0.5,0,14))} />
        </Card>
        <Card className="bg-blue shadow-sticker-lg p-[18px] flex flex-col gap-3.5 text-ink">
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-cream border-[2.5px] border-line rounded-[11px] flex items-center justify-center"><Icon name="drop" size={19} /></div><span className="font-mono text-[10px] font-bold text-sky-900">Goal 8</span></div>
          <div className="font-bold text-sm">Water intake</div>
          <div className="flex gap-1 flex-wrap">{[1,2,3,4,5,6,7,8].map((i)=><div key={i} className={`w-[14px] h-[19px] border-2 border-line rounded-b-md ${i<=water?"bg-[#7FC8A9]":"bg-cream"}`} />)}</div>
          <Stepper value={water} unit=" glasses" dec={()=>setWater(v=>Math.max(0,v-1))} inc={()=>setWater(v=>Math.min(12,v+1))} />
        </Card>
        <Card className="bg-yellow shadow-sticker-lg p-[18px] flex flex-col gap-3.5 text-ink">
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-cream border-[2.5px] border-line rounded-[11px] flex items-center justify-center"><Icon name="dumbbell" size={19} /></div><span className="font-mono text-[10px] font-bold text-yellow-800">Goal 45m</span></div>
          <div className="font-bold text-sm">Exercise</div>
          <Stepper value={ex} unit="m" dec={()=>setEx(v=>Math.max(0,v-5))} inc={()=>setEx(v=>Math.min(180,v+5))} />
        </Card>
        <Card className="bg-pink shadow-sticker-lg p-[18px] flex flex-col gap-3.5 text-ink">
          <div className="flex items-center justify-between"><div className="w-10 h-10 bg-cream border-[2.5px] border-line rounded-[11px] flex items-center justify-center"><Icon name="drop" size={19} /></div><span className="font-mono text-[10px] font-bold text-pink-900">TODAY</span></div>
          <div className="font-bold text-sm">Mood</div>
          <div className="flex gap-1.5">
            {["bad","meh","good","great"].map((m)=>(
              <div key={m} onClick={()=>setMood(m)} className={`flex-1 flex items-center justify-center py-2.5 border-[2.5px] border-line rounded-[11px] cursor-pointer ${mood===m?"bg-green shadow-sticker-sm":"bg-cream"}`}><Face mood={m} /></div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-paper shadow-sticker-lg p-[22px] relative">
        <div className="absolute inset-[7px] border-2 border-dashed border-line rounded-[15px] opacity-30 pointer-events-none" />
        <div className="flex items-end justify-between mb-4.5 relative">
          <div><div className="font-display text-xl">Weekly sleep trend</div><div className="text-[13px] text-neutral-500 mt-0.5">Hours per night · last 7 days</div></div>
          <div className="flex items-center gap-2 bg-green border-[2.5px] border-line rounded-full px-3 py-1.5"><span className="font-display text-[15px]">6.9h</span><span className="text-xs font-semibold">avg</span></div>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${cw} ${ch}`} width="100%" className="block overflow-visible">
            {[5,7,9].map((g)=>(<g key={g}><line x1={padL} y1={py(g)} x2={cw-padR} y2={py(g)} style={{ stroke: "var(--grid-line)" }} strokeWidth="1.5" strokeDasharray="4 5" /><text x="6" y={py(g)+4} fontFamily="Space Mono, monospace" fontSize="10" style={{ fill: "var(--muted)" }}>{g}h</text></g>))}
            <path d={area} fill="#C9E4CA" opacity="0.55" />
            <path d={poly} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {wk.map((v,i)=><circle key={i} cx={px(i)} cy={py(v)} r="5" fill="#fff" stroke="currentColor" strokeWidth="2.5" />)}
            {WD.map((w,i)=><text key={i} x={px(i)} y={ch-10} textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="12" style={{ fill: "var(--muted)" }}>{w}</text>)}
          </svg>
        </div>
      </Card>

      <AITip accent="green" title="Health tip" action="Log walk">
        Your sleep dipped to <b>5.5h on Wednesday</b> and your weekly average is under 7h. Try winding down 30 min earlier tonight — and you're <b>2 glasses short</b> on water. A short evening walk could help both.
      </AITip>
    </>
  );
}

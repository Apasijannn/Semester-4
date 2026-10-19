import { Icon } from "../components/icons.jsx";

/* =========================================================================
   HEADER — search, notifications, avatar (shared)
   ========================================================================= */
export function Header() {
  return (
    <header className="flex items-center gap-4">
      <div className="flex-1 flex items-center gap-2.5 bg-paper border-3 border-line rounded-[14px] shadow-sticker px-4 py-3">
        <Icon name="search" size={19} sw={2.4} />
        <input placeholder="Search tasks, expenses, reminders…"
          className="border-0 outline-none bg-transparent font-sans text-[15px] w-full" />
      </div>
      <button className="relative w-[50px] h-[50px] shrink-0 bg-yellow text-ink border-3 border-line rounded-[14px] shadow-sticker flex items-center justify-center cursor-pointer">
        <Icon name="bell" size={21} sw={2.4} />
        <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-pink text-ink border-[2.5px] border-line rounded-full text-[10px] font-bold font-mono flex items-center justify-center">3</span>
      </button>
      <div className="flex items-center gap-3 bg-paper border-3 border-line rounded-[14px] shadow-sticker py-1.5 pl-1.5 pr-3.5">
        <div className="w-[38px] h-[38px] border-[2.5px] border-line rounded-[10px] bg-blue text-ink flex items-center justify-center font-display text-[15px]">M</div>
        <div className="leading-tight">
          <div className="font-bold text-[13.5px]">Maya R.</div>
          <div className="text-[11px] text-neutral-500 font-mono">Free plan</div>
        </div>
      </div>
    </header>
  );
}

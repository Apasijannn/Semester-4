import { NavLink } from "react-router-dom";
import { Icon } from "../components/icons.jsx";
import { Card } from "../components/primitives.jsx";
import { NAV } from "./nav.js";

/* =========================================================================
   SIDEBAR — highlights the active route via NavLink isActive
   ========================================================================= */
export function Sidebar() {
  return (
    <aside className="w-[250px] shrink-0 flex flex-col gap-6 bg-paper border-3 border-line rounded-[20px] shadow-sticker-lg p-5">
      <div className="flex items-center gap-3 px-1.5 pb-3.5 border-b-3 border-line">
        <div className="w-10 h-10 bg-yellow text-ink border-3 border-line rounded-xl shadow-sticker-sm flex items-center justify-center">
          <Icon name="grid" size={18} sw={2.6} />
        </div>
        <span className="font-display text-2xl tracking-tight">Karsa</span>
      </div>

      <nav className="flex flex-col gap-2.5">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-3 w-full px-3 py-2.5 rounded-[13px] border-3 font-sans font-semibold text-[15px] transition ${
                isActive ? `bg-${n.accent} border-line shadow-sticker-sm text-ink` : "bg-transparent border-transparent text-ink dark:text-bone hover:bg-cream"
              }`}>
            <span className="w-[22px] flex justify-center"><Icon name={n.icon} /></span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <Card className="mt-auto bg-green shadow-sticker p-4 text-ink">
        <div className="font-display text-sm leading-tight">Pro tip</div>
        <div className="text-[12.5px] mt-1.5 leading-snug">Log your water 3× today to keep your streak alive.</div>
      </Card>
    </aside>
  );
}

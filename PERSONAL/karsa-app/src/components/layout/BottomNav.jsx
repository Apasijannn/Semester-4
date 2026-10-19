import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container border-t-4 border-primary flex justify-around items-center py-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 font-label-caps text-[10px] transition-colors ${
              isActive ? 'text-secondary' : 'text-on-surface-variant'
            }`
          }
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'
import { useHealth } from '../../hooks/useHealth'

export function SideNav() {
  const { streak } = useHealth()

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 border-r-4 border-primary bg-surface-container shrink-0 p-stack-md shadow-[4px_4px_0px_0px_rgba(24,28,44,1)] z-20 relative">
      <div className="mb-stack-lg p-stack-sm">
        <h1 className="font-headline-lg text-headline-lg font-black text-primary tracking-tighter">KARSA_V1.0</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">
          SYSTEM_ONLINE &middot; {streak}D STREAK
        </p>
      </div>

      <ul className="flex-1 flex flex-col gap-stack-sm">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-stack-sm font-label-caps text-label-caps transition-all duration-75 rounded ${
                  isActive
                    ? 'text-primary font-bold border-2 border-primary bg-secondary-container translate-x-1 translate-y-1 shadow-none'
                    : 'text-on-surface-variant hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <ul className="flex flex-col gap-stack-sm mt-auto pt-stack-md border-t-2 border-primary border-dashed">
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 p-stack-sm font-label-caps text-label-caps transition-all duration-75 rounded ${
                isActive ? 'text-primary font-bold bg-surface-container-high' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}

import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'

export function AppLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex">
      <SideNav />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto p-grid-margin pb-24 md:pb-grid-margin relative">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

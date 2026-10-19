import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { Header } from "./Header.jsx";

/* =========================================================================
   LAYOUT — sidebar + header + routed <Outlet/>
   ========================================================================= */
export function PageTitle({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between gap-5">
      <div>
        <h1 className="font-display text-[42px] m-0 tracking-tight leading-none">{title}</h1>
        <p className="mt-3 text-[15px] text-neutral-700 dark:text-neutral-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-full flex p-5 gap-5">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col gap-[22px]">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}

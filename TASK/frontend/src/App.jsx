import PlannerPage from "./modules/planner/PlannerPage.jsx";
import { Badge } from "./components/primitives.jsx";

// Shell standalone modul AI Planner. Aksen modul mengikuti nav.js aplikasi
// Karsa (PERSONAL ASSISTANT/src/layout/nav.js); AI Planner memakai lilac.
// Di repo Karsa utama, PlannerPage tinggal dipasang sebagai route baru.
const MODULES = [
  { name: "Dashboard", accent: "yellow" },
  { name: "Health", accent: "green" },
  { name: "Finance", accent: "yellow" },
  { name: "Task", accent: "blue" },
  { name: "Skincare", accent: "pink" },
  { name: "AI Planner", accent: "lilac", active: true },
];

export default function App() {
  return (
    <div className="min-h-full">
      <header className="border-b-3 border-line bg-paper px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="font-display text-[26px] leading-none tracking-tight">Karsa</h1>
          <nav className="flex flex-wrap gap-2">
            {MODULES.map((mod) => (
              <Badge
                key={mod.name}
                color={mod.accent}
                className={mod.active ? "shadow-sticker-sm" : "opacity-50"}
              >
                {mod.name}
              </Badge>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <PlannerPage />
      </main>
    </div>
  );
}

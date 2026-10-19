import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { TaskManager } from "./pages/TaskManager.jsx";
import { FinanceManager } from "./pages/FinanceManager.jsx";
import { HealthManager } from "./pages/HealthManager.jsx";
import { SkincareAssistant } from "./pages/SkincareAssistant.jsx";
import { Settings } from "./pages/Settings.jsx";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/finance" element={<FinanceManager />} />
          <Route path="/health" element={<HealthManager />} />
          <Route path="/skincare" element={<SkincareAssistant />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

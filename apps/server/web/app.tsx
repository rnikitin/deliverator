import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router";

import { AppShell } from "./components/app-shell.js";
import { Board } from "./components/board.js";
import { DashboardPage } from "./components/dashboard-page.js";
import { SettingsPage } from "./components/settings-page.js";
import { buildTaskOverlaySearch } from "./lib/task-overlay.js";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate replace to="/settings/projects" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="feed" element={<Navigate replace to="/dashboard" />} />
          <Route path="settings/*" element={<SettingsPage />} />
          <Route path="projects" element={<Navigate replace to="/settings/projects" />} />
          <Route path="projects/:projectSlug/board" element={<Board />} />
          <Route path="projects/:projectSlug/tasks/:taskId" element={<LegacyTaskRedirect />} />
          <Route path="*" element={<Navigate replace to="/settings/projects" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function LegacyTaskRedirect() {
  const params = useParams<{ projectSlug: string; taskId: string }>();
  const projectSlug = params.projectSlug;
  const taskId = params.taskId;

  if (!projectSlug || !taskId) {
    return <Navigate replace to="/projects" />;
  }

  return (
    <Navigate
      replace
      to={{
        pathname: `/projects/${projectSlug}/board`,
        search: buildTaskOverlaySearch("", projectSlug, taskId)
      }}
    />
  );
}

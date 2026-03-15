import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AppShell } from "./components/app-shell.js";
import { Board } from "./components/board.js";
import {
  Dashboard,
  SettingsLayout,
  SettingsDisplay,
  SettingsProjects,
  SettingsSystem
} from "./components/placeholder.js";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="board" element={<Board />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<SettingsDisplay />} />
            <Route path="projects" element={<SettingsProjects />} />
            <Route path="system" element={<SettingsSystem />} />
          </Route>
          <Route path="*" element={<Navigate replace to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

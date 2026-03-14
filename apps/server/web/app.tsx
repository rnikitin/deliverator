import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router";

import { OperatorShell } from "./components/operator-shell.js";
import { TaskShell } from "./components/task-shell.js";

function TaskRoute() {
  const params = useParams();

  return <TaskShell taskId={params.taskId || "task-foundation"} />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OperatorShell />} />
        <Route path="/tasks/:taskId" element={<TaskRoute />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

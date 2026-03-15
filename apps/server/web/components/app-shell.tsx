import { NavLink, Outlet } from "react-router";

import { cn } from "../lib/utils.js";
import { useGlobalSSE } from "../hooks/use-global-sse.js";

const NAV_ITEMS: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/board", label: "Board" },
  { to: "/settings", label: "Settings" }
];

export function AppShell() {
  useGlobalSSE();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-10 items-center border-b border-border bg-card px-4">
        <NavLink to="/dashboard" className="font-display text-base font-bold tracking-wide text-primary">
          DELIVERATOR
        </NavLink>

        <nav className="ml-8 flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "px-3 py-1 font-body text-sm font-medium transition-none",
                  isActive
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

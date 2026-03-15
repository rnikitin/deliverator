import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("deliverator-theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // localStorage unavailable
  }
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getStoredTheme();
  applyTheme(initial);

  // Listen for system preference changes when in "system" mode
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const current = useThemeStore.getState().theme;
    if (current === "system") applyTheme("system");
  });

  return {
    theme: initial,
    setTheme: (theme) => {
      try { localStorage.setItem("deliverator-theme", theme); } catch { /* noop */ }
      applyTheme(theme);
      set({ theme });
    }
  };
});

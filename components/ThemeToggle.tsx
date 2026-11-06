"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  labels: { light: string; dark: string };
};

export function ThemeToggle({ labels }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("stk-theme", next);
    } catch {
      /* storage can be unavailable */
    }
    setTheme(next);
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute("content", next === "dark" ? "#121316" : "#f2f1ee");
  }

  const isDark = theme === "dark";
  return (
    <button
      className="tool-button theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={isDark ? labels.light : labels.dark}
      title={isDark ? labels.light : labels.dark}
      suppressHydrationWarning
    >
      <span aria-hidden="true" suppressHydrationWarning>{isDark ? "☀" : "☾"}</span>
      <span className="sr-only" suppressHydrationWarning>{isDark ? labels.light : labels.dark}</span>
    </button>
  );
}

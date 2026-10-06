"use client";

import { useEffect, useState, useCallback } from "react";
import { Sun, Moon } from "lucide-react";
import { IconButton } from "./IconButton";
import { Tooltip } from "./Tooltip";

function getStoredTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem("facility-theme");
    if (v === "light" || v === "dark") return v;
  } catch {}
  return null;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Theme toggle button. Reads initial state from localStorage or system preference.
 * Persists to localStorage and sets data-theme attribute.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? getSystemTheme();
    setTheme(initial);
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("facility-theme", next);
    } catch {}
  }, [theme]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <IconButton label="Toggle theme" className="opacity-0">
        <Sun size={18} strokeWidth={1.5} />
      </IconButton>
    );
  }

  return (
    <Tooltip content={theme === "light" ? "Dark mode" : "Light mode"}>
      <IconButton label="Toggle theme" onClick={toggle}>
        {theme === "light" ? (
          <Moon size={18} strokeWidth={1.5} />
        ) : (
          <Sun size={18} strokeWidth={1.5} />
        )}
      </IconButton>
    </Tooltip>
  );
}

"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "Dark SOC" : "Light"} mode`}
      title={`Switch to ${theme === "light" ? "Dark SOC" : "Light"} mode`}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-95 ${className}`}
    >
      {theme === "light" ? (
        <Moon className="size-4 transition-transform duration-200 hover:rotate-12 text-zinc-600" aria-hidden="true" />
      ) : (
        <Sun className="size-4 transition-transform duration-200 hover:rotate-45 text-amber-400" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

"use client";

import {
  ThemeToggle as BeuiThemeToggle,
  type ThemeToggleProps,
} from "@/components/motion/theme-toggle";

export default function ThemeToggle({ className = "", ...props }: ThemeToggleProps) {
  return (
    <BeuiThemeToggle
      {...props}
      variant="rectangle"
      start="bottom-up"
      className={`relative z-[9999] h-10 w-10 rounded-full border border-black/10 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark-soc:border-zinc-700 dark-soc:bg-zinc-900 dark-soc:text-zinc-200 dark-soc:hover:bg-zinc-800 ${className}`}
      iconClassName="size-4"
    />
  );
}

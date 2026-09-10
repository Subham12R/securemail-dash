"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark-soc";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "securemailscope_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "dark-soc" || stored === "light") {
        setThemeState(stored);
        if (stored === "dark-soc") {
          document.documentElement.classList.add("dark-soc");
        } else {
          document.documentElement.classList.remove("dark-soc");
        }
      }
    } catch {
      // Ignore storage access issues
    }
    setMounted(true);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage error
    }
    if (nextTheme === "dark-soc") {
      document.documentElement.classList.add("dark-soc");
    } else {
      document.documentElement.classList.remove("dark-soc");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark-soc" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : "light", setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

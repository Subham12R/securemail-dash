"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext value={{
      collapsed,
      setSidebarCollapsed: setCollapsed,
      toggleSidebar: () => setCollapsed((value) => !value),
    }}>
      {children}
    </SidebarContext>
  );
}

export function useSidebar() {
  const value = useContext(SidebarContext);
  if (!value) throw new Error("useSidebar must be used within SidebarProvider");
  return value;
}

"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/sidebar";
import { CaptureQueueProvider } from "@/components/providers/capture-queue-provider";
import LiveDataRefreshProvider from "@/components/providers/live-data-refresh-provider";
import { NotificationBridge } from "@/components/notifications/apple-system-alert";
import { SidebarProvider } from "@/components/providers/sidebar-provider";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login";

  if (isAuthRoute) {
    return (
      <main className="min-h-screen w-full bg-white">
        <NotificationBridge />
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="app-shell flex min-h-0 min-w-0 flex-1">
        <NotificationBridge />
        <Sidebar />
        <CaptureQueueProvider>
          <LiveDataRefreshProvider />
          {children}
        </CaptureQueueProvider>
      </div>
    </SidebarProvider>
  );
}

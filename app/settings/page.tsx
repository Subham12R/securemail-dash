import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import { SettingsWorkspace } from "@/components/ui/settings-workspace";

export default function SettingsPage() {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
        aria-label="Settings page"
      >
        <DashboardTopbar currentPage="Settings" />
        <SettingsWorkspace />
      </main>
    </ViewTransition>
  );
}

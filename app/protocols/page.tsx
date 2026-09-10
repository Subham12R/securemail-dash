import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import FooterWatermark from "@/components/ui/footer";
import ProtocolsView from "@/components/ui/protocols-view";
import { getAnalysisHistory } from "@/lib/securemail-api";

export const metadata = {
  title: "Protocols | SecureMailScope",
  description: "Email protocol distribution and cryptographic posture analysis across SMTP, IMAP, and POP3.",
};

export default async function ProtocolsPage() {
  const history = await getAnalysisHistory({ skip: 0, limit: 100 });

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white dark-soc:bg-[#111111]"
        aria-label="Protocols analysis"
      >
        <DashboardTopbar currentPage="Protocols" showRefresh />
        <ProtocolsView records={history.records} />
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}

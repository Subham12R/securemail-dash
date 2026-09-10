import { ViewTransition } from "react";
import Link from "next/link";
import HistoryAnalysisDetail from "@/components/ui/history-analysis-detail";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import FooterWatermark from "@/components/ui/footer";
import { convertInboxDetailToAnalysisRecord } from "@/lib/inbox-converter";
import { buildAnalysisDetailViewModel } from "@/lib/analysis-detail";
import { findInboxDetailByRequestId } from "@/lib/inbox-lookup";
import { getServerInboxDataSource } from "@/lib/inbox-external";
import { getAnalysisByRequestId } from "@/lib/securemail-api";

type HistoryDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

function normalizeRouteRequestId(value: string) {
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded.length > 0 && decoded.length <= 256 ? decoded : null;
  } catch {
    return null;
  }
}

function HistoryDetailError({ message }: { message: string }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
        aria-label="History detail page"
      >
        <DashboardTopbar currentPage="History detail" />
        <section className="p-6" aria-labelledby="history-detail-error-heading">
          <h1
            id="history-detail-error-heading"
            className="text-lg font-semibold tracking-tighter text-zinc-900"
          >
            Analysis record unavailable
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">{message}</p>
          <Link
            href="/history"
            className="mt-5 inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Back to History
          </Link>
        </section>
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}

export default async function HistoryDetailPage({
  params,
}: HistoryDetailPageProps) {
  const { requestId: rawRequestId } = await params;
  const requestId = normalizeRouteRequestId(rawRequestId);

  if (!requestId) {
    return <HistoryDetailError message="The requested analysis ID is invalid." />;
  }

  const analysis = await getAnalysisByRequestId(requestId);
  const inbox = await findInboxDetailByRequestId(
    getServerInboxDataSource(),
    requestId,
  );

  let record = analysis.record;
  if (!record && inbox.state === "available" && inbox.detail) {
    record = convertInboxDetailToAnalysisRecord(inbox.detail, requestId);
  }

  if (!record) {
    return (
      <HistoryDetailError
        message={analysis.error ?? "The analysis record is unavailable."}
      />
    );
  }

  const viewModel = buildAnalysisDetailViewModel(record, inbox);

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
        aria-label="History detail page"
      >
        <DashboardTopbar currentPage="History detail" showRefresh />
        <HistoryAnalysisDetail analysis={record} viewModel={viewModel} />
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}

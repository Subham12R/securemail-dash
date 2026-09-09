import DashboardTopbar from "@/components/ui/dashboard-topbar";
import HistoryTable from "@/components/ui/history-table";
import { getAnalysisHistory } from "@/lib/securemail-api";

const PAGE_SIZE = 10;

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function HistoryPage(props: PageProps<"/history">) {
  const searchParams = await props.searchParams;
  let page = parsePage(searchParams.page);
  let history = await getAnalysisHistory({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(history.total / PAGE_SIZE));
  if (!history.error && history.total === 0) {
    page = 1;
  } else if (!history.error && page > totalPages) {
    page = totalPages;
    history = await getAnalysisHistory({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
  }

  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="History page"
    >
      <DashboardTopbar currentPage="History" />
      <section aria-labelledby="history-page-heading" className="px-6 pt-6">
        <h1
          id="history-page-heading"
          className="text-lg font-semibold tracking-tighter text-zinc-900"
        >
          History
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse persisted SecureMail analysis records.
        </p>
        {history.error ? (
          <div
            role="status"
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {history.error}. History data is unavailable until the API responds.
          </div>
        ) : null}
      </section>
      <HistoryTable
        records={history.records}
        total={history.total}
        page={page}
        limit={PAGE_SIZE}
      />
    </main>
  );
}

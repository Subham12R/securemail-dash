"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import InboxDetail from "@/components/ui/inbox-detail";
import { LIVE_DATA_REFRESH_EVENT } from "@/lib/live-data";
import InboxList from "@/components/ui/inbox-list";
import {
  filterInboxItems,
  parseInboxDetailResponse,
  parseInboxListResponse,
  type InboxDetailResponse,
  type InboxDetailTab,
  type InboxFilter,
  type InboxListResponse,
} from "@/lib/inbox-data";

type InboxWorkspaceProps = {
  initialItemId?: string;
  initialRequestId?: string;
  initialFilter: InboxFilter;
  initialTab: InboxDetailTab;
};

type RequestStatus = "idle" | "loading" | "success" | "error";

const emptyCounts: InboxListResponse["counts"] = {
  all: 0,
  flagged: 0,
  healthy: 0,
};

async function responseError(response: Response, fallback: string) {
  if (response.status === 404) return "The selected Inbox item was not found.";

  try {
    const payload: unknown = await response.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      return payload.detail;
    }
  } catch {
    // Use the safe fallback when the response is not JSON.
  }

  return fallback;
}

export default function InboxWorkspace({
  initialItemId,
  initialRequestId,
  initialFilter,
  initialTab,
}: InboxWorkspaceProps) {
  const [list, setList] = useState<InboxListResponse | null>(null);
  const [listStatus, setListStatus] = useState<RequestStatus>("loading");
  const [listError, setListError] = useState<string | null>(null);
  const [listRetry, setListRetry] = useState(0);
  const [filter, setFilter] = useState<InboxFilter>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId ?? null);
  const [sheetOpen, setSheetOpen] = useState(Boolean(initialItemId));
  const [detail, setDetail] = useState<InboxDetailResponse | null>(null);
  const [detailStatus, setDetailStatus] = useState<RequestStatus>(initialItemId ? "loading" : "idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);
  const selectedIdRef = useRef<string | null>(initialItemId ?? null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/inbox?skip=0&limit=200", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(await responseError(response, "The Inbox source returned an error."));
        const payload: unknown = await response.json();
        const nextList = parseInboxListResponse(payload);
        if (controller.signal.aborted) return;

        setList(nextList);
        setListStatus("success");
        setListError(null);
        const requestedItem = nextList.items.find(
          (item) =>
            (initialItemId !== undefined && item.mail_item_id === initialItemId) ||
            (initialRequestId !== undefined && item.analysis.request_id === initialRequestId),
        );
        const currentSelectedId = selectedIdRef.current;
        const nextSelectedId =
          currentSelectedId && nextList.items.some((item) => item.mail_item_id === currentSelectedId)
            ? currentSelectedId
            : requestedItem?.mail_item_id ?? nextList.items[0]?.mail_item_id ?? null;
        if (nextSelectedId !== currentSelectedId) {
          setDetail(null);
          setDetailError(null);
        }
        setDetailStatus(nextSelectedId ? "loading" : "idle");
        selectedIdRef.current = nextSelectedId;
        setSelectedId(nextSelectedId);
        if (requestedItem && (initialItemId !== undefined || initialRequestId !== undefined)) {
          setSheetOpen(true);
        }
        if (initialItemId !== undefined && !requestedItem) setSheetOpen(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setList(null);
        setListStatus("error");
        setListError(error instanceof Error ? error.message : "The Inbox source is unavailable.");
        selectedIdRef.current = null;
        setSelectedId(null);
        setSheetOpen(false);
        setDetail(null);
        setDetailStatus("idle");
        setDetailError(null);
      }
    })();

    return () => controller.abort();
  }, [initialItemId, initialRequestId, listRetry]);

  useEffect(() => {
    const refresh = () => {
      setListStatus("loading");
      setListError(null);
      setDetailStatus(selectedId ? "loading" : "idle");
      setDetailError(null);
      setListRetry((value) => value + 1);
    };

    window.addEventListener(LIVE_DATA_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(LIVE_DATA_REFRESH_EVENT, refresh);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`/api/inbox/${encodeURIComponent(selectedId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(await responseError(response, "The selected Inbox item is unavailable."));
        const payload: unknown = await response.json();
        const nextDetail = parseInboxDetailResponse(payload);
        if (controller.signal.aborted) return;
        setDetail(nextDetail);
        setDetailStatus("success");
        setDetailError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setDetail(null);
        setDetailStatus("error");
        setDetailError(error instanceof Error ? error.message : "The selected Inbox item is unavailable.");
      }
    })();

    return () => controller.abort();
  }, [detailRetry, listRetry, selectedId]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    if (sheetOpen) {
      if (!sheet.open) sheet.showModal();
      const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }

    if (sheet.open) {
      sheet.close();
      const frame = window.requestAnimationFrame(() => triggerRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
  }, [sheetOpen]);

  const visibleItems = useMemo(
    () => filterInboxItems(list?.items ?? [], filter),
    [filter, list?.items],
  );
  const counts = list?.counts ?? emptyCounts;

  const selectItem = (itemId: string, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    if (itemId !== selectedId) {
      setDetail(null);
      setDetailStatus("loading");
      setDetailError(null);
      selectedIdRef.current = itemId;
      setSelectedId(itemId);
    }
    setSheetOpen(true);
  };

  const changeFilter = (nextFilter: InboxFilter) => {
    setFilter(nextFilter);
    const nextItems = filterInboxItems(list?.items ?? [], nextFilter);
    if (selectedId && nextItems.some((item) => item.mail_item_id === selectedId)) return;

    const nextId = nextItems[0]?.mail_item_id ?? null;
    selectedIdRef.current = nextId;
    setSelectedId(nextId);
    setSheetOpen(false);
    setDetail(null);
    setDetailError(null);
    setDetailStatus(nextId ? "loading" : "idle");
  };

  const closeSheet = () => setSheetOpen(false);

  const retryList = () => {
    setListStatus("loading");
    setListError(null);
    setSheetOpen(false);
    setDetail(null);
    setDetailStatus("idle");
    setDetailError(null);
    setListRetry((value) => value + 1);
  };

  const retryDetail = () => {
    setDetail(null);
    setDetailStatus("loading");
    setDetailError(null);
    setDetailRetry((value) => value + 1);
  };

  return (
    <div className="relative flex min-h-0 flex-1 bg-white">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <InboxList
          items={visibleItems}
          counts={counts}
          filter={filter}
          selectedId={selectedId}
          source={list?.source}
          isLoading={listStatus === "loading"}
          hasLoaded={list !== null}
          error={listError}
          onFilterChange={changeFilter}
          onSelect={selectItem}
          onRetry={retryList}
        />
      </div>

      {selectedId ? (
        <dialog
          ref={sheetRef}
          aria-label="Inspect message"
          className="inbox-detail-sheet"
          onCancel={(event) => {
            event.preventDefault();
            closeSheet();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeSheet();
          }}
        >
          <div className="flex h-full min-h-0 flex-col bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2">
              <span className="text-[11px] font-semibold tracking-tighter text-zinc-500">
                Message inspection
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeSheet}
                aria-label="Close message inspection"
                className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <InboxDetail
                key={selectedId}
                detail={detail}
                status={detailStatus}
                error={detailError}
                onRetry={retryDetail}
                onBack={closeSheet}
                initialTab={initialTab}
              />
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

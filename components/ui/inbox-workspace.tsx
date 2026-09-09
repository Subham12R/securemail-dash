"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import InboxDetail from "@/components/ui/inbox-detail";
import InboxList from "@/components/ui/inbox-list";
import {
  filterInboxItems,
  parseInboxDetailResponse,
  parseInboxListResponse,
  type InboxDetailResponse,
  type InboxFilter,
  type InboxListResponse,
} from "@/lib/inbox-data";

type InboxWorkspaceProps = {
  initialItemId?: string;
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

export default function InboxWorkspace({ initialItemId }: InboxWorkspaceProps) {
  const [list, setList] = useState<InboxListResponse | null>(null);
  const [listStatus, setListStatus] = useState<RequestStatus>("loading");
  const [listError, setListError] = useState<string | null>(null);
  const [listRetry, setListRetry] = useState(0);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId ?? null);
  const [sheetOpen, setSheetOpen] = useState(Boolean(initialItemId));
  const [detail, setDetail] = useState<InboxDetailResponse | null>(null);
  const [detailStatus, setDetailStatus] = useState<RequestStatus>(initialItemId ? "loading" : "idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
        setDetail(null);
        setDetailError(null);
        setDetailStatus(nextList.items.length > 0 ? "loading" : "idle");
        setSelectedId((current) => {
          if (current && nextList.items.some((item) => item.mail_item_id === current)) return current;
          if (initialItemId && nextList.items.some((item) => item.mail_item_id === initialItemId)) return initialItemId;
          return nextList.items[0]?.mail_item_id ?? null;
        });
        if (initialItemId && !nextList.items.some((item) => item.mail_item_id === initialItemId)) {
          setSheetOpen(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setList(null);
        setListStatus("error");
        setListError(error instanceof Error ? error.message : "The Inbox source is unavailable.");
        setSelectedId(null);
        setSheetOpen(false);
        setDetail(null);
        setDetailStatus("idle");
        setDetailError(null);
      }
    })();

    return () => controller.abort();
  }, [initialItemId, listRetry]);

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
      setSelectedId(itemId);
    }
    setSheetOpen(true);
  };

  const changeFilter = (nextFilter: InboxFilter) => {
    setFilter(nextFilter);
    const nextItems = filterInboxItems(list?.items ?? [], nextFilter);
    if (selectedId && nextItems.some((item) => item.mail_item_id === selectedId)) return;

    const nextId = nextItems[0]?.mail_item_id ?? null;
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
              />
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

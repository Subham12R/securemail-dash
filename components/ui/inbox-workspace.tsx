"use client";

import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";

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
  const [mobileDetailOpen, setMobileDetailOpen] = useState(Boolean(initialItemId));
  const [detail, setDetail] = useState<InboxDetailResponse | null>(null);
  const [detailStatus, setDetailStatus] = useState<RequestStatus>(initialItemId ? "loading" : "idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);

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
      } catch (error) {
        if (controller.signal.aborted) return;
        setList(null);
        setListStatus("error");
        setListError(error instanceof Error ? error.message : "The Inbox source is unavailable.");
        setSelectedId(null);
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

  const visibleItems = useMemo(
    () => filterInboxItems(list?.items ?? [], filter),
    [filter, list?.items],
  );
  const counts = list?.counts ?? emptyCounts;

  const selectItem = (itemId: string) => {
    if (itemId !== selectedId) {
      setDetail(null);
      setDetailStatus("loading");
      setDetailError(null);
      setSelectedId(itemId);
    }
    setMobileDetailOpen(true);
  };

  const changeFilter = (nextFilter: InboxFilter) => {
    setFilter(nextFilter);
    const nextItems = filterInboxItems(list?.items ?? [], nextFilter);
    if (selectedId && nextItems.some((item) => item.mail_item_id === selectedId)) return;

    const nextId = nextItems[0]?.mail_item_id ?? null;
    setSelectedId(nextId);
    setDetail(null);
    setDetailError(null);
    setDetailStatus(nextId ? "loading" : "idle");
  };

  const retryList = () => {
    setListStatus("loading");
    setListError(null);
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
    <div className="flex min-h-0 flex-1 flex-col bg-[#061426] lg:flex-row">
      <div className={cn("min-h-0 flex-1", mobileDetailOpen ? "hidden lg:flex" : "flex")}>
        <InboxList
          items={visibleItems}
          counts={counts}
          filter={filter}
          selectedId={selectedId}
          isLoading={listStatus === "loading"}
          error={listError}
          onFilterChange={changeFilter}
          onSelect={selectItem}
          onRetry={retryList}
        />
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto", mobileDetailOpen ? "flex" : "hidden lg:flex")}>
        <InboxDetail
          key={selectedId ?? "no-selection"}
          detail={detail}
          status={detailStatus}
          error={detailError}
          onRetry={retryDetail}
          onBack={() => setMobileDetailOpen(false)}
        />
      </div>
    </div>
  );
}

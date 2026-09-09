"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MorphingText } from "@/components/ui/morphing-text";
import { LIVE_DATA_REFRESH_EVENT } from "@/lib/live-data";

export default function DashboardRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const isRefreshing = isPending || isInvalidating;

  const refresh = async () => {
    if (isRefreshing) return;
    setIsInvalidating(true);
    setRefreshError(false);

    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Refresh failed");
      window.dispatchEvent(new Event(LIVE_DATA_REFRESH_EVENT));
      startTransition(() => router.refresh());
    } catch {
      setRefreshError(true);
    } finally {
      setIsInvalidating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      disabled={isRefreshing}
      aria-busy={isRefreshing}
      aria-label={refreshError ? "Refresh failed" : "Refresh live data"}
      title={refreshError ? "Refresh failed" : "Refresh live data"}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      <RefreshCw aria-hidden="true" className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
      <MorphingText>{isRefreshing ? "Refreshing" : "Refresh"}</MorphingText>
    </button>
  );
}

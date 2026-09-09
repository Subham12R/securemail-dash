"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MorphingText } from "@/components/ui/morphing-text";

export default function DashboardRefreshButton() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isRefreshing}
      aria-busy={isRefreshing}
      className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      <RefreshCw aria-hidden="true" className={isRefreshing ? "size-3.5 animate-spin" : "size-3.5"} />
      <MorphingText>{isRefreshing ? "Refreshing" : "Refresh"}</MorphingText>
    </button>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LIVE_DATA_REFRESH_EVENT,
  LIVE_DATA_CACHE_SECONDS,
  LIVE_DATA_ROUTES,
} from "@/lib/live-data";

export default function LiveDataRefreshProvider() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!LIVE_DATA_ROUTES.includes(pathname as (typeof LIVE_DATA_ROUTES)[number])) return;

    const interval = window.setInterval(() => {
      router.refresh();
      window.dispatchEvent(new Event(LIVE_DATA_REFRESH_EVENT));
    }, LIVE_DATA_CACHE_SECONDS * 1000);

    return () => window.clearInterval(interval);
  }, [pathname, router]);

  return null;
}

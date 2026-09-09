"use client";

import { useEffect, useState } from "react";
import {
  ChartLineIcon,
  FlagIcon,
  HistoryIcon,
  HomeIcon,
  LogOutIcon,
  MailIcon,
  PanelLeftIcon,
  PanelRightIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryItems = [
  {
    name: "Dashboard",
    icon: <HomeIcon size={18} aria-hidden="true" />,
    href: "/",
  },
  {
    name: "Inbox",
    icon: <MailIcon size={18} aria-hidden="true" />,
    href: "/inbox",
  },
  {
    name: "History",
    icon: <HistoryIcon size={18} aria-hidden="true" />,
    href: "/history",
  },
  {
    name: "Settings",
    icon: <SettingsIcon size={18} aria-hidden="true" />,
    href: "/settings",
  },
];

const analysisItems = [
  {
    name: "Flagged Emails",
    icon: <FlagIcon size={18} aria-hidden="true" />,
    href: "/analytics/flagged",
  },
  {
    name: "All Analysis",
    icon: <ChartLineIcon size={18} aria-hidden="true" />,
    href: "/analytics",
  },
];

function isActivePath(pathname: string, href: string) {
  return href === "/analytics"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState<number | null>(null);
  const showFlaggedCount = pathname === "/inbox" || pathname.startsWith("/analytics");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateForViewport = () => setCollapsed(mediaQuery.matches);

    updateForViewport();
    mediaQuery.addEventListener("change", updateForViewport);

    return () => mediaQuery.removeEventListener("change", updateForViewport);
  }, []);

  useEffect(() => {
    if (!showFlaggedCount) return;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/inbox?skip=0&limit=1", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (
          typeof payload === "object" &&
          payload !== null &&
          "counts" in payload &&
          typeof payload.counts === "object" &&
          payload.counts !== null &&
          "flagged" in payload.counts &&
          typeof payload.counts.flagged === "number"
        ) {
          setFlaggedCount(payload.counts.flagged);
        }
      } catch {
        // The Inbox page owns the visible error state; the nav badge is optional.
      }
    })();

    return () => controller.abort();
  }, [showFlaggedCount]);

  const width = collapsed ? "w-16" : "w-64";
  const surface = "border-zinc-200 bg-zinc-50 text-zinc-800";
  const divider = "border-zinc-200";
  const muted = "text-zinc-600";
  const linkClasses = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
      active
        ? "bg-zinc-100 text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
    } ${collapsed ? "justify-center" : "justify-start"}`;

  return (
    <div
      className={`relative h-full min-h-0 shrink-0 transition-[width] duration-200 motion-reduce:transition-none ${width}`}
    >
      <aside
        id="dashboard-sidebar"
        aria-label="Sidebar"
        className={`sticky top-0 flex h-full min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden border-r ${surface}`}
      >
        <div
          className={`flex w-full items-center gap-2 border-b ${divider} text-left ${
            collapsed ? "justify-center p-4" : "px-4 py-4"
          }`}
        >
          <Image
            src="/logo.png"
            alt="SecureMailScope"
            width={32}
            height={32}
            className="size-8 object-contain"
          />
          {collapsed ? null : (
            <h1 className="truncate text-md tracking-tighter">SecureMailScope</h1>
          )}
        </div>

        <nav
          aria-label="Primary navigation"
          className={`flex flex-1 flex-col items-start justify-start px-2 py-4 text-left ${muted}`}
        >
          <div className="flex w-full flex-col gap-1">
            {primaryItems.slice(0, 2).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                aria-label={collapsed ? item.name : undefined}
                title={collapsed ? item.name : undefined}
                className={linkClasses(isActivePath(pathname, item.href))}
              >
                {item.icon}
                {collapsed ? null : <span className="text-sm font-medium tracking-tighter text-current">{item.name}</span>}
              </Link>
            ))}
          </div>

          <div className="mt-6 w-full">
            {collapsed ? null : (
              <p className="mb-2 px-2 text-xs  font-semibold tracking-tighter text-zinc-600">
                Analysis
              </p>
            )}
            <div className="flex w-full flex-col gap-1">
              {analysisItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.name : undefined}
                    title={collapsed ? item.name : undefined}
                    className={linkClasses(active)}
                  >
                    {item.icon}
                    {collapsed ? null : (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-medium tracking-tighter text-current">
                        <span className="truncate">{item.name}</span>
                        {item.name === "Flagged Emails" && flaggedCount !== null ? (
                          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                            {flaggedCount}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-1 flex w-full flex-col gap-1">
            {primaryItems.slice(2).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                aria-label={collapsed ? item.name : undefined}
                title={collapsed ? item.name : undefined}
                className={linkClasses(isActivePath(pathname, item.href))}
              >
                {item.icon}
                {collapsed ? null : <span className="text-sm font-medium tracking-tighter text-current">{item.name}</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className={`mt-auto flex w-full flex-col items-center justify-center border-t px-2 py-4 ${divider}`}>
          <div
            className={`flex w-full items-center gap-2 rounded-md p-2 transition-colors ${
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            } ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <UserIcon size={18} aria-hidden="true" />
            {collapsed ? null : <span className="text-sm font-medium tracking-tighter text-current">Profile</span>}
          </div>
          <div
            className={`flex w-full items-center gap-2 rounded-md p-2 text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-700 ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <LogOutIcon size={18} aria-hidden="true" />
            {collapsed ? null : <span className="text-sm font-medium tracking-tighter text-current">Logout</span>}
          </div>
        </div>
      </aside>
      <button
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-controls="dashboard-sidebar"
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setCollapsed((value) => !value)}
        className={`absolute left-full top-3 z-50 ml-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
          "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-zinc-900"
        }`}
      >
        {collapsed ? (
          <PanelLeftIcon size={18} aria-hidden="true" />
        ) : (
          <PanelRightIcon size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

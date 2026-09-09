"use client";

import { useEffect, useState } from "react";
import {
  ChartLineIcon,
  HistoryIcon,
  HomeIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  NetworkIcon,
  PanelLeftIcon,
  PanelRightIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";

const overviewItems = [
  {
    name: "Dashboard",
    icon: <HomeIcon size={18} aria-hidden="true" />,
    href: "/",
  },
];

const forensicItems = [
  {
    name: "Protocols",
    icon: <NetworkIcon size={18} aria-hidden="true" />,
    href: "/protocols",
  },
  {
    name: "TLS Analysis",
    icon: <LockIcon size={18} aria-hidden="true" />,
    href: "/tls",
  },
  {
    name: "Certificates",
    icon: <ShieldCheckIcon size={18} aria-hidden="true" />,
    href: "/certificates",
  },
  {
    name: "Findings",
    icon: <ShieldAlertIcon size={18} aria-hidden="true" />,
    href: "/findings",
    badge: "6",
  },
];

const investigationItems = [
  {
    name: "All Analysis",
    icon: <ChartLineIcon size={18} aria-hidden="true" />,
    href: "/analytics",
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
];

const systemItems = [
  {
    name: "Settings",
    icon: <SettingsIcon size={18} aria-hidden="true" />,
    href: "/settings",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<{ email: string; display_name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.profile) {
          setUserProfile(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    }
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateForViewport = () => setCollapsed(mediaQuery.matches);

    updateForViewport();
    mediaQuery.addEventListener("change", updateForViewport);

    return () => mediaQuery.removeEventListener("change", updateForViewport);
  }, []);

  const width = collapsed ? "w-16" : "w-64";
  const surface = "border-zinc-200 bg-zinc-100 text-zinc-800";
  const divider = "border-zinc-200";
  const muted = "text-zinc-600";
  const linkClasses = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
      active
        ? "bg-zinc-900 text-zinc-200"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
    } ${collapsed ? "justify-center" : "justify-start"}`;

  return (
    <div
      className={`relative h-full min-h-0 shrink-0 transition-[width] duration-200 motion-reduce:transition-none ${width}`}
    >
      <aside
        id="dashboard-sidebar"
        aria-label="Sidebar"
        style={{ viewTransitionName: "app-sidebar" }}
        className={`sticky top-0 flex h-full min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden border-r ${surface}`}
      >
        <div
          className={`flex w-full items-end gap-2 border-b ${divider} text-left ${
            collapsed ? "justify-center p-4" : "px-4 py-4"
          }`}
        >
          <Image
            src="/logo-mark.png"
            alt="SecureMailScope"
            width={500}
            height={500}
            className="size-8 object-contain"
          />
          {collapsed ? null : (
            <h1 className="font-medium text-md tracking-tighter text-zinc-900">SecureMailScope</h1>
          )}
        </div>

        <nav
          aria-label="Primary navigation"
          className={`flex flex-1 flex-col items-start justify-start px-2 py-3 text-left ${muted}`}
        >
          {/* Overview */}
          <div className="flex w-full flex-col gap-1">
            {overviewItems.map((item) => (
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

          {/* Forensics Modules */}
          <div className="mt-4 w-full">
            {collapsed ? null : (
              <p className="mb-1.5 px-2 text-sm font-medium tracking-tighter text-zinc-500">
                Forensics
              </p>
            )}
            <div className="flex w-full flex-col gap-1">
              {forensicItems.map((item) => {
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
                        {"badge" in item && item.badge && (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark-soc:bg-rose-500/20 dark-soc:text-rose-400">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Capture & Evidence */}
          <div className="mt-4 w-full">
            {collapsed ? null : (
              <p className="mb-1.5 px-2 text-sm font-medium tracking-tighter text-zinc-500">
                Capture & Evidence
              </p>
            )}
            <div className="flex w-full flex-col gap-1">
              {investigationItems.map((item) => {
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
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System */}
          <div className="mt-4 w-full">
            <div className="flex w-full flex-col gap-1">
              {systemItems.map((item) => (
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
          </div>
        </nav>

        <div className={`mt-auto flex w-full flex-col items-center justify-center border-t px-2 py-3 ${divider}`}>
          <div className={`flex w-full items-center ${collapsed ? "justify-center" : "justify-between px-2 py-1.5"}`}>
            {collapsed ? null : (
              <span className="text-xs font-medium text-zinc-500">Theme</span>
            )}
            <ThemeToggle />
          </div>
          <div
            className={`flex w-full items-center gap-2 rounded-md p-2 transition-colors ${
              "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            } ${collapsed ? "justify-center" : "justify-start"}`}
            title={userProfile ? `${userProfile.display_name} (${userProfile.email})` : "SecOps Analyst"}
          >
            <UserIcon size={18} aria-hidden="true" className="shrink-0" />
            {collapsed ? null : (
              <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-xs font-semibold text-zinc-900">
                  {userProfile?.display_name || "SecOps Analyst"}
                </span>
                <span className="truncate text-[10px] text-zinc-500">
                  {userProfile?.email || "analyst@company.com"}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-2 rounded-md p-2 text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-700 ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <LogOutIcon size={18} aria-hidden="true" className="shrink-0" />
            {collapsed ? null : <span className="text-sm font-medium tracking-tighter text-current">Logout</span>}
          </button>
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

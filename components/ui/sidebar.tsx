"use client";

import { useEffect, useState } from "react";
import {
  ChartLineIcon,
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

const sidebarItems = [
  {
    name: "Dashboard",
    icon: <HomeIcon size={18} aria-hidden="true" />,
    href: "/",
  },
  {
    name: "Analytics",
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
  {
    name: "Settings",
    icon: <SettingsIcon size={18} aria-hidden="true" />,
    href: "/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateForViewport = () => setCollapsed(mediaQuery.matches);

    updateForViewport();
    mediaQuery.addEventListener("change", updateForViewport);

    return () => mediaQuery.removeEventListener("change", updateForViewport);
  }, []);

  const width = collapsed ? "w-16" : "w-64";

  return (
    <div
      className={`relative h-full min-h-0 shrink-0 transition-[width] duration-200 motion-reduce:transition-none ${width}`}
    >
      <aside
        id="dashboard-sidebar"
        aria-label="Sidebar"
        className="sticky top-0 flex h-full min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden border-r border-zinc-200 bg-zinc-50"
      >
        <div
          className={`flex w-full items-center gap-2 border-b border-zinc-200 text-left text-zinc-800 ${
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
          className="flex flex-1 flex-col items-start justify-start px-2 py-4 text-left text-zinc-800"
        >
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.name : undefined}
                title={collapsed ? item.name : undefined}
                className={`flex w-full items-center gap-2 rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                } ${collapsed ? "justify-center" : "justify-start"}`}
              >
                {item.icon}
                {collapsed ? null : (
                  <span className="text-sm font-medium tracking-tighter text-current">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex w-full flex-col items-center justify-center px-2 py-4 text-zinc-800">
          <div
            className={`flex w-full items-center gap-2 rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${
              collapsed ? "justify-center" : "justify-start"
            }`}
          >
            <UserIcon size={18} aria-hidden="true" />
            {collapsed ? null : (
              <span className="text-sm font-medium tracking-tighter text-current">
                Profile
              </span>
            )}
          </div>
          <div
            className={`flex w-full items-center gap-2 rounded-md p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-500 ${
              collapsed ? "justify-center" : "justify-start"
            }`}
          >
            <LogOutIcon size={18} aria-hidden="true" />
            {collapsed ? null : (
              <span className="text-sm font-medium tracking-tighter text-current">
                Logout
              </span>
            )}
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
        className="absolute left-full top-3 z-50 ml-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
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

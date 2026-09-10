"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { AlertVariant, AppleSystemAlertAction } from "@/lib/notifications";

const EXIT_MS = 220;

export interface AppleSystemAlertBannerProps {
  toastId?: string | number;
  appName?: string;
  variant?: AlertVariant;
  title: string;
  description: string;
  time?: string;
  action?: AppleSystemAlertAction;
  avatarSrc?: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function AppleSystemAlertBanner({
  toastId,
  appName = "SecureMailScope",
  variant = "info",
  title,
  description,
  time = "now",
  action,
  avatarSrc,
  icon,
  onDismiss,
  className,
}: AppleSystemAlertBannerProps) {
  const [phase, setPhase] = useState<"open" | "closing">("open");

  const handleDismiss = () => {
    if (phase !== "open") return;
    setPhase("closing");
    onDismiss?.();
    setTimeout(() => {
      if (toastId !== undefined) {
        toast.dismiss(toastId);
      }
    }, EXIT_MS);
  };

  const handleAction = () => {
    if (action) {
      action.onClick();
      if (toastId !== undefined) {
        toast.dismiss(toastId);
      }
    }
  };

  const renderIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case "critical":
        return <ShieldAlert size={18} className="text-white" strokeWidth={2.2} />;
      case "warning":
        return <AlertTriangle size={18} className="text-white" strokeWidth={2.2} />;
      case "success":
        return <CheckCircle2 size={18} className="text-white" strokeWidth={2.2} />;
      case "info":
      default:
        return <Cpu size={18} className="text-white" strokeWidth={2.2} />;
    }
  };

  const tileBgClass = {
    critical: "bg-rose-500 shadow-rose-500/20",
    warning: "bg-amber-500 shadow-amber-500/20",
    success: "bg-emerald-500 shadow-emerald-500/20",
    info: "bg-sky-500 shadow-sky-500/20",
  }[variant];

  return (
    <div
      role="status"
      data-phase={phase}
      className={cn(
        "pointer-events-auto relative w-88 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.25rem] p-0 font-sans select-none",
        "border border-white/70 bg-white/90 text-neutral-900 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12)] backdrop-blur-xl",
        "dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]/90 dark-soc:text-neutral-100 dark-soc:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.50)]",
        "transition-all duration-240 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        phase === "closing" && "-translate-y-2 opacity-0 duration-200 ease-in",
        className,
      )}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss alert"
        className="absolute top-2.5 right-2.5 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-700 dark-soc:text-slate-400 dark-soc:hover:bg-white/10 dark-soc:hover:text-slate-200"
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      {/* Grid: Tile/Avatar on left + Body on right */}
      <div className="grid grid-cols-[2.375rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 p-3.5 pr-8">
        {/* Left Squircle or Avatar */}
        {avatarSrc ? (
          <div className="relative row-span-2 mt-0.5 size-9.5 shrink-0 overflow-hidden rounded-[0.625rem] shadow-sm ring-1 ring-black/5">
            <Image
              src={avatarSrc}
              alt="Avatar"
              fill
              unoptimized
              sizes="38px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              "row-span-2 mt-0.5 flex size-9.5 shrink-0 items-center justify-center rounded-[0.625rem] shadow-sm ring-1 ring-black/5",
              tileBgClass,
            )}
          >
            {renderIcon()}
          </div>
        )}

        {/* Subsystem & Timestamp */}
        <div className="col-start-2 flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-[12px] font-semibold text-neutral-900 tracking-tight dark-soc:text-neutral-100">
            {appName}
          </p>
          <span className="shrink-0 text-[10.5px] text-neutral-400 dark-soc:text-slate-400 font-medium">
            {time}
          </span>
        </div>

        {/* Title & Description */}
        <div className="col-start-2 space-y-1.5">
          <p className="text-[12.5px] leading-snug text-neutral-700 dark-soc:text-slate-300">
            <span className="font-semibold text-neutral-900 dark-soc:text-white">
              {title}
            </span>
            <span className="text-neutral-400 dark-soc:text-slate-500 font-normal">
              :{" "}
            </span>
            {description}
          </p>

          {/* Action pill button */}
          {action && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleAction}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 dark-soc:bg-[#1E2D56] dark-soc:text-blue-100 dark-soc:hover:bg-[#2A3F75]"
              >
                <span>{action.label}</span>
                <span className="text-[10px] leading-none">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AppleSystemAlertBanner.displayName = "AppleSystemAlertBanner";

import { registerSystemAlertRenderer } from "@/lib/notifications";

if (typeof window !== "undefined") {
  registerSystemAlertRenderer((props) => <AppleSystemAlertBanner {...props} />);
}

export function NotificationBridge() {
  React.useEffect(() => {
    registerSystemAlertRenderer((props) => <AppleSystemAlertBanner {...props} />);
  }, []);
  return null;
}

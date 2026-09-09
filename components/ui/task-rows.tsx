"use client";

import { useState } from "react";
import { MorphingText } from "@/components/ui/morphing-text";

export type TaskDetail = {
  label: string;
  meta: string;
};

export type TaskRow = {
  key: string;
  label: string;
  amount: string;
  status: "ready" | "running" | "done" | "failed";
  progress?: number | null;
  step?: number;
  details: TaskDetail[];
};

function SpinnerRing({ step }: { step?: number }) {
  const size = 24;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      className="relative inline-flex size-6 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 animate-spin">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#52525b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.28} ${circumference * 0.72}`}
        />
      </svg>
      <span className="relative text-[10px] font-semibold tabular-nums text-zinc-700">
        {step}
      </span>
    </span>
  );
}

function StatusMark({ status, step }: Pick<TaskRow, "status" | "step">) {
  if (status === "running") return <SpinnerRing step={step} />;

  if (status === "done") {
    return (
      <span
        className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
        aria-label="Completed"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span
        className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"
        aria-label="Failed"
      >
        <span className="text-xs font-bold">!</span>
      </span>
    );
  }

  return (
    <span
      className="flex size-5.5 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-500"
      aria-label="Ready"
    >
      <span className="size-1.5 rounded-full bg-zinc-400" />
    </span>
  );
}

function StatusPill({ status }: { status: TaskRow["status"] }) {
  if (status === "failed") {
    return (
      <span className="inline-flex h-6 items-center rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-700">
        <MorphingText>Failed</MorphingText>
      </span>
    );
  }

  if (status === "running") {
    return (
      <span className="inline-flex h-6 items-center rounded-md border border-amber-200 bg-amber-50 px-2 text-[11px] font-medium text-amber-700">
        <MorphingText>Processing</MorphingText>
      </span>
    );
  }

  if (status === "done") {
    return (
      <span className="inline-flex h-6 items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
        <MorphingText>Complete</MorphingText>
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-600">
      <MorphingText>Ready</MorphingText>
    </span>
  );
}

export default function TaskRows({
  rows,
  className,
  onToggleRow,
}: {
  rows: TaskRow[];
  className?: string;
  onToggleRow?: (key: string, open: boolean) => void;
}) {
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});

  return (
    <div
      role="list"
      aria-label="Queued captures"
      className={`flex w-full flex-col gap-2 ${className ?? ""}`}
    >
      {rows.map((row) => {
        const open = manualOpen[row.key] ?? false;

        return (
          <div
            key={row.key}
            role="listitem"
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:bg-zinc-50"
          >
            <button
              type="button"
              aria-expanded={open}
              className="flex min-h-12 w-full items-center gap-2.5 px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900"
              onClick={() => {
                setManualOpen((current) => ({ ...current, [row.key]: !open }));
                onToggleRow?.(row.key, !open);
              }}
            >
              <StatusMark status={row.status} step={row.step} />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-900">
                {row.label}
              </span>
              <span className="text-[11px] tabular-nums text-zinc-500">
                {row.amount}
              </span>
              <StatusPill status={row.status} />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {typeof row.progress === "number" && Number.isFinite(row.progress) ? (
              <div className="px-3 pb-2" role="progressbar" aria-label={`${row.label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.progress}>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-zinc-800 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }} />
                </div>
              </div>
            ) : null}

            <div
              className="grid transition-[grid-template-rows,opacity] duration-300"
              style={{
                gridTemplateRows: open ? "1fr" : "0fr",
                opacity: open ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-[24px_1fr] gap-2.5 px-3 pb-3">
                  <span aria-hidden="true" className="mx-auto h-full w-px bg-zinc-200" />
                  <div className="flex flex-col gap-1.5">
                    {row.details.map((detail) => (
                      <div
                        key={detail.label}
                        className="flex items-center justify-between gap-3 text-[11px]"
                      >
                        <span className="text-zinc-500">{detail.label}</span>
                        <span className="font-mono tabular-nums text-zinc-700">
                          {detail.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

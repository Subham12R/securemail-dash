import React from "react";
import { getUsageSeverity } from "@/lib/usage-data";

interface UsageGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function UsageGauge({
  percentage,
  size = 18,
  strokeWidth = 2.5,
  label,
  className = "",
}: UsageGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  const severity = getUsageSeverity(clampedPercentage);

  let progressColor = "stroke-emerald-600";
  if (clampedPercentage === 0) {
    progressColor = "stroke-zinc-300";
  } else if (severity === "critical") {
    progressColor = "stroke-red-600";
  } else if (severity === "warning") {
    progressColor = "stroke-amber-500";
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 -rotate-90 ${className}`}
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label}: ${clampedPercentage}% used` : `${clampedPercentage}% used`}
    >
      {/* Background Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-zinc-200"
      />
      {/* Active Fill */}
      {clampedPercentage > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${progressColor}`}
        />
      )}
    </svg>
  );
}

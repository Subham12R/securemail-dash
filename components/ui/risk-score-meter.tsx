"use client";

import { MorphingText } from "@/components/ui/morphing-text";
import { riskBandForScore, riskScoreBarClass, riskScoreSegmentCount } from "@/lib/risk";

export interface RiskScoreMeterProps {
  score: number | null | undefined;
  bars?: number;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  barWidth?: string;
  barHeight?: string;
  gap?: string;
}

export function RiskScoreMeter({
  score,
  bars = 18,
  showText = true,
  size = "md",
  className = "",
  barWidth,
  barHeight,
  gap,
}: RiskScoreMeterProps) {
  const percentage =
    score !== null && score !== undefined && Number.isFinite(score)
      ? Math.max(0, Math.min(100, score * 100))
      : null;
  const formatted = percentage === null ? "Not supplied" : `${percentage.toFixed(1)}%`;
  const band = riskBandForScore(score ?? null);
  const activeCount = riskScoreSegmentCount(score ?? null, bars);

  const resolvedHeight =
    barHeight ?? (size === "sm" ? "h-4" : size === "lg" ? "h-6" : "h-5");
  const resolvedWidth =
    barWidth ?? (size === "sm" ? "w-[3px]" : size === "lg" ? "w-1" : "w-[3.5px]");
  const resolvedGap = gap ?? (size === "sm" ? "gap-[2px]" : "gap-[2.5px]");

  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      role="meter"
      aria-label={`Risk score ${formatted}${band ? ` (${band})` : ""}`}
      aria-valuenow={percentage ?? undefined}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`flex items-center ${resolvedGap}`} aria-hidden="true">
        {Array.from({ length: bars }, (_, i) => {
          const isFilled = activeCount > i;
          return (
            <div
              key={i}
              className={`${resolvedWidth} ${resolvedHeight} rounded-full transition-all duration-300 motion-reduce:transition-none ${
                isFilled
                  ? `${riskScoreBarClass(score ?? null)} shadow-xs`
                  : "bg-zinc-200/80"
              }`}
            />
          );
        })}
      </div>
      {showText ? (
        <span className="text-xs font-semibold tabular-nums text-zinc-800">
          <MorphingText>{formatted}</MorphingText>
        </span>
      ) : null}
    </div>
  );
}

export default RiskScoreMeter;

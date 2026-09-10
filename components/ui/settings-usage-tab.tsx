"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { UsageGauge } from "@/components/ui/usage-gauge";
import {
  DEFAULT_USAGE_SECTIONS,
  calculateUsagePercentage,
  type UsageMetric,
  type UsageSection,
} from "@/lib/usage-data";

interface SettingsUsageTabProps {
  onUpgradeClick?: () => void;
  sections?: UsageSection[];
}

export function SettingsUsageTab({
  onUpgradeClick,
  sections = DEFAULT_USAGE_SECTIONS,
}: SettingsUsageTabProps) {
  const [expandedMetricId, setExpandedMetricId] = useState<string | null>(null);

  const toggleMetricExpand = (id: string) => {
    setExpandedMetricId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-12 divide-y divide-zinc-200">
      {sections.map((section) => (
        <div
          key={section.id}
          className="pt-8 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12"
        >
          {/* Left Column: Product Info & Upgrade CTA */}
          <div className="md:col-span-5 flex flex-col items-start">
            <h2 className="text-base font-semibold tracking-tighter text-zinc-900">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 leading-relaxed max-w-sm">
              {section.description}
            </p>
            <button
              type="button"
              onClick={onUpgradeClick}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 cursor-pointer"
            >
              Upgrade
            </button>
          </div>

          {/* Right Column: Plan Tier & Usage Gauges */}
          <div className="md:col-span-7 space-y-4">
            <div className="text-sm font-medium text-zinc-900">
              {section.tierName}
            </div>

            <div className="space-y-3">
              {section.metrics.map((metric: UsageMetric) => {
                const percentage = calculateUsagePercentage(metric.used, metric.limit);
                const isExpanded = expandedMetricId === metric.id;
                const hasExpandableDetails = Boolean(metric.details);

                const fractionDisplay =
                  metric.displayValue ??
                  (metric.limit !== null
                    ? `${metric.used.toLocaleString()} / ${metric.limit.toLocaleString()}`
                    : metric.used.toLocaleString());

                return (
                  <div
                    key={metric.id}
                    className="rounded-md border border-zinc-100 bg-zinc-50/50 p-2.5 transition-colors hover:bg-zinc-50/80"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UsageGauge
                          percentage={percentage}
                          size={18}
                          strokeWidth={2.5}
                          label={metric.label}
                        />
                        <span className="truncate text-zinc-700 font-medium">
                          {metric.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-zinc-700">
                        <span className="text-xs sm:text-sm tabular-nums font-medium">
                          {fractionDisplay}
                        </span>
                        {hasExpandableDetails && (
                          <button
                            type="button"
                            onClick={() => toggleMetricExpand(metric.id)}
                            aria-expanded={isExpanded}
                            aria-label={`Toggle details for ${metric.label}`}
                            className="p-0.5 text-zinc-400 hover:text-zinc-700 transition-colors rounded cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && metric.details && (
                      <div className="mt-2 pt-2 border-t border-zinc-200/60 text-xs text-zinc-500 leading-relaxed animate-reveal">
                        {metric.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

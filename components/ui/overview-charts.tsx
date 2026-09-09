"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Sector,
  XAxis,
} from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChartSkeleton,
  PieChartSkeleton,
} from "@/components/ui/loading-skeleton";
import type { PostureCount } from "@/lib/securemail-api";
import type { RiskScoreDistribution } from "@/lib/risk";

const DEEP_BLUE = "#1e3a8a";

const riskColors: Record<string, string> = {
  informational: DEEP_BLUE,
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#dc2626",
};

const postureColors: Record<string, string> = {
  secure: "#22c55e",
  modern: "#22c55e",
  benign: "#22c55e",
  adequate: "#38bdf8",
  review: "#f59e0b",
  needs_review: "#f59e0b",
  deprecated: "#f97316",
  weak: "#ef4444",
  at_risk: "#ef4444",
  risky: "#ef4444",
  handshake_failed: "#dc2626",
  unknown: DEEP_BLUE,
};

const fallbackColors = [
  "#38bdf8",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
];

const chartConfig = {
  count: {
    label: "Analyses",
  },
} satisfies ChartConfig;

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function colorFor(
  value: string,
  colors: Record<string, string>,
  index: number,
) {
  const key = value.toLowerCase().replace(/\s+/g, "_");
  return colors[key] ?? fallbackColors[index % fallbackColors.length];
}

export default function OverviewCharts({
  riskDistribution,
  postureDistribution,
}: {
  riskDistribution: readonly RiskScoreDistribution[];
  postureDistribution: readonly PostureCount[];
}) {
  const [hoveredRisk, setHoveredRisk] = useState<string | null>(null);
  const [activePostureIndex, setActivePostureIndex] = useState<number | null>(null);

  const riskData = riskDistribution.map((entry, index) => ({
    risk: formatLabel(entry.band),
    count: entry.count,
    fill: colorFor(entry.band, riskColors, index),
  }));
  const postureData = postureDistribution.map((entry, index) => ({
    posture: formatLabel(entry.posture),
    count: entry.count,
    fill: colorFor(entry.posture, postureColors, index),
  }));
  const totalPostureCount = postureData.reduce((sum, item) => sum + item.count, 0);
  const activePosture = activePostureIndex !== null ? postureData[activePostureIndex] : null;

  return (
    <section
      aria-labelledby="graph-overview-heading"
      className="space-y-4 px-6 pb-6"
    >
      <div>
        <h2
          id="graph-overview-heading"
          className="text-lg font-semibold tracking-tighter text-zinc-900"
        >
          Graph overview
        </h2>
        <p className="text-sm text-zinc-500">Live aggregate data from the API</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk score distribution</CardTitle>
            <CardDescription>
              Persisted analyses grouped by normalized risk score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riskData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                role="img"
                aria-label="Colorful bar chart showing analysis risk score distribution"
                className="aspect-video max-h-[280px]"
              >
                <BarChart accessibilityLayer data={riskData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="risk"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => String(value).slice(0, 8)}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={750}
                    animationEasing="ease-out"
                  >
                    {riskData.map((entry) => (
                      <Cell
                        key={entry.risk}
                        fill={entry.fill}
                        opacity={hoveredRisk && hoveredRisk !== entry.risk ? 0.35 : 1}
                        className="transition-opacity duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredRisk(entry.risk)}
                        onMouseLeave={() => setHoveredRisk(null)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="relative">
                <BarChartSkeleton />
                <p className="absolute left-1/2 top-1/2 max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/90 px-3 py-1 text-center text-sm text-zinc-500">
                  No data available
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600">
            {riskData.length > 0
              ? riskData.map((entry) => (
                  <div
                    key={entry.risk}
                    className={`flex items-center gap-1.5 transition-opacity duration-150 ${
                      hoveredRisk && hoveredRisk !== entry.risk ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span>{entry.risk}</span>
                    <span className="font-medium text-zinc-900">
                      {entry.count}
                    </span>
                  </div>
                ))
              : "No risk score bands returned"}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="items-center pb-0 text-center">
            <CardTitle>Cryptographic posture</CardTitle>
            <CardDescription>Session security posture overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center pb-5">
            {postureData.length > 0 ? (
              <div className="relative mx-auto aspect-square w-full max-h-[280px]">
                <ChartContainer
                  config={chartConfig}
                  role="img"
                  aria-label="Colorful donut chart showing cryptographic posture"
                  className="size-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={postureData}
                      dataKey="count"
                      nameKey="posture"
                      innerRadius={68}
                      stroke="var(--chart-surface)"
                      strokeWidth={3}
                      isAnimationActive={true}
                      animationDuration={850}
                      animationEasing="ease-out"
                      onMouseEnter={(_, index) => setActivePostureIndex(index)}
                      onMouseLeave={() => setActivePostureIndex(null)}
                      shape={({
                        index,
                        outerRadius = 0,
                        ...props
                      }: PieSectorShapeProps) => (
                        <Sector
                          {...props}
                          outerRadius={
                            index === activePostureIndex
                              ? outerRadius + 8
                              : outerRadius
                          }
                          className="transition-[outerRadius] duration-300 ease-out cursor-pointer"
                        />
                      )}
                    >
                      {postureData.map((entry, index) => (
                        <Cell
                          key={entry.posture}
                          fill={entry.fill}
                          opacity={activePostureIndex !== null && activePostureIndex !== index ? 0.45 : 1}
                          className="transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                {/* Animated Center Metric Callout */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-medium tracking-tight text-zinc-500 truncate max-w-[110px]">
                    {activePosture ? activePosture.posture : "Total Sessions"}
                  </span>
                  <span className="text-xl font-bold tracking-tight text-zinc-900 tabular-nums">
                    {activePosture ? activePosture.count.toLocaleString() : totalPostureCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {totalPostureCount > 0 && activePosture
                      ? `${((activePosture.count / totalPostureCount) * 100).toFixed(1)}%`
                      : "Persisted"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <PieChartSkeleton />
                <p
                  role="status"
                  className="absolute left-1/2 top-1/2 max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/90 px-3 py-1 text-center text-sm text-zinc-500"
                >
                  No data available
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-600">
            {postureData.length > 0
              ? postureData.map((entry) => (
                  <div key={entry.posture} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span>{entry.posture}</span>
                    <span className="font-medium text-zinc-900">
                      {entry.count}
                    </span>
                  </div>
                ))
              : "No posture categories returned"}
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

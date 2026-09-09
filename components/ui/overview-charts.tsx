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
import type { PostureCount, VerdictCount } from "@/lib/securemail-api";

const DEEP_BLUE = "#1e3a8a";

const verdictColors: Record<string, string> = {
  informational: DEEP_BLUE,
  benign: "#22c55e",
  low: "#22c55e",
  suspicious: "#f59e0b",
  medium: "#f59e0b",
  high: "#f97316",
  malicious: "#ef4444",
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
  verdictDistribution,
  postureDistribution,
}: {
  verdictDistribution: readonly VerdictCount[];
  postureDistribution: readonly PostureCount[];
}) {
  const [activePostureIndex, setActivePostureIndex] = useState(0);
  const verdictData = verdictDistribution.map((entry, index) => ({
    verdict: formatLabel(entry.verdict),
    count: entry.count,
    fill: colorFor(entry.verdict, verdictColors, index),
  }));
  const postureData = postureDistribution.map((entry, index) => ({
    posture: formatLabel(entry.posture),
    count: entry.count,
    fill: colorFor(entry.posture, postureColors, index),
  }));
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
            <CardTitle>Verdict distribution</CardTitle>
            <CardDescription>
              Persisted analyses grouped by final backend verdict
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verdictData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                role="img"
                aria-label="Colorful bar chart showing analysis verdict distribution"
                className="aspect-video max-h-[280px]"
              >
                <BarChart accessibilityLayer data={verdictData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="verdict"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => String(value).slice(0, 8)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="count" radius={0} isAnimationActive={false}>
                    {verdictData.map((entry) => (
                      <Cell key={entry.verdict} fill={entry.fill} />
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
            {verdictData.length > 0
              ? verdictData.map((entry) => (
                  <div key={entry.verdict} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span>{entry.verdict}</span>
                    <span className="font-medium text-zinc-900">
                      {entry.count}
                    </span>
                  </div>
                ))
              : "No verdict categories returned"}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="items-center pb-0 text-center">
            <CardTitle>Cryptographic posture</CardTitle>
            <CardDescription>Session security posture overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center pb-5">
            {postureData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                role="img"
                aria-label="Colorful donut chart showing cryptographic posture"
                className="mx-auto aspect-square max-h-[280px]"
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
                    innerRadius={65}
                    strokeWidth={4}
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => setActivePostureIndex(index)}
                    onMouseLeave={() => setActivePostureIndex(0)}
                    shape={({
                      index,
                      outerRadius = 0,
                      ...props
                    }: PieSectorShapeProps) => (
                      <Sector
                        {...props}
                        outerRadius={
                          index === activePostureIndex
                            ? outerRadius + 10
                            : outerRadius
                        }
                      />
                    )}
                  >
                    {postureData.map((entry) => (
                      <Cell key={entry.posture} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
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

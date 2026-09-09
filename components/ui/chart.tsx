"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactElement;
};

type TooltipItem = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: unknown;
};

type ChartTooltipContentProps = Partial<
  Pick<TooltipContentProps<number, string>, "active" | "label" | "payload">
> & {
  hideLabel?: boolean;
};

const ChartContext = React.createContext<ChartConfig | null>(null);

export function ChartContainer({
  children,
  className,
  config,
  style,
  ...props
}: ChartContainerProps) {
  const chartId = React.useId().replace(/:/g, "");
  const colorVariables = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => item.color)
      .map(([key, item]) => [`--color-${key}`, item.color]),
  );

  return (
    <ChartContext.Provider value={config}>
      <div
        data-chart={chartId}
        className={`relative flex w-full justify-center text-xs ${className ?? ""}`}
        style={{ ...colorVariables, ...style }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

export function ChartTooltipContent({
  active,
  hideLabel = false,
  label,
  payload,
}: ChartTooltipContentProps) {
  const config = React.useContext(ChartContext);
  const items = (payload ?? []) as unknown as readonly TooltipItem[];

  if (!active || items.length === 0) {
    return null;
  }

  return (
    <div className="grid min-w-32 gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-lg">
      {!hideLabel && label !== undefined ? (
        <div className="font-medium text-zinc-900">{label}</div>
      ) : null}
      {items.map((item, index) => {
        const key = String(item.dataKey ?? item.name ?? "value");
        const itemConfig = config?.[key];

        return (
          <div key={`${key}-${index}`} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color ?? "#71717a" }}
            />
            <span className="text-zinc-500">
              {itemConfig?.label ?? item.name ?? key}
            </span>
            <span className="ml-auto font-mono font-medium tabular-nums text-zinc-900">
              {String(item.value ?? "—")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

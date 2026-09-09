"use client";

import { useEffect, useRef, useState } from "react";
import { interpolateNumber } from "@/lib/animated-number";

const DURATION_MS = 650;

function formatValue(mode: "count" | "percent", n: number) {
  return mode === "count"
    ? Math.round(n).toLocaleString("en-US")
    : `${n.toFixed(1)}%`;
}

export function AnimatedNumber({
  value,
  mode = "count",
}: {
  value: number | null;
  mode?: "count" | "percent";
}) {
  const fromRef = useRef(0);
  const [text, setText] = useState(0);

  useEffect(() => {
    if (value === null) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    const started = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      if (reduced || time - started >= DURATION_MS) {
        fromRef.current = value;
        setText(value);
        return;
      }
      setText(interpolateNumber(from, value, (time - started) / DURATION_MS));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [mode, value]);

  if (value === null) return <span>Unavailable</span>;

  return <span>{formatValue(mode, text)}</span>;
}

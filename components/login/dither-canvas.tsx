"use client";

import { useEffect, useRef } from "react";
import { computeWaveIntensity, getBayerThreshold } from "@/lib/dither";

export default function DitherCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    const startTime = performance.now();

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    mediaQuery.addEventListener("change", onMotionChange);

    const step = 3; // Pixel grid step (3px)

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current = null;
    };

    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseleave", onMouseLeave, { passive: true });

    const render = (now: number) => {
      const time = isReducedMotion ? 0 : (now - startTime) * 0.001;

      // Base background: clean soft light slate
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const mouseX = mouse?.x;
      const mouseY = mouse?.y;

      // Dither dot color: soft slate
      ctx.fillStyle = "rgba(71, 85, 105, 0.22)";

      const cols = Math.ceil(width / step);
      const rows = Math.ceil(height / step);

      for (let r = 0; r < rows; r++) {
        const y = r * step;
        for (let c = 0; c < cols; c++) {
          const x = c * step;
          const intensity = computeWaveIntensity(x, y, time, mouseX, mouseY);
          const threshold = getBayerThreshold(c, r);

          if (intensity > threshold) {
            ctx.fillRect(x, y, step - 0.5, step - 0.5);
          }
        }
      }

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", onMotionChange);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full overflow-hidden bg-slate-50"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
] as const;

export function getBayerThreshold(x: number, y: number): number {
  const bx = Math.abs(Math.floor(x)) % 4;
  const by = Math.abs(Math.floor(y)) % 4;
  return BAYER_4X4[by][bx];
}

export function computeWaveIntensity(
  x: number,
  y: number,
  time: number,
  mouseX?: number,
  mouseY?: number,
): number {
  const w1 = Math.sin(x * 0.008 + y * 0.006 + time * 0.7);
  const w2 = Math.cos(x * 0.005 - y * 0.007 - time * 0.5);
  const w3 = Math.sin((x + y) * 0.004 + time * 0.3);
  let base = 0.5 + 0.22 * w1 + 0.18 * w2 + 0.1 * w3;

  if (mouseX !== undefined && mouseY !== undefined) {
    const dx = x - mouseX;
    const dy = y - mouseY;
    const dist = Math.hypot(dx, dy);
    if (dist < 180) {
      const falloff = Math.exp(-dist / 65);
      const ripple = Math.sin(dist * 0.07 - time * 2.5) * 0.28 * falloff;
      base += ripple;
    }
  }

  return Math.max(0, Math.min(1, base));
}

export function shouldDrawDitherPixel(
  x: number,
  y: number,
  time: number,
  mouseX?: number,
  mouseY?: number,
): boolean {
  const intensity = computeWaveIntensity(x, y, time, mouseX, mouseY);
  const threshold = getBayerThreshold(x, y);
  return intensity > threshold;
}

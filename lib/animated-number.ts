/** Cubic ease-out interpolation between two numbers. */
export function interpolateNumber(from: number, to: number, progress: number) {
  const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);

  return from + (to - from) * eased;
}

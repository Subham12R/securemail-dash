export function riskScoreBarClass(score: number | null) {
  if (score === null || !Number.isFinite(score)) return "bg-zinc-300";
  if (score >= 0.875) return "bg-red-600";
  if (score >= 0.625) return "bg-orange-500";
  if (score >= 0.375) return "bg-yellow-400";
  return "bg-emerald-500";
}

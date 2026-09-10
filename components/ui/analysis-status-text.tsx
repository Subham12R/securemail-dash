import {
  analysisStatusForVerdict,
  analysisStatusLabel,
  type AnalysisStatus,
} from "@/lib/risk";

const STATUS_TEXT_CLASSES: Record<AnalysisStatus, string> = {
  healthy: "text-emerald-600",
  medium: "text-orange-600",
  high: "text-red-600",
  critical: "text-red-700",
  unknown: "text-zinc-500",
};

export default function AnalysisStatusText({
  verdict,
}: {
  verdict: string | null | undefined;
}) {
  const status = analysisStatusForVerdict(verdict);
  return (
    <span className={`${status === "critical" ? "font-bold" : "font-semibold"} ${STATUS_TEXT_CLASSES[status]}`}>
      {analysisStatusLabel(verdict)}
    </span>
  );
}

import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { MetricCard } from "@/components/ui/card";

type Props = {
  openCount: number;
  highCriticalCount: number;
  acknowledgedCount: number;
  resolvedCount: number;
};

export default function FindingsKpiSummary({
  openCount,
  highCriticalCount,
  acknowledgedCount,
  resolvedCount,
}: Props) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Security findings summary">
      <MetricCard label="Open Findings" value={openCount} icon={AlertTriangle} iconClassName="text-rose-600" />
      <MetricCard label="High / Critical" value={highCriticalCount} icon={ShieldAlert} iconClassName="text-rose-600" />
      <MetricCard label="Acknowledged" value={acknowledgedCount} icon={Clock3} iconClassName="text-zinc-500" />
      <MetricCard label="Resolved" value={resolvedCount} icon={CheckCircle2} iconClassName="text-[var(--color-lime-pulse)]" />
    </section>
  );
}

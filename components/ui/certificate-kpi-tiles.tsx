import { CheckCircle2, Clock3, ShieldAlert, XCircle } from "lucide-react";
import { MetricCard } from "@/components/ui/card";
import type { CertificatesSummary } from "@/lib/certificates-data";

export default function CertificateKpiTiles({ summary }: { summary: CertificatesSummary }) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Certificate validation metrics">
      <MetricCard label="Valid" value={summary.validCount} icon={CheckCircle2} iconClassName="text-[var(--color-lime-pulse)]" />
      <MetricCard label="Expired" value={summary.expiredCount} icon={XCircle} iconClassName="text-rose-600" />
      <MetricCard label="Expiring Soon" value={summary.expiringSoonCount} icon={Clock3} iconClassName="text-amber-600" />
      <MetricCard label="Invalid / Chain Issues" value={summary.invalidCount} icon={ShieldAlert} iconClassName="text-rose-600" />
    </section>
  );
}

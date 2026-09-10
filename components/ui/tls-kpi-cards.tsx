import { KeyRound, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/ui/card";
import type { TlsAnalysisSummary } from "@/lib/tls-data";

export default function TlsKpiCards({ summary }: { summary: TlsAnalysisSummary }) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="TLS key performance metrics">
      <MetricCard label="TLS Sessions" value={summary.tlsSessionsCount} icon={LockKeyhole} iconClassName="text-zinc-500" />
      <MetricCard label="Forward Secrecy" value={summary.pfsCount} description={`${summary.noPfsCount} without`} icon={ShieldCheck} iconClassName="text-zinc-500" />
      <MetricCard label="Strong Ciphers" value={summary.strongCiphersCount} icon={ShieldCheck} iconClassName="text-[var(--color-lime-pulse)]" />
      <MetricCard label="Weak Ciphers" value={summary.weakCiphersCount} icon={ShieldAlert} iconClassName="text-amber-600" />
      <MetricCard label="Key Exchanges" value={summary.keyExchangesCount} icon={KeyRound} iconClassName="text-zinc-500" />
    </section>
  );
}

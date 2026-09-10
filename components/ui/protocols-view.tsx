"use client";

import { useState } from "react";
import type { AnalysisRecord } from "@/lib/securemail-api";
import { buildProtocolSummaries } from "@/lib/protocols-data";
import ProtocolCardsGrid from "@/components/ui/protocol-cards-grid";
import ProtocolSessionsTable from "@/components/ui/protocol-sessions-table";

export default function ProtocolsView({ records }: { records: readonly AnalysisRecord[] }) {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const summaries = buildProtocolSummaries(records);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Email Protocols
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cryptographic posture, TLS upgrade adoption, and port allocations across SMTP, IMAP, and POP3.
          </p>
        </div>
      </div>

      <ProtocolCardsGrid
        summaries={summaries}
        selectedProtocol={selectedProtocol}
        onSelectProtocol={setSelectedProtocol}
      />

      <ProtocolSessionsTable
        records={records}
        activeProtocol={selectedProtocol}
        onSelectProtocol={setSelectedProtocol}
      />
    </div>
  );
}

import type { AnalysisRecord } from "@/lib/securemail-api";

export type ProtocolSummary = {
  protocol: "SMTP" | "IMAP" | "POP3";
  name: string;
  sessionCount: number;
  percentage: number;
  standardPorts: number[];
  tlsPorts: number[];
  withTlsCount: number;
  starttlsCount: number;
  description: string;
};

export function buildProtocolSummaries(records: readonly AnalysisRecord[]): ProtocolSummary[] {
  const total = records.length || 1;
  const smtpRecords = records.filter(r => (r.protocol ?? "").toUpperCase() === "SMTP");
  const imapRecords = records.filter(r => (r.protocol ?? "").toUpperCase() === "IMAP");
  const pop3Records = records.filter(r => (r.protocol ?? "").toUpperCase() === "POP3");

  const countTls = (recs: readonly AnalysisRecord[]) =>
    recs.filter(r => {
      const posture = (r.posture ?? "").toLowerCase();
      return posture.includes("tls") || posture === "modern" || posture === "adequate" || posture === "weak";
    }).length;

  const countStartTls = (recs: readonly AnalysisRecord[]) =>
    recs.filter(r => {
      // Checked via triggers or source labels
      const triggers = Array.isArray(r.trigger_details) ? JSON.stringify(r.trigger_details).toLowerCase() : "";
      return triggers.includes("starttls") || r.source_label?.toLowerCase().includes("starttls");
    }).length;

  return [
    {
      protocol: "SMTP",
      name: "Simple Mail Transfer Protocol",
      sessionCount: smtpRecords.length,
      percentage: Math.round((smtpRecords.length / total) * 1000) / 10,
      standardPorts: [25, 587],
      tlsPorts: [465],
      withTlsCount: countTls(smtpRecords),
      starttlsCount: countStartTls(smtpRecords),
      description: "Used for outbound mail transport and server-to-server relay. STARTTLS commonly upgrades plaintext connections on port 587/25.",
    },
    {
      protocol: "IMAP",
      name: "Internet Message Access Protocol",
      sessionCount: imapRecords.length,
      percentage: Math.round((imapRecords.length / total) * 1000) / 10,
      standardPorts: [143],
      tlsPorts: [993],
      withTlsCount: countTls(imapRecords),
      starttlsCount: countStartTls(imapRecords),
      description: "Client access protocol for retrieving email with folder state synchronization. Direct TLS on port 993 or STARTTLS on 143.",
    },
    {
      protocol: "POP3",
      name: "Post Office Protocol v3",
      sessionCount: pop3Records.length,
      percentage: Math.round((pop3Records.length / total) * 1000) / 10,
      standardPorts: [110],
      tlsPorts: [995],
      withTlsCount: countTls(pop3Records),
      starttlsCount: countStartTls(pop3Records),
      description: "Legacy retrieval protocol that downloads and removes messages from the remote mailbox. Implicit TLS on port 995.",
    },
  ];
}

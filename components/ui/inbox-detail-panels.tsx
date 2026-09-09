"use client";

import { useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  Check,
  CircleSlash2,
  FileText,
  KeyRound,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ContentDetails,
  EmailDetails,
  HeaderDetails,
  InboxDetailResponse,
  InboxDetailTab,
  IpReputationDetails,
  NetworkDetails,
  Section,
  TlsDetails,
} from "@/lib/inbox-data";

const tabs: Array<{ key: InboxDetailTab; label: string; icon: typeof Mail }> = [
  { key: "email", label: "Email", icon: Mail },
  { key: "headers", label: "Headers", icon: FileText },
  { key: "content", label: "Preview", icon: FileText },
  { key: "network", label: "TCP Stream", icon: Network },
  { key: "tls", label: "TLS", icon: LockKeyhole },
];

function valueOrFallback(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Not observed" : String(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not observed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not observed";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not observed";
}

function SectionState({ section }: { section: Section<unknown> }) {
  const redacted = section.state === "redacted";
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        redacted
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-700",
      )}
    >
      {redacted ? (
        <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleSlash2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <div>
        <p className="text-sm font-medium">
          {redacted ? "Data redacted" : "Data unavailable"}
        </p>
        <p className="mt-1 text-xs text-current/70">
          {section.reason ?? "The source did not provide this section."}
        </p>
      </div>
    </div>
  );
}

function DataList({
  entries,
}: {
  entries: Array<[label: string, value: string | number]>;
}) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {entries.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] tracking-tighter text-zinc-500">{label}</dt>
          <dd className="mt-1 break-words text-sm text-zinc-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PanelHeading({ icon: Icon, title }: { icon: typeof Mail; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon aria-hidden="true" className="size-4 text-sky-600" />
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
    </div>
  );
}

function EmailPanel({ section }: { section: Section<EmailDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const email = section.data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={Mail} title="Email envelope" />
        <DataList
          entries={[
            ["From", valueOrFallback(email.from.address)],
            ["To", email.recipients.map((recipient) => valueOrFallback(recipient.address)).join(", ") || "Not observed"],
            ["Subject", valueOrFallback(email.subject)],
            ["Date", formatDate(email.date)],
            ["Message ID", valueOrFallback(email.message_id)],
            ["Protocol", valueOrFallback(email.protocol)],
            ["Direction", valueOrFallback(email.direction)],
          ]}
        />
      </div>
      <p className="text-xs leading-5 text-zinc-600">
        Message metadata is displayed from the selected capture item. It is not a mailbox mutation or delivery action.
      </p>
    </div>
  );
}

function AuthBadge({ label, value }: { label: string; value: string }) {
  const passed = value === "pass";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium",
        passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : value === "fail"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}
    >
      {passed ? <Check aria-hidden="true" className="size-3" /> : <AlertTriangle aria-hidden="true" className="size-3" />}
      {label} {value}
    </span>
  );
}

function HeadersPanel({ section }: { section: Section<HeaderDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const headers = section.data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={FileText} title="Allowlisted headers" />
        <dl className="divide-y divide-zinc-200">
          {headers.fields.map((field) => (
            <div key={field.name} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-xs font-medium text-zinc-600">{field.name}</dt>
              <dd className={cn("break-words text-sm", field.flagged ? "text-rose-700" : "text-zinc-800")}>
                {field.value}
                {field.flagged ? <span className="ml-2 text-[10px] tracking-tighter text-rose-600">suspicious</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={ShieldCheck} title="Authentication results" />
        <div className="flex flex-wrap gap-2">
          <AuthBadge label="SPF" value={headers.authentication.spf} />
          <AuthBadge label="DKIM" value={headers.authentication.dkim} />
          <AuthBadge label="DMARC" value={headers.authentication.dmarc} />
        </div>
      </div>
    </div>
  );
}

function ContentPanel({ section }: { section: Section<ContentDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const content = section.data;
  const hasHtmlPreview = content.format === "html" && content.html !== null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
      <PanelHeading icon={FileText} title="Message preview" />
      <p className="mb-4 text-xs text-zinc-500">
        {hasHtmlPreview
          ? "Rendered directly from the captured HTML body in an isolated preview. Scripts, forms, and navigation are disabled."
          : "Rendered as bounded plain text. Raw message bytes are withheld from the inspection view."}
      </p>
      {hasHtmlPreview ? (
        <iframe
          data-email-preview="html"
          title="Rendered email HTML preview"
          srcDoc={content.html ?? ""}
          sandbox=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-[32rem] w-full rounded-lg border border-zinc-200 bg-white"
        />
      ) : (
        <pre className="max-w-prose whitespace-pre-wrap break-words font-sans text-sm leading-6 text-zinc-800">
          {content.text}
        </pre>
      )}
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-600">
        <span>Format: {content.format}</span>
        <span>·</span>
        <span>{content.truncated ? "Content truncated" : "Complete bounded projection"}</span>
        {content.redactions.length > 0 ? (
          <>
            <span>·</span>
            <span>{content.redactions.length} redactions</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function formatQualityScore(value: number | null) {
  if (value === null) return "Not supplied";
  return `${Math.max(0, Math.min(100, value)).toFixed(0)}/100`;
}

function IpReputationPanel({ details }: { details: IpReputationDetails | null }) {
  if (!details) {
    return (
      <div role="status" className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        IP reputation data was not supplied for this stream.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
      <PanelHeading icon={Network} title="IP reputation" />
      <DataList
        entries={[
          ["IP address", valueOrFallback(details.address)],
          [
            "Spamhaus",
            details.spamhaus_listed === null
              ? "Not supplied"
              : details.spamhaus_listed
                ? "Listed"
                : "Not listed",
          ],
          ["IP quality score", formatQualityScore(details.quality_score)],
          ["Quality level", valueOrFallback(details.quality_level)],
          ["Quality source", valueOrFallback(details.quality_source)],
          ["Hosting / datacenter", formatBoolean(details.hosting)],
          ["Proxy", formatBoolean(details.proxy)],
          ["ISP", valueOrFallback(details.isp)],
          ["Organization", valueOrFallback(details.organization)],
          ["Location", [details.city, details.country].filter(Boolean).join(", ") || "Not supplied"],
          ["Reverse DNS", valueOrFallback(details.reverse_dns)],
        ]}
      />
      {details.issues.length > 0 ? (
        <div className="mt-5 border-t border-zinc-200 pt-4">
          <p className="text-[11px] tracking-tighter text-zinc-500">IP issues</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-800">
            {details.issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NetworkPanel({ section }: { section: Section<NetworkDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const network = section.data;

  return (
    <div className="space-y-5">
      <IpReputationPanel details={network.ip_reputation} />
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={Network} title="TCP stream analysis" />
        <DataList
          entries={[
            ["Stream ID", network.stream_id],
            ["Client", `${valueOrFallback(network.client_ip)}:${valueOrFallback(network.client_port)}`],
            ["Server", `${valueOrFallback(network.server_ip)}:${valueOrFallback(network.server_port)}`],
            ["Start time", formatDate(network.start_time)],
            ["End time", formatDate(network.end_time)],
            ["Duration", network.duration_seconds === null ? "Not observed" : `${network.duration_seconds.toFixed(3)} s`],
            ["Packets", valueOrFallback(network.packet_count)],
            ["Bytes", valueOrFallback(network.byte_count)],
            ["Retransmissions", valueOrFallback(network.retransmissions)],
            ["Out of order", valueOrFallback(network.out_of_order)],
          ]}
        />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={Network} title="TCP flags" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(network.tcp_flags).map(([name, state]) => (
            <div key={name} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-xs">
              <span className="text-zinc-600">{name}</span>
              <span className={state === "present" ? "text-emerald-700" : "text-zinc-600"}>{state}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-600">Evidence references: {network.evidence_refs.join(", ") || "Not observed"}</p>
    </div>
  );
}

function TlsPanel({ section }: { section: Section<TlsDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const tls = section.data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={KeyRound} title="TLS negotiation" />
        <DataList
          entries={[
            ["STARTTLS advertised", formatBoolean(tls.starttls_advertised)],
            ["STARTTLS used", formatBoolean(tls.starttls_used)],
            ["Handshake", formatBoolean(tls.handshake_success)],
            ["Handshake failures", valueOrFallback(tls.handshake_failures)],
            ["Version", valueOrFallback(tls.version)],
            ["Version status", valueOrFallback(tls.version_status)],
            ["Cipher suite", valueOrFallback(tls.cipher_suite)],
            ["Supported versions", tls.supported_versions.join(", ") || "Not observed"],
            ["Supported groups", tls.supported_groups.join(", ") || "Not observed"],
          ]}
        />
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={AlertTriangle} title="TLS warnings" />
        {tls.warnings.length > 0 ? (
          <ul className="space-y-2 text-sm text-zinc-800">
            {tls.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">No warnings supplied.</p>
        )}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <PanelHeading icon={LockKeyhole} title="Certificate posture" />
        <DataList
          entries={[
            ["Present", formatBoolean(tls.certificate.present)],
            ["Expired", formatBoolean(tls.certificate.expired)],
            ["Chain valid", formatBoolean(tls.certificate.chain_valid)],
            ["Hostname mismatch", formatBoolean(tls.certificate.hostname_mismatch)],
            ["Key algorithm", valueOrFallback(tls.certificate.key_algorithm)],
            ["Key length", tls.certificate.key_length_bits === null ? "Not observed" : `${tls.certificate.key_length_bits} bits`],
            ["Signature", valueOrFallback(tls.certificate.signature_algorithm)],
          ]}
        />
      </div>
    </div>
  );
}

function renderPanel(tab: InboxDetailTab, detail: InboxDetailResponse) {
  switch (tab) {
    case "email":
      return <EmailPanel section={detail.email} />;
    case "headers":
      return <HeadersPanel section={detail.headers} />;
    case "content":
      return <ContentPanel section={detail.content} />;
    case "network":
      return <NetworkPanel section={detail.network} />;
    case "tls":
      return <TlsPanel section={detail.tls} />;
  }
}

export default function InboxDetailPanels({
  detail,
  initialTab = "content",
  idPrefix = "inbox",
}: {
  detail: InboxDetailResponse;
  initialTab?: InboxDetailTab;
  idPrefix?: string;
}) {
  const [activeTab, setActiveTab] = useState<InboxDetailTab>(initialTab);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.key);
    document.getElementById(`${idPrefix}-tab-${nextTab.key}`)?.focus();
  };

  return (
    <>
      <div className="border-b border-zinc-200 px-4 pt-3 sm:px-6">
        <div role="tablist" aria-label="Message detail sections" className="flex min-w-max gap-1 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                id={`${idPrefix}-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${idPrefix}-panel-${key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(key)}
                onKeyDown={handleTabKeyDown}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-700",
                  active ? "border-sky-600 text-zinc-900" : "border-transparent text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        id={`${idPrefix}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${activeTab}`}
        tabIndex={0}
        className="p-6 focus-visible:outline-2 focus-visible:outline-sky-700"
      >
        {renderPanel(activeTab, detail)}
      </div>
    </>
  );
}

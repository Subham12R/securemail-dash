"use client";

import { useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleSlash2,
  ExternalLink,
  FileText,
  Flag,
  KeyRound,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  ContentDetails,
  EmailDetails,
  HeaderDetails,
  InboxDetailResponse,
  NetworkDetails,
  Section,
  TlsDetails,
} from "@/lib/inbox-data";

type DetailStatus = "idle" | "loading" | "success" | "error";

type InboxDetailProps = {
  detail: InboxDetailResponse | null;
  status: DetailStatus;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
};

type TabKey = "email" | "headers" | "content" | "network" | "tls";

const tabs: Array<{ key: TabKey; label: string; icon: typeof Mail }> = [
  { key: "email", label: "Email", icon: Mail },
  { key: "headers", label: "Headers", icon: FileText },
  { key: "content", label: "Content", icon: FileText },
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
          ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
          : "border-slate-500/30 bg-slate-800/40 text-slate-300",
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
          <dt className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-200">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PanelHeading({ icon: Icon, title }: { icon: typeof Mail; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon aria-hidden="true" className="size-4 text-sky-300" />
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
    </div>
  );
}

function EmailPanel({ section }: { section: Section<EmailDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const email = section.data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
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
      <p className="text-xs leading-5 text-slate-500">
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
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : value === "fail"
            ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
            : "border-slate-500/30 bg-slate-500/10 text-slate-400",
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
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
        <PanelHeading icon={FileText} title="Allowlisted headers" />
        <dl className="divide-y divide-[#214365]">
          {headers.fields.map((field) => (
            <div key={field.name} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-xs font-medium text-slate-400">{field.name}</dt>
              <dd className={cn("break-words text-sm", field.flagged ? "text-rose-300" : "text-slate-200")}>
                {field.value}
                {field.flagged ? <span className="ml-2 text-[10px] uppercase tracking-wider text-rose-400">suspicious</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
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

  return (
    <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
      <PanelHeading icon={FileText} title="Sanitized message content" />
      <pre className="max-w-prose whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-200">
        {content.text}
      </pre>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
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

function NetworkPanel({ section }: { section: Section<NetworkDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const network = section.data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
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
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
        <PanelHeading icon={Network} title="TCP flags" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(network.tcp_flags).map(([name, state]) => (
            <div key={name} className="flex items-center justify-between rounded border border-[#214365] px-3 py-2 text-xs">
              <span className="text-slate-400">{name}</span>
              <span className={state === "present" ? "text-emerald-300" : "text-slate-500"}>{state}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">Evidence references: {network.evidence_refs.join(", ") || "Not observed"}</p>
    </div>
  );
}

function TlsPanel({ section }: { section: Section<TlsDetails> }) {
  if (section.state !== "available" || !section.data) return <SectionState section={section} />;
  const tls = section.data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
        <PanelHeading icon={KeyRound} title="TLS negotiation" />
        <DataList
          entries={[
            ["STARTTLS advertised", formatBoolean(tls.starttls_advertised)],
            ["STARTTLS used", formatBoolean(tls.starttls_used)],
            ["Handshake", formatBoolean(tls.handshake_success)],
            ["Handshake failures", valueOrFallback(tls.handshake_failures)],
            ["Version", valueOrFallback(tls.version)],
            ["Cipher suite", valueOrFallback(tls.cipher_suite)],
            ["Supported versions", tls.supported_versions.join(", ") || "Not observed"],
            ["Supported groups", tls.supported_groups.join(", ") || "Not observed"],
          ]}
        />
      </div>
      <div className="rounded-lg border border-[#214365] bg-[#0b213e] p-5">
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

function DetailSkeleton() {
  return (
    <div aria-label="Loading selected message" className="space-y-5 p-6">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
      <div className="h-8 w-3/4 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
      <div className="mt-8 h-10 animate-pulse rounded bg-slate-800" />
      <div className="h-56 animate-pulse rounded-lg bg-slate-800" />
    </div>
  );
}

function renderPanel(tab: TabKey, detail: InboxDetailResponse) {
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

export default function InboxDetail({
  detail,
  status,
  error,
  onRetry,
  onBack,
}: InboxDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("email");

  if (status === "loading") return <DetailSkeleton />;

  if (status === "error") {
    return (
      <section className="flex min-h-full flex-col justify-center p-6" aria-label="Selected message error">
        <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-5 text-rose-200">
          <p className="font-medium">Message detail unavailable</p>
          <p className="mt-1 text-sm text-rose-200/75">{error ?? "The source did not return this message."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-rose-300/40 px-3 py-2 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-slate-500/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
            >
              Back to messages
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="flex min-h-full items-center justify-center p-6 text-center" aria-label="No message selected">
        <div>
          <Mail aria-hidden="true" className="mx-auto size-7 text-slate-600" />
          <h2 className="mt-4 text-lg font-medium text-slate-200">Select a message</h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">Choose an Inbox row to inspect its safe message and network data.</p>
        </div>
      </section>
    );
  }

  const item = detail.item;
  const flagged = item.triage_state === "flagged";
  const analysisHref = detail.analysis_ref.request_id
    ? `/analytics?requestId=${encodeURIComponent(detail.analysis_ref.request_id)}`
    : null;

  const selectTab = (key: TabKey) => setActiveTab(key);
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    selectTab(tabs[nextIndex].key);
    document.getElementById(`inbox-tab-${tabs[nextIndex].key}`)?.focus();
  };

  return (
    <section aria-labelledby="selected-message-heading" className="min-h-full bg-[#061426]">
      <header className="border-b border-[#173858] px-6 pb-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
              {flagged ? <Flag aria-hidden="true" className="size-4 text-rose-400" /> : <ShieldCheck aria-hidden="true" className="size-4 text-emerald-400" />}
              <span className={flagged ? "text-rose-300" : "text-emerald-300"}>{flagged ? "Flagged" : "Healthy"}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">{item.protocol}</span>
            </div>
            <h2 id="selected-message-heading" className="mt-2 max-w-3xl text-xl font-semibold tracking-tight text-white">
              {item.subject ?? "Subject unavailable"}
            </h2>
          </div>
          {analysisHref ? (
            <Link
              href={analysisHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-medium text-sky-200 transition-colors hover:border-sky-300/60 hover:bg-sky-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Open analysis
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
          ) : null}
        </div>

        <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex min-w-0 gap-3"><dt className="w-12 shrink-0 text-slate-400">From:</dt><dd className="truncate text-slate-200" title={item.sender.address ?? undefined}>{item.sender.address ?? "Not observed"}</dd></div>
          <div className="flex min-w-0 gap-3"><dt className="w-12 shrink-0 text-slate-400">To:</dt><dd className="truncate text-slate-200">{item.recipients.map((recipient) => recipient.address ?? "Not observed").join(", ") || "Not observed"}</dd></div>
          <div className="flex min-w-0 gap-3"><dt className="w-12 shrink-0 text-slate-400">Time:</dt><dd className="text-slate-200">{formatDate(item.observed_at)}</dd></div>
          <div className="flex min-w-0 gap-3"><dt className="w-12 shrink-0 text-slate-400">Item:</dt><dd className="truncate font-mono text-xs text-slate-400" title={item.mail_item_id}>{item.mail_item_id}</dd></div>
        </dl>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to messages
        </button>
      </header>

      <div className="border-b border-[#173858] px-4 pt-3 sm:px-6">
        <div role="tablist" aria-label="Message detail sections" className="flex min-w-max gap-1 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                id={`inbox-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`inbox-panel-${key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(key)}
                onKeyDown={handleTabKeyDown}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-300",
                  active ? "border-sky-400 text-white" : "border-transparent text-slate-300 hover:border-slate-600 hover:text-white",
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
        id={`inbox-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`inbox-tab-${activeTab}`}
        tabIndex={0}
        className="p-6 focus-visible:outline-2 focus-visible:outline-sky-300"
      >
        {renderPanel(activeTab, detail)}
      </div>
    </section>
  );
}

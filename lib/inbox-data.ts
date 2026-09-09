export type InboxFilter = "all" | "flagged" | "healthy";
export type InboxDetailTab = "email" | "headers" | "content" | "network" | "tls";
export type InboxSource = "fixture" | "live";

export type TriageState = "flagged" | "healthy" | "unavailable";
export type ViewCheckState =
  | "pass"
  | "flagged"
  | "unavailable"
  | "not_observed";
export type SectionState = "available" | "unavailable" | "redacted";
export type AnalysisStatus = "complete" | "degraded" | "unavailable";

export type MailAddress = {
  name: string | null;
  address: string | null;
  host?: string | null;
};

export type ViewCheck = {
  state: ViewCheckState;
  label: string | null;
};

export type AnalysisSummary = {
  request_id: string | null;
  status: AnalysisStatus;
  risk_score: number | null;
  risk_class: string | null;
};

export type InboxListItem = {
  mail_item_id: string;
  capture_id: string | null;
  session_id: string | null;
  protocol: "SMTP" | "IMAP" | "POP3" | string;
  observed_at: string | null;
  sender: MailAddress;
  recipients: MailAddress[];
  subject: string | null;
  preview: string | null;
  triage_state: TriageState;
  view_checks: {
    headers: ViewCheck;
    content: ViewCheck;
    tcp: ViewCheck;
    tls: ViewCheck;
  };
  analysis: AnalysisSummary;
};

export type EmailDetails = {
  from: MailAddress;
  recipients: MailAddress[];
  subject: string | null;
  date: string | null;
  message_id: string | null;
  protocol: string;
  direction: "inbound" | "outbound" | "unknown";
};

export type HeaderField = {
  name: string;
  value: string;
  flagged?: boolean;
};

export type HeaderDetails = {
  fields: HeaderField[];
  authentication: {
    spf: "pass" | "fail" | "neutral" | "not_observed";
    dkim: "pass" | "fail" | "neutral" | "not_observed";
    dmarc: "pass" | "fail" | "neutral" | "not_observed";
  };
};

export type ContentDetails = {
  format: "plain_text";
  text: string;
  truncated: boolean;
  redactions: string[];
};

export type IpReputationDetails = {
  address: string | null;
  spamhaus_listed: boolean | null;
  quality_score: number | null;
  quality_level: string | null;
  quality_source: string | null;
  hosting: boolean | null;
  proxy: boolean | null;
  isp: string | null;
  organization: string | null;
  reverse_dns: string | null;
  country: string | null;
  city: string | null;
  issues: string[];
};

export type NetworkDetails = {
  stream_id: string;
  client_ip: string | null;
  client_port: number | null;
  server_ip: string | null;
  server_port: number | null;
  start_time: string | null;
  end_time: string | null;
  duration_seconds: number | null;
  packet_count: number | null;
  byte_count: number | null;
  retransmissions: number | null;
  out_of_order: number | null;
  tcp_flags: Record<string, "present" | "absent" | "not_observed">;
  evidence_refs: string[];
  ip_reputation: IpReputationDetails | null;
};

export type TlsDetails = {
  starttls_advertised: boolean | null;
  starttls_used: boolean | null;
  handshake_success: boolean | null;
  handshake_failures: number | null;
  version: string | null;
  version_status: string | null;
  cipher_suite: string | null;
  warnings: string[];
  supported_versions: string[];
  supported_groups: string[];
  certificate: {
    present: boolean | null;
    expired: boolean | null;
    chain_valid: boolean | null;
    hostname_mismatch: boolean | null;
    key_algorithm: string | null;
    key_length_bits: number | null;
    signature_algorithm: string | null;
  };
};

export type Section<T> = {
  state: SectionState;
  data: T | null;
  reason: string | null;
  source: string | null;
};

export type InboxListResponse = {
  schema_version: "inbox-list.v1";
  source?: InboxSource;
  total: number;
  skip: number;
  limit: number;
  counts: {
    all: number;
    flagged: number;
    healthy: number;
  };
  items: InboxListItem[];
};

export type InboxDetailResponse = {
  schema_version: "inbox-detail.v1";
  source?: InboxSource;
  item: InboxListItem;
  email: Section<EmailDetails>;
  headers: Section<HeaderDetails>;
  content: Section<ContentDetails>;
  network: Section<NetworkDetails>;
  tls: Section<TlsDetails>;
  analysis_ref: AnalysisSummary;
  diagnostics: string[];
};

export type InboxDataSource = {
  list(input: { skip: number; limit: number }): Promise<InboxListResponse>;
  detail(itemId: string): Promise<InboxDetailResponse | null>;
};

export class InboxDataError extends Error {
  constructor() {
    super("Invalid Inbox response");
    this.name = "InboxDataError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isViewCheck(value: unknown): value is ViewCheck {
  return (
    isRecord(value) &&
    (value.state === "pass" ||
      value.state === "flagged" ||
      value.state === "unavailable" ||
      value.state === "not_observed") &&
    isStringOrNull(value.label)
  );
}

function isAnalysisSummary(value: unknown): value is AnalysisSummary {
  return (
    isRecord(value) &&
    isStringOrNull(value.request_id) &&
    (value.status === "complete" ||
      value.status === "degraded" ||
      value.status === "unavailable") &&
    (typeof value.risk_score === "number" || value.risk_score === null) &&
    isStringOrNull(value.risk_class)
  );
}

function isMailAddress(value: unknown): value is MailAddress {
  return (
    isRecord(value) &&
    isStringOrNull(value.name) &&
    isStringOrNull(value.address) &&
    (value.host === undefined || isStringOrNull(value.host))
  );
}

function isInboxListItem(value: unknown): value is InboxListItem {
  if (!isRecord(value)) return false;
  if (
    typeof value.mail_item_id !== "string" ||
    !isStringOrNull(value.capture_id) ||
    !isStringOrNull(value.session_id) ||
    typeof value.protocol !== "string" ||
    !isStringOrNull(value.observed_at) ||
    !isMailAddress(value.sender) ||
    !Array.isArray(value.recipients) ||
    !value.recipients.every(isMailAddress) ||
    !isStringOrNull(value.subject) ||
    !isStringOrNull(value.preview) ||
    (value.triage_state !== "flagged" &&
      value.triage_state !== "healthy" &&
      value.triage_state !== "unavailable") ||
    !isRecord(value.view_checks) ||
    !isViewCheck(value.view_checks.headers) ||
    !isViewCheck(value.view_checks.content) ||
    !isViewCheck(value.view_checks.tcp) ||
    !isViewCheck(value.view_checks.tls) ||
    !isAnalysisSummary(value.analysis)
  ) {
    return false;
  }

  return true;
}

export function parseInboxListResponse(value: unknown): InboxListResponse {
  if (!isRecord(value)) throw new InboxDataError();

  const counts = value.counts;
  if (
    value.schema_version !== "inbox-list.v1" ||
    (value.source !== undefined && value.source !== "fixture" && value.source !== "live") ||
    !isNonNegativeInteger(value.total) ||
    !isNonNegativeInteger(value.skip) ||
    !isNonNegativeInteger(value.limit) ||
    !isRecord(counts) ||
    !isNonNegativeInteger(counts.all) ||
    !isNonNegativeInteger(counts.flagged) ||
    !isNonNegativeInteger(counts.healthy) ||
    !Array.isArray(value.items) ||
    !value.items.every(isInboxListItem)
  ) {
    throw new InboxDataError();
  }

  return value as unknown as InboxListResponse;
}

function isSection(value: unknown): value is Section<unknown> {
  return (
    isRecord(value) &&
    (value.state === "available" ||
      value.state === "unavailable" ||
      value.state === "redacted") &&
    (value.data === null || value.data !== undefined) &&
    isStringOrNull(value.reason) &&
    isStringOrNull(value.source)
  );
}

export function parseInboxDetailResponse(value: unknown): InboxDetailResponse {
  if (
    !isRecord(value) ||
    value.schema_version !== "inbox-detail.v1" ||
    (value.source !== undefined && value.source !== "fixture" && value.source !== "live") ||
    !isInboxListItem(value.item) ||
    !isSection(value.email) ||
    !isSection(value.headers) ||
    !isSection(value.content) ||
    !isSection(value.network) ||
    !isSection(value.tls) ||
    !isAnalysisSummary(value.analysis_ref) ||
    !Array.isArray(value.diagnostics) ||
    !value.diagnostics.every((entry) => typeof entry === "string")
  ) {
    throw new InboxDataError();
  }

  return value as unknown as InboxDetailResponse;
}

export function getInboxFilterFromQuery(value: unknown): InboxFilter {
  return value === "flagged" || value === "healthy" || value === "all" ? value : "all";
}

export function getInboxTabFromQuery(value: unknown): InboxDetailTab {
  return value === "email" || value === "headers" || value === "content" || value === "network" || value === "tls"
    ? value
    : "content";
}

export function filterInboxItems(
  items: readonly InboxListItem[],
  filter: InboxFilter,
): InboxListItem[] {
  if (filter === "all") return [...items];
  return items.filter((item) => item.triage_state === filter);
}

function available<T>(data: T, source = "fixture"): Section<T> {
  return { state: "available", data, reason: null, source };
}

function unavailable<T>(reason: string): Section<T> {
  return { state: "unavailable", data: null, reason, source: "fixture" };
}

function redacted<T>(reason: string): Section<T> {
  return { state: "redacted", data: null, reason, source: "fixture" };
}

function address(
  value: string,
  name: string | null = null,
  host: string | null = value.split("@")[1] ?? null,
): MailAddress {
  return { address: value, name, host };
}

function checks(
  flagged = false,
  unavailableView: keyof InboxListItem["view_checks"] | null = null,
): InboxListItem["view_checks"] {
  const check = (view: keyof InboxListItem["view_checks"]): ViewCheck => {
    if (unavailableView === view) return { state: "unavailable", label: "Unavailable" };
    return flagged
      ? { state: "flagged", label: "Warning" }
      : { state: "pass", label: "Checked" };
  };

  return {
    headers: check("headers"),
    content: check("content"),
    tcp: check("tcp"),
    tls: check("tls"),
  };
}

function createItem(input: {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  protocol: "SMTP" | "IMAP" | "POP3";
  flagged: boolean;
  unavailableView?: keyof InboxListItem["view_checks"];
  requestId?: string | null;
  riskScore?: number | null;
  riskClass?: string | null;
}): InboxListItem {
  const host = input.sender.split("@")[1] ?? null;
  return {
    mail_item_id: input.id,
    capture_id: "pcap-inbox-preview",
    session_id: `${input.id}-session`,
    protocol: input.protocol,
    observed_at: input.time,
    sender: address(input.sender, null, host),
    recipients: [address("user@company.com", null, "company.com")],
    subject: input.subject,
    preview: input.preview,
    triage_state: input.flagged ? "flagged" : "healthy",
    view_checks: checks(input.flagged, input.unavailableView ?? null),
    analysis: {
      request_id: input.requestId === undefined ? `req-${input.id}` : input.requestId,
      status: input.requestId === null ? "unavailable" : "complete",
      risk_score: input.riskScore ?? (input.flagged ? 0.78 : 0.08),
      risk_class: input.riskClass ?? (input.flagged ? "high" : "informational"),
    },
  };
}

const fixtureItems: InboxListItem[] = [
  createItem({
    id: "inbox-item-flagged-1",
    sender: "alerts@tmpvault.com",
    subject: "Security Alert: Account Update",
    preview: "Please verify your account ...",
    time: "2025-04-24T10:12:00Z",
    protocol: "SMTP",
    flagged: true,
    requestId: "req-inbox-flagged-1",
  }),
  createItem({
    id: "inbox-item-healthy-1",
    sender: "newsletter@bigcommerce.net",
    subject: "Order confirmation",
    preview: "Your order #123456 has been...",
    time: "2025-04-24T10:24:00Z",
    protocol: "SMTP",
    flagged: false,
  }),
  createItem({
    id: "inbox-item-healthy-2",
    sender: "john.doe@company.com",
    subject: "Re: Project update",
    preview: "Here are the latest updates...",
    time: "2025-04-24T09:47:00Z",
    protocol: "IMAP",
    flagged: false,
  }),
  createItem({
    id: "inbox-item-healthy-3",
    sender: "support@amazon.com",
    subject: "Your Amazon order is on the way",
    preview: "Tracking number: 1Z9999...",
    time: "2025-04-24T09:21:00Z",
    protocol: "SMTP",
    flagged: false,
  }),
  createItem({
    id: "inbox-item-healthy-4",
    sender: "billing@secure-payments.com",
    subject: "Invoice #78432",
    preview: "Your invoice is attached...",
    time: "2025-04-24T08:53:00Z",
    protocol: "SMTP",
    flagged: false,
  }),
  createItem({
    id: "inbox-item-healthy-5",
    sender: "no-reply@google.com",
    subject: "Security checkup",
    preview: "Keep your account safe...",
    time: "2025-04-24T08:27:00Z",
    protocol: "IMAP",
    flagged: false,
  }),
  createItem({
    id: "inbox-item-healthy-6",
    sender: "marketing@trustedbrand.com",
    subject: "Special offer just for you",
    preview: "Limited time only!",
    time: "2025-04-24T07:56:00Z",
    protocol: "POP3",
    flagged: false,
    unavailableView: "content",
  }),
  createItem({
    id: "inbox-item-healthy-7",
    sender: "cdn@updates.microsoft.com",
    subject: "Windows security update",
    preview: "Your device will be updated...",
    time: "2025-04-24T07:34:00Z",
    protocol: "IMAP",
    flagged: false,
  }),
  createItem({
    id: "inbox-item-flagged-2",
    sender: "notifications@slack.com",
    subject: "New message in #general",
    preview: "Team discussion...",
    time: "2025-04-24T06:58:00Z",
    protocol: "SMTP",
    flagged: true,
    riskScore: 0.66,
  }),
  createItem({
    id: "inbox-item-flagged-3",
    sender: "alerts@tmpvault.com",
    subject: "Suspicious Login Attempt",
    preview: "We noticed a login from a new...",
    time: "2025-04-24T06:12:00Z",
    protocol: "SMTP",
    flagged: true,
    riskScore: 0.91,
    riskClass: "critical",
  }),
  createItem({
    id: "inbox-item-flagged-4",
    sender: "payment@business-secure.net",
    subject: "Payment Confirmation",
    preview: "Your payment has been received...",
    time: "2025-04-24T03:17:00Z",
    protocol: "SMTP",
    flagged: true,
    riskScore: 0.74,
  }),
  createItem({
    id: "inbox-item-flagged-5",
    sender: "no-reply@google.com",
    subject: "Security checkup",
    preview: "Keep your account safe...",
    time: "2025-04-24T08:27:00Z",
    protocol: "IMAP",
    flagged: true,
    riskScore: 0.71,
  }),
];

function emailDetails(item: InboxListItem): EmailDetails {
  return {
    from: item.sender,
    recipients: item.recipients,
    subject: item.subject,
    date: item.observed_at,
    message_id: `<${item.mail_item_id}@preview.securemailscope>`,
    protocol: item.protocol,
    direction: "inbound",
  };
}

function headerDetails(item: InboxListItem): HeaderDetails {
  return {
    fields: [
      { name: "From", value: item.sender.address ?? "Not observed" },
      { name: "Reply-To", value: "no-reply@tmpvault.com", flagged: item.triage_state === "flagged" },
      { name: "Return-Path", value: "bounce@tmpvault.com", flagged: item.triage_state === "flagged" },
      { name: "Subject", value: item.subject ?? "Not observed" },
    ],
    authentication: {
      spf: item.triage_state === "flagged" ? "fail" : "pass",
      dkim: item.triage_state === "flagged" ? "fail" : "pass",
      dmarc: item.triage_state === "flagged" ? "fail" : "pass",
    },
  };
}

function contentDetails(item: InboxListItem): ContentDetails {
  return {
    format: "plain_text",
    text:
      item.triage_state === "flagged"
        ? "We detected unusual activity on your account. Verify your details using the approved security portal."
        : "This is a bounded preview message supplied by the Inbox fixture.",
    truncated: false,
    redactions: [],
  };
}

function networkDetails(item: InboxListItem): NetworkDetails {
  return {
    stream_id: `${item.mail_item_id}-stream`,
    client_ip: "104.195.127.17",
    client_port: 37533,
    server_ip: "109.123.254.170",
    server_port: 25,
    start_time: "2025-04-24T19:30:37.027Z",
    end_time: "2025-04-24T19:30:42.916Z",
    duration_seconds: 5.889,
    packet_count: 61,
    byte_count: 38507,
    retransmissions: item.triage_state === "flagged" ? 2 : 0,
    out_of_order: item.triage_state === "flagged" ? 1 : 0,
    tcp_flags: {
      SYN: "present",
      ACK: "present",
      PSH: item.triage_state === "flagged" ? "present" : "absent",
      URG: item.triage_state === "flagged" ? "present" : "absent",
      RST: "absent",
    },
    evidence_refs: [`${item.capture_id}:stream:${item.session_id}`],
    ip_reputation: {
      address: "104.195.127.17",
      spamhaus_listed: false,
      quality_score: item.triage_state === "flagged" ? 78 : 15,
      quality_level: item.triage_state === "flagged" ? "elevated" : "low",
      quality_source: "fixture",
      hosting: true,
      proxy: false,
      isp: "Example Network",
      organization: "Example Organization",
      reverse_dns: "mail.example.test",
      country: "United States",
      city: "Austin",
      issues: item.triage_state === "flagged" ? ["Preview IP reputation requires review."] : [],
    },
  };
}

function tlsDetails(item: InboxListItem): TlsDetails {
  return {
    starttls_advertised: true,
    starttls_used: true,
    handshake_success: true,
    handshake_failures: item.triage_state === "flagged" ? 3 : 0,
    version: item.triage_state === "flagged" ? "TLS1.0" : "TLS1.3",
    version_status: item.triage_state === "flagged" ? "deprecated" : "current",
    cipher_suite:
      item.triage_state === "flagged"
        ? "TLS_RSA_WITH_3DES_EDE_CBC_SHA"
        : "TLS_AES_256_GCM_SHA384",
    supported_versions: ["TLS 1.3", "TLS 1.2"],
    supported_groups: ["x25519", "secp256r1"],
    certificate: {
      present: true,
      expired: item.triage_state === "flagged",
      chain_valid: item.triage_state !== "flagged",
      hostname_mismatch: item.triage_state === "flagged",
      key_algorithm: "RSA",
      key_length_bits: item.triage_state === "flagged" ? 1024 : 2048,
      signature_algorithm: item.triage_state === "flagged" ? "SHA1-RSA" : "SHA256-RSA",
    },
    warnings: item.triage_state === "flagged" ? ["Legacy TLS version requires review."] : [],
  };
}

function createDetail(item: InboxListItem): InboxDetailResponse {
  const content =
    item.mail_item_id === "inbox-item-healthy-6"
      ? unavailable<ContentDetails>("The capture did not expose message content.")
      : available(contentDetails(item));
  const headers =
    item.mail_item_id === "inbox-item-flagged-5"
      ? redacted<HeaderDetails>("The source withheld unrestricted headers.")
      : available(headerDetails(item));

  return {
    schema_version: "inbox-detail.v1",
    source: "fixture",
    item,
    email: available(emailDetails(item)),
    headers,
    content,
    network: available(networkDetails(item)),
    tls: available(tlsDetails(item)),
    analysis_ref: item.analysis,
    diagnostics: item.triage_state === "flagged" ? ["Preview finding data is fixture-backed."] : [],
  };
}

const fixtureDetails = new Map(
  fixtureItems.map((item) => [item.mail_item_id, createDetail(item)]),
);

const fixtureSource: InboxDataSource = {
  async list({ skip, limit }) {
    const safeSkip = Math.max(0, Math.floor(skip));
    const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));
    const flagged = fixtureItems.filter((item) => item.triage_state === "flagged").length;
    const healthy = fixtureItems.filter((item) => item.triage_state === "healthy").length;

    return {
      schema_version: "inbox-list.v1",
      source: "fixture",
      total: fixtureItems.length,
      skip: safeSkip,
      limit: safeLimit,
      counts: { all: fixtureItems.length, flagged, healthy },
      items: fixtureItems.slice(safeSkip, safeSkip + safeLimit),
    };
  },
  async detail(itemId) {
    return fixtureDetails.get(itemId) ?? null;
  },
};

export function getInboxDataSource(): InboxDataSource {
  return fixtureSource;
}

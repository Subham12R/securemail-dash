import {
  InboxDataError,
  getInboxDataSource,
  parseInboxDetailResponse,
  parseInboxListResponse,
  type AnalysisSummary,
  type ContentDetails,
  type EmailDetails,
  type HeaderDetails,
  type InboxDataSource,
  type InboxDetailResponse,
  type InboxListItem,
  type InboxListResponse,
  type IpReputationDetails,
  type MailAddress,
  type NetworkDetails,
  type Section,
  type TlsDetails,
  type ViewCheck,
} from "./inbox-data.ts";
import { LIVE_DATA_CACHE_SECONDS } from "./live-data.ts";

export const INBOX_CACHE_TAG = "securemailscope:inbox";
const DEFAULT_INBOX_API_URL = "https://inbox.tmpvault.com/api/emails";
const MAX_FIELD_LENGTH = 2_048;
const MAX_CONTENT_LENGTH = 12_000;
const MAX_EVIDENCE_LENGTH = 160;
const REQUEST_TIMEOUT_MS = 10_000;

type RecordValue = Record<string, unknown>;

type NormalizedExternal = {
  item: InboxListItem;
  email: Section<EmailDetails>;
  headers: Section<HeaderDetails>;
  content: Section<ContentDetails>;
  network: Section<NetworkDetails>;
  tls: Section<TlsDetails>;
  diagnostics: string[];
};

function record(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function valueAt(source: RecordValue | null, key: string): unknown {
  return source?.[key];
}

function boundedString(value: unknown, maxLength = MAX_FIELD_LENGTH): string | null {
  if (typeof value !== "string") return null;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function stringAt(source: RecordValue | null, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = boundedString(valueAt(source, key));
    if (value !== null) return value;
  }
  return null;
}

function stringOrNumberAt(source: RecordValue | null, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = valueAt(source, key);
    if (typeof value === "string") return boundedString(value);
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function numberAt(source: RecordValue | null, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = valueAt(source, key);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function booleanAt(source: RecordValue | null, ...keys: string[]): boolean | null {
  for (const key of keys) {
    const value = valueAt(source, key);
    if (typeof value === "boolean") return value;
  }
  return null;
}

function stringArray(value: unknown, maxLength = MAX_FIELD_LENGTH): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => boundedString(entry, maxLength))
    .filter((entry): entry is string => entry !== null);
}

function hostFor(address: string | null) {
  if (!address) return null;
  const at = address.lastIndexOf("@");
  return at > 0 && at < address.length - 1 ? address.slice(at + 1) : null;
}

function mailAddress(value: unknown): MailAddress | null {
  if (typeof value === "string") {
    const address = boundedString(value);
    return address ? { name: null, address, host: hostFor(address) } : null;
  }

  const source = record(value);
  if (!source) return null;

  const address = stringAt(source, "Address", "address", "email");
  const name = stringAt(source, "Name", "name");
  if (!address && !name) return null;
  return { name, address, host: hostFor(address) };
}

function mailAddresses(value: unknown): MailAddress[] {
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .map(mailAddress)
    .filter((entry): entry is MailAddress => entry !== null);
}

function firstMailAddress(...values: unknown[]): MailAddress {
  for (const value of values) {
    const address = mailAddresses(value)[0];
    if (address) return address;
  }
  return { name: null, address: null, host: null };
}

function allMailAddresses(...values: unknown[]): MailAddress[] {
  for (const value of values) {
    const addresses = mailAddresses(value);
    if (addresses.length > 0) return addresses;
  }
  return [];
}

function addressLabel(address: MailAddress) {
  if (address.name && address.address) return `${address.name} <${address.address}>`;
  return address.address ?? address.name ?? "Not observed";
}

function headerValue(value: unknown): string | null {
  const direct = boundedString(value);
  if (direct !== null) return direct;

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => {
        const address = mailAddress(entry);
        if (address) return addressLabel(address);
        return boundedString(entry);
      })
      .filter((entry): entry is string => entry !== null);
    return parts.length > 0 ? boundedString(parts.join(", ")) : null;
  }

  return null;
}

function normalizedRiskScore(value: number | null) {
  if (value === null) return null;
  if (value >= 0 && value <= 1) return value;
  if (value >= 0 && value <= 100) return value / 100;
  return null;
}

function analysisStatus(
  ai: RecordValue | null,
  requestId: string | null,
  riskScore: number | null,
): AnalysisSummary["status"] {
  const status = stringAt(ai, "status")?.toLowerCase();
  if (status === "complete" || status === "completed" || status === "success") return "complete";
  if (status) return "degraded";
  if (requestId !== null || riskScore !== null) return "degraded";
  return "unavailable";
}

function observedCheck(observed: boolean, label: string): ViewCheck {
  return observed
    ? { state: "not_observed", label }
    : { state: "unavailable", label: "Unavailable" };
}

function available<T>(data: T): Section<T> {
  return { state: "available", data, reason: null, source: "live" };
}

function unavailable<T>(reason: string): Section<T> {
  return { state: "unavailable", data: null, reason, source: "live" };
}

function normalizeAuthResult(value: unknown): HeaderDetails["authentication"]["spf"] {
  const result = typeof value === "string" ? value.toLowerCase() : "";
  if (result === "pass" || result === "fail" || result === "neutral") return result;
  return "not_observed";
}

function normalizeHeaders(
  headers: RecordValue,
  analysis: RecordValue | null,
): HeaderDetails {
  const fields: HeaderDetails["fields"] = [];
  const analysisHeaders = record(valueAt(analysis, "Headers"));
  const allowedHeaders = [
    "From",
    "To",
    "Subject",
    "Date",
    "MessageID",
    "Reply-To",
    "Return-Path",
    "Content-Type",
    "MIMEVersion",
    "Received",
    "DKIM",
  ];

  for (const name of allowedHeaders) {
    const value = headerValue(valueAt(headers, name));
    if (value === null) continue;
    const flagged =
      (name === "From" && booleanAt(analysisHeaders, "SuspiciousFrom") === true) ||
      (name === "Reply-To" && booleanAt(analysisHeaders, "SuspiciousReplyTo") === true) ||
      (name === "Return-Path" && booleanAt(analysisHeaders, "FromReturnMismatch") === true);
    fields.push(flagged ? { name, value, flagged: true } : { name, value });
  }

  const auth = record(valueAt(analysis, "Auth"));
  return {
    fields,
    authentication: {
      spf: normalizeAuthResult(valueAt(record(valueAt(auth, "SPF")), "Result")),
      dkim: normalizeAuthResult(valueAt(record(valueAt(auth, "DKIM")), "Result")),
      dmarc: normalizeAuthResult(valueAt(record(valueAt(auth, "DMARC")), "Result")),
    },
  };
}

function decodeCodePoint(value: string, radix: number) {
  const codePoint = Number.parseInt(value, radix);
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : " ";
}

function htmlToPlainText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(code, 16))
    .replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(code, 10))
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function redactSensitiveText(value: string) {
  const redactions = new Set<string>();
  let text = value;
  const replacements: Array<[name: string, pattern: RegExp]> = [
    ["credential", /\b(password|passwd|passcode)\b\s*[:=]\s*[^\n]{0,200}/gi],
    ["secret", /\b(api[- ]?key|access[- ]?token|token|secret)\b\s*[:=]\s*[^\n]{0,200}/gi],
    ["private key", /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi],
  ];

  for (const [name, pattern] of replacements) {
    const nextText = text.replace(pattern, () => {
      redactions.add(name);
      return `[${name} redacted]`;
    });
    text = nextText;
  }

  return { text, redactions: [...redactions] };
}

function normalizeContent(email: RecordValue): ContentDetails | null {
  const textBody = valueAt(email, "TextBody");
  const htmlBody = valueAt(email, "HTMLBody");
  const rawBody = valueAt(email, "RawBody");
  const source =
    typeof textBody === "string"
      ? textBody
      : typeof htmlBody === "string"
        ? htmlToPlainText(htmlBody)
        : typeof rawBody === "string"
          ? htmlToPlainText(rawBody)
          : null;
  if (!source) return null;

  const boundedSource = boundedString(source, MAX_CONTENT_LENGTH * 4);
  if (!boundedSource) return null;
  const safe = redactSensitiveText(boundedSource);
  const text = boundedString(safe.text, MAX_CONTENT_LENGTH);
  if (!text) return null;

  return {
    format: "plain_text",
    text,
    truncated: source.length > MAX_CONTENT_LENGTH || safe.text.length > MAX_CONTENT_LENGTH,
    redactions: safe.redactions,
  };
}

function normalizeTcpFlag(value: unknown): "present" | "absent" | "not_observed" {
  if (value === true || value === 1) return "present";
  if (value === false || value === 0) return "absent";
  if (typeof value !== "string") return "not_observed";

  switch (value.trim().toLowerCase()) {
    case "present":
    case "true":
    case "set":
    case "ok":
    case "1":
      return "present";
    case "absent":
    case "false":
    case "not_present":
    case "unset":
    case "0":
      return "absent";
    default:
      return "not_observed";
  }
}

function normalizeIpReputation(
  analysisIp: RecordValue | null,
  stream: RecordValue,
): IpReputationDetails | null {
  const info = record(valueAt(analysisIp, "IPInfo"));
  const spamhaus = record(valueAt(analysisIp, "Spamhaus"));
  const fraud = record(valueAt(analysisIp, "Fraud"));
  const address = stringAt(analysisIp, "IP") ?? stringAt(stream, "ClientIP");

  if (!analysisIp && address === null) return null;

  return {
    address,
    spamhaus_listed: booleanAt(spamhaus, "Listed"),
    quality_score: numberAt(fraud, "Score"),
    quality_level: stringAt(fraud, "Level"),
    quality_source: stringAt(fraud, "Source"),
    hosting: booleanAt(info, "Hosting"),
    proxy: booleanAt(info, "Proxy"),
    isp: stringAt(info, "ISP"),
    organization: stringAt(info, "Org", "Organization"),
    reverse_dns: stringAt(info, "ReverseDNS"),
    country: stringAt(info, "Country"),
    city: stringAt(info, "City"),
    issues: stringArray(valueAt(analysisIp, "Issues"), MAX_EVIDENCE_LENGTH),
  };
}

function normalizeNetwork(
  stream: RecordValue,
  observations: RecordValue | null,
  tcp: RecordValue | null,
  evidenceRefs: string[],
  analysisIp: RecordValue | null,
): NetworkDetails {
  const clientBytes = numberAt(stream, "ClientBytes");
  const serverBytes = numberAt(stream, "ServerBytes");
  const derivedBytes =
    clientBytes !== null && serverBytes !== null ? clientBytes + serverBytes : clientBytes ?? serverBytes;
  const durationMs = numberAt(stream, "DurationMs");
  const rawFlags = record(valueAt(tcp, "Flags"));
  const tcpFlags: NetworkDetails["tcp_flags"] = {};

  for (const [name, value] of Object.entries(rawFlags ?? {})) {
    tcpFlags[name] = normalizeTcpFlag(value);
  }

  return {
    stream_id: stringOrNumberAt(stream, "StreamID") ?? "Not observed",
    client_ip: stringAt(stream, "ClientIP"),
    client_port: numberAt(stream, "ClientPort"),
    server_ip: stringAt(stream, "ServerIP"),
    server_port: numberAt(stream, "ServerPort"),
    start_time: stringAt(stream, "StartTime"),
    end_time: stringAt(stream, "EndTime"),
    duration_seconds:
      durationMs !== null
        ? durationMs / 1000
        : numberAt(observations, "session_duration_seconds"),
    packet_count: numberAt(observations, "packet_count") ?? numberAt(stream, "TotalPackets"),
    byte_count: numberAt(observations, "byte_count") ?? derivedBytes,
    retransmissions: numberAt(observations, "retransmission_count"),
    out_of_order: numberAt(observations, "out_of_order_count"),
    tcp_flags: tcpFlags,
    evidence_refs: evidenceRefs,
    ip_reputation: normalizeIpReputation(analysisIp, stream),
  };
}

function normalizeTls(
  stream: RecordValue,
  streamTls: RecordValue,
  analysisTls: RecordValue | null,
  observations: RecordValue | null,
): TlsDetails {
  const certificate = record(valueAt(analysisTls, "Certificate"));
  const supportedVersions = stringArray(valueAt(streamTls, "ClientSupportedVersions"));
  const supportedGroups = stringArray(valueAt(streamTls, "ClientSupportedGroups"));

  return {
    starttls_advertised:
      booleanAt(stream, "HasSTARTTLS") ?? booleanAt(observations, "starttls_advertised"),
    starttls_used: booleanAt(observations, "starttls_used"),
    handshake_success: booleanAt(observations, "handshake_success"),
    handshake_failures: numberAt(observations, "handshake_failures"),
    version:
      stringAt(analysisTls, "Version") ??
      stringAt(streamTls, "Version") ??
      stringAt(observations, "tls_version"),
    version_status: stringAt(analysisTls, "VersionStatus"),
    cipher_suite:
      stringAt(analysisTls, "CipherSuite") ??
      stringAt(streamTls, "CipherSuite") ??
      stringAt(observations, "cipher_suite"),
    supported_versions: supportedVersions,
    supported_groups: supportedGroups,
    warnings: stringArray(valueAt(analysisTls, "Warnings"), MAX_EVIDENCE_LENGTH),
    certificate: {
      present:
        booleanAt(certificate, "Present", "present") ??
        booleanAt(observations, "cert_present"),
      expired:
        booleanAt(certificate, "Expired", "expired") ??
        booleanAt(observations, "cert_expired"),
      chain_valid:
        booleanAt(certificate, "ChainValid", "chain_valid") ??
        booleanAt(observations, "cert_chain_valid"),
      hostname_mismatch:
        booleanAt(certificate, "HostnameMismatch", "hostname_mismatch") ??
        booleanAt(observations, "hostname_mismatch"),
      key_algorithm:
        stringAt(certificate, "KeyAlgorithm", "key_algorithm") ??
        stringAt(observations, "cert_key_algorithm"),
      key_length_bits:
        numberAt(certificate, "KeyLengthBits", "key_length_bits") ??
        numberAt(observations, "cert_key_length_bits"),
      signature_algorithm:
        stringAt(certificate, "SignatureAlgorithm", "signature_algorithm") ??
        stringAt(observations, "cert_signature_algorithm") ??
        stringAt(observations, "signature_algorithm"),
    },
  };
}

function normalizeExternalRecord(value: unknown): NormalizedExternal {
  const raw = record(value);
  const email = record(valueAt(raw, "email"));
  const headers = record(valueAt(email, "Headers"));
  const stream = record(valueAt(raw, "stream"));
  const streamTls = record(valueAt(stream, "TLS"));
  const analysis = record(valueAt(raw, "analysis"));
  const risk = record(valueAt(analysis, "Risk"));
  const analysisAuth = record(valueAt(analysis, "Auth"));
  const analysisTls = record(valueAt(analysis, "TLS"));
  const analysisIp = record(valueAt(analysis, "IP"));
  const tcp = record(valueAt(analysis, "TCP"));
  const ai = record(valueAt(raw, "ai"));
  const aiResponse = record(valueAt(ai, "response"));
  const aiSession = record(valueAt(aiResponse, "session"));
  const observations = record(valueAt(aiSession, "observations"));

  const mailItemId = stringAt(raw, "id");
  if (!mailItemId) throw new InboxDataError();

  const captureId = stringAt(raw, "email_id") ?? stringAt(email, "ID");
  const streamId = stringOrNumberAt(stream, "StreamID");
  const sessionId =
    stringAt(aiSession, "session_id") ??
    (captureId && streamId ? `${captureId}:stream:${streamId}` : null);
  const requestId = stringAt(ai, "request_id") ?? stringAt(aiResponse, "request_id");
  const riskScore = normalizedRiskScore(
    numberAt(raw, "risk_score") ?? numberAt(risk, "Score"),
  );
  const riskClass = stringAt(raw, "risk_level") ?? stringAt(risk, "Level");
  const explicitFlag = booleanAt(raw, "flagged") ?? booleanAt(risk, "Flagged");
  const inferredFlag = /^(critical|high)$/i.test(riskClass ?? "");
  const hasTriageSignal = explicitFlag !== null || riskScore !== null || riskClass !== null;
  const flagged = explicitFlag ?? inferredFlag;
  const sender = firstMailAddress(
    valueAt(raw, "from"),
    valueAt(headers, "From"),
    valueAt(email, "EnvelopeFrom"),
  );
  const recipients = allMailAddresses(
    valueAt(raw, "to"),
    valueAt(headers, "To"),
    valueAt(email, "EnvelopeTo"),
  );
  const subject = stringAt(raw, "subject") ?? stringAt(headers, "Subject");
  const observedAt = stringAt(raw, "received_at") ?? stringAt(email, "ReceivedAt");
  const content = normalizeContent(email ?? {});
  const evidenceRefs = stringArray(valueAt(record(valueAt(aiResponse, "result")), "evidence_refs"), MAX_EVIDENCE_LENGTH);
  const checks = {
    headers: observedCheck(headers !== null, "Available"),
    content: observedCheck(content !== null, "Available"),
    tcp: observedCheck(stream !== null || tcp !== null, "Available"),
    tls: observedCheck(streamTls !== null || analysisTls !== null, "Available"),
  };
  const analysisSummary: AnalysisSummary = {
    request_id: requestId,
    status: analysisStatus(ai, requestId, riskScore),
    risk_score: riskScore,
    risk_class: riskClass,
  };
  const item: InboxListItem = {
    mail_item_id: mailItemId,
    capture_id: captureId,
    session_id: sessionId,
    protocol: stringAt(aiSession, "protocol") ?? stringAt(raw, "protocol") ?? "Unknown",
    observed_at: observedAt,
    sender,
    recipients,
    subject,
    preview: content ? boundedString(content.text.replace(/\s+/g, " ").trim(), 180) : null,
    triage_state: hasTriageSignal ? (flagged ? "flagged" : "healthy") : "unavailable",
    view_checks: checks,
    analysis: analysisSummary,
  };
  const emailDetails: EmailDetails = {
    from: sender,
    recipients,
    subject,
    date: stringAt(headers, "Date") ?? observedAt,
    message_id: stringAt(headers, "MessageID", "Message-Id"),
    protocol: item.protocol,
    direction: "unknown",
  };
  const network = stream
    ? normalizeNetwork(stream, observations, tcp, evidenceRefs, analysisIp)
    : null;
  const tls = streamTls || analysisTls
    ? normalizeTls(stream ?? {}, streamTls ?? {}, analysisTls, observations)
    : null;

  const diagnostics: string[] = [];
  if (content === null && valueAt(email, "HTMLBody") !== undefined) {
    diagnostics.push("HTML-only message content is withheld from the safe text view.");
  }
  if (analysisAuth === null && analysis === null) {
    diagnostics.push("Live analysis data was not supplied for this message.");
  }

  return {
    item,
    email: email ? available(emailDetails) : unavailable("The source did not provide email metadata."),
    headers: headers
      ? available(normalizeHeaders(headers, analysis))
      : unavailable("The source did not provide message headers."),
    content: content
      ? available(content)
      : unavailable("The source did not provide a safe plain-text projection."),
    network: network
      ? available(network)
      : unavailable("The source did not provide a TCP stream."),
    tls: tls
      ? available(tls)
      : unavailable("The source did not provide TLS negotiation data."),
    diagnostics,
  };
}

function envelopeData(payload: unknown, expectArray: boolean): unknown {
  const source = record(payload);
  if (!source || source.success !== true) throw new InboxDataError();
  const data = valueAt(source, "data");
  if (expectArray && data === null && numberAt(record(valueAt(source, "meta")), "total") === 0) {
    return [];
  }
  if (expectArray ? !Array.isArray(data) : !record(data)) throw new InboxDataError();
  return data;
}

export function normalizeInboxApiList(
  payload: unknown,
  input: { skip: number; limit: number },
): InboxListResponse {
  const data = envelopeData(payload, true) as unknown[];
  const normalized = data.map(normalizeExternalRecord);
  const flagged = normalized.filter((entry) => entry.item.triage_state === "flagged").length;
  const healthy = normalized.filter((entry) => entry.item.triage_state === "healthy").length;
  const meta = record(record(payload)?.meta);
  const total = numberAt(meta, "total");
  const response: InboxListResponse = {
    schema_version: "inbox-list.v1",
    source: "live",
    total: total !== null && Number.isInteger(total) && total >= 0 ? total : normalized.length,
    skip: Math.max(0, Math.floor(input.skip)),
    limit: Math.max(1, Math.floor(input.limit)),
    counts: { all: normalized.length, flagged, healthy },
    items: normalized.map((entry) => entry.item),
  };
  return parseInboxListResponse(response);
}

export function normalizeInboxApiDetail(payload: unknown): InboxDetailResponse {
  const data = envelopeData(payload, false);
  const normalized = normalizeExternalRecord(data);
  return parseInboxDetailResponse({
    schema_version: "inbox-detail.v1",
    source: "live",
    item: normalized.item,
    email: normalized.email,
    headers: normalized.headers,
    content: normalized.content,
    network: normalized.network,
    tls: normalized.tls,
    analysis_ref: normalized.item.analysis,
    diagnostics: normalized.diagnostics,
  });
}

function configuredInboxUrl() {
  const value = process.env.SECUREMAILSCOPE_INBOX_URL ?? DEFAULT_INBOX_API_URL;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Live Inbox source is misconfigured");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Live Inbox source is misconfigured");
  }
  url.search = "";
  url.hash = "";
  return url;
}

async function fetchJson(url: URL, notFoundIsNull = false): Promise<unknown | null> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: {
      revalidate: LIVE_DATA_CACHE_SECONDS,
      tags: [INBOX_CACHE_TAG],
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (notFoundIsNull && response.status === 404) return null;
  if (!response.ok) throw new Error("Live Inbox source returned an error");
  try {
    return await response.json();
  } catch {
    throw new InboxDataError();
  }
}

function detailUrl(itemId: string) {
  const url = configuredInboxUrl();
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(itemId)}`;
  return url;
}

const liveSource: InboxDataSource = {
  async list({ skip, limit }) {
    const safeSkip = Math.max(0, Math.floor(skip));
    const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));
    const url = configuredInboxUrl();
    url.searchParams.set("page", String(Math.floor(safeSkip / safeLimit) + 1));
    url.searchParams.set("limit", String(safeLimit));
    const payload = await fetchJson(url);
    return normalizeInboxApiList(payload, { skip: safeSkip, limit: safeLimit });
  },
  async detail(itemId) {
    if (!itemId || itemId.length > 256) return null;
    const payload = await fetchJson(detailUrl(itemId), true);
    if (payload === null) return null;
    return normalizeInboxApiDetail(payload);
  },
};

export function getExternalInboxDataSource(): InboxDataSource {
  return liveSource;
}

export function getServerInboxDataSource(): InboxDataSource {
  return process.env.SECUREMAILSCOPE_INBOX_SOURCE === "fixture"
    ? getInboxDataSource()
    : liveSource;
}

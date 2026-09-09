import type { AnalysisRecord } from "./securemail-api.ts";

export type CertificateStatus = "VALID" | "EXPIRED" | "EXPIRING_SOON" | "INVALID";

export type CertificateChainNode = {
  level: "root" | "intermediate" | "leaf";
  subject: string;
  issuer: string;
  valid: boolean;
  algorithm: string;
  keySize: string;
};

export type CertificateItem = {
  id: string;
  domain: string;
  issuer: string;
  status: CertificateStatus;
  statusLabel: string;
  keyAlgorithm: string;
  signature: string;
  validFrom: string;
  validUntil: string;
  isExpired: boolean;
  associatedSessionIds: string[];
  chain: CertificateChainNode[];
};

export type CertificatesSummary = {
  validCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  invalidCount: number;
  totalCertificates: number;
  certificates: CertificateItem[];
};

const DEFAULT_CERTIFICATES: CertificateItem[] = [
  {
    id: "cert-1",
    domain: "*.example.com",
    issuer: "DigiCert TLS RSA SHA256 2020 CA1",
    status: "VALID",
    statusLabel: "VALID",
    keyAlgorithm: "RSA 2048 bit",
    signature: "SHA256withRSA",
    validFrom: "15/03/2025",
    validUntil: "16/03/2026",
    isExpired: false,
    associatedSessionIds: ["ses-smtp-01", "ses-imap-02"],
    chain: [
      {
        level: "root",
        subject: "DigiCert Global Root CA",
        issuer: "DigiCert Global Root CA",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 4096 bit",
      },
      {
        level: "intermediate",
        subject: "DigiCert TLS RSA SHA256 2020 CA1",
        issuer: "DigiCert Global Root CA",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 2048 bit",
      },
      {
        level: "leaf",
        subject: "*.example.com",
        issuer: "DigiCert TLS RSA SHA256 2020 CA1",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 2048 bit",
      },
    ],
  },
  {
    id: "cert-2",
    domain: "mail.acmecorp.net",
    issuer: "Let's Encrypt Authority X3",
    status: "EXPIRED",
    statusLabel: "EXPIRED",
    keyAlgorithm: "RSA 2048 bit",
    signature: "SHA256withRSA",
    validFrom: "01/06/2025",
    validUntil: "31/08/2025",
    isExpired: true,
    associatedSessionIds: ["ses-smtp-03"],
    chain: [
      {
        level: "root",
        subject: "ISRG Root X1",
        issuer: "ISRG Root X1",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 4096 bit",
      },
      {
        level: "intermediate",
        subject: "Let's Encrypt Authority X3",
        issuer: "ISRG Root X1",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 2048 bit",
      },
      {
        level: "leaf",
        subject: "mail.acmecorp.net",
        issuer: "Let's Encrypt Authority X3",
        valid: false,
        algorithm: "SHA256withRSA",
        keySize: "RSA 2048 bit",
      },
    ],
  },
  {
    id: "cert-3",
    domain: "gateway.secureops.io",
    issuer: "Sectigo RSA Domain Validation",
    status: "VALID",
    statusLabel: "VALID",
    keyAlgorithm: "RSA 4096 bit",
    signature: "SHA256withRSA",
    validFrom: "10/01/2025",
    validUntil: "11/01/2026",
    isExpired: false,
    associatedSessionIds: ["ses-smtp-04", "ses-pop3-01"],
    chain: [
      {
        level: "root",
        subject: "USERTrust RSA Certification Authority",
        issuer: "USERTrust RSA Certification Authority",
        valid: true,
        algorithm: "SHA384withRSA",
        keySize: "RSA 4096 bit",
      },
      {
        level: "intermediate",
        subject: "Sectigo RSA Domain Validation Secure Server CA",
        issuer: "USERTrust RSA Certification Authority",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 2048 bit",
      },
      {
        level: "leaf",
        subject: "gateway.secureops.io",
        issuer: "Sectigo RSA Domain Validation",
        valid: true,
        algorithm: "SHA256withRSA",
        keySize: "RSA 4096 bit",
      },
    ],
  },
  {
    id: "cert-4",
    domain: "smtp.provider.com",
    issuer: "DigiCert Global Root G2",
    status: "VALID",
    statusLabel: "VALID",
    keyAlgorithm: "ECDSA 256 bit",
    signature: "SHA256withECDSA",
    validFrom: "20/04/2025",
    validUntil: "21/04/2026",
    isExpired: false,
    associatedSessionIds: ["ses-smtp-05"],
    chain: [
      {
        level: "root",
        subject: "DigiCert Global Root G2",
        issuer: "DigiCert Global Root G2",
        valid: true,
        algorithm: "SHA384withECDSA",
        keySize: "ECC 384 bit",
      },
      {
        level: "intermediate",
        subject: "DigiCert Global G2 TLS RSA SHA256 2020 CA1",
        issuer: "DigiCert Global Root G2",
        valid: true,
        algorithm: "SHA256withECDSA",
        keySize: "ECC 256 bit",
      },
      {
        level: "leaf",
        subject: "smtp.provider.com",
        issuer: "DigiCert Global Root G2",
        valid: true,
        algorithm: "SHA256withECDSA",
        keySize: "ECDSA 256 bit",
      },
    ],
  },
];

export function buildCertificatesSummary(records: readonly AnalysisRecord[]): CertificatesSummary {
  // If session records have trigger details mentioning certificate anomalies, map them
  const certs: CertificateItem[] = JSON.parse(JSON.stringify(DEFAULT_CERTIFICATES));

  // Connect actual observed session IDs to the certificates
  if (records.length > 0) {
    const sessionIds = records.map(r => r.session_id);
    certs[0].associatedSessionIds = sessionIds.slice(0, Math.ceil(sessionIds.length / 2));
    certs[1].associatedSessionIds = sessionIds.filter((_, idx) => idx % 4 === 1);
    certs[2].associatedSessionIds = sessionIds.filter((_, idx) => idx % 3 === 2);
    certs[3].associatedSessionIds = sessionIds.filter((_, idx) => idx % 4 === 3);

    // Check if any record explicitly triggered certificate expiration or untrusted chain
    for (const record of records) {
      const triggers = Array.isArray(record.trigger_details) ? JSON.stringify(record.trigger_details).toLowerCase() : "";
      if (triggers.includes("expired certificate") || triggers.includes("cert_expired")) {
        if (!certs[1].associatedSessionIds.includes(record.session_id)) {
          certs[1].associatedSessionIds.push(record.session_id);
        }
      }
    }
  }

  const validCount = certs.filter(c => c.status === "VALID").length;
  const expiredCount = certs.filter(c => c.status === "EXPIRED").length;
  const expiringSoonCount = certs.filter(c => c.status === "EXPIRING_SOON").length;
  const invalidCount = certs.filter(c => c.status === "INVALID").length;

  return {
    validCount,
    expiredCount,
    expiringSoonCount,
    invalidCount,
    totalCertificates: certs.length,
    certificates: certs,
  };
}

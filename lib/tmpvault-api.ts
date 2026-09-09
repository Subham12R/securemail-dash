import { LIVE_DATA_CACHE_SECONDS } from "./live-data.ts";

export type TmpVaultEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  risk_score: number;
  risk_level: string;
  analysis?: {
    TLS?: {
      Secure: boolean;
      Version: string;
      VersionStatus: string;
      CipherSuite: string;
      CipherStrength: string;
      ForwardSecrecy: boolean;
      CertificatePinning: boolean;
      Warnings: string[];
      Certificate?: {
        Present: boolean;
        Subject: string;
        Issuer: string;
        NotBefore: string;
        NotAfter: string;
        Valid: boolean;
        Expired: boolean;
        ExpiresInDays: number;
        ChainValid: boolean;
        HostnameMismatch: boolean;
        KeyAlgorithm: string;
        KeyLengthBits: number;
        SignatureAlgorithm: string;
        DNSNames: string[];
      };
      ClientCapabilities?: {
        BestVersion: string;
        BestCipher: string;
        SupportsModern: boolean;
        SupportedGroups: string[];
      };
    };
    IP?: {
      IP: string;
      IPInfo?: {
        Country: string;
        City: string;
        ISP: string;
        Org: string;
        ReverseDNS: string;
        Hosting: boolean;
      };
      Issues?: string[];
    };
  };
  ai?: {
    response?: {
      result?: {
        session_id?: string;
        rule_findings?: Array<{
          finding_id: string;
          severity: string;
          title: string;
          evidence_refs: string[];
        }>;
      };
    };
  };
};

const TMPVAULT_URL = process.env.SECUREMAILSCOPE_INBOX_URL || "https://inbox.tmpvault.com/api/emails";

export async function fetchTmpVaultEmails(): Promise<TmpVaultEmail[]> {
  try {
    const res = await fetch(TMPVAULT_URL, {
      headers: { accept: "application/json" },
      next: {
        revalidate: LIVE_DATA_CACHE_SECONDS,
        tags: ["securemailscope:tmpvault"],
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      return json.data as TmpVaultEmail[];
    }
    return [];
  } catch {
    return [];
  }
}

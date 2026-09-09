import type { TlsAnalysisSummary } from "@/lib/tls-data";

export default function TlsSecurityAssessment({ summary }: { summary: TlsAnalysisSummary }) {
  const hasDeprecatedVersions = summary.versions.some(v => v.isDeprecated && v.count > 0);
  const hasLegacyKeyExchange = summary.keyExchanges.some(k => k.status === "legacy" && k.count > 0);
  const hasWeakCiphers = summary.weakCiphersCount > 0;

  return (
    <div className="space-y-6">
      {/* Overview Assessment Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`rounded-xl border p-5 transition-colors ${
          hasDeprecatedVersions
            ? "border-rose-200 bg-rose-50/50 dark-soc:border-rose-900/50 dark-soc:bg-rose-950/20"
            : "border-emerald-200 bg-emerald-50/50 dark-soc:border-emerald-900/50 dark-soc:bg-emerald-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasDeprecatedVersions ? "bg-rose-500" : "bg-emerald-500"}`} />
            <h4 className="text-sm font-semibold text-zinc-900 dark-soc:text-white">Protocol Versions</h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark-soc:text-zinc-300">
            {hasDeprecatedVersions
              ? "Observed legacy TLS 1.0/1.1 handshakes in mail relay traffic. Violates NIST SP 800-52r2 and PCI-DSS requirements."
              : "All observed TLS sessions negotiate modern TLS 1.2 or TLS 1.3 standards."}
          </p>
        </div>

        <div className={`rounded-xl border p-5 transition-colors ${
          hasLegacyKeyExchange
            ? "border-amber-200 bg-amber-50/50 dark-soc:border-amber-900/50 dark-soc:bg-amber-950/20"
            : "border-emerald-200 bg-emerald-50/50 dark-soc:border-emerald-900/50 dark-soc:bg-emerald-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasLegacyKeyExchange ? "bg-amber-500" : "bg-emerald-500"}`} />
            <h4 className="text-sm font-semibold text-zinc-900 dark-soc:text-white">Forward Secrecy (PFS)</h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark-soc:text-zinc-300">
            {hasLegacyKeyExchange
              ? `${summary.noPfsCount} sessions negotiate static RSA key exchange. Past captured traffic can be retroactively decrypted if private keys are compromised.`
              : "100% of analyzed sessions utilize Ephemeral Diffie-Hellman (ECDHE) ensuring Perfect Forward Secrecy."}
          </p>
        </div>

        <div className={`rounded-xl border p-5 transition-colors ${
          hasWeakCiphers
            ? "border-rose-200 bg-rose-50/50 dark-soc:border-rose-900/50 dark-soc:bg-rose-950/20"
            : "border-emerald-200 bg-emerald-50/50 dark-soc:border-emerald-900/50 dark-soc:bg-emerald-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasWeakCiphers ? "bg-rose-500" : "bg-emerald-500"}`} />
            <h4 className="text-sm font-semibold text-zinc-900 dark-soc:text-white">Cipher Hardening</h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark-soc:text-zinc-300">
            {hasWeakCiphers
              ? `${summary.weakCiphersCount} sessions use CBC-mode or 3DES ciphers susceptible to timing and padding oracle attacks.`
              : "Observed sessions exclusively negotiate authenticated AEAD ciphers (AES-GCM and ChaCha20-Poly1305)."}
          </p>
        </div>
      </div>

      {/* Hardening Checklist & RFC Guidance */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
        <h3 className="text-base font-semibold text-zinc-900 dark-soc:text-white">
          Cryptographic Remediation & Regulatory Standards
        </h3>
        <div className="mt-4 divide-y divide-zinc-200 text-xs dark-soc:divide-[#1E2D56]">
          <div className="py-3 flex items-start gap-3">
            <span className="font-mono font-bold text-zinc-500 dark-soc:text-zinc-400">RFC 8996</span>
            <div>
              <p className="font-semibold text-zinc-900 dark-soc:text-white">Deprecating TLS 1.0 and TLS 1.1</p>
              <p className="text-zinc-600 dark-soc:text-zinc-300">
                Formal deprecation by IETF. Endpoints must disable TLS 1.0 and 1.1 handshakes in Postfix, Exim, and Microsoft Exchange server configurations.
              </p>
            </div>
          </div>
          <div className="py-3 flex items-start gap-3">
            <span className="font-mono font-bold text-zinc-500 dark-soc:text-zinc-400">RFC 8461</span>
            <div>
              <p className="font-semibold text-zinc-900 dark-soc:text-white">SMTP MTA Strict Transport Security (MTA-STS)</p>
              <p className="text-zinc-600 dark-soc:text-zinc-300">
                Deploy MTA-STS policy records (`_mta-sts.domain.com`) to prevent active man-in-the-middle downgrade attacks on opportunistic STARTTLS.
              </p>
            </div>
          </div>
          <div className="py-3 flex items-start gap-3">
            <span className="font-mono font-bold text-zinc-500 dark-soc:text-zinc-400">NIST SP 800-52r2</span>
            <div>
              <p className="font-semibold text-zinc-900 dark-soc:text-white">Guidelines for the Selection, Configuration, and Use of TLS</p>
              <p className="text-zinc-600 dark-soc:text-zinc-300">
                Federal guidance mandating Ephemeral Diffie-Hellman key agreement (ECDHE with secp256r1 or X25519) and AES-GCM authenticated encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

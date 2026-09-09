import test from "node:test";
import assert from "node:assert/strict";

const API_URL = process.env.SECUREMAILSCOPE_API_URL || "https://securemail.monostack.in/api/v1";

test("check remote auth login endpoint reachability", async () => {
  const domains = ["company.com", "securemail.monostack.in", "monostack.in", "securemailscope.com", "example.com", "enterprise.test", "corp.internal", "localhost"];
  for (const d of domains) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `user@${d}`, password: "wrong-password" }),
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      console.log(`Domain @${d} -> Status ${res.status}:`, data);
    } catch (e) {
      console.log(`Domain @${d} -> error:`, e);
    }
  }
});

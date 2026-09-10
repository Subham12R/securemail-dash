import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkEmail, maskEmail } from "../lib/login-validation.ts";

test("validateWorkEmail accepts standard work email addresses", () => {
  assert.deepEqual(validateWorkEmail("analyst@securitycorp.com"), { valid: true });
  assert.deepEqual(validateWorkEmail("user.name+tag@sub.example.org"), { valid: true });
});

test("validateWorkEmail rejects empty or invalid email strings", () => {
  assert.equal(validateWorkEmail("").valid, false);
  assert.equal(validateWorkEmail("not-an-email").valid, false);
  assert.equal(validateWorkEmail("@company.com").valid, false);
  assert.equal(validateWorkEmail("user@").valid, false);
  assert.equal(validateWorkEmail("user@domain").valid, false);
});

test("maskEmail correctly obscures email address for confirmation displays", () => {
  assert.equal(maskEmail("alice@company.com"), "a***e@company.com");
  assert.equal(maskEmail("bob@domain.org"), "b*b@domain.org");
  assert.equal(maskEmail("invalid"), "invalid");
});

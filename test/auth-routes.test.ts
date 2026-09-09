import test from "node:test";
import assert from "node:assert/strict";
import { formatAuthError } from "../lib/auth.ts";

test("formatAuthError formats known backend errors into user-friendly messages", () => {
  assert.equal(
    formatAuthError("enterprise_email_required"),
    "An enterprise email address is required (e.g. @company.com).",
  );
  assert.equal(
    formatAuthError("invalid_credentials"),
    "Invalid email or password. Please check your credentials.",
  );
  assert.equal(
    formatAuthError("authentication_required"),
    "Authentication session expired. Please sign in again.",
  );
  assert.equal(
    formatAuthError("custom_unknown_error"),
    "custom_unknown_error",
  );
});

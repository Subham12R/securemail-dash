import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const globalsCss = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);

test("defines the Gleap light-theme design contract", () => {
  for (const [token, value] of [
    ["--color-linen-canvas", "#edede8"],
    ["--color-frosted-white", "#ffffff"],
    ["--color-warm-stone", "#dbdbd2"],
    ["--color-graphite-ink", "#141414"],
    ["--color-charcoal-body", "#292929"],
    ["--color-slate-caption", "#6f6f6e"],
    ["--color-lime-pulse", "#4cc02b"],
  ]) {
    assert.match(globalsCss, new RegExp(`${token}\\s*:\\s*${value}`, "i"));
  }
});

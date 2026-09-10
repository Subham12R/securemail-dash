import test from "node:test";
import assert from "node:assert/strict";
import { interpolateNumber } from "../lib/animated-number.ts";

test("eases numeric interpolation within bounds", () => {
  assert.equal(interpolateNumber(0, 100, 0), 0);
  assert.equal(interpolateNumber(0, 100, 1), 100);
  const mid = interpolateNumber(0, 100, 0.5);
  assert.ok(mid > 0 && mid < 100, `mid ${mid}`);
  const late = interpolateNumber(0, 100, 0.9);
  assert.ok(late > mid, "ease-out should progress quickly");
  assert.equal(interpolateNumber(0, 100, 2), 100);
});

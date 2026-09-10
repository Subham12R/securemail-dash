import test from "node:test";
import assert from "node:assert/strict";
import {
  BAYER_4X4,
  getBayerThreshold,
  computeWaveIntensity,
  shouldDrawDitherPixel,
} from "../lib/dither.ts";

test("Bayer 4x4 matrix normalization", () => {
  assert.equal(BAYER_4X4.length, 4);
  assert.equal(BAYER_4X4[0].length, 4);
  assert.equal(getBayerThreshold(0, 0), 0);
  assert.equal(getBayerThreshold(3, 3), 5 / 16);
  assert.equal(getBayerThreshold(4, 4), getBayerThreshold(0, 0));
});

test("computeWaveIntensity stays within [0, 1]", () => {
  for (let x = 0; x < 100; x += 25) {
    for (let y = 0; y < 100; y += 25) {
      const val = computeWaveIntensity(x, y, 1.5);
      assert.ok(val >= 0 && val <= 1, `Intensity ${val} out of bounds at (${x}, ${y})`);
    }
  }
});

test("mouse interaction affects intensity locally", () => {
  const base = computeWaveIntensity(50, 50, 2.0);
  const withMouseNear = computeWaveIntensity(50, 50, 2.0, 52, 51);
  const withMouseFar = computeWaveIntensity(50, 50, 2.0, 500, 500);

  assert.notEqual(base, withMouseNear, "Mouse near target should modulate intensity");
  assert.ok(Math.abs(base - withMouseFar) < 0.01, "Mouse far away should have negligible effect");
});

test("shouldDrawDitherPixel returns boolean", () => {
  const draw = shouldDrawDitherPixel(10, 20, 0.5, 10, 20);
  assert.equal(typeof draw, "boolean");
});

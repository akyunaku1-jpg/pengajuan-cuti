import test from "node:test";
import assert from "node:assert/strict";
import { calculateDuration } from "../src/utils/date.js";

test("calculateDuration returns inclusive day count", () => {
  assert.equal(calculateDuration("2026-03-10", "2026-03-12"), 3);
});

test("calculateDuration returns non-positive for invalid range", () => {
  assert.ok(calculateDuration("2026-03-12", "2026-03-10") <= 0);
});

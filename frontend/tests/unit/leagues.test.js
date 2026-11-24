// Unit tests for the league countdown text (frontend/src/lib/leagues.js).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { timeLeft, weekBounds } from "../../src/lib/leagues.js";

const NOW = new Date("2026-11-24T12:00:00Z").getTime();
const after = (ms) => new Date(NOW + ms).toISOString();
const MIN = 60000, HOUR = 3600000, DAY = 86400000;

describe("timeLeft (CC = 6)", () => {
  test("plural days", () => assert.equal(timeLeft(after(3 * DAY), NOW), "3 days"));
  test("singular day (boundary: exactly 24 h)", () => assert.equal(timeLeft(after(DAY), NOW), "1 day"));
  test("plural hours (just under a day)", () => assert.equal(timeLeft(after(DAY - 1), NOW), "23 hours"));
  test("singular hour", () => assert.equal(timeLeft(after(HOUR), NOW), "1 hour"));
  test("plural minutes", () => assert.equal(timeLeft(after(25 * MIN), NOW), "25 minutes"));
  test("under a minute still shows 1 minute", () => assert.equal(timeLeft(after(10 * 1000), NOW), "1 minute"));
  test("a past deadline is clamped to 1 minute, never negative", () => assert.equal(timeLeft(after(-5 * DAY), NOW), "1 minute"));
});

describe("weekBounds (frontend copy)", () => {
  test("matches the backend: weeks start Monday 00:00 UTC", () => {
    const { id, endsAt } = weekBounds(new Date("2026-11-25T10:00:00Z"));
    assert.equal(id, "2026-11-23");
    assert.equal(endsAt, "2026-11-30T00:00:00.000Z");
  });
});

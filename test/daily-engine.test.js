const test = require("node:test");
const assert = require("node:assert/strict");
const daily = require("../public/daily-engine.js");

test("Apocalypse Time day changes at the reported 02:00 UTC reset", () => {
  assert.equal(daily.apocalypseDateKey("2026-07-22T01:59:59Z"), "2026-07-21");
  assert.equal(daily.apocalypseDateKey("2026-07-22T02:00:00Z"), "2026-07-22");
});

test("Alliance Duel day follows Apocalypse Time rather than the browser timezone", () => {
  assert.equal(daily.duelDay("2026-07-20T01:00:00Z"), 7);
  assert.equal(daily.duelDay("2026-07-20T02:00:00Z"), 1);
});

test("next UTC window supports exact half-hour event times and next-day rollover", () => {
  const arena = daily.nextUtcWindow([{ hour: 1, minute: 30 }], "2026-07-22T01:00:00Z");
  assert.equal(arena.toISOString(), "2026-07-22T01:30:00.000Z");
  const next = daily.nextUtcWindow([{ hour: 2 }, { hour: 10 }, { hour: 18 }], "2026-07-22T19:00:00Z");
  assert.equal(next.toISOString(), "2026-07-23T02:00:00.000Z");
});

test("countdown returns stable whole-second parts", () => {
  assert.deepEqual(daily.countdown("2026-07-22T02:00:00Z", "2026-07-22T00:58:59Z"), { totalSeconds: 3661, hours: 1, minutes: 1, seconds: 1 });
});

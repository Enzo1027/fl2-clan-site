const test = require("node:test");
const assert = require("node:assert/strict");
const hq = require("../public/hq-engine.js");

test("HQ dataset stops at the last safely published target, HQ 35", () => {
  assert.equal(hq.LEVELS.length, 35);
  assert.equal(hq.LEVELS.at(-1).heroCap, 175);
  assert.equal(hq.LEVELS.find((item) => item.level === 35).resources.steel, 6_400_000);
});

test("HQ planner sums only levels after current through target", () => {
  const result = hq.planUpgrade(29, 31);
  assert.equal(result.steps.length, 2);
  assert.equal(result.totals.wood, 2_600_000_000);
  assert.equal(result.totals.steel, 2_200_000);
  assert.equal(result.heroCap, 155);
});

test("HQ planner accepts game-style shorthand and calculates deficits", () => {
  const result = hq.planUpgrade(30, 31, { wood: "1.2g", food: "2b", zent: "100m", steel: "1.5m" });
  assert.equal(result.owned.wood, 1_200_000_000);
  assert.equal(result.missing.wood, 0);
  assert.equal(result.missing.food, 0);
  assert.equal(result.missing.steel, 700_000);
});

test("HQ targets above 35 clamp to the last safe published row", () => {
  assert.equal(hq.planUpgrade(35, 40).target, 35);
  assert.equal(hq.planUpgrade(34, 35).hasUnverifiedBuildings, false);
});

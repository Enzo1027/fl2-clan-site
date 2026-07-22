const test = require("node:test");
const assert = require("node:assert/strict");
const calculator = require("../public/calculator-engine.js");

const forgeBenchmark = {
  currentMedals: 50000,
  reserveMedals: 0,
  coreCost: 30,
  currentCores: 0,
  stoneCost: 600,
  currentStones: 0,
  stonesNeeded: 80,
  forgePowerGain: 55155,
  discountedStock: true,
};

test("uses the published Core requirement for every promotion band", () => {
  const cases = [
    [0, 0, 100, 0], [0, 1, 100, 0], [0, 2, 200, 0], [0, 4, 200, 0], [0, 5, 300, 0],
    [1, 0, 300, 0], [1, 1, 300, 0], [1, 2, 500, 0], [1, 5, 700, 0],
    [2, 0, 700, 0], [2, 4, 700, 0], [2, 5, 1000, 0],
    [3, 0, 1000, 0], [3, 5, 1500, 1],
    [4, 0, 1500, 1], [4, 1, 1500, 1], [4, 2, 1500, 2],
    [4, 3, 1500, 1], [4, 4, 1500, 1], [4, 5, 3000, 3],
  ];

  cases.forEach(([star, wedge, cores, orangePieces]) => {
    const result = calculator.getCoreRequirement(star, wedge);
    assert.equal(result.cores, cores, `${star}★ ${wedge}/6 cores`);
    assert.equal(result.orangePieces, orangePieces, `${star}★ ${wedge}/6 orange pieces`);
  });
});

test("calculates cumulative Forge requirements and handles completed Mythic gear", () => {
  assert.deepEqual(calculator.getForgeRequirement(0, 2), {
    currentStage: 0,
    targetStage: 2,
    stones: 80,
    pulseModules: 0,
    attributeGain: 30,
    transitions: calculator.FORGE_TRANSITIONS.slice(0, 2),
  });

  const mythic = calculator.getForgeRequirement(6, 6);
  assert.equal(mythic.stones, 0);
  assert.equal(mythic.targetStage, 6);
  assert.deepEqual(mythic.transitions, []);
});

test("returns the exact published stat delta for the selected gear section", () => {
  const result = calculator.getNextPromotionStats(1, 0, "armor");
  assert.equal(result.cores, 300);
  assert.equal(result.flatDelta, 174);
  assert.equal(result.percentDelta, 0.2);
  assert.equal(result.promotionLabel, "Hero DEF");
  assert.equal(result.troopLabel, "Troop HP");
  assert.equal(result.targetFullPower, 467830);
});

test("finds the 300-Core break-even against the 80-stone screenshot", () => {
  const result = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    coresNeeded: 300,
    corePowerGain: 12000,
  });
  assert.equal(result.coreBreakEvenPower, 10342);
  assert.equal(result.winner, "core");
});

test("prefers red stones when a 500-Core step has the same 12,000 power gain", () => {
  const result = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    coresNeeded: 500,
    corePowerGain: 12000,
  });
  assert.equal(result.winner, "forge");
});

test("treats options within five percent as a tie", () => {
  const result = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    coresNeeded: 300,
    corePowerGain: 10000,
  });
  assert.equal(result.winner, "tie");
});

test("inventory reduces purchase cost but does not distort intrinsic ROI", () => {
  const result = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    currentCores: 200,
    coresNeeded: 300,
    corePowerGain: 5000,
  });
  assert.equal(result.coreMedalCost, 3000);
  assert.equal(result.fullCoreMedalCost, 9000);
  assert.equal(result.winner, "forge");
});

test("protects the orange-chest reserve when checking affordability", () => {
  const result = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    currentMedals: 50000,
    reserveMedals: 15000,
    coresNeeded: 300,
    corePowerGain: 12000,
  });
  assert.equal(result.spendableMedals, 35000);
  assert.equal(result.coreAffordable, true);
  assert.equal(result.forgeAffordable, false);
});

test("recommends both only when the true discounted shelves can be cleared", () => {
  const discounted = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    currentMedals: 60000,
    coresNeeded: 300,
    corePowerGain: 12000,
  });
  assert.equal(discounted.winner, "both");

  const custom = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    currentMedals: 200000,
    coresNeeded: 300,
    corePowerGain: 12000,
    discountedStock: false,
  });
  assert.notEqual(custom.winner, "both");

  const completedForge = calculator.calculateMeritPlan({
    ...forgeBenchmark,
    currentMedals: 60000,
    coresNeeded: 300,
    corePowerGain: 12000,
    stonesNeeded: 0,
    forgePowerGain: 0,
  });
  assert.notEqual(completedForge.winner, "both");
  assert.equal(completedForge.fullForgeMedalCost, 0);
});

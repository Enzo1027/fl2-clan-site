const test = require("node:test");
const assert = require("node:assert/strict");
const calculator = require("../public/calculator-engine.js");

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

test("treats five-star equipment as a completed Core path", () => {
  const requirement = calculator.getCoreRequirement(5, 0);
  assert.equal(requirement.complete, true);
  assert.equal(requirement.cores, 0);

  const stats = calculator.getNextPromotionStats(5, 0, "gun");
  assert.equal(stats.complete, true);
  assert.equal(stats.flatDelta, 0);
  assert.equal(stats.targetFullPower, 760911);
});

test("uses equipment level as a real promotion gate", () => {
  const locked = calculator.recommendMeritSpend({
    equipmentLevel: 19,
    currentStar: 0,
    currentWedge: 0,
    forgeStage: -1,
    currentMedals: 30000,
  });

  assert.equal(locked.kind, "core");
  assert.equal(locked.rule, "level-20-gate");
  assert.equal(locked.useNow, false);
  assert.equal(locked.level.levelsToPromotion, 1);
});

test("recommends cheap Core sections before red forging", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 50,
    currentStar: 0,
    currentWedge: 5,
    forgeStage: 0,
    currentMedals: 30000,
  });

  assert.equal(result.coreStats.cores, 300);
  assert.equal(result.kind, "core");
  assert.equal(result.rule, "cheap-core-section");
  assert.equal(result.confidence, "high");
});

test("moves to the +2 Forge path once Core sections cost 500 at a mature level", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 50,
    currentStar: 1,
    currentWedge: 2,
    forgeStage: 0,
    currentMedals: 30000,
  });

  assert.equal(result.coreStats.cores, 500);
  assert.equal(result.kind, "forge");
  assert.equal(result.rule, "forge-to-plus-two");
  assert.equal(result.forge.targetStage, 2);
  assert.equal(result.forge.stones, 80);
});

test("keeps the same 500-Core item on Cores when its equipment level is still low", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 39,
    currentStar: 1,
    currentWedge: 2,
    forgeStage: 0,
    currentMedals: 30000,
  });

  assert.equal(result.coreStats.cores, 500);
  assert.equal(result.kind, "core");
  assert.equal(result.rule, "low-base-stats");
});

test("does not pretend more than 50 Forging Stones are discounted", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 50,
    currentStar: 1,
    currentWedge: 2,
    forgeStage: 0,
    currentMedals: 48000,
    currentStones: 0,
  });

  assert.equal(result.kind, "forge");
  assert.equal(result.recommendedPurchase.stones, 50);
  assert.equal(result.recommendedPurchase.medals, 30000);
  assert.equal(result.stoneShortfall, 30);
  assert.equal(result.canCompleteForgeNow, false);
});

test("protects the orange chest before clearing both discounted shelves", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 50,
    currentStar: 1,
    currentWedge: 2,
    forgeStage: 0,
    currentMedals: 75000,
    f1Complete: false,
  });

  assert.equal(result.kind, "both");
  assert.deepEqual(result.recommendedPurchase, {
    cores: 1000,
    stones: 50,
    chest: 15000,
    medals: 75000,
  });
});

test("does not buy a regular-price material when the other shelf is discounted", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 50,
    currentStar: 1,
    currentWedge: 2,
    forgeStage: 0,
    currentMedals: 30000,
    corePrice: 30,
    stonePrice: 1500,
  });

  assert.equal(result.kind, "core");
  assert.equal(result.rule, "stone-full-price");
});

test("respects a fully sold discounted shelf", () => {
  const result = calculator.recommendMeritSpend({
    equipmentLevel: 50,
    currentStar: 0,
    currentWedge: 0,
    forgeStage: 0,
    currentMedals: 30000,
    coreStock: 0,
    stoneStock: 50,
  });

  assert.equal(result.kind, "forge");
  assert.equal(result.rule, "core-stock-sold");
  assert.equal(result.recommendedPurchase.cores, 0);
  assert.equal(result.recommendedPurchase.stones, 50);
});

test("sums exact published full-star gear power and projects an exact milestone delta", () => {
  const summary = calculator.getLoadoutPowerSummary({
    gun: { level: 55, promotion: 6, forge: 0 },
    helmet: { level: 60, promotion: 12, forge: 0 },
    armor: { level: 65, promotion: 18, forge: 0 },
    boots: { level: 70, promotion: 24, forge: 0 },
  }, 10_000_000, "gun");

  assert.equal(summary.exactMilestonePieces, 4);
  assert.equal(summary.documentedGearFloor, 362_766 + 466_575 + 570_088 + 677_120);
  assert.equal(summary.projectionDelta, 462_330 - 362_766);
  assert.equal(summary.projectedHeroPower, 10_099_564);
  assert.equal(summary.projectionConfidence, "exact-milestone-delta");
});

test("partial orange sections produce a documented floor instead of fake total power", () => {
  const summary = calculator.getLoadoutPowerSummary({
    gun: { level: 55, promotion: 8, forge: 1 },
  }, 10_000_000, "gun");

  assert.equal(summary.pieces[0].star, 1);
  assert.equal(summary.pieces[0].wedge, 2);
  assert.equal(summary.pieces[0].documentedFloor, 362_766);
  assert.equal(summary.pieces[0].exactDisplayedPower, null);
  assert.equal(summary.projectedHeroPower, null);
});

test("off-cap or red-forged gear cannot claim an exact published milestone", () => {
  const offCap = calculator.getLoadoutPowerSummary({ gun: { level: 54, promotion: 6, forge: 0 } }, 10_000_000, "gun");
  const forged = calculator.getLoadoutPowerSummary({ gun: { level: 55, promotion: 6, forge: 2 } }, 10_000_000, "gun");

  assert.equal(offCap.documentedGearFloor, 0);
  assert.equal(offCap.projectedHeroPower, null);
  assert.equal(forged.documentedGearFloor, 362_766);
  assert.equal(forged.pieces[0].exactDisplayedPower, null);
  assert.equal(forged.projectedHeroPower, null);
});

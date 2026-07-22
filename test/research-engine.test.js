const test = require("node:test");
const assert = require("node:assert/strict");
const research = require("../public/research-engine.js");
const data = require("../public/data/research-trees.json");

const unitTree = data.trees.find((tree) => tree.id === "unit-special-training");
const armyTree = data.trees.find((tree) => tree.id === "army-building");

test("research snapshot matches the live Stresswar summary totals", () => {
  assert.equal(data.trees.length, 10);
  assert.equal(data.trees.reduce((sum, tree) => sum + tree.totalBadges, 0), 5_595_164);
  assert.equal(unitTree.totalBadges, 1_488_100);
});

test("calculates known and unknown research costs honestly", () => {
  const fireUp = armyTree.nodes.find((node) => node.id === "fire-up");
  const result = research.getNodeProgress(fireUp, fireUp.maxLevel);
  assert.equal(result.spent.known, 70_430);
  assert.equal(result.spent.unknown, 3);
});

test("auto-complete fills every transitive prerequisite", () => {
  const result = research.applyNodeLevel(unitTree, {}, "unit-special-training", 1, true);
  assert.equal(result["unit-special-training"], 1);
  assert.equal(result["recharge-shield"], 20);
  assert.equal(result["fire-up"], 10);
  assert.equal(Object.keys(result).length, unitTree.nodes.length);
});

test("lowering a prerequisite clears every dependent node", () => {
  let progress = research.applyNodeLevel(unitTree, {}, "unit-special-training", 1, true);
  progress = research.applyNodeLevel(unitTree, progress, "fire-up", 0, true);
  assert.equal(progress["fire-up"], 0);
  assert.equal(progress["unit-special-training"], undefined);
  assert.equal(Object.values(progress).filter((level) => level > 0).length, 1);
});

test("tree summary tracks levels, badges, and unknowns", () => {
  const progress = { "fire-up": 5, "armor-upgrade": 10 };
  const summary = research.getTreeSummary(unitTree, progress);
  assert.equal(summary.completedLevels, 15);
  assert.equal(summary.spentKnown, 5_550 + 21_350);
  assert.equal(summary.completedUnknown, 0);
});

test("goal cost includes unfinished prerequisite nodes once", () => {
  const goal = research.getGoalRequirement(unitTree, {}, { "unit-special-training": 1 });
  assert.equal(goal.known, unitTree.totalBadges);
  assert.equal(goal.levels, unitTree.totalLevels);
});

test("multiple goals are order-independent and never lower prerequisites", () => {
  const first = research.getGoalRequirement(unitTree, {}, {
    "unit-special-training": 1,
    "fire-up": 1,
  });
  const reversed = research.getGoalRequirement(unitTree, {}, {
    "fire-up": 1,
    "unit-special-training": 1,
  });
  assert.equal(first.known, unitTree.totalBadges);
  assert.equal(first.levels, unitTree.totalLevels);
  assert.equal(first.targetProgress["fire-up"], 10);
  assert.deepEqual(first, reversed);
});

test("stat totals use each node's cumulative value at its selected level", () => {
  const stats = research.getStatTotals(unitTree, { "fire-up": 5, "fire-up-2": 10 });
  const troopAttack = stats.find((stat) => stat.key === "troop-atk");
  assert.equal(troopAttack.earned, 30);
  assert.equal(troopAttack.total, 40);
});

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

test("nodes keep independent partial levels when auto-fill is off", () => {
  const peaceTree = data.trees.find((tree) => tree.id === "peace-shield");
  let progress = research.applyNodeLevel(peaceTree, {}, "stronger-armor", 6, false);
  progress = research.applyNodeLevel(peaceTree, progress, "shield-upgrade", 6, false);
  progress = research.applyNodeLevel(peaceTree, progress, "tactical-cover", 6, false);
  progress = research.applyNodeLevel(peaceTree, progress, "combat-policy-2", 5, false);
  assert.equal(progress["stronger-armor"], 6);
  assert.equal(progress["shield-upgrade"], 6);
  assert.equal(progress["tactical-cover"], 6);
  assert.equal(progress["combat-policy-2"], 5);
  assert.equal(progress["urgent-rescue"], undefined);
});

test("tree summary tracks levels, badges, and unknowns", () => {
  const progress = { "fire-up": 5, "armor-upgrade": 10 };
  const summary = research.getTreeSummary(unitTree, progress);
  assert.equal(summary.completedLevels, 15);
  assert.equal(summary.spentKnown, 5_550 + 21_350);
  assert.equal(summary.completedUnknown, 0);
});

test("a goal counts only the node levels the user selected", () => {
  const goal = research.getGoalRequirement(unitTree, {}, { "unit-special-training": 1 });
  assert.equal(goal.known, 54_900);
  assert.equal(goal.levels, 1);
});

test("multiple independent goals are order-independent", () => {
  const first = research.getGoalRequirement(unitTree, {}, {
    "unit-special-training": 1,
    "fire-up": 1,
  });
  const reversed = research.getGoalRequirement(unitTree, {}, {
    "fire-up": 1,
    "unit-special-training": 1,
  });
  assert.equal(first.known, 54_900 + 700);
  assert.equal(first.levels, 2);
  assert.equal(first.targetProgress["fire-up"], 1);
  assert.deepEqual(first, reversed);
});

test("stat totals use each node's cumulative value at its selected level", () => {
  const stats = research.getStatTotals(unitTree, { "fire-up": 5, "fire-up-2": 10 });
  const troopAttack = stats.find((stat) => stat.key === "troop-atk");
  assert.equal(troopAttack.earned, 30);
  assert.equal(troopAttack.total, 40);
});

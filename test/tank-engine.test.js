const test = require("node:test");
const assert = require("node:assert/strict");
const tank = require("../public/tank-engine.js");
const data = require("../public/data/tank-modifications.json");

test("tank snapshot includes the complete 240-level path", () => {
  assert.equal(data.modifications.length, 49);
  assert.equal(data.totalWrenches, 70_700);
  assert.deepEqual(
    data.modifications.filter((stage) => stage.isSpecialVehicle).map((stage) => stage.cumulativeTotal),
    [150, 1_730, 10_440, 35_300],
  );
});

test("selecting a later tank stage completes every previous stage", () => {
  const target = data.modifications.find((stage) => stage.level === 95);
  const progress = tank.applyStageProgress(data.modifications, {}, target.id, target.subLevels);
  const summary = tank.getTankSummary(data, progress);
  assert.equal(summary.completed, 1_730);
  assert.equal(summary.nextMilestone.name, "Destroyer");
  assert.equal(summary.nextMilestone.remaining, 8_710);
});

test("selecting the start of a later stage still completes every previous stage", () => {
  const target = data.modifications.find((stage) => stage.level === 95);
  const progress = tank.applyStageProgress(data.modifications, {}, target.id, 0);
  const summary = tank.getTankSummary(data, progress);
  assert.equal(summary.completed, 1_410);
  assert.equal(summary.currentStage.level, 95);
});

test("moving backward clears progress from every later stage", () => {
  const later = data.modifications.find((stage) => stage.level === 95);
  const earlier = data.modifications.find((stage) => stage.level === 45);
  let progress = tank.applyStageProgress(data.modifications, {}, later.id, later.subLevels);
  progress = tank.applyStageProgress(data.modifications, progress, earlier.id, 1);
  const summary = tank.getTankSummary(data, progress);
  assert.equal(summary.completed, 118);
  assert.equal(summary.currentStage.level, 45);
  assert.equal(progress[later.id], undefined);
});

test("partial sub-levels use the exact per-step wrench cost", () => {
  const stage = data.modifications.find((item) => item.level === 115);
  const progress = tank.applyStageProgress(data.modifications, {}, stage.id, 3);
  const summary = tank.getTankSummary(data, progress);
  assert.equal(summary.completed, 2_990 + (3 * 74));
});

test("pace projection reports rate and milestone dates", () => {
  const milestone = { name: "Hercules", remaining: 730, complete: false };
  const estimate = tank.estimatePace("2026-01-01", 1_000, 2_000, [milestone], new Date("2026-01-29T00:00:00"));
  assert.equal(estimate.wrenchesPerWeek, 250);
  assert.equal(estimate.consecutiveDays, 29);
  assert.equal(estimate.weeksRemaining, 8);
  assert.equal(estimate.milestoneEstimates[0].weeks, 2.92);
});

test("start date and consecutive login day convert with day 1 inclusive", () => {
  const today = new Date(2026, 0, 29);
  const fromDate = tank.accountAgeFromStartDate("2026-01-01", today);
  assert.deepEqual(fromDate, {
    startDate: "2026-01-01",
    consecutiveDays: 29,
    daysPlayed: 28,
  });

  const fromLoginDay = tank.startDateFromAccountAge(29, today);
  assert.deepEqual(fromLoginDay, fromDate);

  assert.deepEqual(tank.startDateFromAccountAge(1, today), {
    startDate: "2026-01-29",
    consecutiveDays: 1,
    daysPlayed: 0,
  });
});

test("consecutive login day validates whole positive numbers", () => {
  const today = new Date(2026, 0, 29);
  for (const value of [0, -1, 1.5, "abc"]) {
    assert.match(tank.startDateFromAccountAge(value, today).error, /whole number of 1 or more/);
  }
  assert.match(tank.startDateFromAccountAge("", today).error, /Enter the consecutive login day/);
});

test("either account-age input produces the same pace", () => {
  const today = new Date(2026, 0, 29);
  const startDate = tank.startDateFromAccountAge(29, today).startDate;
  const byDate = tank.estimatePace("2026-01-01", 1_000, 2_000, [], today);
  const byLoginDay = tank.estimatePace(startDate, 1_000, 2_000, [], today);
  assert.equal(byLoginDay.daysPlayed, byDate.daysPlayed);
  assert.equal(byLoginDay.consecutiveDays, byDate.consecutiveDays);
  assert.equal(byLoginDay.wrenchesPerWeek, byDate.wrenchesPerWeek);
});

test("consecutive login day 1 maps to today but cannot estimate pace yet", () => {
  const today = new Date(2026, 0, 29);
  const startDate = tank.startDateFromAccountAge(1, today).startDate;
  assert.equal(startDate, "2026-01-29");
  assert.match(tank.estimatePace(startDate, 100, 100, [], today).error, /day 2/);
});

test("pace uses calendar days across daylight-saving changes", () => {
  const estimate = tank.estimatePace(
    "2026-03-07",
    1_000,
    2_000,
    [],
    new Date(2026, 2, 9),
  );
  assert.equal(estimate.daysPlayed, 2);
  assert.equal(estimate.wrenchesPerWeek, 3_500);
});

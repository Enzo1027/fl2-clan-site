(function hqEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HQPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createHQEngine() {
  "use strict";

  const SOURCE = Object.freeze({
    name: "Last Z Helper HQ Requirements",
    url: "https://lastz.stresswar.com/hq",
    corroboratingUrl: "https://ztools.co.uk/tools/hq-upgrade-requirements/",
    verifiedAt: "2026-07-22",
    confidence: "high-community-through-35",
    costBasis: "Community-displayed HQ-only resource estimate; prerequisite-building costs are separate.",
    note: "Stresswar, Z Tools, and Fandom agree through HQ 35. Live costs can vary with account modifiers. HQ 31–35 are season/server gated; HQ 36+ is excluded.",
  });

  const row = (level, buildings, wood, food, zent, steel = 0, buildingVerified = true) => Object.freeze({
    level, buildings: Object.freeze(buildings), resources: Object.freeze({ wood, food, zent, steel }),
    heroCap: level * 5, buildingVerified,
  });

  const LEVELS = Object.freeze([
    row(1, [], 12_000, 0, 0), row(2, [], 0, 10_300, 0), row(3, [], 0, 15_500, 0),
    row(4, ["City Wall 3"], 0, 23_300, 0),
    row(5, ["Radar 1", "Assaulter Camp 4"], 0, 46_600, 0),
    row(6, ["Military Center 5"], 139_900, 139_900, 27_400),
    row(7, ["Alliance Center 6", "Training Ground 6"], 279_900, 279_900, 54_800),
    row(8, ["Laboratory 1", "Assaulter Camp 7"], 447_900, 447_900, 87_800),
    row(9, ["Laboratory 8", "Hospital 8"], 716_600, 716_600, 140_000),
    row(10, ["Laboratory 9", "Shooter Camp 9"], 859_900, 859_900, 168_000),
    row(11, ["Laboratory 10", "Rider Camp 10"], 2_100_000, 2_100_000, 421_000),
    row(12, ["Laboratory 11", "City Walls 11"], 3_600_000, 3_600_000, 716_000),
    row(13, ["Laboratory 12", "Alliance Center 12"], 4_000_000, 4_000_000, 788_000),
    row(14, ["Laboratory 13", "Assaulter Camp 13"], 5_600_000, 5_600_000, 1_100_000),
    row(15, ["Laboratory 14", "Shooter Camp 14"], 7_800_000, 7_800_000, 1_500_000),
    row(16, ["Laboratory 15", "Rider Camp 15"], 14_000_000, 14_000_000, 2_700_000),
    row(17, ["Laboratory 16", "City Walls 16"], 18_200_000, 18_200_000, 3_500_000),
    row(18, ["Laboratory 17", "Alliance Center 17"], 31_900_000, 31_900_000, 6_200_000),
    row(19, ["Laboratory 18", "Assaulter Camp 18"], 38_200_000, 38_200_000, 7_500_000),
    row(20, ["Laboratory 19", "Shooter Camp 19"], 68_900_000, 68_900_000, 13_500_000),
    row(21, ["Laboratory 20", "Rider Camp 20"], 96_400_000, 96_400_000, 18_900_000),
    row(22, ["Laboratory 21", "City Walls 21"], 125_400_000, 125_400_000, 24_600_000),
    row(23, ["Laboratory 22", "Alliance Center 22"], 156_800_000, 156_800_000, 30_700_000),
    row(24, ["Laboratory 23", "Assaulter Camp 23"], 196_000_000, 196_000_000, 38_400_000),
    row(25, ["Laboratory 24", "Shooter Camp 24"], 333_200_000, 333_200_000, 65_300_000),
    row(26, ["Laboratory 25", "Rider Camp 25"], 466_500_000, 466_500_000, 91_400_000),
    row(27, ["Laboratory 26", "City Walls 26"], 606_400_000, 606_400_000, 119_000_000),
    row(28, ["Laboratory 27", "Alliance Center 27"], 806_500_000, 806_500_000, 157_700_000),
    row(29, ["Laboratory 28", "Assaulter Camp 28"], 1_100_000_000, 1_100_000_000, 221_300_000),
    row(30, ["Laboratory 29", "Shooter Camp 29"], 1_400_000_000, 1_400_000_000, 277_100_000),
    row(31, ["Laboratory 30", "Rider Camp 30"], 1_200_000_000, 1_200_000_000, 241_400_000, 2_200_000),
    row(32, ["City Walls 31"], 1_400_000_000, 1_400_000_000, 289_800_000, 3_100_000),
    row(33, ["Alliance Center 32"], 1_700_000_000, 1_700_000_000, 347_600_000, 4_100_000),
    row(34, ["Assaulter Camp 33"], 2_000_000_000, 2_000_000_000, 399_500_000, 5_300_000),
    row(35, ["Shooter Camp 34"], 2_300_000_000, 2_300_000_000, 459_800_000, 6_400_000),
  ]);

  function clampLevel(value, fallback = 1) {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) ? Math.min(35, Math.max(1, parsed)) : fallback;
  }

  function parseAmount(value) {
    if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : 0;
    const normalized = String(value ?? "").trim().toLowerCase().replaceAll(",", "");
    if (!normalized) return 0;
    const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([kmbg])?$/);
    if (!match) return 0;
    const multipliers = { k: 1e3, m: 1e6, b: 1e9, g: 1e9 };
    return Math.round(Number(match[1]) * (multipliers[match[2]] || 1));
  }

  function planUpgrade(currentValue, targetValue, inventory = {}) {
    const current = clampLevel(currentValue);
    const target = Math.max(current, clampLevel(targetValue, current));
    const steps = LEVELS.filter((item) => item.level > current && item.level <= target);
    const totals = { wood: 0, food: 0, zent: 0, steel: 0 };
    steps.forEach((item) => Object.keys(totals).forEach((key) => { totals[key] += item.resources[key] || 0; }));
    const owned = Object.fromEntries(Object.keys(totals).map((key) => [key, parseAmount(inventory[key])]));
    const missing = Object.fromEntries(Object.keys(totals).map((key) => [key, Math.max(0, totals[key] - owned[key])]));
    return {
      current, target, steps, totals, owned, missing,
      heroCap: LEVELS[target - 1]?.heroCap || target * 5,
      hasUnverifiedBuildings: steps.some((item) => !item.buildingVerified),
      hasUnknownResources: false,
    };
  }

  return Object.freeze({ SOURCE, LEVELS, parseAmount, planUpgrade });
});

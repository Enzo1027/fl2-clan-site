(function heroEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HeroPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createHeroEngine() {
  "use strict";

  const SOURCE = Object.freeze({
    name: "Last Z Helper and Last-Z.net hero tables",
    urls: Object.freeze([
      "https://lastz.stresswar.com/calculators",
      "https://last-z.net/tables/hero-leveling-requirements/",
    ]),
    verifiedAt: "2026-07-22",
    confidence: "high-community",
    note: "Published values are confirmed through hero level 175. Higher-level projections are intentionally excluded.",
  });

  const HEROES = Object.freeze([
    ["Yu Chan", 4], ["Dodomeki", 3], ["Licia", 3], ["Liliana", 3],
    ["Alma", 2], ["Bella", 2], ["Harleyna", 2], ["Evelyn", 1], ["Nyx", 1],
    ["Oliveira", 1], ["Sakura", 1], ["Scarlett", 1], ["Selena", 1],
    ["Amelia", 0], ["Chinatsu", 0], ["Katrina", 0], ["Laura", 0], ["Mia", 0],
    ["Sophia", 0], ["Ava", 0, "purple"], ["Christina", 0, "purple"],
    ["Elizabeth", 0, "purple"], ["Fiona", 0, "purple"], ["Isabella", 0, "purple"],
    ["Leah", 0, "purple"], ["Maria", 0, "purple"], ["Miranda", 0, "purple"],
    ["Vivian", 0, "purple"], ["Amber", 4], ["Queenie", 4],
  ].map(([name, season, rarity = "orange"]) => Object.freeze({
    id: name.toLowerCase().replaceAll(" ", "-"), name, season, rarity,
    image: ["amber", "queenie"].includes(name.toLowerCase()) ? null : `assets/heroes/${name.toLowerCase().replaceAll(" ", "-")}.png`,
  })));

  const HERO_STATE_VERSION = 2;
  const GEAR_SLOTS = Object.freeze(["gun", "helmet", "armor", "boots"]);
  const HERO_ROLES = Object.freeze(["unknown", "damage", "defense", "support"]);

  // EXP needed to advance from level n to n + 1. Index 0 is unused.
  const EXP_COSTS = Object.freeze([
    0, 50, 100, 150, 200, 300, 400, 500, 600, 700, 900, 1_100, 1_300, 1_500, 1_700,
    1_900, 2_100, 2_300, 2_500, 2_700, 3_000, 3_300, 3_600, 3_900, 4_200, 4_500,
    4_800, 5_100, 5_400, 5_700, 6_000, 7_000, 9_000, 12_000, 16_000, 21_000,
    27_000, 34_000, 42_000, 51_000, 61_000, 74_000, 90_000, 110_000, 130_000,
    160_000, 180_000, 220_000, 250_000, 290_000, 330_000, 390_000, 470_000,
    570_000, 690_000, 840_000, 1_000_000, 1_200_000, 1_500_000, 1_700_000,
    2_000_000, 2_300_000, 2_600_000, 2_900_000, 3_200_000, 3_500_000, 3_800_000,
    4_100_000, 4_400_000, 4_700_000, 5_200_000, 5_700_000, 6_200_000, 6_700_000,
    7_200_000, 7_700_000, 8_200_000, 8_700_000, 9_200_000, 9_700_000, 10_500_000,
    11_200_000, 12_000_000, 12_700_000, 13_500_000, 14_200_000, 15_000_000,
    15_700_000, 16_500_000, 17_200_000, 18_200_000, 19_200_000, 20_000_000,
    21_000_000, 22_000_000, 23_000_000, 24_000_000, 25_000_000, 26_000_000,
    27_000_000, 29_000_000, 31_000_000, 33_000_000, 35_000_000, 37_000_000,
    39_000_000, 41_000_000, 43_000_000, 45_000_000, 47_000_000, 49_000_000,
    51_000_000, 53_000_000, 55_000_000, 57_000_000, 59_000_000, 61_000_000,
    63_000_000, 65_000_000, 67_000_000, 70_000_000, 73_000_000, 76_000_000,
    79_000_000, 82_000_000, 85_000_000, 88_000_000, 91_000_000, 94_000_000,
    97_000_000, 100_000_000, 103_000_000, 106_000_000, 109_000_000, 112_000_000,
    115_000_000, 118_000_000, 121_000_000, 124_000_000, 127_000_000, 132_000_000,
    137_000_000, 142_000_000, 147_000_000, 152_000_000, 157_000_000, 162_000_000,
    167_000_000, 172_000_000, 177_000_000, 210_000_000, 240_000_000, 270_000_000,
    300_000_000, 330_000_000, 360_000_000, 400_000_000, 430_000_000, 470_000_000,
    500_000_000, 540_000_000, 580_000_000, 620_000_000, 660_000_000, 700_000_000,
    750_000_000, 800_000_000, 850_000_000, 900_000_000, 950_000_000, 1_000_000_000,
    1_100_000_000, 1_200_000_000, 1_300_000_000, 1_400_000_000,
  ]);

  const STAR_FRAGMENT_COSTS = Object.freeze([5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 60, 60, 60, 60, 60, 100, 100, 100, 100, 100]);
  const EXCLUSIVE_FRAGMENT_COSTS = Object.freeze([5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 50, 50, 50, 50, 50]);
  const SKILL_BOOK_COSTS = Object.freeze([0, 100, 100, 100, 100, 200, 200, 200, 200, 200, 300, 300, 300, 300, 300, 400, 400, 400, 400, 400, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500]);

  function whole(value, min, max) {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : min;
  }

  function rangeTotal(costs, current, target) {
    return costs.slice(current, target).reduce((sum, cost) => sum + cost, 0);
  }

  function calculate(values = {}) {
    const level = whole(values.level, 1, 175);
    const targetLevel = Math.max(level, whole(values.targetLevel, level, 175));
    const starStep = whole(values.starStep, 0, 25);
    const targetStarStep = Math.max(starStep, whole(values.targetStarStep, starStep, 25));
    const skillLevel = whole(values.skillLevel, 1, 30);
    const targetSkillLevel = Math.max(skillLevel, whole(values.targetSkillLevel, skillLevel, 30));
    const skills = whole(values.skills, 1, 3);
    const exclusiveStep = whole(values.exclusiveStep, 0, 25);
    const targetExclusiveStep = Math.max(exclusiveStep, whole(values.targetExclusiveStep, exclusiveStep, 25));
    return {
      level, targetLevel, exp: rangeTotal(EXP_COSTS, level, targetLevel), requiredHq: Math.ceil(targetLevel / 5),
      starStep, targetStarStep, heroFragments: rangeTotal(STAR_FRAGMENT_COSTS, starStep, targetStarStep),
      skillLevel, targetSkillLevel, skills, skillBooksPerSkill: rangeTotal(SKILL_BOOK_COSTS, skillLevel, targetSkillLevel),
      skillBooks: rangeTotal(SKILL_BOOK_COSTS, skillLevel, targetSkillLevel) * skills,
      exclusiveStep, targetExclusiveStep, exclusiveFragments: rangeTotal(EXCLUSIVE_FRAGMENT_COSTS, exclusiveStep, targetExclusiveStep),
    };
  }

  function starLabel(stepValue) {
    const step = whole(stepValue, 0, 25);
    const stars = Math.floor(step / 5);
    const part = step % 5;
    return part ? `${stars}\u2605 ${part}/5` : `${stars}\u2605`;
  }

  function heroIdFromName(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return HEROES.find((hero) => hero.id === normalized || hero.name.toLowerCase() === normalized)?.id || null;
  }

  function promotionFromParts(starValue, wedgeValue) {
    const star = whole(starValue, 0, 5);
    if (star >= 5) return 30;
    return (star * 6) + whole(wedgeValue, 0, 5);
  }

  function promotionParts(promotionValue) {
    const promotion = whole(promotionValue, 0, 30);
    if (promotion === 30) return Object.freeze({ star: 5, wedge: 0 });
    return Object.freeze({ star: Math.floor(promotion / 6), wedge: promotion % 6 });
  }

  function defaultGearPiece() {
    return { level: 0, promotion: 0, forge: -1 };
  }

  function normalizeGearPiece(piece = {}) {
    const hasPromotion = Number.isFinite(Number(piece.promotion));
    return {
      level: whole(piece.level ?? piece.equipmentLevel, 0, 100),
      promotion: hasPromotion
        ? whole(piece.promotion, 0, 30)
        : promotionFromParts(piece.currentStar, piece.currentWedge),
      forge: whole(piece.forge ?? piece.forgeStage, -1, 6),
    };
  }

  function defaultHeroRecord(seed = {}) {
    const selectedGearSlot = GEAR_SLOTS.includes(seed.selectedGearSlot || seed.gearSlot)
      ? (seed.selectedGearSlot || seed.gearSlot)
      : "gun";
    const gear = Object.fromEntries(GEAR_SLOTS.map((slot) => [slot, normalizeGearPiece(seed.gear?.[slot] || {})]));
    const role = HERO_ROLES.includes(seed.heroRole) ? seed.heroRole : "unknown";
    return {
      level: whole(seed.level, 1, 175),
      targetLevel: whole(seed.targetLevel ?? 175, 1, 175),
      starStep: whole(seed.starStep, 0, 25),
      targetStarStep: whole(seed.targetStarStep ?? 25, 0, 25),
      skillLevel: whole(seed.skillLevel ?? 20, 1, 30),
      targetSkillLevel: whole(seed.targetSkillLevel ?? 30, 1, 30),
      skills: whole(seed.skills ?? 3, 1, 3),
      exclusiveStep: whole(seed.exclusiveStep, 0, 25),
      targetExclusiveStep: whole(seed.targetExclusiveStep ?? 25, 0, 25),
      ownedExp: whole(seed.ownedExp, 0, Number.MAX_SAFE_INTEGER),
      ownedFragments: whole(seed.ownedFragments, 0, Number.MAX_SAFE_INTEGER),
      ownedBooks: whole(seed.ownedBooks, 0, Number.MAX_SAFE_INTEGER),
      ownedExclusive: whole(seed.ownedExclusive, 0, Number.MAX_SAFE_INTEGER),
      heroRole: role,
      displayedPower: whole(seed.displayedPower, 0, Number.MAX_SAFE_INTEGER),
      selectedGearSlot,
      gear,
    };
  }

  function normalizeHeroRecord(seed = {}) {
    const record = defaultHeroRecord(seed);
    record.targetLevel = Math.max(record.level, record.targetLevel);
    record.targetStarStep = Math.max(record.starStep, record.targetStarStep);
    record.targetSkillLevel = Math.max(record.skillLevel, record.targetSkillLevel);
    record.targetExclusiveStep = Math.max(record.exclusiveStep, record.targetExclusiveStep);
    return record;
  }

  function normalizeHeroState(saved, meritState = {}) {
    if (saved?.modelVersion === HERO_STATE_VERSION && saved.roster && typeof saved.roster === "object") {
      const roster = {};
      Object.entries(saved.roster).forEach(([heroId, record]) => {
        if (HEROES.some((hero) => hero.id === heroId)) roster[heroId] = normalizeHeroRecord(record);
      });
      const activeHeroId = HEROES.some((hero) => hero.id === saved.activeHeroId)
        ? saved.activeHeroId
        : Object.keys(roster)[0] || "yu-chan";
      if (!roster[activeHeroId]) roster[activeHeroId] = normalizeHeroRecord();
      return { modelVersion: HERO_STATE_VERSION, activeHeroId, roster };
    }

    const meritHeroId = heroIdFromName(meritState?.hero);
    const savedHeroId = heroIdFromName(saved?.heroId);
    const activeHeroId = savedHeroId || meritHeroId || "yu-chan";
    const legacy = saved && typeof saved === "object" ? saved : {};
    const record = normalizeHeroRecord(legacy);
    const selectedGearSlot = GEAR_SLOTS.includes(legacy.gearSlot)
      ? legacy.gearSlot
      : GEAR_SLOTS.includes(meritState?.gearSlot) ? meritState.gearSlot : "gun";
    record.selectedGearSlot = selectedGearSlot;

    const meritMatches = meritHeroId === activeHeroId;
    const legacyPiece = {
      equipmentLevel: legacy.equipmentLevel,
      currentStar: legacy.currentStar,
      currentWedge: legacy.currentWedge,
      forgeStage: legacy.forgeStage,
    };
    const meritPiece = meritMatches ? meritState : {};
    if (legacy.equipmentLevel != null || meritMatches) {
      record.gear[selectedGearSlot] = normalizeGearPiece({ ...legacyPiece, ...meritPiece });
    }
    if (meritMatches && HERO_ROLES.includes(meritState.heroRole)) record.heroRole = meritState.heroRole;

    return {
      modelVersion: HERO_STATE_VERSION,
      activeHeroId,
      roster: { [activeHeroId]: record },
    };
  }

  function getHeroRecord(state, heroId) {
    return normalizeHeroRecord(state?.roster?.[heroId] || {});
  }

  function setHeroRecord(state, heroId, record) {
    const normalizedState = normalizeHeroState(state);
    if (!HEROES.some((hero) => hero.id === heroId)) return normalizedState;
    return {
      modelVersion: HERO_STATE_VERSION,
      activeHeroId: heroId,
      roster: { ...normalizedState.roster, [heroId]: normalizeHeroRecord(record) },
    };
  }

  return Object.freeze({
    SOURCE, HEROES, EXP_COSTS, STAR_FRAGMENT_COSTS, EXCLUSIVE_FRAGMENT_COSTS, SKILL_BOOK_COSTS,
    HERO_STATE_VERSION, GEAR_SLOTS, calculate, starLabel, heroIdFromName, promotionFromParts,
    promotionParts, defaultGearPiece, normalizeGearPiece, defaultHeroRecord, normalizeHeroRecord,
    normalizeHeroState, getHeroRecord, setHeroRecord,
  });
});

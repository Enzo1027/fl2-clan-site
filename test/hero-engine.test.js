const test = require("node:test");
const assert = require("node:assert/strict");
const hero = require("../public/hero-engine.js");

test("hero dataset contains the current published roster and exact level ceiling", () => {
  assert.equal(hero.HEROES.length, 30);
  assert.equal(hero.EXP_COSTS.length, 175);
});

test("hero level calculator matches published cumulative examples", () => {
  assert.equal(hero.calculate({ level: 1, targetLevel: 50 }).exp, 1_854_500);
  assert.equal(hero.calculate({ level: 1, targetLevel: 175 }).exp, 21_817_444_500);
  assert.equal(hero.calculate({ level: 170, targetLevel: 175 }).requiredHq, 35);
});

test("hero star, skill, and exclusive totals match the published tables", () => {
  const result = hero.calculate({
    starStep: 0, targetStarStep: 25,
    skillLevel: 1, targetSkillLevel: 30, skills: 3,
    exclusiveStep: 0, targetExclusiveStep: 25,
  });
  assert.equal(result.heroFragments, 975);
  assert.equal(result.skillBooks, 29_700);
  assert.equal(result.exclusiveFragments, 575);
});

test("partial hero progress only counts unfinished sublevels", () => {
  const result = hero.calculate({ starStep: 5, targetStarStep: 10, exclusiveStep: 20, targetExclusiveStep: 25 });
  assert.equal(result.heroFragments, 50);
  assert.equal(result.exclusiveFragments, 250);
  assert.equal(hero.starLabel(7), "1★ 2/5");
});

test("legacy hero and Merit selections migrate into one four-piece roster", () => {
  const state = hero.normalizeHeroState({
    heroId: "dodomeki",
    level: "150",
    targetLevel: "175",
    heroRole: "defense",
    gearSlot: "armor",
    equipmentLevel: "44",
  }, {
    hero: "Dodomeki",
    heroRole: "defense",
    gearSlot: "armor",
    equipmentLevel: "62",
    currentStar: "2",
    currentWedge: "3",
    forgeStage: "1",
  });

  assert.equal(state.modelVersion, 2);
  assert.equal(state.activeHeroId, "dodomeki");
  assert.equal(state.roster.dodomeki.level, 150);
  assert.deepEqual(state.roster.dodomeki.gear.armor, { level: 62, promotion: 15, forge: 1 });
  assert.deepEqual(state.roster.dodomeki.gear.gun, { level: 0, promotion: 0, forge: -1 });
});

test("hero records retain separate four-piece loadouts and convert promotion parts", () => {
  const original = hero.normalizeHeroState(null, null);
  const yuChan = hero.getHeroRecord(original, "yu-chan");
  yuChan.gear.helmet = { level: 70, promotion: hero.promotionFromParts(4, 5), forge: 3 };
  const updated = hero.setHeroRecord(original, "yu-chan", yuChan);

  assert.deepEqual(hero.promotionParts(updated.roster["yu-chan"].gear.helmet.promotion), { star: 4, wedge: 5 });
  assert.equal(original.roster["yu-chan"].gear.helmet.level, 0);
});

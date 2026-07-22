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

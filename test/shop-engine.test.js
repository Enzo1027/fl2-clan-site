const test = require("node:test");
const assert = require("node:assert/strict");
const shop = require("../public/shop-engine.js");

test("shop advisor covers all seven currently documented shops", () => {
  assert.equal(shop.SHOPS.length, 7);
});

test("Merit advice holds outside State Ruler and protects missing orange gear inside it", () => {
  const normal = shop.advise({ stateRuler: false }).find((item) => item.id === "merit");
  assert.equal(normal.recommendations[0].verdict, "hold");
  const event = shop.advise({ stateRuler: true, orangeGearComplete: false }).find((item) => item.id === "merit");
  assert.equal(event.recommendations[0].verdict, "buy");
  assert.equal(event.recommendations[2].verdict, "buy");
});

test("account context changes VIP and war-sensitive recommendations", () => {
  const result = shop.advise({ vipLevel: 10, warSoon: true });
  assert.equal(result.find((item) => item.id === "limited").recommendations[1].verdict, "buy");
  assert.equal(result.find((item) => item.id === "core").recommendations[1].verdict, "buy-if");
});

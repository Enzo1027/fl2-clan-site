(function shopEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ShopAdvisor = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createShopEngine() {
  "use strict";

  const SOURCE = Object.freeze({
    name: "LDShop Last Z Store Guide",
    url: "https://www.ldshop.gg/blog/last-z/store-guide.html",
    updatedAt: "2026-05-28",
    confidence: "medium-community-strategy",
    note: "Purchase order is community strategy, not an official game rule. Exact stock and prices can rotate; always compare the live shelf.",
  });

  const SHOPS = Object.freeze([
    {
      id: "glory", name: "Glory Shop", currency: "Glory Points", cadence: "Weekly",
      items: [
        ["Versatile Orange Hero Fragments", "buy", "Rare, flexible hero progress"],
        ["Golden Wrenches", "buy", "Long tank path and Vehicle Day value"],
        ["Exclusive Equipment Framework Fragments", "buy", "Rare when available"],
        ["Random Component Boxes", "buy-if", "After the three rarer materials"],
        ["Refugee Tickets / Enhancement Alloy", "buy-if", "Useful when an aligned event is near"],
        ["Modification Blueprints", "last", "Spend here only after stronger priorities"],
      ],
    },
    {
      id: "merit", name: "Merit Shop", currency: "Merit Medals", cadence: "State Ruler",
      items: [
        ["Power Cores", "event", "Best during State Ruler; use the FL2 Merit calculator for account-specific advice"],
        ["Versatile Orange Hero Fragments", "event", "Strong during State Ruler when your main heroes still need stars"],
        ["Orange Equipment Choice Box", "event-if", "Protect this until Formation 1 has complete orange gear"],
        ["Purple boxes, basic tickets, resource crates", "skip", "Low long-term progression value"],
      ],
    },
    {
      id: "vip", name: "VIP Shop", currency: "VIP Points", cadence: "Rotation",
      items: [
        ["Golden Wrenches", "buy", "Most consistent scarce progression purchase"],
        ["Speed-ups", "skip", "More replaceable than wrenches"],
      ],
    },
    {
      id: "camilla", name: "Camilla's Shop", currency: "Event Tokens", cadence: "Event",
      items: [
        ["Advanced Modification License", "buy", "Hard gate for later vehicle modification"],
        ["Rare vehicle materials", "buy-if", "Good after the license"],
        ["Common speed-ups", "skip", "Usually replaceable elsewhere"],
      ],
    },
    {
      id: "limited", name: "Time-Limited Shop", currency: "Rotating", cadence: "Event",
      items: [
        ["Research Badges", "buy", "Permanent high-tier research bottleneck"],
        ["Versatile Orange Fragments", "vip10", "Priority when unlocked at VIP 10+"],
        ["Purple Hero Fragments", "skip", "Low late-game impact"],
      ],
    },
    {
      id: "core", name: "Power Core Store", currency: "Power Core Store Currency", cadence: "Cycle",
      items: [
        ["Fuel", "buy", "Consistent activity and vehicle value"],
        ["Advanced Teleporters", "war", "Only when relocation or war is near"],
        ["Power Cores", "skip", "Community sources rate other acquisition paths better"],
      ],
    },
    {
      id: "black", name: "Black Market", currency: "Valor Medals", cadence: "Earned in combat events",
      items: [
        ["Orange Equipment", "gear", "Priority until Formation 1 is fully equipped"],
        ["Everything else", "last", "Reassess only after the orange gear need is covered"],
      ],
    },
  ].map((shop) => Object.freeze({ ...shop, items: Object.freeze(shop.items.map((item) => Object.freeze(item))) })));

  function verdict(rule, state) {
    if (rule === "buy") return "buy";
    if (rule === "skip") return "skip";
    if (rule === "last") return "last";
    if (rule === "event") return state.stateRuler ? "buy" : "hold";
    if (rule === "event-if") return state.stateRuler && !state.orangeGearComplete ? "buy" : state.stateRuler ? "last" : "hold";
    if (rule === "vip10") return state.vipLevel >= 10 ? "buy" : "locked";
    if (rule === "war") return state.warSoon ? "buy-if" : "hold";
    if (rule === "gear") return state.orangeGearComplete ? "last" : "buy";
    return "buy-if";
  }

  function advise(values = {}) {
    const state = {
      stateRuler: Boolean(values.stateRuler),
      vehicleEvent: Boolean(values.vehicleEvent),
      warSoon: Boolean(values.warSoon),
      orangeGearComplete: Boolean(values.orangeGearComplete),
      vipLevel: Math.max(0, Math.floor(Number(values.vipLevel) || 0)),
    };
    return SHOPS.map((shop) => ({
      ...shop,
      recommendations: shop.items.map(([item, rule, reason]) => ({ item, rule, reason, verdict: verdict(rule, state) })),
    }));
  }

  return Object.freeze({ SOURCE, SHOPS, advise });
});

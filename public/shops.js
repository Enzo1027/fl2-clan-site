(function initializeShopPage() {
  "use strict";
  const store = window.fl2Profiles;
  const t = (value) => window.fl2I18n?.t(value) || value;
  const form = document.getElementById("shopForm");
  const verdictLabels = { buy: "Buy", "buy-if": "Situational", hold: "Hold", skip: "Skip", last: "Buy last", locked: "Locked" };
  function values() {
    const data = new FormData(form);
    return { stateRuler: data.has("stateRuler"), orangeGearComplete: data.has("orangeGearComplete"), warSoon: data.has("warSoon"), vehicleEvent: data.has("vehicleEvent"), vipLevel: data.get("vipLevel") || "0" };
  }
  function save() { store?.setFeatureState("shops", values()); }
  function render(persist = true) {
    const input = values(); const shops = ShopAdvisor.advise(input);
    document.getElementById("shopGrid").innerHTML = shops.map((shop) => `<article class="shop-card"><header><div><h2>${shop.name}</h2><span>${shop.currency}</span></div><span>${shop.cadence}</span></header><div class="shop-items">${shop.recommendations.map((item) => `<div class="shop-item"><span class="verdict verdict-${item.verdict}">${verdictLabels[item.verdict]}</span><div><strong>${item.item}</strong><small>${item.reason}</small></div></div>`).join("")}</div></article>`).join("");
    const buys = shops.flatMap((shop) => shop.recommendations.filter((item) => item.verdict === "buy").slice(0, 2).map((item) => ({ shop: shop.name, item: item.item })));
    document.getElementById("buyFirst").innerHTML = buys.slice(0, 5).map((item) => `<div class="compact-row"><div><strong>${item.item}</strong><span>${item.shop}</span></div><b>BUY</b></div>`).join("");
    if (input.stateRuler) { document.getElementById("shopHeadline").textContent = "State Ruler: compare Merit bottlenecks"; document.getElementById("shopSummary").textContent = "Power Cores, orange fragments, and orange equipment can all be correct. Use the exact Merit advisor for your hero and gear state."; }
    else { document.getElementById("shopHeadline").textContent = "Hold Merit; start with recurring scarce items"; document.getElementById("shopSummary").textContent = "Glory orange fragments and wrenches are strong recurring priorities while Merit waits for State Ruler."; }
    if (persist) save();
  }
  function restore() {
    const saved = store?.getFeatureState("shops"); form.reset();
    if (saved) Object.entries(saved).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (!field) return; if (field.type === "checkbox") field.checked = Boolean(value); else field.value = String(value); });
    render(Boolean(saved));
  }
  form.addEventListener("input", () => render(true)); form.addEventListener("change", () => render(true)); form.addEventListener("submit", (event) => { event.preventDefault(); render(true); document.getElementById("shopGrid").scrollIntoView({ behavior: "smooth", block: "start" }); });
  document.getElementById("clearShops").addEventListener("click", () => { store?.removeFeatureState("shops"); restore(); window.fl2Toast(t("Shop context cleared for this profile")); });
  window.addEventListener("fl2:profilechange", restore); restore();
})();

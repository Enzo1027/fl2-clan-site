(function initializeHQPage() {
  "use strict";
  const store = window.fl2Profiles;
  const form = document.getElementById("hqForm");
  const current = document.getElementById("currentHq");
  const target = document.getElementById("targetHq");
  const resources = ["wood", "food", "zent", "steel"];
  const labels = { wood: "Wood", food: "Food", zent: "Zent", steel: "Steel" };
  const i18n = window.fl2I18n;
  const t = (value) => i18n?.t(value) || value;
  const format = (value) => new Intl.NumberFormat(i18n?.locale).format(Math.round(value || 0));
  const short = (value) => {
    if (!value) return "0";
    if (value >= 1e9) return `${(value / 1e9).toFixed(value % 1e9 ? 2 : 0).replace(/\.00$/, "")}G`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(value % 1e6 ? 1 : 0).replace(/\.0$/, "")}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
    return format(value);
  };

  function populateLevels() {
    const options = HQPlanner.LEVELS.map((item) => `<option value="${item.level}">HQ ${item.level}</option>`).join("");
    current.innerHTML = options; target.innerHTML = options; current.value = "29"; target.value = "30";
  }
  function values() { return Object.fromEntries(new FormData(form).entries()); }
  function save() { store?.setFeatureState("hq", values()); }
  function restore() {
    const saved = store?.getFeatureState("hq");
    form.reset(); current.value = "29"; target.value = "30";
    if (saved) Object.entries(saved).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field) field.value = String(value); });
    render(Boolean(saved));
  }
  function render(persist = true) {
    if (Number(target.value) < Number(current.value)) target.value = current.value;
    const input = values();
    const result = HQPlanner.planUpgrade(input.current, input.target, input);
    document.getElementById("hqPath").textContent = `${result.current} → ${result.target}`;
    document.getElementById("hqSteps").textContent = `${result.steps.length} HQ upgrade${result.steps.length === 1 ? "" : "s"}`;
    document.getElementById("heroCap").textContent = format(result.heroCap);
    const ready = resources.filter((key) => result.totals[key] === 0 || result.missing[key] === 0).length;
    document.getElementById("readyCount").textContent = `${ready} / 4`;
    document.getElementById("resultIntro").textContent = result.steps.length ? `Published HQ rows ${result.current + 1} through ${result.target}. Prerequisite-building upgrade costs are separate.` : "Choose a target above your current HQ.";
    document.getElementById("resourceResults").innerHTML = resources.map((key) => {
      const needed = result.totals[key], missing = result.missing[key], owned = result.owned[key];
      return `<article class="resource-card ${missing ? "is-short" : "is-ready"}"><span>${labels[key]}</span><strong>${missing ? `${short(missing)} short` : needed ? "Ready" : "Not needed"}</strong><small>${short(needed)} total${owned ? ` · ${short(owned)} owned` : ""}</small></article>`;
    }).join("");
    document.getElementById("seasonWarning").hidden = result.target < 31;
    document.getElementById("hqRoute").innerHTML = result.steps.map((step) => {
      const cost = resources.filter((key) => step.resources[key]).map((key) => `${labels[key]} ${short(step.resources[key])}`).join(" · ");
      return `<tr><td><strong>HQ ${step.level}</strong></td><td>${step.buildings.join(" + ") || "None"}</td><td>${cost || "None"}</td><td>${step.heroCap}</td></tr>`;
    }).join("") || '<tr><td colspan="4">You are already at this target.</td></tr>';
    if (persist) save();
  }
  form.addEventListener("input", render); form.addEventListener("change", render);
  form.addEventListener("submit", (event) => { event.preventDefault(); render(); document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" }); });
  document.getElementById("clearHq").addEventListener("click", () => { store?.removeFeatureState("hq"); form.reset(); current.value = "29"; target.value = "30"; render(false); window.fl2Toast(t("HQ plan cleared for this profile")); });
  window.addEventListener("fl2:profilechange", restore);
  populateLevels(); restore();
})();

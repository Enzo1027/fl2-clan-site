(function initializeHeroPage() {
  "use strict";
  const store = window.fl2Profiles;
  const form = document.getElementById("heroForm");
  const format = (value) => new Intl.NumberFormat().format(Math.max(0, Math.round(Number(value) || 0)));
  const number = (value) => Math.max(0, Math.floor(Number(String(value).replaceAll(",", "")) || 0));

  function fillProgressSelect(select, exclusive = false) {
    select.innerHTML = Array.from({ length: 26 }, (_, step) => `<option value="${step}">${exclusive ? `Lv ${HeroPlanner.starLabel(step).replace("★", "")}` : HeroPlanner.starLabel(step)}</option>`).join("");
  }
  function values() { return Object.fromEntries(new FormData(form).entries()); }
  function selectedHero() { return HeroPlanner.HEROES.find((hero) => hero.id === document.getElementById("heroId").value) || HeroPlanner.HEROES[0]; }
  function save() { store?.setFeatureState("heroes", { ...values(), heroRole: document.getElementById("heroRole").value, gearSlot: document.getElementById("gearSlot").value, equipmentLevel: document.getElementById("equipmentLevel").value }); }
  function renderRoster() {
    const active = selectedHero();
    document.getElementById("heroSelector").innerHTML = HeroPlanner.HEROES.map((hero) => `<button class="hero-chip${hero.id === active.id ? " is-active" : ""}" type="button" data-hero-id="${hero.id}" aria-pressed="${hero.id === active.id}">${hero.image ? `<img src="${hero.image}" alt="" />` : `<span class="hero-avatar-fallback">${hero.name.slice(0, 2).toUpperCase()}</span>`}<strong>${hero.name}</strong><small>${hero.season ? `S${hero.season}` : "Base"} · ${hero.rarity}</small></button>`).join("");
    document.querySelectorAll(".hero-chip").forEach((button) => button.addEventListener("click", () => { document.getElementById("heroId").value = button.dataset.heroId; render(true); }));
  }
  function render(persist = true) {
    const input = values();
    if (Number(input.targetLevel) < Number(input.level)) form.elements.targetLevel.value = input.level;
    if (Number(input.targetStarStep) < Number(input.starStep)) form.elements.targetStarStep.value = input.starStep;
    if (Number(input.targetSkillLevel) < Number(input.skillLevel)) form.elements.targetSkillLevel.value = input.skillLevel;
    if (Number(input.targetExclusiveStep) < Number(input.exclusiveStep)) form.elements.targetExclusiveStep.value = input.exclusiveStep;
    const clean = values();
    const result = HeroPlanner.calculate(clean);
    const hero = selectedHero();
    document.getElementById("selectedHeroName").textContent = hero.name;
    document.getElementById("selectedHeroMeta").textContent = `${hero.season ? `Season ${hero.season}` : "Base roster"} · ${hero.rarity === "orange" ? "Orange" : "Purple"}`;
    document.getElementById("heroResultIntro").textContent = `${hero.name}: level ${result.level} → ${result.targetLevel}, ${HeroPlanner.starLabel(result.starStep)} → ${HeroPlanner.starLabel(result.targetStarStep)}.`;
    const resources = [
      ["Hero EXP", result.exp, number(clean.ownedExp), `HQ ${result.requiredHq} required for level ${result.targetLevel}`],
      ["Orange fragments", result.heroFragments, number(clean.ownedFragments), `${HeroPlanner.starLabel(result.starStep)} → ${HeroPlanner.starLabel(result.targetStarStep)}`],
      ["Orange skill books", result.skillBooks, number(clean.ownedBooks), `${result.skills} skill${result.skills === 1 ? "" : "s"} through level ${result.targetSkillLevel}`],
      ["Exclusive fragments", result.exclusiveFragments, number(clean.ownedExclusive), "Season heroes only; initial unlock not included"],
    ];
    document.getElementById("heroResources").innerHTML = resources.map(([label, needed, owned, note]) => {
      const missing = Math.max(0, needed - owned);
      return `<article class="resource-card ${missing ? "is-short" : "is-ready"}"><span>${label}</span><strong>${missing ? format(missing) : needed ? "Ready" : "None"}</strong><small>${format(needed)} total${owned ? ` · ${format(owned)} owned` : ""}<br>${note}</small></article>`;
    }).join("");
    document.getElementById("heroEvidence").innerHTML = `<strong>Known boundary:</strong> this calculator stops at level 175 and five stars. It does not mix in Season 5’s later-star system or any Last War data.`;
    const role = document.getElementById("heroRole").value;
    document.getElementById("gearGuidance").textContent = role === "damage" ? "Damage hero: compare Gun and Helmet first, then use the exact level/star/forge state in Merit." : role === "defense" ? "Front-row hero: compare Armor and Boots first, then use the exact level/star/forge state in Merit." : "Choose the lowest-level orange piece in Formation 1; the Merit advisor will account for its exact level, stars, sections, and forge stage.";
    renderRoster();
    if (persist) save();
  }
  function restore() {
    const saved = store?.getFeatureState("heroes");
    form.reset(); document.getElementById("heroId").value = "yu-chan"; document.getElementById("starStep").value = "0"; document.getElementById("targetStarStep").value = "25"; document.getElementById("exclusiveStep").value = "0"; document.getElementById("targetExclusiveStep").value = "25";
    document.getElementById("heroRole").value = saved?.heroRole || "unknown"; document.getElementById("gearSlot").value = saved?.gearSlot || "gun"; document.getElementById("equipmentLevel").value = saved?.equipmentLevel || "40";
    if (saved) Object.entries(saved).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field) field.value = String(value); });
    render(Boolean(saved));
  }
  [document.getElementById("starStep"), document.getElementById("targetStarStep")].forEach((select) => fillProgressSelect(select));
  [document.getElementById("exclusiveStep"), document.getElementById("targetExclusiveStep")].forEach((select) => fillProgressSelect(select, true));
  form.addEventListener("input", () => render(true)); form.addEventListener("change", () => render(true)); form.addEventListener("submit", (event) => { event.preventDefault(); render(true); document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" }); });
  ["heroRole", "gearSlot", "equipmentLevel"].forEach((id) => document.getElementById(id).addEventListener("change", () => render(true)));
  document.getElementById("openMerit").addEventListener("click", () => {
    const existing = store?.getFeatureState("calculator") || {};
    store?.setFeatureState("calculator", { ...existing, hero: selectedHero().name, heroRole: document.getElementById("heroRole").value, gearSlot: document.getElementById("gearSlot").value, equipmentLevel: document.getElementById("equipmentLevel").value });
    location.href = "calculator.html";
  });
  document.getElementById("clearHero").addEventListener("click", () => { store?.removeFeatureState("heroes"); restore(); window.fl2Toast("Hero plan cleared for this profile"); });
  window.addEventListener("fl2:profilechange", restore); restore();
})();

(function initializeHeroPage() {
  "use strict";

  const Planner = window.HeroPlanner;
  const Power = window.MeritCalculator;
  const store = window.fl2Profiles;
  const form = document.getElementById("heroForm");
  const byId = (id) => document.getElementById(id);
  const i18n = window.fl2I18n;
  const t = (value) => i18n?.t(value) || value;
  const format = (value) => new Intl.NumberFormat(i18n?.locale).format(Math.max(0, Math.round(Number(value) || 0)));
  const formatDecimal = (value) => new Intl.NumberFormat(i18n?.locale, { maximumFractionDigits: 1 }).format(Math.max(0, Number(value) || 0));
  const number = (value) => Math.max(0, Math.floor(Number(String(value ?? 0).replaceAll(",", "")) || 0));
  const gearLabels = { gun: "Gun", helmet: "Helmet", armor: "Armor", boots: "Boots" };
  let heroState;

  function fillProgressSelect(select, exclusive = false) {
    select.innerHTML = Array.from({ length: 26 }, (_, step) => `<option value="${step}">${exclusive ? `Lv ${Planner.starLabel(step).replace("★", "")}` : Planner.starLabel(step)}</option>`).join("");
  }

  function values() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function selectedHero() {
    return Planner.HEROES.find((hero) => hero.id === heroState.activeHeroId) || Planner.HEROES[0];
  }

  function activeRecord() {
    return Planner.getHeroRecord(heroState, selectedHero().id);
  }

  function saveState() {
    store?.setFeatureState("heroes", heroState);
  }

  function writeActiveRecord(patch) {
    const heroId = selectedHero().id;
    const current = activeRecord();
    const next = Planner.normalizeHeroRecord({
      ...current,
      ...patch,
      gear: patch.gear || current.gear,
    });
    heroState = Planner.setHeroRecord(heroState, heroId, next);
    saveState();
    return next;
  }

  function renderRoster() {
    const active = selectedHero();
    byId("heroSelector").innerHTML = Planner.HEROES.map((hero) => `<button class="hero-chip${hero.id === active.id ? " is-active" : ""}" type="button" data-hero-id="${hero.id}" aria-pressed="${hero.id === active.id}">${hero.image ? `<img src="${hero.image}" alt="" />` : `<span class="hero-avatar-fallback">${hero.name.slice(0, 2).toUpperCase()}</span>`}<strong data-i18n-skip>${hero.name}</strong><small>${hero.season ? `S${hero.season}` : "Base"} · ${hero.rarity}</small></button>`).join("");
  }

  function gearOptions(max, selected, suffix = "") {
    return Array.from({ length: max + 1 }, (_, value) => `<option value="${value}"${value === selected ? " selected" : ""}>${value}${suffix}</option>`).join("");
  }

  function forgeOptions(selected) {
    return [
      [-1, "Locked"], [0, "Base"], [1, "+1"], [2, "+2"], [3, "+3"],
      [4, "+4"], [5, "+5"], [6, "Mythic"],
    ].map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("");
  }

  function gearCard(slot, piece, selectedSlot) {
    const parts = Planner.promotionParts(piece.promotion);
    const selected = slot === selectedSlot;
    return `<article class="loadout-card${selected ? " is-selected" : ""}" data-gear-slot="${slot}">
      <header><b class="loadout-gear-thumb loadout-gear-${slot}" aria-hidden="true"></b><span><strong>${gearLabels[slot]}</strong><small data-gear-summary></small></span><span class="selected-mark">${selected ? "MERIT" : ""}</span></header>
      <div class="loadout-fields">
        <label><span>Level</span><input data-gear-field="level" type="number" min="0" max="100" value="${piece.level}" inputmode="numeric" aria-label="${gearLabels[slot]} equipment level" /></label>
        <label><span>Stars</span><select data-gear-field="star" aria-label="${gearLabels[slot]} orange stars">${gearOptions(5, parts.star, "★")}</select></label>
        <label><span>Sections</span><select data-gear-field="wedge" aria-label="${gearLabels[slot]} filled sections">${gearOptions(5, parts.wedge, "/6")}</select></label>
        <label><span>Red</span><select data-gear-field="forge" aria-label="${gearLabels[slot]} red forge level">${forgeOptions(piece.forge)}</select></label>
      </div>
      <button class="select-merit-gear" type="button" data-select-gear="${slot}">${selected ? "Selected for Merit" : "Use in Merit"}</button>
    </article>`;
  }

  function gearSummary(piece) {
    const parts = Planner.promotionParts(piece.promotion);
    const starText = parts.star || parts.wedge ? `${parts.star}★ ${parts.wedge}/6` : "no stars";
    return `Lv.${piece.level} · ${starText}`;
  }

  function refreshGearCard(card) {
    const star = Number(card.querySelector('[data-gear-field="star"]').value);
    const wedge = card.querySelector('[data-gear-field="wedge"]');
    if (star >= 5) wedge.value = "0";
    wedge.disabled = star >= 5;
    const piece = Planner.normalizeGearPiece({
      level: card.querySelector('[data-gear-field="level"]').value,
      currentStar: star,
      currentWedge: wedge.value,
      forge: card.querySelector('[data-gear-field="forge"]').value,
    });
    card.querySelector("[data-gear-summary]").textContent = gearSummary(piece);
    return piece;
  }

  function renderLoadout() {
    const record = activeRecord();
    byId("gearLoadout").innerHTML = Planner.GEAR_SLOTS.map((slot) => gearCard(slot, record.gear[slot], record.selectedGearSlot)).join("");
    byId("gearLoadout").querySelectorAll(".loadout-card").forEach(refreshGearCard);
  }

  function guidance(record) {
    const piece = gearLabels[record.selectedGearSlot];
    if (record.heroRole === "damage") return `Damage hero: compare Gun and Helmet first. ${piece} is selected and synced to Merit.`;
    if (record.heroRole === "defense") return `Front-row hero: compare Armor and Boots first. ${piece} is selected and synced to Merit.`;
    return `${piece} is selected. If you are unsure, use the lowest-level orange piece in Formation 1.`;
  }

  function renderPower() {
    const record = activeRecord();
    const summary = Power.getLoadoutPowerSummary(record.gear, record.displayedPower, record.selectedGearSlot);
    const allExact = summary.exactMilestonePieces === 4;
    byId("currentHeroPower").textContent = summary.displayedHeroPower ? format(summary.displayedHeroPower) : "Not entered";
    byId("gearPowerLabel").textContent = allExact ? "Verified milestone subtotal" : "Documented gear floor";
    byId("documentedGearPower").textContent = summary.documentedGearFloor ? format(summary.documentedGearFloor) : "0";
    byId("gearPowerNote").textContent = allExact
      ? "All four pieces match published star + level-cap rows before forge"
      : `${summary.documentedPieces} of 4 pieces match a published star + level-cap floor`;

    if (summary.projectedHeroPower !== null) {
      byId("projectedHeroPower").textContent = format(summary.projectedHeroPower);
      byId("powerProjectionNote").textContent = `+${format(summary.projectionDelta)} at ${summary.milestone.nextFullStar}★ and Lv.${summary.targetMilestoneLevel}`;
      byId("powerBadge").textContent = "Exact milestone delta";
    } else {
      byId("projectedHeroPower").textContent = summary.displayedHeroPower ? "Not safe yet" : "Needs baseline";
      byId("powerProjectionNote").textContent = !summary.displayedHeroPower
        ? "Enter the current power shown in game"
        : summary.selected.wedge > 0 ? "Finish the current star so both endpoints are published"
          : summary.selected.star === 0 ? "Reach 1★ and Lv.55 for the first published milestone"
            : summary.selected.star >= 5 ? "Selected gear is already 5★"
              : summary.selected.level !== summary.selected.publishedMilestoneLevel ? `Set the actual level; this ${summary.selected.star}★ row is published at Lv.${summary.selected.publishedMilestoneLevel}`
                : summary.selected.forge > 0 ? "A red-forged baseline cannot use the un-forged milestone delta" : "This state is not a published milestone";
      byId("powerBadge").textContent = allExact ? "Verified gear total" : "Partial";
    }

    const milestone = summary.milestone;
    byId("powerNextStep").innerHTML = milestone.complete
      ? `<span>${summary.selected.label}</span><strong>Core path complete</strong><small>This piece is already 5★. Select another item for Merit.</small>`
      : `<span>Exact next Core click · ${summary.selected.label}</span><strong>+${format(milestone.flatDelta)} ${milestone.promotionLabel} &nbsp; +${formatDecimal(milestone.percentDelta)}% ${milestone.troopLabel}</strong><small>${format(milestone.cores)} Cores · ${milestone.currentLabel} → ${milestone.nextLabel}</small>`;
    byId("powerHonesty").textContent = allExact
      ? "The subtotal exactly matches four published orange-gear star + enhancement-cap rows before red forging. Hero level, skills, hero stars, exclusive equipment, research, buildings, and vehicle bonuses are not included."
      : "Published power rows pair each completed star with its enhancement cap. Partial sections, off-cap levels, and red-forge power are not guessed; qualifying rows above are only a documented floor.";
    byId("gearGuidance").textContent = guidance(record);
  }

  function saveProgressAndRender() {
    const input = values();
    if (Number(input.targetLevel) < Number(input.level)) form.elements.targetLevel.value = input.level;
    if (Number(input.targetStarStep) < Number(input.starStep)) form.elements.targetStarStep.value = input.starStep;
    if (Number(input.targetSkillLevel) < Number(input.skillLevel)) form.elements.targetSkillLevel.value = input.skillLevel;
    if (Number(input.targetExclusiveStep) < Number(input.exclusiveStep)) form.elements.targetExclusiveStep.value = input.exclusiveStep;
    const clean = values();
    const record = writeActiveRecord(clean);
    const result = Planner.calculate(clean);
    const hero = selectedHero();
    byId("selectedHeroName").textContent = hero.name;
    byId("selectedHeroMeta").textContent = `${hero.season ? `Season ${hero.season}` : "Base roster"} · ${hero.rarity === "orange" ? "Orange" : "Purple"}`;
    byId("heroResultIntro").textContent = `${hero.name}: level ${result.level} → ${result.targetLevel}, ${Planner.starLabel(result.starStep)} → ${Planner.starLabel(result.targetStarStep)}.`;
    const resources = [
      ["Hero EXP", result.exp, number(clean.ownedExp), `HQ ${result.requiredHq} required for level ${result.targetLevel}`],
      ["Orange fragments", result.heroFragments, number(clean.ownedFragments), `${Planner.starLabel(result.starStep)} → ${Planner.starLabel(result.targetStarStep)}`],
      ["Orange skill books", result.skillBooks, number(clean.ownedBooks), `${result.skills} skill${result.skills === 1 ? "" : "s"} through level ${result.targetSkillLevel}`],
      ["Exclusive fragments", result.exclusiveFragments, number(clean.ownedExclusive), "Season heroes only; initial unlock not included"],
    ];
    byId("heroResources").innerHTML = resources.map(([label, needed, owned, note]) => {
      const missing = Math.max(0, needed - owned);
      return `<article class="resource-card ${missing ? "is-short" : "is-ready"}"><span>${label}</span><strong>${missing ? format(missing) : needed ? "Ready" : "None"}</strong><small>${format(needed)} total${owned ? ` · ${format(owned)} owned` : ""}<br>${note}</small></article>`;
    }).join("");
    byId("heroEvidence").innerHTML = "<strong>Known boundary:</strong> this calculator stops at level 175 and five hero stars. It does not mix in Season 5’s later-star system or any Last War data.";
    return record;
  }

  function loadActiveHero() {
    const hero = selectedHero();
    const record = activeRecord();
    byId("heroId").value = hero.id;
    Object.entries(record).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field && typeof value !== "object") field.value = String(value);
    });
    byId("heroRole").value = record.heroRole;
    byId("displayedPower").value = record.displayedPower || "";
    renderRoster();
    renderLoadout();
    saveProgressAndRender();
    renderPower();
  }

  function restore() {
    form.reset();
    const saved = store?.getFeatureState("heroes");
    const merit = store?.getFeatureState("calculator");
    heroState = Planner.normalizeHeroState(saved, merit);
    if (saved && saved.modelVersion !== Planner.HERO_STATE_VERSION) saveState();
    loadActiveHero();
  }

  [byId("starStep"), byId("targetStarStep")].forEach((select) => fillProgressSelect(select));
  [byId("exclusiveStep"), byId("targetExclusiveStep")].forEach((select) => fillProgressSelect(select, true));

  byId("heroSelector").addEventListener("click", (event) => {
    const button = event.target.closest("[data-hero-id]");
    if (!button || button.dataset.heroId === selectedHero().id) return;
    heroState = Planner.setHeroRecord(heroState, button.dataset.heroId, Planner.getHeroRecord(heroState, button.dataset.heroId));
    saveState();
    loadActiveHero();
  });

  form.addEventListener("input", saveProgressAndRender);
  form.addEventListener("change", saveProgressAndRender);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProgressAndRender();
    document.querySelector(".result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  byId("gearLoadout").addEventListener("input", (event) => {
    const card = event.target.closest("[data-gear-slot]");
    if (!card || !event.target.matches("[data-gear-field]")) return;
    const record = activeRecord();
    writeActiveRecord({ gear: { ...record.gear, [card.dataset.gearSlot]: refreshGearCard(card) } });
    renderPower();
  });
  byId("gearLoadout").addEventListener("change", (event) => {
    const card = event.target.closest("[data-gear-slot]");
    if (!card || !event.target.matches("[data-gear-field]")) return;
    const record = activeRecord();
    writeActiveRecord({ gear: { ...record.gear, [card.dataset.gearSlot]: refreshGearCard(card) } });
    renderPower();
  });
  byId("gearLoadout").addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-gear]");
    if (!button) return;
    writeActiveRecord({ selectedGearSlot: button.dataset.selectGear });
    renderLoadout();
    renderPower();
  });

  byId("heroRole").addEventListener("change", () => {
    writeActiveRecord({ heroRole: byId("heroRole").value });
    renderPower();
  });
  byId("displayedPower").addEventListener("input", () => {
    writeActiveRecord({ displayedPower: number(byId("displayedPower").value) });
    renderPower();
  });
  byId("applyAllGearLevel").addEventListener("click", () => {
    const level = Math.min(100, number(byId("allGearLevel").value));
    const record = activeRecord();
    const gear = Object.fromEntries(Planner.GEAR_SLOTS.map((slot) => [slot, { ...record.gear[slot], level }]));
    writeActiveRecord({ gear });
    renderLoadout();
    renderPower();
    window.fl2Toast(t(`All four equipment levels set to ${level}`));
  });

  byId("openMerit").addEventListener("click", () => {
    const record = activeRecord();
    const piece = record.gear[record.selectedGearSlot];
    const parts = Planner.promotionParts(piece.promotion);
    const existing = store?.getFeatureState("calculator") || {};
    store?.setFeatureState("calculator", {
      ...existing,
      hero: selectedHero().name,
      heroRole: record.heroRole,
      gearSlot: record.selectedGearSlot,
      equipmentLevel: piece.level,
      currentStar: parts.star,
      currentWedge: parts.wedge,
      forgeStage: piece.forge,
    });
    saveState();
    location.href = "calculator.html";
  });

  byId("clearHero").addEventListener("click", () => {
    store?.removeFeatureState("heroes");
    heroState = Planner.normalizeHeroState(null, null);
    loadActiveHero();
    store?.removeFeatureState("heroes");
    window.fl2Toast(t("Hero roster cleared for this profile"));
  });

  window.addEventListener("fl2:profilechange", restore);
  restore();
})();

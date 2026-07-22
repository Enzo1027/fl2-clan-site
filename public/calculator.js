(function initializeMeritCalculator() {
  "use strict";

  const Engine = window.MeritCalculator;
  if (!Engine) return;

  const form = document.getElementById("calculatorForm");
  const resultCard = document.querySelector(".result-card");
  const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const storageKey = "fl2-merit-calculator-v1";
  let calculatorMode = "quick";
  let priceMode = "discount";
  let suppressPriceModeChange = false;

  const byId = (id) => document.getElementById(id);
  const readNumber = (id) => {
    const value = Number(byId(id).value);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  const format = (value) => integerFormatter.format(Number.isFinite(value) ? value : 0);
  const powerGain = (beforeId, afterId) => {
    const before = readNumber(beforeId);
    const after = readNumber(afterId);
    return before > 0 && after > before ? Math.floor(after - before) : 0;
  };

  function stageLabel(stage) {
    if (stage === 0) return "Base";
    if (stage === 6) return "Mythic";
    return `+${stage}`;
  }

  function setMode(nextMode) {
    calculatorMode = nextMode === "exact" ? "exact" : "quick";
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === calculatorMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".exact-only").forEach((element) => {
      element.hidden = calculatorMode !== "exact";
    });
    byId("benchmarkRow").hidden = calculatorMode === "exact" || !byId("forgeUnlocked").checked;
    byId("modeHelp").textContent = calculatorMode === "exact"
      ? "Exact compares your in-game Promote and Forge power previews."
      : "Quick gives a break-even threshold and can use the verified 80-stone example.";
    update();
  }

  function setPriceMode(nextMode, applyDefaults = true) {
    priceMode = ["discount", "regular", "custom"].includes(nextMode) ? nextMode : "custom";
    document.querySelectorAll("[data-price-mode]").forEach((button) => {
      const active = button.dataset.priceMode === priceMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (applyDefaults && priceMode !== "custom") {
      suppressPriceModeChange = true;
      byId("coreCost").value = priceMode === "discount" ? "30" : "100";
      byId("stoneCost").value = priceMode === "discount" ? "600" : "1500";
      suppressPriceModeChange = false;
    }
    update();
  }

  function normalizeForgeTarget() {
    const current = Math.min(6, readNumber("forgeStage"));
    const target = byId("forgeTarget");
    [...target.options].forEach((option) => {
      option.disabled = Number(option.value) <= current;
    });
    if (current >= 6) {
      target.value = "6";
      target.disabled = true;
      return;
    }
    target.disabled = false;
    if (Number(target.value) <= current) target.value = String(current + 1);
  }

  function renderRoleAdvice() {
    const role = byId("heroRole").value;
    const slot = byId("gearSlot").value;
    const hero = byId("hero").value;
    const slotName = Engine.FULL_STAR_DATA[slot].label;
    let advice = `${hero}: keep the math tied to this ${slotName}; do not reuse its preview for another item.`;
    if (role === "attack") {
      advice = slot === "gun" || slot === "helmet"
        ? `${hero} is set as a damage hero. Gun first, then Helmet, is the usual offensive priority.`
        : `${hero} is set as a damage hero. ${slotName} improves survival, but compare it against Gun or Helmet before committing.`;
    } else if (role === "defense") {
      advice = slot === "armor" || slot === "boots"
        ? `${hero} is set as a defender. Armor first, then Boots, is the usual durability priority.`
        : `${hero} is set as a defender. ${slotName} adds offense, but Armor or Boots may fit the hero's job better.`;
    } else if (role === "support") {
      advice = `${hero} is set as support. Favor the piece that keeps the hero active long enough to deliver their skill, then use ROI as the tiebreaker.`;
    }
    byId("roleAdvice").textContent = advice;
  }

  function renderCoreFacts(stats) {
    const orangeNeeded = Math.max(0, stats.orangePieces - readNumber("orangePieces"));
    const orangeText = stats.orangePieces > 0
      ? `${stats.orangePieces} orange piece${stats.orangePieces === 1 ? "" : "s"}`
      : "No extra orange piece";
    const warning = orangeNeeded > 0 ? " material-warning" : "";
    byId("knownCoreChange").innerHTML = `
      <div>
        <span>${stats.currentLabel} → ${stats.nextLabel}</span>
        <strong>${format(stats.cores)} Power Cores</strong>
        <small>${orangeText}</small>
      </div>
      <div>
        <span>Published promotion stats</span>
        <strong>+${format(stats.flatDelta)} ${stats.promotionLabel}</strong>
        <small>+${numberFormatter.format(stats.percentDelta)}% ${stats.troopLabel}</small>
      </div>
      <div class="${warning.trim()}">
        <span>${stats.nextFullStar}★ ${stats.piece.label} reference</span>
        <strong>${format(stats.targetFullPower)} power</strong>
        <small>${orangeNeeded > 0 ? `You still need ${orangeNeeded} orange piece${orangeNeeded === 1 ? "" : "s"}.` : "Full-star reference; partial-section power varies."}</small>
      </div>`;
  }

  function renderForgeFacts(requirement) {
    const finalStep = requirement.transitions.some((transition) => transition.pulseModules > 0);
    const stoneLabel = `${format(requirement.stones)} red stone${requirement.stones === 1 ? "" : "s"}`;
    byId("forgeRequirement").textContent = requirement.stones > 0 ? stoneLabel : "Forge path complete";
    byId("forgeAttribute").textContent = requirement.stones > 0
      ? `+${format(requirement.attributeGain)}% forging attributes${finalStep ? ` · ${requirement.pulseModules} Pulse Modules` : ""}`
      : "No additional forge level is listed";
  }

  function comparisonRow(kind, title, power, fullCost, actualCost, efficiency, winner, extra) {
    const hasPower = power > 0;
    const roi = hasPower ? `${numberFormatter.format(efficiency * 1000)} power` : "Preview needed";
    const costText = actualCost === fullCost
      ? `${format(fullCost)} medals`
      : `${format(actualCost)} to buy · ${format(fullCost)} full value`;
    return `
      <div class="comparison-row${winner === kind || winner === "both" ? " is-winner" : ""}">
        <div><strong>${title}</strong><small>${costText}${extra ? ` · ${extra}` : ""}</small></div>
        <div class="roi-value"><strong>${roi}</strong><small>per 1,000 medals</small></div>
      </div>`;
  }

  function renderResults(context) {
    const {
      plan, coreStats, forgeRequirement, coreGain, forgeGain, forgeUnlocked,
      reserveActive, coreMaterialReady, forgeMaterialReady, benchmarkActive,
    } = context;
    let winner = plan.winner;

    if (!forgeUnlocked && plan.hasCoreData) winner = "core";
    if (!forgeUnlocked && !plan.hasCoreData) winner = "incomplete";
    if (forgeRequirement.stones === 0 && plan.hasCoreData) winner = "core";

    let title = "Check the next Core preview";
    let status = "ONE NUMBER NEEDED";
    let summary = "Enter the current and preview power from the Promote screen. The calculator already knows this section's material cost and published stat change.";

    if (winner === "both") {
      title = "Buy both discounted shelves";
      status = "ENOUGH FOR BOTH";
      summary = `After the ${format(plan.input.reserveMedals)}-medal reserve, you can clear 1,000 discounted Cores and 50 discounted red stones. You do not need to choose this week.`;
    } else if (winner === "core") {
      title = coreMaterialReady ? "Spend on Power Cores" : "Cores win—secure orange gear first";
      status = coreMaterialReady ? (plan.coreAffordable ? "CORE WINS" : "SAVE FOR CORES") : "MATERIAL BLOCKED";
      summary = coreMaterialReady
        ? `${coreStats.piece.label} promotion gives more power per medal for this ${byId("hero").value} comparison.${plan.coreAffordable ? " You can complete the step now." : ` Save ${format(plan.remainingForCore)} more medals after your reserve.`}`
        : `The Core step has the better return, but it also needs ${coreStats.orangePieces} orange gear piece${coreStats.orangePieces === 1 ? "" : "s"}. Do not strand the Cores without that material.`;
    } else if (winner === "forge") {
      title = forgeMaterialReady ? "Spend on red Forging Stones" : "Stones win—save the modules first";
      status = forgeMaterialReady ? (plan.forgeAffordable ? "RED STONES WIN" : "SAVE FOR STONES") : "MODULE BLOCKED";
      summary = forgeMaterialReady
        ? `${stageLabel(forgeRequirement.currentStage)} → ${stageLabel(forgeRequirement.targetStage)} forging gives more power per medal in this comparison.${plan.forgeAffordable ? " You can complete it now." : ` Save ${format(plan.remainingForForge)} more medals after your reserve.`}`
        : `The forge path has the better return, but the Mythic step also needs ${forgeRequirement.pulseModules} Pulse Modules.`;
    } else if (winner === "tie") {
      title = "Returns are effectively tied";
      status = "WITHIN 5%";
      summary = "Use event timing and hero role as the tiebreaker. Prefer the upgrade you can complete on Gear Day without weakening Formation 1 balance.";
    } else if (plan.hasForgeData && !plan.hasCoreData) {
      title = `Look for at least +${format(plan.coreBreakEvenPower)} power`;
      status = "CORE BREAK-EVEN";
      summary = `If the next ${format(coreStats.cores)}-Core section adds at least ${format(plan.coreBreakEvenPower)} power, Cores beat the red-stone comparison. If it adds less, choose the stones.`;
    } else if (plan.hasCoreData && forgeUnlocked) {
      title = "Enter the Forge preview";
      status = "FORGE DATA NEEDED";
      summary = "The Core side is ready. Add this exact item's Forge before-and-after power to finish the comparison.";
    } else if (!forgeUnlocked) {
      title = "Forging is not available yet";
      status = "CORE PATH ONLY";
      summary = "Use Cores on the selected gear or save medals. The red-stone option should not be valued until forging is unlocked on this item.";
    }

    resultCard.dataset.winner = winner;
    byId("resultStatus").textContent = status;
    byId("resultTitle").textContent = title;
    byId("resultSummary").textContent = summary;
    byId("comparisonTable").innerHTML = [
      comparisonRow("core", `Power Cores · ${coreStats.piece.label}`, coreGain, plan.fullCoreMedalCost, plan.coreMedalCost, plan.fullCoreEfficiency, winner, `${format(plan.coresToBuy)} to buy`),
      comparisonRow("forge", `Red stones · ${stageLabel(forgeRequirement.currentStage)} to ${stageLabel(forgeRequirement.targetStage)}`, forgeGain, plan.fullForgeMedalCost, plan.forgeMedalCost, plan.fullForgeEfficiency, winner, `${format(plan.stonesToBuy)} to buy`),
    ].join("");

    if (plan.hasForgeData) {
      const entered = coreGain > 0 ? ` Your Core preview adds ${format(coreGain)}.` : "";
      byId("breakEven").innerHTML = `<strong>Core break-even:</strong> this ${format(coreStats.cores)}-Core section must add ${format(plan.coreBreakEvenPower)} power to match the forge return.${entered}`;
      byId("breakEven").hidden = false;
    } else {
      byId("breakEven").hidden = true;
    }

    const steps = [];
    if (reserveActive) steps.push("Keep 15,000 medals untouched for the orange equipment chest.");
    if (winner === "both") {
      steps.push("Buy the 1,000 discounted Power Cores for 30,000 medals.");
      steps.push("Buy the 50 discounted red Forging Stones for 30,000 medals.");
    } else if (winner === "core") {
      if (!coreMaterialReady) steps.push(`Obtain ${coreStats.orangePieces - readNumber("orangePieces")} more orange gear piece${coreStats.orangePieces - readNumber("orangePieces") === 1 ? "" : "s"}.`);
      steps.push(plan.coreMedalCost === 0 ? "Use the Cores already in inventory." : `${plan.coreAffordable ? "Buy" : "Save for"} ${format(plan.coresToBuy)} Cores (${format(plan.coreMedalCost)} medals).`);
      steps.push(`Promote ${byId("hero").value}'s ${coreStats.piece.label} from ${coreStats.currentLabel} to ${coreStats.nextLabel}.`);
    } else if (winner === "forge") {
      if (!forgeMaterialReady) steps.push(`Save ${forgeRequirement.pulseModules - readNumber("pulseModules")} more Pulse Modules.`);
      steps.push(plan.forgeMedalCost === 0 ? "Use the red stones already in inventory." : `${plan.forgeAffordable ? "Buy" : "Save for"} ${format(plan.stonesToBuy)} red stones (${format(plan.forgeMedalCost)} medals).`);
      steps.push(`Forge ${byId("hero").value}'s ${coreStats.piece.label} through ${stageLabel(forgeRequirement.targetStage)}.`);
    } else if (winner === "tie") {
      steps.push("Wait for the matching scoring day if neither upgrade is urgent.");
      steps.push("Choose Cores for broader orange-gear progression or stones for the selected mythic path.");
    } else {
      steps.push("Open the selected item in Equipment and tap Promote.");
      steps.push("Copy the current power and the preview power into the Core fields.");
      if (calculatorMode === "exact" && forgeUnlocked) steps.push("Repeat on the Forge screen for the exact red-stone result.");
    }
    byId("shoppingPlan").innerHTML = steps.map((step) => `<li>${step}</li>`).join("");

    const sourceMode = calculatorMode === "exact"
      ? "Exact mode uses your two in-game previews."
      : benchmarkActive
        ? "Quick mode uses the verified 80-stone / 55,155-power armor screenshot as the forge benchmark."
        : "Quick mode is waiting for an item-specific Forge preview.";
    byId("confidenceNote").textContent = `${sourceMode} Promotion costs and stat deltas use the June 2026 tables; shop prices are editable in case the game changes.`;
  }

  function saveState() {
    try {
      const values = {};
      [...form.elements].forEach((element) => {
        if (!element.name) return;
        values[element.name] = element.type === "checkbox" ? element.checked : element.value;
      });
      localStorage.setItem(storageKey, JSON.stringify({ values, calculatorMode, priceMode }));
    } catch {
      // The calculator remains fully functional when local storage is unavailable.
    }
  }

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || !saved.values) return;
      Object.entries(saved.values).forEach(([name, value]) => {
        const element = form.elements.namedItem(name);
        if (!element) return;
        if (element.type === "checkbox") element.checked = Boolean(value);
        else element.value = String(value);
      });
      calculatorMode = saved.calculatorMode === "exact" ? "exact" : "quick";
      priceMode = ["discount", "regular", "custom"].includes(saved.priceMode) ? saved.priceMode : "custom";
    } catch {
      // Ignore malformed or blocked storage.
    }
  }

  function update() {
    normalizeForgeTarget();
    renderRoleAdvice();

    const coreStats = Engine.getNextPromotionStats(
      readNumber("currentStar"),
      readNumber("currentWedge"),
      byId("gearSlot").value,
    );
    const forgeRequirement = Engine.getForgeRequirement(readNumber("forgeStage"), readNumber("forgeTarget"));
    renderCoreFacts(coreStats);
    renderForgeFacts(forgeRequirement);

    const forgeUnlocked = byId("forgeUnlocked").checked && forgeRequirement.stones > 0;
    byId("forgeFields").hidden = !byId("forgeUnlocked").checked;
    byId("forgeRequirement").parentElement.hidden = !byId("forgeUnlocked").checked;
    byId("benchmarkRow").hidden = calculatorMode === "exact" || !forgeUnlocked;

    const coreGain = powerGain("corePowerBefore", "corePowerAfter");
    const enteredForgeGain = powerGain("forgePowerBefore", "forgePowerAfter");
    const benchmarkActive = calculatorMode === "quick" && byId("useForgeBenchmark").checked &&
      forgeRequirement.currentStage === 0 && forgeRequirement.targetStage === 2;
    const forgeGain = forgeUnlocked ? (enteredForgeGain || (benchmarkActive ? 55155 : 0)) : 0;
    const reserveActive = byId("reserveChest").checked;

    const plan = Engine.calculateMeritPlan({
      currentMedals: readNumber("currentMedals"),
      reserveMedals: reserveActive ? 15000 : 0,
      coreCost: readNumber("coreCost"),
      currentCores: readNumber("currentCores"),
      coresNeeded: coreStats.cores,
      corePowerGain: coreGain,
      stoneCost: readNumber("stoneCost"),
      currentStones: readNumber("currentStones"),
      stonesNeeded: forgeRequirement.stones,
      forgePowerGain: forgeGain,
      discountedStock: priceMode === "discount" && readNumber("coreCost") === 30 && readNumber("stoneCost") === 600,
    });

    const coreMaterialReady = readNumber("orangePieces") >= coreStats.orangePieces;
    const forgeMaterialReady = readNumber("pulseModules") >= forgeRequirement.pulseModules;
    renderResults({
      plan,
      coreStats,
      forgeRequirement,
      coreGain,
      forgeGain,
      forgeUnlocked,
      reserveActive,
      coreMaterialReady,
      forgeMaterialReady,
      benchmarkActive,
    });
    saveState();
  }

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  document.querySelectorAll("[data-price-mode]").forEach((button) => {
    button.addEventListener("click", () => setPriceMode(button.dataset.priceMode));
  });
  ["coreCost", "stoneCost"].forEach((id) => {
    byId(id).addEventListener("input", () => {
      if (!suppressPriceModeChange) setPriceMode("custom", false);
    });
  });
  ["forgeStage", "forgeTarget"].forEach((id) => {
    byId(id).addEventListener("change", () => {
      const baseline = readNumber("forgeStage") === 0 && readNumber("forgeTarget") === 2;
      if (!baseline) byId("useForgeBenchmark").checked = false;
    });
  });
  byId("useForgeBenchmark").addEventListener("change", () => {
    if (byId("useForgeBenchmark").checked) {
      byId("forgeStage").value = "0";
      byId("forgeTarget").value = "2";
    }
  });
  byId("f1OrangeCount").addEventListener("change", () => {
    byId("reserveChest").checked = readNumber("f1OrangeCount") < 20;
  });
  form.addEventListener("input", update);
  form.addEventListener("change", update);

  byId("resetCalculator").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    form.reset();
    byId("currentMedals").value = "60000";
    byId("f1OrangeCount").value = "20";
    byId("forgeTarget").value = "2";
    byId("useForgeBenchmark").checked = true;
    setPriceMode("discount");
    setMode("quick");
  });

  byId("loadExample").addEventListener("click", () => {
    byId("currentMedals").value = "48000";
    byId("reserveChest").checked = false;
    byId("gearSlot").value = "armor";
    byId("currentStar").value = "1";
    byId("currentWedge").value = "0";
    byId("forgeStage").value = "0";
    byId("forgeTarget").value = "2";
    byId("useForgeBenchmark").checked = true;
    byId("forgePowerBefore").value = "413421";
    byId("forgePowerAfter").value = "468576";
    byId("corePowerBefore").value = "";
    byId("corePowerAfter").value = "";
    setPriceMode("discount");
    setMode("quick");
  });

  restoreState();
  setPriceMode(priceMode, false);
  setMode(calculatorMode);
})();

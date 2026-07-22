(function initializeQuickCalculator() {
  "use strict";

  const Engine = window.MeritCalculator;
  if (!Engine) return;

  const form = document.getElementById("calculatorForm");
  const answerPanel = document.getElementById("answerPanel");
  const storageKey = "fl2-merit-calculator-simple-v2";
  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

  const byId = (id) => document.getElementById(id);
  const readNumber = (id) => {
    const value = Number(byId(id).value);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  const format = (value) => formatter.format(Number.isFinite(value) ? value : 0);
  const checkedValue = (name) => form.elements.namedItem(name).value;
  const gearSlot = () => checkedValue("gearSlot") || "gun";
  const powerGain = (beforeId, afterId) => {
    const before = readNumber(beforeId);
    const after = readNumber(afterId);
    return before > 0 && after > before ? Math.floor(after - before) : 0;
  };

  function stageLabel(stage) {
    if (stage < 0) return "Locked";
    if (stage === 0) return "Base";
    if (stage === 6) return "Mythic";
    return `+${stage}`;
  }

  function rawForgeStage() {
    const parsed = Number(byId("forgeStage").value);
    return Number.isFinite(parsed) ? parsed : -1;
  }

  function normalizeForgeTarget(forceNext = false) {
    const current = rawForgeStage();
    const target = byId("forgeTarget");
    const unlocked = current >= 0 && current < 6;

    [...target.options].forEach((option) => {
      option.disabled = unlocked && Number(option.value) <= current;
    });
    target.disabled = !unlocked;

    if (!unlocked) return;
    if (forceNext) {
      target.value = String(current < 2 ? 2 : current + 1);
    } else if (Number(target.value) <= current) {
      target.value = String(current + 1);
    }
  }

  function forgeRequirement() {
    const current = rawForgeStage();
    if (current < 0 || current >= 6) {
      return {
        currentStage: Math.max(0, current),
        targetStage: Math.max(0, current),
        stones: 0,
        pulseModules: 0,
        attributeGain: 0,
        transitions: [],
      };
    }
    return Engine.getForgeRequirement(current, readNumber("forgeTarget"));
  }

  function renderNextStep(coreStats, forge) {
    const forgeText = rawForgeStage() < 0
      ? "Not available"
      : forge.stones > 0
        ? `${format(forge.stones)} Red Stones`
        : "Complete";
    const forgeSmall = rawForgeStage() < 0
      ? "Choose Cores for now"
      : forge.stones > 0
        ? `${stageLabel(forge.currentStage)} → ${stageLabel(forge.targetStage)}`
        : "Already Mythic";

    byId("nextStepReadout").innerHTML = `
      <div><span>Next Core section</span><strong>${format(coreStats.cores)} Cores</strong><small>${coreStats.currentLabel} → ${coreStats.nextLabel}</small></div>
      <div><span>Red path selected</span><strong>${forgeText}</strong><small>${forgeSmall}</small></div>`;
  }

  function quickDecision(context) {
    const { plan, coreStats, forge, reserveActive } = context;
    const currentStar = readNumber("currentStar");
    const forgeStage = rawForgeStage();
    const discounted = readNumber("coreCost") === 30 && readNumber("stoneCost") === 600;

    if (plan.canClearBothDiscounts) {
      return {
        kind: "both",
        title: reserveActive ? "Buy all three" : "Buy both",
        reason: reserveActive
          ? "You can protect the orange chest and still clear both discounted shelves."
          : "You have enough medals to clear both discounted shelves, so you do not need to choose.",
        confidence: "Easy choice",
      };
    }

    if (reserveActive) {
      return {
        kind: "chest",
        title: plan.input.currentMedals >= 15000 ? "Orange chest first" : "Save for the chest",
        reason: "Finish Formation 1's orange gear before choosing between Cores and Red Stones.",
        confidence: "Formation 1 priority",
      };
    }

    if (readNumber("coreCost") >= 100 || readNumber("stoneCost") >= 1500) {
      return {
        kind: "save",
        title: "Wait for a discount",
        reason: "At least one item is at the regular shop price. Saving is safer than paying full price.",
        confidence: "Save medals",
      };
    }

    if (forgeStage < 0 || forge.stones === 0) {
      return {
        kind: "core",
        title: "Use Power Cores",
        reason: forgeStage < 0 ? "Red forging is not unlocked on this item yet." : "This item's red forge path is already complete.",
        confidence: "Clear choice",
      };
    }

    if (currentStar < 2) {
      return {
        kind: "core",
        title: "Buy Power Cores",
        reason: currentStar < 1
          ? "Build the first orange star before spending heavily on red forging."
          : "Build toward two orange stars before pushing this item's red forge path.",
        confidence: "Strong early-game rule",
      };
    }

    if (forgeStage < 2) {
      return {
        kind: "forge",
        title: "Buy Red Stones",
        reason: "The path to +2 is the strongest normal Red Stone value.",
        confidence: "Strong mid-game rule",
      };
    }

    if (coreStats.cores <= 700) {
      return {
        kind: "core",
        title: "Buy Power Cores",
        reason: `Your next section costs only ${format(coreStats.cores)} Cores, while red forging gets more expensive after +2.`,
        confidence: "Good shortcut",
      };
    }

    if (forgeStage >= 3) {
      return {
        kind: "core",
        title: "Lean toward Cores",
        reason: "Late red forge levels have steep Stone costs. Use the exact preview before a very large spend.",
        confidence: "Preview recommended",
      };
    }

    if (!discounted) {
      return {
        kind: "save",
        title: "Wait for a discount",
        reason: "These are not the usual discounted shop prices. Saving is safer than buying at full price.",
        confidence: "Save medals",
      };
    }

    return {
      kind: "save",
      title: "Check the preview",
      reason: `This ${format(coreStats.cores)}-Core step is close enough that one power preview can change the answer.`,
      confidence: "One quick check needed",
    };
  }

  function exactDecision(plan, reserveActive) {
    if (plan.winner === "both") {
      return {
        kind: "both",
        title: reserveActive ? "Buy all three" : "Buy both",
        reason: reserveActive
          ? "You can buy the orange chest and clear both discounted shelves."
          : "You can afford both discounted shelves, so there is no need to choose.",
        confidence: "Exact answer",
      };
    }
    if (plan.winner === "core") {
      return { kind: "core", title: "Buy Power Cores", reason: "This exact Core preview gives more power for each medal.", confidence: "Uses your preview" };
    }
    if (plan.winner === "forge") {
      return { kind: "forge", title: "Buy Red Stones", reason: "This exact Forge preview gives more power for each medal.", confidence: "Uses your preview" };
    }
    return { kind: "tie", title: "Either one works", reason: "The two returns are within 5%. Use event timing as the tiebreaker.", confidence: "Effectively tied" };
  }

  function applyCompletionChecks(decision, context) {
    const { plan, coreStats, forge } = context;
    if (decision.kind === "core") {
      const missingOrange = Math.max(0, coreStats.orangePieces - readNumber("orangePieces"));
      if (missingOrange > 0) {
        return {
          kind: "save",
          title: "Get orange gear first",
          reason: `The Core step wins, but it also needs ${missingOrange} more orange gear piece${missingOrange === 1 ? "" : "s"}.`,
          confidence: "Material needed",
          target: "core",
        };
      }
      if (plan.spendableMedals < plan.coreMedalCost) {
        return {
          kind: "save",
          title: "Save for Cores",
          reason: `Cores are the better move. You need ${format(plan.remainingForCore)} more medals after your reserve.`,
          confidence: "Best target",
          target: "core",
        };
      }
    }

    if (decision.kind === "forge") {
      const missingModules = Math.max(0, forge.pulseModules - readNumber("pulseModules"));
      if (missingModules > 0) {
        return {
          kind: "save",
          title: "Save the modules first",
          reason: `The Forge step wins, but Mythic also needs ${missingModules} more Pulse Modules.`,
          confidence: "Material needed",
          target: "forge",
        };
      }
      if (plan.spendableMedals < plan.forgeMedalCost) {
        return {
          kind: "save",
          title: "Save for Red Stones",
          reason: `Red Stones are the better move. You need ${format(plan.remainingForForge)} more medals after your reserve.`,
          confidence: "Best target",
          target: "forge",
        };
      }
    }
    return decision;
  }

  function renderAction(decision, context) {
    const { plan, coreStats, forge, exact, reserveActive } = context;
    let actionTitle = "Keep your medals";
    let actionDetail = "Do not make a large purchase yet.";
    const lines = [];

    if (decision.kind === "both") {
      actionTitle = reserveActive ? "Chest + 1,000 Cores + 50 Stones" : "1,000 Cores + 50 Red Stones";
      actionDetail = reserveActive ? "75,000 medals total at discounted prices" : "60,000 medals total at discounted prices";
      if (reserveActive) lines.push("Buy the 15,000-medal orange equipment chest first.");
      lines.push("Clear both discounted material shelves.");
    } else if (decision.kind === "chest") {
      actionTitle = "1 orange equipment chest";
      actionDetail = "Reserve 15,000 medals";
      lines.push("Put the chest on Formation 1.");
      lines.push("Keep the remaining medals for the next completed upgrade.");
    } else if (decision.kind === "core") {
      actionTitle = plan.coresToBuy > 0 ? `${format(plan.coresToBuy)} Power Cores` : "Use your owned Power Cores";
      actionDetail = plan.coresToBuy > 0 ? `${format(plan.coreMedalCost)} medals` : "No medal purchase needed";
      lines.push(`Promote ${byId("hero").value}'s ${coreStats.piece.label} to ${coreStats.nextLabel}.`);
      lines.push(`Gain +${format(coreStats.flatDelta)} ${coreStats.promotionLabel} and +${format(coreStats.percentDelta)}% ${coreStats.troopLabel}.`);
    } else if (decision.kind === "forge") {
      actionTitle = plan.stonesToBuy > 0 ? `${format(plan.stonesToBuy)} Red Stones` : "Use your owned Red Stones";
      actionDetail = plan.stonesToBuy > 0 ? `${format(plan.forgeMedalCost)} medals` : "No medal purchase needed";
      lines.push(`Forge ${byId("hero").value}'s ${coreStats.piece.label} through ${stageLabel(forge.targetStage)}.`);
      lines.push(`${format(forge.attributeGain)}% total forging-attribute gain on this path.`);
    } else if (decision.kind === "tie") {
      actionTitle = "Choose on Gear Day";
      actionDetail = "The power return is effectively the same";
      lines.push("Use Cores for broader orange-star progress.");
      lines.push("Use Red Stones if this is a priority mythic item.");
    } else if (decision.target === "core") {
      actionTitle = `Target ${format(coreStats.cores)} Cores`;
      actionDetail = `You own ${format(plan.input.currentCores)}`;
      lines.push("Keep buying only at the discounted Core price.");
    } else if (decision.target === "forge") {
      actionTitle = `Target ${format(forge.stones)} Red Stones`;
      actionDetail = `You own ${format(plan.input.currentStones)}`;
      lines.push("Keep buying only at the discounted Stone price.");
    } else {
      const breakEven = plan.coreBreakEvenPower > 0 ? plan.coreBreakEvenPower : 0;
      actionTitle = breakEven > 0 ? `Core preview must beat +${format(breakEven)}` : "Save this week's medals";
      actionDetail = breakEven > 0 ? "Enter the two Core preview numbers below" : "Wait for discounted stock or an exact preview";
      lines.push("Open the gear's Promote screen before spending.");
    }

    byId("answerAction").innerHTML = `<span>Do this</span><strong>${actionTitle}</strong><small>${actionDetail}</small>`;
    byId("shortList").innerHTML = lines.slice(0, 2).map((line) => `<li>${line}</li>`).join("");
    byId("precisionButton").hidden = exact || decision.kind === "both" || decision.kind === "chest";
  }

  function saveState() {
    try {
      const values = {};
      [...form.elements].forEach((element) => {
        if (!element.name) return;
        if (element.type === "radio") {
          if (element.checked) values[element.name] = element.value;
        } else {
          values[element.name] = element.value;
        }
      });
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // Storage is a convenience, not a requirement.
    }
  }

  function restoreState() {
    try {
      const values = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!values) return;
      Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field instanceof RadioNodeList) {
          field.value = String(value);
        } else {
          field.value = String(value);
        }
      });
    } catch {
      // Ignore unavailable or malformed saved state.
    }
  }

  function update() {
    normalizeForgeTarget();
    const coreStats = Engine.getNextPromotionStats(readNumber("currentStar"), readNumber("currentWedge"), gearSlot());
    const forge = forgeRequirement();
    const reserveActive = checkedValue("f1Complete") === "no";
    const coreGain = powerGain("corePowerBefore", "corePowerAfter");
    const forgeGain = powerGain("forgePowerBefore", "forgePowerAfter");
    const benchmarkForgeGain = forge.currentStage === 0 && forge.targetStage === 2 && forge.stones === 80 ? 55155 : 0;
    const exact = coreGain > 0 && forgeGain > 0 && rawForgeStage() >= 0 && forge.stones > 0;

    renderNextStep(coreStats, forge);
    byId("reserveMessage").textContent = reserveActive ? "We will protect 15,000 medals for the orange chest." : "No reserve needed.";

    const forgeInputsDisabled = rawForgeStage() < 0 || rawForgeStage() >= 6;
    ["forgePowerBefore", "forgePowerAfter"].forEach((id) => { byId(id).disabled = forgeInputsDisabled; });

    const plan = Engine.calculateMeritPlan({
      currentMedals: readNumber("currentMedals"),
      reserveMedals: reserveActive ? 15000 : 0,
      coreCost: readNumber("coreCost"),
      currentCores: readNumber("currentCores"),
      coresNeeded: coreStats.cores,
      corePowerGain: coreGain,
      stoneCost: readNumber("stoneCost"),
      currentStones: readNumber("currentStones"),
      stonesNeeded: forge.stones,
      forgePowerGain: forgeGain || benchmarkForgeGain,
      discountedStock: readNumber("coreCost") === 30 && readNumber("stoneCost") === 600,
    });

    let decision = exact ? exactDecision(plan, reserveActive) : quickDecision({ plan, coreStats, forge, reserveActive });
    decision = applyCompletionChecks(decision, { plan, coreStats, forge });

    answerPanel.dataset.answer = decision.kind;
    byId("answerType").textContent = exact ? "EXACT ANSWER" : "QUICK ANSWER";
    byId("answerConfidence").textContent = decision.confidence;
    byId("answerTitle").textContent = decision.title;
    byId("answerReason").textContent = decision.reason;
    byId("answerFootnote").textContent = exact
      ? "Compared using your in-game power previews and the full material cost."
      : "Fast guidance from current community costs. Use the optional preview for large late-game purchases.";
    renderAction(decision, { plan, coreStats, forge, exact, reserveActive });
    saveState();
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
    answerPanel.focus({ preventScroll: true });
    answerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  byId("forgeStage").addEventListener("change", () => {
    normalizeForgeTarget(true);
    update();
  });

  byId("precisionButton").addEventListener("click", () => {
    byId("advancedDetails").open = true;
    byId("advancedDetails").scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => byId("corePowerBefore").focus(), 300);
  });

  byId("resetCalculator").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    form.reset();
    byId("advancedDetails").open = false;
    normalizeForgeTarget(true);
    update();
  });

  restoreState();
  normalizeForgeTarget();
  update();
})();

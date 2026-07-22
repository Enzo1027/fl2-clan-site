(function initializeMeritCalculator() {
  "use strict";

  const Engine = window.MeritCalculator;
  if (!Engine) return;

  const form = document.getElementById("calculatorForm");
  const answerPanel = document.getElementById("answerPanel");
  const storageKey = "fl2-merit-calculator-level-aware-v3";
  const profileStore = window.fl2Profiles;
  const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const byId = (id) => document.getElementById(id);
  const format = (value) => formatter.format(Number.isFinite(value) ? value : 0);

  function readNumber(id) {
    const element = byId(id);
    const value = element ? Number(element.value) : 0;
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function checkedValue(name) {
    const field = form.elements.namedItem(name);
    return field ? field.value : "";
  }

  function stageLabel(stage) {
    if (stage < 0) return "Locked";
    if (stage === 0) return "Base";
    if (stage === 6) return "Mythic";
    return `+${stage}`;
  }

  function currentState() {
    return {
      slot: checkedValue("gearSlot") || "gun",
      formation: byId("formation").value,
      heroRole: byId("heroRole").value,
      equipmentLevel: readNumber("equipmentLevel"),
      currentStar: readNumber("currentStar"),
      currentWedge: readNumber("currentWedge"),
      forgeStage: Number(byId("forgeStage").value),
      currentMedals: readNumber("currentMedals"),
      currentCores: readNumber("currentCores"),
      currentStones: readNumber("currentStones"),
      f1Complete: checkedValue("f1Complete") === "yes",
      corePrice: readNumber("coreCost"),
      stonePrice: readNumber("stoneCost"),
      coreStock: readNumber("coreStock"),
      stoneStock: readNumber("stoneStock"),
      orangePieces: readNumber("orangePieces"),
      pulseModules: readNumber("pulseModules"),
    };
  }

  function syncProgressFields() {
    const complete = readNumber("currentStar") >= 5;
    byId("currentWedge").disabled = complete;
    if (complete) byId("currentWedge").value = "0";
  }

  function renderNextSteps(result) {
    const levelHeadline = result.level.promotionUnlocked
      ? `Lv.${format(result.level.level)}`
      : `${format(result.level.levelsToPromotion)} level${result.level.levelsToPromotion === 1 ? "" : "s"} short`;
    const levelDetail = result.level.promotionUnlocked
      ? `Normal orange cap at this star: Lv.${result.level.normalCap}`
      : "Reach Lv.20 with Enhancement Alloy first";

    const coreHeadline = result.coreStats.complete
      ? "Core path complete"
      : `${format(result.coreStats.cores)} Cores`;
    let coreDetail = "This item is already 5★";
    if (!result.coreStats.complete) {
      coreDetail = `+${format(result.coreStats.flatDelta)} ${result.coreStats.promotionLabel} · +${format(result.coreStats.percentDelta)}% ${result.coreStats.troopLabel}`;
      if (result.level.capIncreaseOnNextSection > 0) {
        coreDetail += ` · unlocks Lv.${result.level.nextCap}`;
      }
    }

    let forgeHeadline = "Not unlocked";
    let forgeDetail = "Use Cores for now";
    if (result.forgeStage >= 6) {
      forgeHeadline = "Forge complete";
      forgeDetail = "This item is already Mythic";
    } else if (result.forgeAvailable) {
      forgeHeadline = `${format(result.forge.stones)} Red Stones`;
      forgeDetail = `${stageLabel(result.forge.currentStage)} → ${stageLabel(result.forge.targetStage)} · +${format(result.forge.attributeGain)}% forge boost`;
    }

    byId("nextStepReadout").innerHTML = `
      <div><span>Equipment level</span><strong>${levelHeadline}</strong><small>${levelDetail}</small></div>
      <div><span>Next Core section</span><strong>${coreHeadline}</strong><small>${coreDetail}</small></div>
      <div><span>Useful red path</span><strong>${forgeHeadline}</strong><small>${forgeDetail}</small></div>`;
  }

  function titleFor(result) {
    if (result.kind === "both") return result.f1Complete ? "Buy both" : "Buy all three";
    if (result.kind === "chest") return result.currentMedals >= result.reserveMedals ? "Orange chest first" : "Save for orange gear";
    if (result.kind === "core") {
      if (!result.f1Complete) return "Chest, then Cores";
      if (result.rule === "level-20-gate") return "Buy Cores; enhance first";
      return "Buy Power Cores";
    }
    if (result.kind === "forge") return result.f1Complete ? "Buy Red Stones" : "Chest, then Stones";
    if (result.rule === "item-complete") return "Choose another item";
    return "Save your medals";
  }

  function reasonFor(result) {
    const reasons = {
      "finish-f1-orange": "Formation 1's missing orange gear is a bigger account upgrade than either material right now.",
      "clear-both-discounts": result.f1Complete
        ? "You can clear both discounted shelves, so you do not need to choose."
        : "You can protect the orange chest and still clear both discounted shelves.",
      "level-20-gate": `This item is only Lv.${format(result.level.level)}. Promotion is locked until Lv.20, and Red Stones are not the early priority.`,
      "core-path-complete": "This item is already 5★, so Cores cannot improve it further. Red forging is the remaining path.",
      "core-path-complete-late-forge": "This item is already 5★. Red forging is its remaining path, but late forge levels are expensive.",
      "forge-path-complete": "This item is already Mythic, so its next useful material is Power Cores.",
      "forge-locked": "Red forging is not available on this item yet. Cores are the usable upgrade material.",
      "cheap-core-section": `The next promotion costs only ${format(result.coreStats.cores)} Cores. Published stat gains and community math both favor these cheap sections.`,
      "low-base-stats": `At Lv.${format(result.level.level)}, fixed Core promotion stats are safer than multiplying a still-small base with Red Stones.`,
      "forge-to-plus-two": `The next Core section costs ${format(result.coreStats.cores)}. At this equipment level, the strong red path through +2 is the better Merit target.`,
      "balanced-plus-three": "This mature 3★+ item is ready for the balanced +3 forge step before deeper Core costs.",
      "avoid-late-forge": "Red forging becomes sharply more expensive after +2/+3. Continue the Core path before chasing deep forge levels.",
      "resume-core-path": "The efficient early Forge steps are covered. Resume star promotion on this item.",
      "core-full-price": "Red Stones are discounted while Cores are not. Buy the discounted material and wait for the Core discount.",
      "stone-full-price": "Power Cores are discounted while Red Stones are not. Buy Cores and wait for the Stone discount.",
      "core-stock-sold": "The discounted Core shelf is already empty. Use this week's remaining discount on Red Stones.",
      "stone-stock-sold": "The discounted Stone shelf is already empty. Use this week's remaining discount on Power Cores.",
      "wait-for-discount": "The useful material is not at its normal discounted price. Paying full price is poor Merit value.",
      "item-complete": "This gear is 5★ and Mythic. Move to the weakest orange item in the formation.",
      "no-efficient-step": "There is no efficient completed upgrade available from the current shop state.",
    };
    return reasons[result.rule] || reasons["no-efficient-step"];
  }

  function roleTip(state) {
    const attackPiece = state.slot === "gun" || state.slot === "helmet";
    if (state.heroRole === "damage" && !attackPiece) {
      return "For a back-row damage hero, keep Gun and Helmet at least as advanced as this piece.";
    }
    if (state.heroRole === "defense" && attackPiece) {
      return "For a front-row tank, keep Armor and Boots at least as advanced as this piece.";
    }
    return "Keep the four pieces on this formation in roughly even upgrade bands.";
  }

  function renderAction(result, state) {
    const purchase = result.recommendedPurchase;
    const hero = byId("hero").value;
    const gear = result.coreStats.piece.label;
    const lines = [];
    let actionTitle = "Hold your medals";
    let actionDetail = "Wait for the next discounted shop reset";

    if (result.kind === "both") {
      actionTitle = result.f1Complete
        ? `${format(purchase.cores)} Cores + ${format(purchase.stones)} Stones`
        : `1 chest + ${format(purchase.cores)} Cores + ${format(purchase.stones)} Stones`;
      actionDetail = `${format(purchase.medals)} medals total`;
      if (!result.f1Complete) lines.push("Buy the 15,000-medal orange equipment chest first.");
      lines.push("Clear both discounted material shelves; ignore the regular-price copies.");
    } else if (result.kind === "chest") {
      actionTitle = result.currentMedals >= result.reserveMedals ? "Buy 1 orange equipment chest" : `Save ${format(result.reserveMedals - result.currentMedals)} more medals`;
      actionDetail = "Formation 1 gets the chest";
      lines.push("Finish all 20 orange slots before funding deeper gear upgrades.");
    } else if (result.kind === "core") {
      const prefix = purchase.chest ? "1 chest + " : "";
      actionTitle = purchase.cores > 0 ? `${prefix}${format(purchase.cores)} discounted Cores` : "Use the Cores you own";
      actionDetail = purchase.medals > 0 ? `${format(purchase.medals)} medals total` : "No Merit spend needed for this step";
      if (purchase.chest) lines.push("Buy the orange chest first and keep it in Formation 1.");
      if (!result.level.promotionUnlocked) {
        lines.push(`Raise ${hero}'s ${gear} to Lv.20 with Alloy before using Cores.`);
      } else if (result.canCompleteCoreNow) {
        lines.push(`Promote ${hero}'s ${gear} to ${result.coreStats.nextLabel} on Gear Day.`);
      } else {
        const shortages = [];
        if (result.coreShortfall > 0) shortages.push(`${format(result.coreShortfall)} more Cores`);
        if (result.orangePieceShortfall > 0) shortages.push(`${format(result.orangePieceShortfall)} orange piece${result.orangePieceShortfall === 1 ? "" : "s"}`);
        lines.push(`Buy the discount and hold it; this step still needs ${shortages.join(" and ")}.`);
      }
      if (!result.coreStats.complete) {
        lines.push(`Next click adds +${format(result.coreStats.flatDelta)} ${result.coreStats.promotionLabel} and +${format(result.coreStats.percentDelta)}% ${result.coreStats.troopLabel}.`);
      }
    } else if (result.kind === "forge") {
      const prefix = purchase.chest ? "1 chest + " : "";
      actionTitle = purchase.stones > 0 ? `${prefix}${format(purchase.stones)} discounted Stones` : "Use the Red Stones you own";
      actionDetail = purchase.medals > 0 ? `${format(purchase.medals)} medals total` : "No Merit spend needed for this step";
      if (purchase.chest) lines.push("Buy the orange chest first and keep it in Formation 1.");
      if (result.canCompleteForgeNow) {
        lines.push(`Forge ${hero}'s ${gear} from ${stageLabel(result.forge.currentStage)} through ${stageLabel(result.forge.targetStage)}.`);
      } else {
        const shortages = [];
        if (result.stoneShortfall > 0) shortages.push(`${format(result.stoneShortfall)} more Stones`);
        if (result.pulseModuleShortfall > 0) shortages.push(`${format(result.pulseModuleShortfall)} Pulse Modules`);
        lines.push(`Buy only the discounted stock and hold it; this path still needs ${shortages.join(" and ")}.`);
      }
      lines.push(`That path adds ${format(result.forge.attributeGain)}% in published forge boosts.`);
    } else if (result.rule === "item-complete") {
      actionTitle = "Select the formation's weakest item";
      actionDetail = "Do not spend more on this one";
      lines.push("Spread upgrades instead of stacking a finished piece.");
    } else {
      lines.push("Use any materials you already own on Gear Day, but skip full-price shop stock.");
    }

    if (result.kind === "core" || result.kind === "forge") lines.push(roleTip(state));
    byId("answerAction").innerHTML = `<span>Buy this week</span><strong>${actionTitle}</strong><small>${actionDetail}</small>`;
    byId("shortList").innerHTML = lines.slice(0, 3).map((line) => `<li>${line}</li>`).join("");
  }

  function render(result, state) {
    renderNextSteps(result);
    answerPanel.dataset.answer = result.kind;
    byId("answerConfidence").textContent = result.confidence === "high" ? "High confidence" : "Medium confidence";
    byId("answerTitle").textContent = titleFor(result);
    byId("answerReason").textContent = reasonFor(result);
    byId("reserveMessage").textContent = result.f1Complete
      ? "No orange-chest reserve needed."
      : "FL2 protects 15,000 medals for Formation 1's orange chest.";
    byId("answerFootnote").innerHTML = result.confidence === "high"
      ? "<strong>Why high confidence?</strong> This answer comes from a hard game gate, published material table, or the actual discounted shelf limits."
      : "<strong>Why medium confidence?</strong> Costs and stat changes are exact; the order is community-tested because Last Z does not publish the future displayed-power formula.";
    renderAction(result, state);
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
      if (profileStore) profileStore.setFeatureState("calculator", values);
      else localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // Local storage is a convenience only.
    }
  }

  function restoreState() {
    try {
      const values = profileStore?.getFeatureState("calculator") || JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!values) return;
      Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field) field.value = String(value);
      });
    } catch {
      // Ignore unavailable or malformed saved state.
    }
  }

  function update() {
    syncProgressFields();
    const state = currentState();
    const result = Engine.recommendMeritSpend(state);
    render(result, state);
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

  byId("resetCalculator").addEventListener("click", () => {
    if (profileStore) profileStore.removeFeatureState("calculator");
    else localStorage.removeItem(storageKey);
    form.reset();
    byId("advancedDetails").open = false;
    update();
  });

  window.addEventListener("fl2:profilechange", () => {
    form.reset();
    restoreState();
    update();
  });

  restoreState();
  update();
})();

(function calculatorEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.MeritCalculator = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createCalculatorEngine() {
  "use strict";

  const DEFAULT_INPUTS = Object.freeze({
    currentMedals: 0,
    reserveMedals: 15000,
    coreCost: 30,
    currentCores: 0,
    coresNeeded: 0,
    corePowerGain: 0,
    stoneCost: 600,
    currentStones: 0,
    stonesNeeded: 80,
    forgePowerGain: 55155,
    discountedStock: true,
  });

  const CORE_STAGE_TOTALS = Object.freeze([1100, 3900, 8400, 14900, 25400]);

  const FORGE_TRANSITIONS = Object.freeze([
    { from: "base", to: "+1", stones: 30, pulseModules: 0, attributeGain: 10 },
    { from: "+1", to: "+2", stones: 50, pulseModules: 0, attributeGain: 20 },
    { from: "+2", to: "+3", stones: 100, pulseModules: 0, attributeGain: 20 },
    { from: "+3", to: "+4", stones: 200, pulseModules: 0, attributeGain: 25 },
    { from: "+4", to: "+5", stones: 300, pulseModules: 0, attributeGain: 25 },
    { from: "+5", to: "final", stones: 300, pulseModules: 50, attributeGain: 100 },
  ]);

  const PROMOTION_FLAT_STATS = Object.freeze([
    1074, 1248, 1421, 1595, 1769, 2203,
    2377, 2551, 2725, 2899, 3072, 3507,
    3681, 3854, 4028, 4202, 4376, 4810,
    4984, 5158, 5332, 5505, 5679, 6114,
    6287, 6461, 6635, 6809, 6983, 7417,
  ]);

  const ATTACK_PROMOTION_PERCENTS = Object.freeze([
    5, 5.3, 5.6, 5.9, 6.2, 7,
    7.3, 7.5, 7.8, 8.1, 8.3, 9,
    9.3, 9.5, 9.8, 10.1, 10.3, 11,
    11.3, 11.5, 11.8, 12.1, 12.3, 13,
    13.3, 13.5, 13.8, 14.1, 14.3, 15,
  ]);

  const DEFENSE_PROMOTION_PERCENTS = Object.freeze([
    3, 3.2, 3.4, 3.6, 3.8, 4.4,
    4.6, 4.8, 5, 5.1, 5.3, 5.8,
    6, 6.2, 6.4, 6.5, 6.7, 7.2,
    7.4, 7.6, 7.8, 7.9, 8.1, 8.6,
    8.8, 9, 9.2, 9.3, 9.5, 10,
  ]);

  const FULL_STAR_DATA = Object.freeze({
    gun: {
      label: "Gun",
      displayedPower: [362766, 462330, 561838, 661402, 760911],
      primaryLabel: "Hero ATK",
      primary: [5493, 5838, 6183, 6528, 6873],
      secondaryLabel: "ATK",
      secondary: [5.3, 5.6, 5.9, 6.2, 6.5],
      promotionLabel: "Hero ATK",
      troopLabel: "Troop DMG",
    },
    helmet: {
      label: "Helmet",
      displayedPower: [366790, 466575, 566305, 666120, 765880],
      primaryLabel: "Hero ATK",
      primary: [3380, 3592, 3804, 4017, 4229],
      secondaryLabel: "Hero DEF",
      secondary: [1690, 1796, 1902, 2008, 2115],
      tertiaryLabel: "ATK",
      tertiary: [5.3, 5.6, 5.9, 6.2, 6.5],
      promotionLabel: "Hero ATK",
      troopLabel: "Troop DMG",
    },
    armor: {
      label: "Armor",
      displayedPower: [365516, 467830, 570088, 672402, 774661],
      primaryLabel: "Hero DEF",
      primary: [5493, 5838, 6183, 6528, 6873],
      secondaryLabel: "DEF",
      secondary: [5.3, 5.6, 5.9, 6.2, 6.5],
      promotionLabel: "Hero DEF",
      troopLabel: "Troop HP",
    },
    boots: {
      label: "Boots",
      displayedPower: [369540, 472075, 574555, 677120, 779630],
      primaryLabel: "Hero ATK",
      primary: [1690, 1796, 1902, 2008, 2115],
      secondaryLabel: "Hero DEF",
      secondary: [3380, 3592, 3804, 4017, 4229],
      tertiaryLabel: "DEF",
      tertiary: [5.3, 5.6, 5.9, 6.2, 6.5],
      promotionLabel: "Hero DEF",
      troopLabel: "Troop HP",
    },
  });

  function numberAtLeast(value, minimum) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(minimum, parsed) : minimum;
  }

  function wholeNumber(value, minimum = 0) {
    return Math.floor(numberAtLeast(value, minimum));
  }

  function sanitizeInputs(values = {}) {
    return {
      currentMedals: wholeNumber(values.currentMedals),
      reserveMedals: wholeNumber(values.reserveMedals),
      coreCost: wholeNumber(values.coreCost, 1),
      currentCores: wholeNumber(values.currentCores),
      coresNeeded: wholeNumber(values.coresNeeded),
      corePowerGain: wholeNumber(values.corePowerGain),
      stoneCost: wholeNumber(values.stoneCost, 1),
      currentStones: wholeNumber(values.currentStones),
      stonesNeeded: wholeNumber(values.stonesNeeded),
      forgePowerGain: wholeNumber(values.forgePowerGain),
      discountedStock: values.discountedStock !== false,
    };
  }

  function efficiency(powerGain, medalCost) {
    if (powerGain <= 0) return 0;
    if (medalCost === 0) return Number.POSITIVE_INFINITY;
    return powerGain / medalCost;
  }

  function compareEfficiencies(coreEfficiency, forgeEfficiency) {
    if (coreEfficiency === forgeEfficiency) return "tie";
    if (!Number.isFinite(coreEfficiency)) return "core";
    if (!Number.isFinite(forgeEfficiency)) return "forge";

    const strongest = Math.max(coreEfficiency, forgeEfficiency);
    if (strongest === 0) return "tie";
    const difference = Math.abs(coreEfficiency - forgeEfficiency) / strongest;
    if (difference <= 0.05) return "tie";
    return coreEfficiency > forgeEfficiency ? "core" : "forge";
  }

  function getCoreRequirement(starValue, wedgeValue) {
    const star = Math.min(4, wholeNumber(starValue));
    const wedge = Math.min(5, wholeNumber(wedgeValue));
    let cores = 100;

    if (star === 0) {
      cores = wedge <= 1 ? 100 : wedge <= 4 ? 200 : 300;
    } else if (star === 1) {
      cores = wedge <= 1 ? 300 : wedge <= 4 ? 500 : 700;
    } else if (star === 2) {
      cores = wedge <= 4 ? 700 : 1000;
    } else if (star === 3) {
      cores = wedge <= 4 ? 1000 : 1500;
    } else if (star === 4) {
      cores = wedge <= 4 ? 1500 : 3000;
    }

    let orangePieces = 0;
    if (star === 3 && wedge === 5) orangePieces = 1;
    if (star === 4 && wedge <= 1) orangePieces = 1;
    if (star === 4 && wedge === 2) orangePieces = 2;
    if (star === 4 && (wedge === 3 || wedge === 4)) orangePieces = 1;
    if (star === 4 && wedge === 5) orangePieces = 3;

    const nextStar = wedge === 5 ? star + 1 : star;
    const nextWedge = wedge === 5 ? 0 : wedge + 1;
    const currentLabel = star === 0 && wedge === 0 ? "No wedges" : `${star}★ ${wedge}/6`;
    const nextLabel = `${nextStar}★ ${nextWedge}/6`;
    return { star, wedge, cores, orangePieces, currentLabel, nextLabel };
  }

  function getForgeRequirement(currentStageValue, targetStageValue) {
    const currentStage = Math.min(FORGE_TRANSITIONS.length, wholeNumber(currentStageValue));
    if (currentStage === FORGE_TRANSITIONS.length) {
      return {
        currentStage,
        targetStage: currentStage,
        stones: 0,
        pulseModules: 0,
        attributeGain: 0,
        transitions: [],
      };
    }
    const requestedTarget = Math.min(FORGE_TRANSITIONS.length, wholeNumber(targetStageValue));
    const targetStage = Math.min(
      FORGE_TRANSITIONS.length,
      Math.max(currentStage + 1, requestedTarget || currentStage + 1),
    );
    const transitions = FORGE_TRANSITIONS.slice(currentStage, targetStage);
    return {
      currentStage,
      targetStage,
      stones: transitions.reduce((sum, step) => sum + step.stones, 0),
      pulseModules: transitions.reduce((sum, step) => sum + step.pulseModules, 0),
      attributeGain: transitions.reduce((sum, step) => sum + step.attributeGain, 0),
      transitions,
    };
  }

  function getNextPromotionStats(starValue, wedgeValue, slotValue) {
    const requirement = getCoreRequirement(starValue, wedgeValue);
    const slot = FULL_STAR_DATA[slotValue] ? slotValue : "gun";
    const piece = FULL_STAR_DATA[slot];
    const currentIndex = requirement.star * 6 + requirement.wedge;
    const attackPiece = slot === "gun" || slot === "helmet";
    const percentages = attackPiece ? ATTACK_PROMOTION_PERCENTS : DEFENSE_PROMOTION_PERCENTS;
    const currentFlat = currentIndex === 0 ? 0 : PROMOTION_FLAT_STATS[currentIndex - 1];
    const currentPercent = currentIndex === 0 ? 0 : percentages[currentIndex - 1];
    const nextFlat = PROMOTION_FLAT_STATS[currentIndex];
    const nextPercent = percentages[currentIndex];
    const nextFullStar = Math.min(5, requirement.star + 1);
    const currentFullPower = requirement.wedge === 0 && requirement.star > 0
      ? piece.displayedPower[requirement.star - 1]
      : null;
    const targetFullPower = nextFullStar > 0 ? piece.displayedPower[nextFullStar - 1] : null;

    return {
      ...requirement,
      slot,
      piece,
      currentIndex,
      nextFlat,
      nextPercent,
      flatDelta: nextFlat - currentFlat,
      percentDelta: Number((nextPercent - currentPercent).toFixed(1)),
      promotionLabel: piece.promotionLabel,
      troopLabel: piece.troopLabel,
      nextFullStar,
      currentFullPower,
      targetFullPower,
      fullStarPowerDelta: currentFullPower === null ? null : targetFullPower - currentFullPower,
    };
  }

  function calculateMeritPlan(values) {
    const input = sanitizeInputs({ ...DEFAULT_INPUTS, ...values });
    const coresToBuy = Math.max(0, input.coresNeeded - input.currentCores);
    const stonesToBuy = Math.max(0, input.stonesNeeded - input.currentStones);
    const coreMedalCost = coresToBuy * input.coreCost;
    const forgeMedalCost = stonesToBuy * input.stoneCost;
    const fullCoreMedalCost = input.coresNeeded * input.coreCost;
    const fullForgeMedalCost = input.stonesNeeded * input.stoneCost;
    const spendableMedals = Math.max(0, input.currentMedals - input.reserveMedals);
    const hasCoreData = input.coresNeeded > 0 && input.corePowerGain > 0;
    const hasForgeData = input.stonesNeeded > 0 && input.forgePowerGain > 0;
    const coreEfficiency = hasCoreData ? efficiency(input.corePowerGain, coreMedalCost) : 0;
    const forgeEfficiency = hasForgeData ? efficiency(input.forgePowerGain, forgeMedalCost) : 0;
    const fullCoreEfficiency = hasCoreData ? efficiency(input.corePowerGain, fullCoreMedalCost) : 0;
    const fullForgeEfficiency = hasForgeData ? efficiency(input.forgePowerGain, fullForgeMedalCost) : 0;
    const coreAffordable = hasCoreData && spendableMedals >= coreMedalCost;
    const forgeAffordable = hasForgeData && spendableMedals >= forgeMedalCost;
    const affordableCores = Math.min(coresToBuy, Math.floor(spendableMedals / input.coreCost));
    const affordableStones = Math.min(stonesToBuy, Math.floor(spendableMedals / input.stoneCost));
    const coreBreakEvenPower = hasForgeData ? Math.ceil(fullCoreMedalCost * fullForgeEfficiency) : 0;
    const remainingForCore = Math.max(0, coreMedalCost - spendableMedals);
    const remainingForForge = Math.max(0, forgeMedalCost - spendableMedals);
    const discountedCoreStockCost = 1000 * input.coreCost;
    const discountedStoneStockCost = 50 * input.stoneCost;
    const canClearBothDiscounts = input.discountedStock && input.coresNeeded > 0 && input.stonesNeeded > 0 &&
      spendableMedals >= discountedCoreStockCost + discountedStoneStockCost;

    let winner = "incomplete";
    let action = "enter-core-data";
    if (canClearBothDiscounts) {
      winner = "both";
      action = "buy-both-stock";
    } else if (hasCoreData && hasForgeData) {
      winner = compareEfficiencies(fullCoreEfficiency, fullForgeEfficiency);
      if (winner === "tie") {
        action = coreAffordable || forgeAffordable ? "choose-timing" : "save-either";
      } else {
        const winnerAffordable = winner === "core" ? coreAffordable : forgeAffordable;
        const winnerCost = winner === "core" ? coreMedalCost : forgeMedalCost;
        action = winnerCost === 0 ? `complete-${winner}` : winnerAffordable ? `buy-${winner}` : `save-${winner}`;
      }
    }

    return {
      input,
      hasCoreData,
      hasForgeData,
      coresToBuy,
      stonesToBuy,
      coreMedalCost,
      forgeMedalCost,
      fullCoreMedalCost,
      fullForgeMedalCost,
      spendableMedals,
      coreEfficiency,
      forgeEfficiency,
      fullCoreEfficiency,
      fullForgeEfficiency,
      coreAffordable,
      forgeAffordable,
      affordableCores,
      affordableStones,
      coreBreakEvenPower,
      remainingForCore,
      remainingForForge,
      discountedCoreStockCost,
      discountedStoneStockCost,
      canClearBothDiscounts,
      winner,
      action,
    };
  }

  return {
    DEFAULT_INPUTS,
    CORE_STAGE_TOTALS,
    FORGE_TRANSITIONS,
    FULL_STAR_DATA,
    PROMOTION_FLAT_STATS,
    ATTACK_PROMOTION_PERCENTS,
    DEFENSE_PROMOTION_PERCENTS,
    calculateMeritPlan,
    sanitizeInputs,
    getCoreRequirement,
    getForgeRequirement,
    getNextPromotionStats,
  };
});

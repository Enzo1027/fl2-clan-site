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

  const CORE_STAGE_TOTALS = Object.freeze([1100, 3900, 8400, 14900, 25400]);

  const SHOP_DEFAULTS = Object.freeze({
    orangeChest: 15000,
    corePrice: 30,
    coreStock: 1000,
    stonePrice: 600,
    stoneStock: 50,
  });

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

  function getCoreRequirement(starValue, wedgeValue) {
    const requestedStar = wholeNumber(starValue);
    if (requestedStar >= 5) {
      return {
        star: 5,
        wedge: 0,
        cores: 0,
        orangePieces: 0,
        currentLabel: "5★ complete",
        nextLabel: "Complete",
        complete: true,
      };
    }

    const star = Math.min(4, requestedStar);
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
    return { star, wedge, cores, orangePieces, currentLabel, nextLabel, complete: false };
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
    if (requirement.complete) {
      return {
        ...requirement,
        slot,
        piece,
        currentIndex: PROMOTION_FLAT_STATS.length,
        nextFlat: null,
        nextPercent: null,
        flatDelta: 0,
        percentDelta: 0,
        promotionLabel: piece.promotionLabel,
        troopLabel: piece.troopLabel,
        nextFullStar: 5,
        currentFullPower: piece.displayedPower[4],
        targetFullPower: piece.displayedPower[4],
        fullStarPowerDelta: 0,
      };
    }

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

  function getLoadoutPowerSummary(loadout = {}, displayedHeroPowerValue = 0, selectedSlotValue = "gun") {
    const slots = Object.keys(FULL_STAR_DATA);
    const selectedSlot = FULL_STAR_DATA[selectedSlotValue] ? selectedSlotValue : "gun";
    const pieces = slots.map((slot) => {
      const raw = loadout[slot] || {};
      const rawPromotion = Number(raw.promotion);
      const promotion = Number.isFinite(rawPromotion)
        ? Math.min(30, wholeNumber(rawPromotion))
        : Math.min(30, (Math.min(5, wholeNumber(raw.currentStar)) * 6) + Math.min(5, wholeNumber(raw.currentWedge)));
      const star = promotion >= 30 ? 5 : Math.floor(promotion / 6);
      const wedge = promotion >= 30 ? 0 : promotion % 6;
      const table = FULL_STAR_DATA[slot];
      const level = Math.min(100, wholeNumber(raw.level ?? raw.equipmentLevel));
      const publishedMilestoneLevel = star > 0 ? 50 + (star * 5) : null;
      const rawForge = Number(raw.forge ?? raw.forgeStage);
      const forge = Number.isFinite(rawForge) ? Math.max(-1, Math.min(6, Math.floor(rawForge))) : -1;
      const atPublishedLevel = publishedMilestoneLevel !== null && level === publishedMilestoneLevel;
      const documentedFloor = atPublishedLevel ? table.displayedPower[star - 1] : 0;
      const exactDisplayedPower = atPublishedLevel && wedge === 0 && forge <= 0 ? documentedFloor : null;
      return {
        slot,
        label: table.label,
        level,
        star,
        wedge,
        forge,
        publishedMilestoneLevel,
        documentedFloor,
        exactDisplayedPower,
        confidence: exactDisplayedPower === null ? "floor" : "exact-milestone",
      };
    });

    const selected = pieces.find((piece) => piece.slot === selectedSlot);
    const milestone = getNextPromotionStats(selected.star, selected.wedge, selectedSlot);
    const displayedHeroPower = wholeNumber(displayedHeroPowerValue);
    const canProjectNextFullStar = displayedHeroPower > 0
      && selected.star > 0
      && selected.star < 5
      && selected.wedge === 0
      && selected.exactDisplayedPower !== null
      && milestone.fullStarPowerDelta !== null;
    return {
      displayedHeroPower,
      selectedSlot,
      selected,
      pieces,
      documentedGearFloor: pieces.reduce((sum, piece) => sum + piece.documentedFloor, 0),
      documentedPieces: pieces.filter((piece) => piece.documentedFloor > 0).length,
      exactMilestonePieces: pieces.filter((piece) => piece.exactDisplayedPower !== null).length,
      milestone,
      targetMilestoneLevel: milestone.nextFullStar > 0 ? 50 + (milestone.nextFullStar * 5) : null,
      projectedHeroPower: canProjectNextFullStar ? displayedHeroPower + milestone.fullStarPowerDelta : null,
      projectionDelta: canProjectNextFullStar ? milestone.fullStarPowerDelta : null,
      projectionConfidence: canProjectNextFullStar ? "exact-milestone-delta" : "unavailable",
    };
  }

  function getEquipmentLevelContext(levelValue, starValue, wedgeValue) {
    const level = Math.min(100, wholeNumber(levelValue));
    const star = Math.min(5, wholeNumber(starValue));
    const wedge = Math.min(5, wholeNumber(wedgeValue));
    const normalCap = Math.min(75, 50 + (star * 5));
    const nextCap = star < 5 && wedge === 5 ? Math.min(75, normalCap + 5) : normalCap;

    let band = "late";
    if (level < 20) band = "locked";
    else if (level < 40) band = "early";
    else if (level < 60) band = "mid";

    return {
      level,
      star,
      wedge,
      band,
      promotionUnlocked: level >= 20,
      normalCap,
      nextCap,
      levelsToPromotion: Math.max(0, 20 - level),
      capIncreaseOnNextSection: nextCap - normalCap,
    };
  }

  function forgeTargetForStrategy(star, currentStage, level) {
    if (currentStage < 0 || currentStage >= FORGE_TRANSITIONS.length) return currentStage;
    if (currentStage < 2) return 2;
    if (currentStage === 2 && star >= 3 && level >= 60) return 3;
    return Math.min(FORGE_TRANSITIONS.length, currentStage + 1);
  }

  function discountedPurchase(spendableMedals, price, stock) {
    if (price <= 0 || stock <= 0) return { units: 0, cost: 0 };
    const units = Math.min(stock, Math.floor(Math.max(0, spendableMedals) / price));
    return { units, cost: units * price };
  }

  function recommendMeritSpend(values = {}) {
    const currentMedals = wholeNumber(values.currentMedals);
    const currentCores = wholeNumber(values.currentCores);
    const currentStones = wholeNumber(values.currentStones);
    const orangePieces = wholeNumber(values.orangePieces);
    const pulseModules = wholeNumber(values.pulseModules);
    const currentStar = Math.min(5, wholeNumber(values.currentStar));
    const currentWedge = Math.min(5, wholeNumber(values.currentWedge));
    const equipmentLevel = Math.min(100, wholeNumber(values.equipmentLevel));
    const rawForgeStage = Number(values.forgeStage);
    const forgeStage = Number.isFinite(rawForgeStage)
      ? Math.max(-1, Math.min(FORGE_TRANSITIONS.length, Math.floor(rawForgeStage)))
      : -1;
    const f1Complete = values.f1Complete !== false;
    const corePrice = wholeNumber(values.corePrice ?? SHOP_DEFAULTS.corePrice, 1);
    const stonePrice = wholeNumber(values.stonePrice ?? SHOP_DEFAULTS.stonePrice, 1);
    const coreStock = wholeNumber(values.coreStock ?? SHOP_DEFAULTS.coreStock);
    const stoneStock = wholeNumber(values.stoneStock ?? SHOP_DEFAULTS.stoneStock);
    const coreStats = getNextPromotionStats(currentStar, currentWedge, values.slot);
    const level = getEquipmentLevelContext(equipmentLevel, currentStar, currentWedge);
    const reserveMedals = f1Complete ? 0 : SHOP_DEFAULTS.orangeChest;
    const spendableMedals = Math.max(0, currentMedals - reserveMedals);
    const coreDiscounted = corePrice <= SHOP_DEFAULTS.corePrice;
    const stoneDiscounted = stonePrice <= SHOP_DEFAULTS.stonePrice;
    const forgeAvailable = forgeStage >= 0 && forgeStage < FORGE_TRANSITIONS.length;
    const coreAvailable = !coreStats.complete;
    const recommendedForgeTarget = forgeTargetForStrategy(currentStar, forgeStage, equipmentLevel);
    const forge = forgeAvailable
      ? getForgeRequirement(forgeStage, recommendedForgeTarget)
      : getForgeRequirement(FORGE_TRANSITIONS.length, FORGE_TRANSITIONS.length);
    const bothCost = (corePrice * coreStock) + (stonePrice * stoneStock);

    let kind = "save";
    let rule = "no-efficient-step";
    let confidence = "medium";
    let useNow = true;

    if (!f1Complete && currentMedals < reserveMedals) {
      kind = "chest";
      rule = "finish-f1-orange";
      confidence = "high";
      useNow = false;
    } else if (coreAvailable && forgeAvailable && coreStock > 0 && stoneStock > 0 && coreDiscounted && stoneDiscounted && spendableMedals >= bothCost) {
      kind = "both";
      rule = "clear-both-discounts";
      confidence = "high";
    } else if (!coreAvailable && !forgeAvailable) {
      kind = "save";
      rule = "item-complete";
      confidence = "high";
      useNow = false;
    } else if (!level.promotionUnlocked && coreAvailable) {
      kind = "core";
      rule = "level-20-gate";
      confidence = "high";
      useNow = false;
    } else if (!coreAvailable) {
      kind = "forge";
      rule = forgeStage >= 3 ? "core-path-complete-late-forge" : "core-path-complete";
      confidence = forgeStage >= 3 ? "medium" : "high";
    } else if (!forgeAvailable) {
      kind = "core";
      rule = forgeStage >= FORGE_TRANSITIONS.length ? "forge-path-complete" : "forge-locked";
      confidence = "high";
    } else if (coreStats.cores <= 300) {
      kind = "core";
      rule = "cheap-core-section";
      confidence = "high";
    } else if (equipmentLevel < 40) {
      kind = "core";
      rule = "low-base-stats";
      confidence = "medium";
    } else if (forgeStage < 2 && coreStats.cores >= 500) {
      kind = "forge";
      rule = "forge-to-plus-two";
      confidence = "medium";
    } else if (forgeStage === 2 && currentStar >= 3 && equipmentLevel >= 60 && coreStats.cores >= 1000) {
      kind = "forge";
      rule = "balanced-plus-three";
      confidence = "medium";
    } else {
      kind = "core";
      rule = forgeStage >= 3 ? "avoid-late-forge" : "resume-core-path";
      confidence = "medium";
    }

    if (kind === "core" && !coreDiscounted) {
      if (forgeAvailable && stoneDiscounted) {
        kind = "forge";
        rule = "core-full-price";
        confidence = "medium";
      } else {
        kind = "save";
        rule = "wait-for-discount";
        confidence = "high";
        useNow = false;
      }
    } else if (kind === "forge" && !stoneDiscounted) {
      if (coreAvailable && coreDiscounted) {
        kind = "core";
        rule = "stone-full-price";
        confidence = "medium";
      } else {
        kind = "save";
        rule = "wait-for-discount";
        confidence = "high";
        useNow = false;
      }
    }

    if (kind === "core" && coreStock === 0 && forgeAvailable && stoneStock > 0 && stoneDiscounted) {
      kind = "forge";
      rule = "core-stock-sold";
      confidence = "medium";
    } else if (kind === "forge" && stoneStock === 0 && coreAvailable && coreStock > 0 && coreDiscounted) {
      kind = "core";
      rule = "stone-stock-sold";
      confidence = "medium";
    }

    const corePurchase = discountedPurchase(spendableMedals, corePrice, coreStock);
    const stonePurchase = discountedPurchase(spendableMedals, stonePrice, stoneStock);
    const chestCost = f1Complete || currentMedals < reserveMedals ? 0 : reserveMedals;
    let recommendedPurchase = { cores: 0, stones: 0, chest: chestCost, medals: chestCost };

    if (kind === "both") {
      recommendedPurchase = {
        cores: coreStock,
        stones: stoneStock,
        chest: chestCost,
        medals: chestCost + bothCost,
      };
    } else if (kind === "core") {
      recommendedPurchase.cores = corePurchase.units;
      recommendedPurchase.medals += corePurchase.cost;
    } else if (kind === "forge") {
      recommendedPurchase.stones = stonePurchase.units;
      recommendedPurchase.medals += stonePurchase.cost;
    }

    const ownedAfterPurchase = {
      cores: currentCores + recommendedPurchase.cores,
      stones: currentStones + recommendedPurchase.stones,
    };
    const coreShortfall = Math.max(0, coreStats.cores - ownedAfterPurchase.cores);
    const stoneShortfall = Math.max(0, forge.stones - ownedAfterPurchase.stones);
    const orangePieceShortfall = Math.max(0, coreStats.orangePieces - orangePieces);
    const pulseModuleShortfall = Math.max(0, forge.pulseModules - pulseModules);

    return {
      kind,
      rule,
      confidence,
      useNow,
      currentMedals,
      currentCores,
      currentStones,
      orangePieces,
      pulseModules,
      reserveMedals,
      spendableMedals,
      f1Complete,
      corePrice,
      stonePrice,
      coreStock,
      stoneStock,
      coreDiscounted,
      stoneDiscounted,
      bothCost,
      coreStats,
      level,
      forgeStage,
      forgeAvailable,
      recommendedForgeTarget,
      forge,
      recommendedPurchase,
      ownedAfterPurchase,
      coreShortfall,
      stoneShortfall,
      orangePieceShortfall,
      pulseModuleShortfall,
      canCompleteCoreNow: coreAvailable && coreShortfall === 0 && orangePieceShortfall === 0 && level.promotionUnlocked,
      canCompleteForgeNow: forgeAvailable && forge.stones > 0 && stoneShortfall === 0 && pulseModuleShortfall === 0,
    };
  }

  return {
    CORE_STAGE_TOTALS,
    FORGE_TRANSITIONS,
    FULL_STAR_DATA,
    PROMOTION_FLAT_STATS,
    ATTACK_PROMOTION_PERCENTS,
    DEFENSE_PROMOTION_PERCENTS,
    SHOP_DEFAULTS,
    getCoreRequirement,
    getForgeRequirement,
    getNextPromotionStats,
    getLoadoutPowerSummary,
    getEquipmentLevelContext,
    recommendMeritSpend,
  };
});

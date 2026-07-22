(function tankEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FL2Tank = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTankEngine() {
  "use strict";

  function clampSubLevel(value, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(maximum, Math.floor(number)));
  }

  function applyStageProgress(modifications, completions = {}, stageId, subLevelValue) {
    const index = modifications.findIndex((item) => item.id === stageId);
    if (index === -1) return { ...completions };

    const next = {};
    const stage = modifications[index];
    const subLevel = clampSubLevel(subLevelValue, stage.subLevels);
    for (let previous = 0; previous < index; previous += 1) {
      next[modifications[previous].id] = modifications[previous].subLevels;
    }
    next[stage.id] = subLevel;
    return next;
  }

  function getCompletedWrenches(modifications, completions = {}) {
    return modifications.reduce((total, stage) => {
      const subLevel = clampSubLevel(completions[stage.id], stage.subLevels);
      return total + (subLevel * stage.wrenchesPerSubLevel);
    }, 0);
  }

  function getMilestones(modifications, completedWrenches = 0) {
    return modifications
      .filter((stage) => stage.isSpecialVehicle)
      .map((stage) => ({
        id: stage.id,
        name: stage.name,
        level: stage.level,
        total: stage.cumulativeTotal,
        remaining: Math.max(0, stage.cumulativeTotal - completedWrenches),
        complete: completedWrenches >= stage.cumulativeTotal,
      }));
  }

  function getCurrentStage(modifications, completions = {}) {
    let current = null;
    modifications.forEach((stage) => {
      if (Object.prototype.hasOwnProperty.call(completions, stage.id)) current = stage;
    });
    return current;
  }

  function getTankSummary(data, completions = {}) {
    const completed = getCompletedWrenches(data.modifications, completions);
    const total = data.totalWrenches;
    const remaining = Math.max(0, total - completed);
    const milestones = getMilestones(data.modifications, completed);
    return {
      total,
      completed,
      remaining,
      percent: total ? (completed / total) * 100 : 0,
      milestones,
      nextMilestone: milestones.find((milestone) => !milestone.complete) || null,
      currentStage: getCurrentStage(data.modifications, completions),
    };
  }

  function estimatePace(startDateValue, completedWrenches, remainingWrenches, milestones = [], todayValue = new Date()) {
    if (!startDateValue) return { error: "Choose your game start date." };
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDateValue);
    if (!dateParts) return { error: "Choose a valid start date." };
    const startDay = Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]));
    const parsedStart = new Date(startDay);
    if (
      parsedStart.getUTCFullYear() !== Number(dateParts[1])
      || parsedStart.getUTCMonth() !== Number(dateParts[2]) - 1
      || parsedStart.getUTCDate() !== Number(dateParts[3])
    ) return { error: "Choose a valid start date." };
    const today = new Date(todayValue);
    const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (startDay > todayDay) return { error: "Start date cannot be in the future." };

    const daysPlayed = Math.floor((todayDay - startDay) / 86_400_000);
    if (daysPlayed < 1) return { error: "At least one day of progress is needed." };
    if (completedWrenches <= 0) return { error: "Record some tank progress to calculate your pace." };

    const weeksPlayed = daysPlayed / 7;
    const wrenchesPerWeek = completedWrenches / weeksPlayed;
    const weeksRemaining = remainingWrenches / wrenchesPerWeek;

    function futureDate(weeks) {
      const result = new Date(today);
      result.setHours(0, 0, 0, 0);
      result.setDate(result.getDate() + Math.ceil(weeks * 7));
      return result;
    }

    return {
      daysPlayed,
      weeksPlayed,
      wrenchesPerWeek,
      weeksRemaining,
      estimatedCompletion: futureDate(weeksRemaining),
      milestoneEstimates: milestones
        .filter((milestone) => !milestone.complete)
        .map((milestone) => {
          const weeks = milestone.remaining / wrenchesPerWeek;
          return { ...milestone, weeks, estimatedDate: futureDate(weeks) };
        }),
    };
  }

  return {
    clampSubLevel,
    applyStageProgress,
    getCompletedWrenches,
    getMilestones,
    getCurrentStage,
    getTankSummary,
    estimatePace,
  };
});

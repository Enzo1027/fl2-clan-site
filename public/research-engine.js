(function researchEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FL2Research = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createResearchEngine() {
  "use strict";

  function clampLevel(value, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(maximum, Math.floor(number)));
  }

  function sumCostRange(costs, start = 0, end = costs.length) {
    return costs.slice(start, end).reduce(
      (total, cost) => {
        if (cost === null || cost === undefined) total.unknown += 1;
        else total.known += Number(cost) || 0;
        return total;
      },
      { known: 0, unknown: 0 },
    );
  }

  function getNodeProgress(node, levelValue) {
    const level = clampLevel(levelValue, node.maxLevel);
    const spent = sumCostRange(node.badgeCost, 0, level);
    const remaining = sumCostRange(node.badgeCost, level, node.maxLevel);
    return { level, spent, remaining, complete: level === node.maxLevel };
  }

  function getPrerequisiteIds(tree, nodeId) {
    const nodeMap = new Map(tree.nodes.map((node) => [node.id, node]));
    const visited = new Set();
    const ordered = [];

    function visit(id) {
      const node = nodeMap.get(id);
      if (!node || visited.has(id)) return;
      visited.add(id);
      node.parents.forEach(visit);
      ordered.push(id);
    }

    const target = nodeMap.get(nodeId);
    if (!target) return [];
    target.parents.forEach(visit);
    return ordered;
  }

  function getDependentIds(tree, nodeId) {
    const children = new Map();
    tree.nodes.forEach((node) => {
      node.parents.forEach((parentId) => {
        if (!children.has(parentId)) children.set(parentId, []);
        children.get(parentId).push(node.id);
      });
    });
    const visited = new Set();
    function visit(id) {
      (children.get(id) || []).forEach((childId) => {
        if (visited.has(childId)) return;
        visited.add(childId);
        visit(childId);
      });
    }
    visit(nodeId);
    return Array.from(visited);
  }

  function applyNodeLevel(tree, progress = {}, nodeId, levelValue, autoComplete = false) {
    const nodeMap = new Map(tree.nodes.map((node) => [node.id, node]));
    const node = nodeMap.get(nodeId);
    if (!node) return { ...progress };

    const previousLevel = clampLevel(progress[nodeId], node.maxLevel);
    const nextLevel = clampLevel(levelValue, node.maxLevel);
    const next = { ...progress, [nodeId]: nextLevel };
    if (nextLevel < previousLevel) {
      getDependentIds(tree, nodeId).forEach((id) => { delete next[id]; });
    }
    if (autoComplete && next[nodeId] > 0) {
      getPrerequisiteIds(tree, nodeId).forEach((id) => {
        const prerequisite = nodeMap.get(id);
        next[id] = prerequisite.maxLevel;
      });
    }
    return next;
  }

  function getTreeSummary(tree, progress = {}) {
    let spentKnown = 0;
    let remainingKnown = 0;
    let completedUnknown = 0;
    let remainingUnknown = 0;
    let completedLevels = 0;

    tree.nodes.forEach((node) => {
      const nodeProgress = getNodeProgress(node, progress[node.id]);
      spentKnown += nodeProgress.spent.known;
      remainingKnown += nodeProgress.remaining.known;
      completedUnknown += nodeProgress.spent.unknown;
      remainingUnknown += nodeProgress.remaining.unknown;
      completedLevels += nodeProgress.level;
    });

    return {
      spentKnown,
      remainingKnown,
      completedUnknown,
      remainingUnknown,
      completedLevels,
      totalLevels: tree.totalLevels,
      levelPercent: tree.totalLevels ? (completedLevels / tree.totalLevels) * 100 : 0,
      badgePercent: tree.totalBadges ? (spentKnown / tree.totalBadges) * 100 : 0,
    };
  }

  function getGoalRequirement(tree, progress = {}, goals = {}) {
    const nodeMap = new Map(tree.nodes.map((node) => [node.id, node]));
    const targetProgress = { ...progress };
    Object.entries(goals).forEach(([nodeId, targetLevel]) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      targetProgress[nodeId] = Math.max(
        clampLevel(targetProgress[nodeId], node.maxLevel),
        clampLevel(targetLevel, node.maxLevel),
      );
      getPrerequisiteIds(tree, nodeId).forEach((id) => {
        const prerequisite = nodeMap.get(id);
        targetProgress[id] = Math.max(
          clampLevel(targetProgress[id], prerequisite.maxLevel),
          prerequisite.maxLevel,
        );
      });
    });

    return tree.nodes.reduce(
      (total, node) => {
        const current = clampLevel(progress[node.id], node.maxLevel);
        const target = Math.max(current, clampLevel(targetProgress[node.id], node.maxLevel));
        const gap = sumCostRange(node.badgeCost, current, target);
        total.known += gap.known;
        total.unknown += gap.unknown;
        total.levels += target - current;
        return total;
      },
      { known: 0, unknown: 0, levels: 0, targetProgress },
    );
  }

  function getStatTotals(tree, progress = {}) {
    const totals = new Map();

    tree.nodes.forEach((node) => {
      const level = clampLevel(progress[node.id], node.maxLevel);
      node.stats.forEach((stat) => {
        if (stat.format === "text" || !Array.isArray(stat.values)) return;
        const entry = totals.get(stat.key) || {
          key: stat.key,
          label: stat.label,
          format: stat.format,
          earned: 0,
          total: 0,
        };
        entry.total += Number(stat.values[node.maxLevel - 1]) || 0;
        if (level > 0) entry.earned += Number(stat.values[level - 1]) || 0;
        totals.set(stat.key, entry);
      });
    });

    return Array.from(totals.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  return {
    clampLevel,
    sumCostRange,
    getNodeProgress,
    getPrerequisiteIds,
    getDependentIds,
    applyNodeLevel,
    getTreeSummary,
    getGoalRequirement,
    getStatTotals,
  };
});

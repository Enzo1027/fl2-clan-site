(function initializeResearchPlanner() {
  "use strict";

  const STORAGE_KEY = "fl2-research-planner-v1";
  const MODEL_VERSION = 2;
  const engine = window.FL2Research;
  const profileStore = window.fl2Profiles;
  const number = new Intl.NumberFormat();
  let bundle = null;
  let openNodeId = null;

  let state = loadState();
  const elements = {
    treeList: document.querySelector("#treeList"),
    allSpent: document.querySelector("#allSpent"),
    allSpentMeta: document.querySelector("#allSpentMeta"),
    allRemaining: document.querySelector("#allRemaining"),
    allRemainingMeta: document.querySelector("#allRemainingMeta"),
    allLevels: document.querySelector("#allLevels"),
    allPercent: document.querySelector("#allPercent"),
    allGoal: document.querySelector("#allGoal"),
    allGoalMeta: document.querySelector("#allGoalMeta"),
    treeKicker: document.querySelector("#treeKicker"),
    treeTitle: document.querySelector("#treeTitle"),
    treeRequirements: document.querySelector("#treeRequirements"),
    treeProgressLabel: document.querySelector("#treeProgressLabel"),
    treeBadgeLabel: document.querySelector("#treeBadgeLabel"),
    treeProgressBar: document.querySelector("#treeProgressBar"),
    treeProgressTrack: document.querySelector("#treeProgressTrack"),
    autoComplete: document.querySelector("#autoComplete"),
    nodeSearch: document.querySelector("#nodeSearch"),
    mapViewButton: document.querySelector("#mapViewButton"),
    tableViewButton: document.querySelector("#tableViewButton"),
    clearTreeButton: document.querySelector("#clearTreeButton"),
    goalBanner: document.querySelector("#goalBanner"),
    goalDescription: document.querySelector("#goalDescription"),
    goalCost: document.querySelector("#goalCost"),
    statGrid: document.querySelector("#statGrid"),
    unknownNote: document.querySelector("#unknownNote"),
    researchWorkspace: document.querySelector("#researchWorkspace"),
    researchStatus: document.querySelector("#researchStatus"),
    researchFreshness: document.querySelector("#researchFreshness"),
    nodeDialog: document.querySelector("#nodeDialog"),
    dialogNodeTitle: document.querySelector("#dialogNodeTitle"),
    dialogNodeParents: document.querySelector("#dialogNodeParents"),
    nodeSummary: document.querySelector("#nodeSummary"),
    nodeGoalSelect: document.querySelector("#nodeGoalSelect"),
    nodeLevelList: document.querySelector("#nodeLevelList"),
    clearNodeButton: document.querySelector("#clearNodeButton"),
    closeNodeDialog: document.querySelector("#closeNodeDialog"),
  };

  function loadState() {
    try {
      const saved = profileStore?.getFeatureState("research") || JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        return {
          activeTreeId: saved.activeTreeId || "unit-special-training",
          view: saved.view === "table" ? "table" : "map",
          autoComplete: saved.modelVersion === MODEL_VERSION ? Boolean(saved.autoComplete) : false,
          progress: saved.progress || {},
          goals: saved.goals || {},
          search: "",
        };
      }
    } catch {}
    return {
      activeTreeId: "unit-special-training",
      view: "map",
      autoComplete: false,
      progress: {},
      goals: {},
      search: "",
    };
  }

  function saveState() {
    try {
      const snapshot = {
        modelVersion: MODEL_VERSION,
        activeTreeId: state.activeTreeId,
        view: state.view,
        autoComplete: state.autoComplete,
        progress: state.progress,
        goals: state.goals,
      };
      if (profileStore) profileStore.setFeatureState("research", snapshot);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      const status = document.querySelector("#localSaveStatus");
      if (status) {
        const profileLabel = profileStore ? `${profileStore.getProfile().name} ` : "";
        status.textContent = document.documentElement.dataset.offlineReady === "true"
          ? `${profileLabel}auto-saved · offline ready`
          : `${profileLabel}auto-saved on this device`;
      }
    } catch {
      const status = document.querySelector("#localSaveStatus");
      if (status) status.textContent = "Browser saving is unavailable";
    }
  }

  function activeTree() {
    return bundle.trees.find((tree) => tree.id === state.activeTreeId) || bundle.trees[0];
  }

  function treeProgress(tree) {
    return state.progress[tree.id] || {};
  }

  function treeGoals(tree) {
    return state.goals[tree.id] || {};
  }

  function format(value) {
    return number.format(Math.round(value || 0));
  }

  function formatCost(cost, unknown = 0) {
    if (unknown && cost) return `${format(cost)} known + ${unknown} unpublished`;
    if (unknown) return `${unknown} cost${unknown === 1 ? "" : "s"} unpublished`;
    return format(cost);
  }

  function formatStat(value, statFormat) {
    const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
    return statFormat === "percent" ? `${rounded}%` : format(rounded);
  }

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  }

  function renderOverall() {
    let spent = 0;
    let remaining = 0;
    let spentUnknown = 0;
    let remainingUnknown = 0;
    let levels = 0;
    let totalLevels = 0;
    let goalKnown = 0;
    let goalUnknown = 0;
    let goalCount = 0;

    bundle.trees.forEach((tree) => {
      const summary = engine.getTreeSummary(tree, treeProgress(tree));
      spent += summary.spentKnown;
      remaining += summary.remainingKnown;
      spentUnknown += summary.completedUnknown;
      remainingUnknown += summary.remainingUnknown;
      levels += summary.completedLevels;
      totalLevels += summary.totalLevels;
      const goals = treeGoals(tree);
      goalCount += Object.keys(goals).length;
      const goal = engine.getGoalRequirement(tree, treeProgress(tree), goals);
      goalKnown += goal.known;
      goalUnknown += goal.unknown;
    });

    elements.allSpent.textContent = format(spent);
    elements.allSpentMeta.textContent = spentUnknown ? `Plus ${spentUnknown} completed cost${spentUnknown === 1 ? "" : "s"} not published` : "All completed costs published";
    elements.allRemaining.textContent = format(remaining);
    elements.allRemainingMeta.textContent = remainingUnknown
      ? `Plus ${remainingUnknown} level cost${remainingUnknown === 1 ? "" : "s"} not published yet`
      : "All remaining costs published";
    elements.allLevels.textContent = `${format(levels)} / ${format(totalLevels)}`;
    elements.allPercent.textContent = `${totalLevels ? Math.floor((levels / totalLevels) * 100) : 0}% complete`;
    elements.allGoal.textContent = goalCount ? (goalKnown || goalUnknown ? formatCost(goalKnown, goalUnknown) : "Achieved") : "None";
    elements.allGoalMeta.textContent = goalCount
      ? `${goalCount} node goal${goalCount === 1 ? "" : "s"} across all trees`
      : "Choose a node goal below";
  }

  function renderTreeList() {
    elements.treeList.replaceChildren(...bundle.trees.map((tree) => {
      const summary = engine.getTreeSummary(tree, treeProgress(tree));
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tree-card${tree.id === state.activeTreeId ? " is-active" : ""}`;
      button.setAttribute("aria-pressed", String(tree.id === state.activeTreeId));
      button.innerHTML = `
        <span class="tree-glyph" aria-hidden="true">${initials(tree.name)}</span>
        <span class="tree-card-copy"><strong>${tree.name}</strong><small>${summary.completedLevels}/${tree.totalLevels} levels · ${Math.floor(summary.levelPercent)}%${summary.remainingUnknown ? ` · ${summary.remainingUnknown} unpublished` : ""}</small></span>
        <em>${format(summary.remainingKnown)}<small>known</small></em>`;
      button.addEventListener("click", () => {
        state.activeTreeId = tree.id;
        state.search = "";
        elements.nodeSearch.value = "";
        saveState();
        render();
      });
      return button;
    }));
  }

  function renderActiveHeader(tree, summary) {
    const unknownTotal = summary.completedUnknown + summary.remainingUnknown;
    elements.treeKicker.textContent = `${tree.nodes.length} nodes · ${format(tree.totalBadges)} known badges${unknownTotal ? ` · ${unknownTotal} unpublished` : ""}`;
    elements.treeTitle.textContent = tree.name;
    elements.treeRequirements.textContent = tree.unlockRequirements.length
      ? `Unlocks with ${tree.unlockRequirements.join(" · ")}`
      : "No recorded unlock requirement";
    elements.treeProgressLabel.textContent = `${summary.completedLevels} / ${tree.totalLevels} levels`;
    elements.treeBadgeLabel.textContent = `${format(summary.spentKnown)} known spent · ${format(summary.remainingKnown)} known left${summary.remainingUnknown ? ` · ${summary.remainingUnknown} costs unpublished` : ""}`;
    elements.treeProgressBar.style.width = `${Math.min(100, summary.levelPercent)}%`;
    elements.treeProgressTrack.setAttribute("aria-valuemax", String(tree.totalLevels));
    elements.treeProgressTrack.setAttribute("aria-valuenow", String(summary.completedLevels));
    elements.autoComplete.checked = state.autoComplete;
    elements.mapViewButton.classList.toggle("is-active", state.view === "map");
    elements.tableViewButton.classList.toggle("is-active", state.view === "table");
    elements.mapViewButton.setAttribute("aria-pressed", String(state.view === "map"));
    elements.tableViewButton.setAttribute("aria-pressed", String(state.view === "table"));
  }

  function renderGoal(tree) {
    const goals = treeGoals(tree);
    const entries = Object.entries(goals);
    if (!entries.length) {
      elements.goalBanner.hidden = true;
      return;
    }
    const requirement = engine.getGoalRequirement(tree, treeProgress(tree), goals);
    elements.goalBanner.hidden = false;
    const achieved = requirement.levels === 0;
    elements.goalDescription.textContent = achieved
      ? "Goal achieved — choose another target whenever you are ready"
      : `${requirement.levels} selected level${requirement.levels === 1 ? "" : "s"} remaining — previous nodes stay exactly as entered`;
    elements.goalCost.textContent = achieved ? "✓ Achieved" : `${formatCost(requirement.known, requirement.unknown)} badges`;
  }

  function renderStats(tree) {
    const stats = engine.getStatTotals(tree, treeProgress(tree));
    if (!stats.length) {
      elements.statGrid.innerHTML = '<div class="stat-chip"><span>Data status</span><strong>Stat totals not published</strong></div>';
      return;
    }
    elements.statGrid.innerHTML = stats.map((stat) => `
      <div class="stat-chip"><span>${stat.label}</span><strong>${formatStat(stat.earned, stat.format)} / ${formatStat(stat.total, stat.format)}</strong></div>
    `).join("");
  }

  function renderUnknowns(summary) {
    elements.unknownNote.hidden = summary.remainingUnknown === 0 && summary.completedUnknown === 0;
    if (!elements.unknownNote.hidden) {
      const parts = [];
      if (summary.remainingUnknown) parts.push(`${summary.remainingUnknown} future`);
      if (summary.completedUnknown) parts.push(`${summary.completedUnknown} completed`);
      const totalUnknown = summary.remainingUnknown + summary.completedUnknown;
      elements.unknownNote.textContent = `${parts.join(" and ")} level cost${totalUnknown === 1 ? " is" : "s are"} still shown as “?” by the source. Badge totals count only published values.`;
    }
  }

  function filteredNodes(tree) {
    const query = state.search.trim().toLowerCase();
    return query ? tree.nodes.filter((node) => node.name.toLowerCase().includes(query)) : tree.nodes;
  }

  function nodeCard(tree, node) {
    const progress = engine.getNodeProgress(node, treeProgress(tree)[node.id]);
    const goal = treeGoals(tree)[node.id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "node-card",
      progress.level > 0 ? "is-started" : "",
      progress.complete ? "is-complete" : "",
      goal ? "has-goal" : "",
    ].filter(Boolean).join(" ");
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML = `
      <span class="node-level"><span>Level</span><b>${progress.level}/${node.maxLevel}</b></span>
      <h3>${node.name}</h3>
      <span>
        <span class="node-cost"><span>${progress.complete ? "Complete" : "Known remaining"}</span><strong>${progress.complete ? "✓" : format(progress.remaining.known)}</strong></span>
        ${progress.remaining.unknown ? `<span class="node-unknown">Plus ${progress.remaining.unknown} unpublished cost${progress.remaining.unknown === 1 ? "" : "s"}</span>` : ""}
        <span class="node-meter"><span style="width:${node.maxLevel ? (progress.level / node.maxLevel) * 100 : 0}%"></span></span>
      </span>`;
    button.addEventListener("click", () => openNode(tree, node.id));
    return button;
  }

  function renderMap(tree) {
    const nodes = filteredNodes(tree);
    const rows = new Map();
    nodes.forEach((node) => {
      const y = Number(node.position?.y || 0);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(node);
    });
    const map = document.createElement("div");
    map.className = "research-map";
    Array.from(rows.entries()).sort((a, b) => a[0] - b[0]).forEach(([y, rowNodes], index) => {
      const row = document.createElement("section");
      row.className = "research-row";
      row.innerHTML = `<span class="research-row-label">Step ${index + 1}</span>`;
      rowNodes.sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0)).forEach((node) => row.append(nodeCard(tree, node)));
      map.append(row);
    });
    if (!nodes.length) map.innerHTML = '<p class="unknown-note">No nodes match that search.</p>';
    elements.researchWorkspace.replaceChildren(map);
  }

  function renderTable(tree) {
    const nodes = filteredNodes(tree);
    const wrap = document.createElement("div");
    wrap.className = "data-table-wrap";
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Research</th><th>Previous map path</th><th class="right">Level</th><th class="right">Remaining</th></tr></thead>
        <tbody>${nodes.map((node) => {
          const progress = engine.getNodeProgress(node, treeProgress(tree)[node.id]);
          const parentNames = node.parents.map((id) => tree.nodes.find((item) => item.id === id)?.name || id).join(", ") || "None";
          return `<tr data-node-id="${node.id}" role="button" tabindex="0" aria-haspopup="dialog" aria-label="Open ${node.name}, level ${progress.level} of ${node.maxLevel}"><td><strong>${node.name}</strong></td><td>${parentNames}</td><td class="right ${progress.complete ? "green" : ""}">${progress.level}/${node.maxLevel}</td><td class="right gold">${formatCost(progress.remaining.known, progress.remaining.unknown)}</td></tr>`;
        }).join("")}</tbody>
      </table>`;
    wrap.querySelectorAll("tbody tr").forEach((row) => {
      const activate = () => openNode(tree, row.dataset.nodeId);
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
    });
    elements.researchWorkspace.replaceChildren(wrap);
  }

  function renderWorkspace(tree) {
    if (state.view === "table") renderTable(tree);
    else renderMap(tree);
  }

  function render() {
    const tree = activeTree();
    state.activeTreeId = tree.id;
    const summary = engine.getTreeSummary(tree, treeProgress(tree));
    renderOverall();
    renderTreeList();
    renderActiveHeader(tree, summary);
    renderGoal(tree);
    renderStats(tree);
    renderUnknowns(summary);
    renderWorkspace(tree);
    elements.researchStatus.textContent = `${tree.name}: ${summary.completedLevels} of ${tree.totalLevels} levels finished.`;
    if (openNodeId && elements.nodeDialog.open) renderNodeDialog(tree, openNodeId);
  }

  function renderNodeDialog(tree, nodeId) {
    const node = tree.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const progress = engine.getNodeProgress(node, treeProgress(tree)[node.id]);
    const parents = node.parents.map((id) => tree.nodes.find((item) => item.id === id)?.name || id);
    elements.dialogNodeTitle.textContent = node.name;
    elements.dialogNodeParents.textContent = parents.length ? `Previous map path: ${parents.join(" · ")}` : "Starting node — no previous path";
    elements.nodeSummary.innerHTML = `
      <div><span>Current level</span><strong>${progress.level} / ${node.maxLevel}</strong></div>
      <div><span>Spent</span><strong>${formatCost(progress.spent.known, progress.spent.unknown)}</strong></div>
      <div><span>Remaining</span><strong>${formatCost(progress.remaining.known, progress.remaining.unknown)}</strong></div>`;
    elements.nodeGoalSelect.innerHTML = `<option value="">No goal</option>${Array.from({ length: node.maxLevel }, (_, index) => `<option value="${index + 1}">Level ${index + 1}</option>`).join("")}`;
    elements.nodeGoalSelect.value = String(treeGoals(tree)[node.id] || "");
    elements.nodeLevelList.replaceChildren(...Array.from({ length: node.maxLevel }, (_, index) => {
      const level = index + 1;
      const row = document.createElement("button");
      row.type = "button";
      row.className = `level-row${level <= progress.level ? " is-complete" : ""}`;
      row.setAttribute("aria-pressed", String(level <= progress.level));
      const statText = node.stats.map((stat) => {
        const value = stat.values?.[index];
        if (value === null || value === undefined) return "";
        return `${stat.label} ${stat.format === "percent" ? `${value}%` : stat.format === "number" ? `+${format(value)}` : value}`;
      }).filter(Boolean).join(" · ") || "No published stat detail";
      const cost = node.badgeCost[index];
      row.innerHTML = `<span class="level-check">${level <= progress.level ? "✓" : ""}</span><span class="level-number">Lv ${level}</span><span class="level-cost">${cost === null || cost === undefined ? "? badges" : `${format(cost)} badges`}</span><span class="level-stats">${statText}</span>`;
      row.addEventListener("click", () => {
        const current = treeProgress(tree);
        state.progress[tree.id] = engine.applyNodeLevel(tree, current, node.id, level, state.autoComplete);
        saveState();
        render();
      });
      return row;
    }));
  }

  function openNode(tree, nodeId) {
    openNodeId = nodeId;
    renderNodeDialog(tree, nodeId);
    if (!elements.nodeDialog.open) elements.nodeDialog.showModal();
  }

  elements.autoComplete.addEventListener("change", () => {
    state.autoComplete = elements.autoComplete.checked;
    saveState();
  });
  elements.nodeSearch.addEventListener("input", () => {
    state.search = elements.nodeSearch.value;
    renderWorkspace(activeTree());
  });
  elements.mapViewButton.addEventListener("click", () => { state.view = "map"; saveState(); render(); });
  elements.tableViewButton.addEventListener("click", () => { state.view = "table"; saveState(); render(); });
  elements.clearTreeButton.addEventListener("click", () => {
    const tree = activeTree();
    if (!window.confirm(`Clear all saved progress and goals for ${tree.name}?`)) return;
    delete state.progress[tree.id];
    delete state.goals[tree.id];
    saveState();
    render();
  });
  elements.nodeGoalSelect.addEventListener("change", () => {
    const tree = activeTree();
    if (!state.goals[tree.id]) state.goals[tree.id] = {};
    if (elements.nodeGoalSelect.value) state.goals[tree.id][openNodeId] = Number(elements.nodeGoalSelect.value);
    else delete state.goals[tree.id][openNodeId];
    saveState();
    render();
  });
  elements.clearNodeButton.addEventListener("click", () => {
    const tree = activeTree();
    state.progress[tree.id] = engine.applyNodeLevel(tree, treeProgress(tree), openNodeId, 0, state.autoComplete);
    saveState();
    render();
  });
  elements.closeNodeDialog.addEventListener("click", () => elements.nodeDialog.close());
  elements.nodeDialog.addEventListener("close", () => { openNodeId = null; });
  elements.nodeDialog.addEventListener("click", (event) => {
    if (event.target === elements.nodeDialog) elements.nodeDialog.close();
  });
  window.addEventListener("fl2:profilechange", () => {
    state = loadState();
    openNodeId = null;
    if (elements.nodeDialog.open) elements.nodeDialog.close();
    if (bundle) render();
  });

  fetch("data/research-trees.json?v=20260722-research-tank-v2")
    .then((response) => {
      if (!response.ok) throw new Error(`Research data returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      bundle = data;
      elements.researchFreshness.textContent = `Requirements snapshot checked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(bundle.capturedAt))}.`;
      render();
    })
    .catch((error) => {
      elements.treeTitle.textContent = "Research data unavailable";
      elements.treeRequirements.textContent = error.message;
      elements.researchWorkspace.innerHTML = '<p class="unknown-note">Reload the page to try again.</p>';
    });
})();

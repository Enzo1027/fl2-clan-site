(function initializeTankPlanner() {
  "use strict";

  const STORAGE_KEY = "fl2-tank-planner-v1";
  const engine = window.FL2Tank;
  const number = new Intl.NumberFormat();
  let data = null;
  let openStageId = null;
  const state = loadState();

  const elements = {
    tankSpent: document.querySelector("#tankSpent"),
    tankRemaining: document.querySelector("#tankRemaining"),
    tankStageLabel: document.querySelector("#tankStageLabel"),
    nextVehicle: document.querySelector("#nextVehicle"),
    nextVehicleMeta: document.querySelector("#nextVehicleMeta"),
    tankPercent: document.querySelector("#tankPercent"),
    tankLevelProgress: document.querySelector("#tankLevelProgress"),
    quickStage: document.querySelector("#quickStage"),
    quickSubLevel: document.querySelector("#quickSubLevel"),
    quickStageReadout: document.querySelector("#quickStageReadout"),
    gameStartDate: document.querySelector("#gameStartDate"),
    paceResult: document.querySelector("#paceResult"),
    clearTankButton: document.querySelector("#clearTankButton"),
    milestoneGrid: document.querySelector("#milestoneGrid"),
    tankWorkspace: document.querySelector("#tankWorkspace"),
    tankCardsButton: document.querySelector("#tankCardsButton"),
    tankTableButton: document.querySelector("#tankTableButton"),
    tankDialog: document.querySelector("#tankDialog"),
    dialogTankTitle: document.querySelector("#dialogTankTitle"),
    dialogTankRating: document.querySelector("#dialogTankRating"),
    tankDialogSummary: document.querySelector("#tankDialogSummary"),
    tankLevelList: document.querySelector("#tankLevelList"),
    clearStageButton: document.querySelector("#clearStageButton"),
    closeTankDialog: document.querySelector("#closeTankDialog"),
    tankFreshness: document.querySelector("#tankFreshness"),
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") return {
        completions: saved.completions || {},
        selectedStageId: saved.selectedStageId || "",
        gameStartDate: saved.gameStartDate || "",
        view: saved.view === "table" ? "table" : "cards",
      };
    } catch {}
    return { completions: {}, selectedStageId: "", gameStartDate: "", view: "cards" };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const status = document.querySelector("#localSaveStatus");
      if (status) status.textContent = "Saved on this browser";
    } catch {
      const status = document.querySelector("#localSaveStatus");
      if (status) status.textContent = "Browser saving is unavailable";
    }
  }

  function format(value) {
    return number.format(Math.round(value || 0));
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
  }

  function localDateValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function rankName(stage) {
    return stage.modificationRating.replace(/^\d+%\s*/, "").replace(/\s*Modifier$/, "");
  }

  function currentSubLevel(stage) {
    return engine.clampSubLevel(state.completions[stage.id], stage.subLevels);
  }

  function renderSummary(summary) {
    const started = data.modifications.filter((stage) => currentSubLevel(stage) > 0).length;
    elements.tankSpent.textContent = format(summary.completed);
    elements.tankRemaining.textContent = format(summary.remaining);
    elements.tankStageLabel.textContent = summary.currentStage ? `At Lv ${summary.currentStage.level} · ${summary.currentStage.name}` : "Starting path";
    elements.nextVehicle.textContent = summary.nextMilestone ? summary.nextMilestone.name.replace(" Armored Vehicle", "") : "Complete";
    elements.nextVehicleMeta.textContent = summary.nextMilestone ? `${format(summary.nextMilestone.remaining)} wrenches away` : "All published stages finished";
    elements.tankPercent.textContent = `${Math.floor(summary.percent)}%`;
    elements.tankLevelProgress.textContent = `${started} of ${data.modifications.length} stages started`;
  }

  function renderQuickEntry() {
    if (!state.selectedStageId || !data.modifications.some((stage) => stage.id === state.selectedStageId)) {
      state.selectedStageId = engine.getCurrentStage(data.modifications, state.completions)?.id || data.modifications[0].id;
    }
    elements.quickStage.innerHTML = data.modifications.map((stage) => `<option value="${stage.id}">Lv ${stage.level} — ${stage.name}</option>`).join("");
    elements.quickStage.value = state.selectedStageId;
    const stage = data.modifications.find((item) => item.id === state.selectedStageId);
    elements.quickSubLevel.innerHTML = Array.from({ length: stage.subLevels + 1 }, (_, index) => `<option value="${index}">${index} of ${stage.subLevels}</option>`).join("");
    elements.quickSubLevel.value = String(currentSubLevel(stage));
    elements.quickStageReadout.innerHTML = `
      <div><span>Each sub-level</span><strong>${format(stage.wrenchesPerSubLevel)} wrenches</strong></div>
      <div><span>Whole stage</span><strong>${format(stage.totalWrenches)} wrenches</strong></div>
      <div><span>After this stage</span><strong>${format(stage.cumulativeTotal)} cumulative</strong></div>`;
  }

  function renderPace(summary) {
    elements.gameStartDate.value = state.gameStartDate;
    elements.gameStartDate.max = localDateValue();
    const pace = engine.estimatePace(state.gameStartDate, summary.completed, summary.remaining, summary.milestones);
    if (pace.error) {
      elements.paceResult.innerHTML = `<p class="pace-error">${pace.error}</p>`;
      return;
    }
    const next = pace.milestoneEstimates[0];
    elements.paceResult.innerHTML = `
      <div class="pace-result-grid">
        <div><span>Average pace</span><strong>${format(pace.wrenchesPerWeek)} / week</strong></div>
        <div><span>Full completion</span><strong>${dateLabel(pace.estimatedCompletion)}</strong></div>
        <div><span>Weeks remaining</span><strong>${pace.weeksRemaining.toFixed(1)}</strong></div>
        <div><span>${next ? `Next: ${next.name}` : "Milestones"}</span><strong>${next ? dateLabel(next.estimatedDate) : "Complete"}</strong></div>
      </div>`;
  }

  function renderMilestones(summary) {
    elements.milestoneGrid.innerHTML = summary.milestones.map((milestone) => `
      <button type="button" class="milestone-card${milestone.complete ? " is-complete" : ""}" data-stage-id="${milestone.id}" aria-label="Jump to ${milestone.name}, level ${milestone.level}">
        <div class="milestone-level"><span>Level ${milestone.level}</span><b>${milestone.complete ? "Unlocked" : format(milestone.total)}</b></div>
        <h3>${milestone.name}</h3>
        <p>${milestone.complete ? "✓ Vehicle milestone completed" : `<strong>${format(milestone.remaining)}</strong> more wrenches`}</p>
      </button>`).join("");
    elements.milestoneGrid.querySelectorAll("[data-stage-id]").forEach((card) => {
      card.addEventListener("click", () => {
        state.selectedStageId = card.dataset.stageId;
        saveState();
        renderQuickEntry();
        document.querySelector(`#stage-${CSS.escape(card.dataset.stageId)}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function stageCard(stage) {
    const complete = currentSubLevel(stage);
    const button = document.createElement("button");
    button.type = "button";
    button.id = `stage-${stage.id}`;
    button.className = [
      "tank-stage",
      complete > 0 ? "is-started" : "",
      complete === stage.subLevels ? "is-complete" : "",
      stage.isSpecialVehicle ? "is-milestone" : "",
    ].filter(Boolean).join(" ");
    button.innerHTML = `
      <span class="tank-stage-top"><span>Lv ${stage.level}</span><strong>${complete}/${stage.subLevels}</strong></span>
      <h3>${stage.name}</h3>
      <span class="tank-stage-rating">${stage.modificationRating}</span>
      <span class="tank-stage-bottom">
        <span class="tank-stage-cost"><span>${format(stage.wrenchesPerSubLevel)} each</span><strong>${format(stage.totalWrenches)} total</strong></span>
        <span class="tank-stage-progress"><span style="width:${(complete / stage.subLevels) * 100}%"></span></span>
      </span>`;
    button.addEventListener("click", () => openStage(stage.id));
    return button;
  }

  function renderCards() {
    const groups = new Map();
    data.modifications.forEach((stage) => {
      const rank = rankName(stage);
      if (!groups.has(rank)) groups.set(rank, []);
      groups.get(rank).push(stage);
    });
    const fragment = document.createDocumentFragment();
    groups.forEach((stages, rank) => {
      const section = document.createElement("section");
      section.className = "tank-tier";
      section.innerHTML = `<h3>${rank}</h3>`;
      const grid = document.createElement("div");
      grid.className = "tank-stage-grid";
      stages.forEach((stage) => grid.append(stageCard(stage)));
      section.append(grid);
      fragment.append(section);
    });
    elements.tankWorkspace.replaceChildren(fragment);
  }

  function renderTable() {
    const wrap = document.createElement("div");
    wrap.className = "data-table-wrap";
    wrap.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Level</th><th>Modification</th><th>Rank</th><th class="right">Progress</th><th class="right">Each</th><th class="right">Cumulative</th></tr></thead>
        <tbody>${data.modifications.map((stage) => {
          const current = currentSubLevel(stage);
          return `<tr data-stage-id="${stage.id}" role="button" tabindex="0"><td><strong>Lv ${stage.level}</strong></td><td>${stage.name}</td><td>${rankName(stage)}</td><td class="right ${current === stage.subLevels ? "green" : ""}">${current}/${stage.subLevels}</td><td class="right gold">${format(stage.wrenchesPerSubLevel)}</td><td class="right">${format(stage.cumulativeTotal)}</td></tr>`;
        }).join("")}</tbody>
      </table>`;
    wrap.querySelectorAll("tbody tr").forEach((row) => {
      const activate = () => openStage(row.dataset.stageId);
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
    });
    elements.tankWorkspace.replaceChildren(wrap);
  }

  function render() {
    const summary = engine.getTankSummary(data, state.completions);
    renderSummary(summary);
    renderQuickEntry();
    renderPace(summary);
    renderMilestones(summary);
    elements.tankCardsButton.classList.toggle("is-active", state.view === "cards");
    elements.tankTableButton.classList.toggle("is-active", state.view === "table");
    elements.tankCardsButton.setAttribute("aria-pressed", String(state.view === "cards"));
    elements.tankTableButton.setAttribute("aria-pressed", String(state.view === "table"));
    if (state.view === "table") renderTable();
    else renderCards();
    if (openStageId && elements.tankDialog.open) renderStageDialog(openStageId);
  }

  function renderStageDialog(stageId) {
    const stage = data.modifications.find((item) => item.id === stageId);
    if (!stage) return;
    const current = currentSubLevel(stage);
    const spentHere = current * stage.wrenchesPerSubLevel;
    elements.dialogTankTitle.textContent = `Lv ${stage.level} · ${stage.name}`;
    elements.dialogTankRating.textContent = stage.modificationRating;
    elements.tankDialogSummary.innerHTML = `
      <div><span>Current progress</span><strong>${current} / ${stage.subLevels}</strong></div>
      <div><span>Spent here</span><strong>${format(spentHere)}</strong></div>
      <div><span>Remaining here</span><strong>${format(stage.totalWrenches - spentHere)}</strong></div>`;
    elements.tankLevelList.replaceChildren(...Array.from({ length: stage.subLevels }, (_, index) => {
      const subLevel = index + 1;
      const complete = subLevel <= current;
      const row = document.createElement("button");
      row.type = "button";
      row.className = `level-row${complete ? " is-complete" : ""}`;
      row.innerHTML = `<span class="level-check">${complete ? "✓" : ""}</span><span class="level-number">${subLevel}/${stage.subLevels}</span><span class="level-cost">${format(stage.wrenchesPerSubLevel)} wrenches</span><span class="level-stats">${format(stage.cumulativeTotal - ((stage.subLevels - subLevel) * stage.wrenchesPerSubLevel))} cumulative after this step</span>`;
      row.addEventListener("click", () => {
        state.completions = engine.applyStageProgress(data.modifications, state.completions, stage.id, subLevel);
        state.selectedStageId = stage.id;
        saveState();
        render();
      });
      return row;
    }));
  }

  function openStage(stageId) {
    openStageId = stageId;
    renderStageDialog(stageId);
    if (!elements.tankDialog.open) elements.tankDialog.showModal();
  }

  elements.quickStage.addEventListener("change", () => {
    state.selectedStageId = elements.quickStage.value;
    const stage = data.modifications.find((item) => item.id === state.selectedStageId);
    state.completions = engine.applyStageProgress(
      data.modifications,
      state.completions,
      stage.id,
      currentSubLevel(stage),
    );
    saveState();
    render();
  });
  elements.quickSubLevel.addEventListener("change", () => {
    state.completions = engine.applyStageProgress(data.modifications, state.completions, state.selectedStageId, elements.quickSubLevel.value);
    saveState();
    render();
  });
  elements.gameStartDate.addEventListener("change", () => {
    state.gameStartDate = elements.gameStartDate.value;
    saveState();
    renderPace(engine.getTankSummary(data, state.completions));
  });
  elements.clearTankButton.addEventListener("click", () => {
    if (!window.confirm("Clear all saved tank progress?")) return;
    state.completions = {};
    state.selectedStageId = data.modifications[0].id;
    saveState();
    render();
  });
  elements.tankCardsButton.addEventListener("click", () => { state.view = "cards"; saveState(); render(); });
  elements.tankTableButton.addEventListener("click", () => { state.view = "table"; saveState(); render(); });
  elements.clearStageButton.addEventListener("click", () => {
    state.completions = engine.applyStageProgress(data.modifications, state.completions, openStageId, 0);
    saveState();
    render();
  });
  elements.closeTankDialog.addEventListener("click", () => elements.tankDialog.close());
  elements.tankDialog.addEventListener("close", () => { openStageId = null; });
  elements.tankDialog.addEventListener("click", (event) => {
    if (event.target === elements.tankDialog) elements.tankDialog.close();
  });

  fetch("data/tank-modifications.json?v=20260722-research-tank-v2")
    .then((response) => {
      if (!response.ok) throw new Error(`Tank data returned ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      data = payload;
      elements.tankFreshness.textContent = `Requirements snapshot checked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(data.capturedAt))}.`;
      render();
    })
    .catch((error) => {
      elements.tankWorkspace.innerHTML = `<p class="unknown-note">Tank data could not load: ${error.message}. Reload to try again.</p>`;
    });
})();

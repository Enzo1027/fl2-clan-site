(function initializeDailyPage() {
  "use strict";
  const store = window.fl2Profiles;
  const DAY_DATA = {
    1: { name: "Vehicle Day", kicker: "Day 1 · Modded Vehicle Boost", action: "Use wrenches, blueprints, module/plugin chests, radar tasks, and vehicle materials.", tasks: [["wrenches", "Use saved Golden Wrenches", "Vehicle modification points"], ["blueprints", "Use Modification Blueprints", "Match the active point task"], ["vehicle-chests", "Open vehicle module/plugin chests", "Only if listed in today’s game tab"], ["radar-duel", "Complete saved radar tasks", "Keep room before the next refresh"]] },
    2: { name: "Shelter Upgrade", kicker: "Day 2 · Building", action: "Finish construction, use construction speed-ups, orange bounties, and refugee tickets.", tasks: [["construction", "Finish high-power buildings", "Confirm the point list before completing"], ["construction-speed", "Use construction speed-ups", "Spend only what helps your target"], ["orange-bounty", "Turn in orange bounties", "Community-reported scoring task"], ["refugees", "Use saved refugee tickets", "When shown in today’s point list"]] },
    3: { name: "Age of Science", kicker: "Day 3 · Research", action: "Use research speed-ups and badges, and send orange trades when the point list supports them.", tasks: [["research", "Finish research nodes", "Use the FL2 Research Planner first"], ["research-speed", "Use research speed-ups", "Prefer valuable nodes over empty points"], ["badges", "Spend saved research badges", "Alliance Recognition can improve the week"], ["orange-trades", "Send orange trucks/trades", "Confirm the live task wording"]] },
    4: { name: "Hero Initiative", kicker: "Day 4 · Heroes and gear", action: "Use hero fragments, recruits, skill books, Power Cores, alloy, and orange equipment promotion.", tasks: [["hero-frags", "Use saved hero fragments", "Upgrade the formation you actually use"], ["recruit", "Use saved recruitment tickets", "Match the live point list"], ["hero-skills", "Use orange skill books", "Plan all three skills first"], ["gear", "Promote orange gear with Cores / Alloy", "Run the Merit advisor before spending"]] },
    5: { name: "Holistic Growth", kicker: "Day 5 · Training and growth", action: "Train troops, use training speed-ups, finish broad power gains, and complete radar tasks.", tasks: [["train", "Run troop training queues", "Use the highest efficient tier"], ["training-speed", "Use training speed-ups", "Avoid exhausting next week’s reserve"], ["growth-power", "Finish planned building/research power", "Check the current point list"], ["radar-growth", "Complete radar tasks", "Keep room for refresh"]] },
    6: { name: "Enemy Buster", kicker: "Day 6 · Combat", action: "Fight only within alliance/state rules. Shield before reset if you will not participate.", tasks: [["shield", "Shield or confirm combat plan", "Protect troops if offline"], ["combat", "Follow FL2 target and rally calls", "Never freelance into state diplomacy"], ["combat-trades", "Finish eligible bounties/trades", "Use only what the live list scores"], ["heal", "Keep healing capacity available", "Avoid unrecoverable hospital overflow"]] },
    7: { name: "Rest and Prepare", kicker: "Day 7 · No Duel scoring", action: "Save radars and upgrade materials for Monday. Refill queues and plan the coming week.", tasks: [["save-radar", "Save radar completions for Monday", "Leave enough open slots for refresh"], ["save-mats", "Hold wrenches and blueprints", "Vehicle Day starts after reset"], ["weekly-plan", "Choose next HQ, hero, and research goals", "Use the command center"], ["shield-check", "Check shields and state rules", "Prepare before the new matchup"]] },
  };
  const DAILY = [
    ["trucks", "Send trucks and use available attacks", "A common guide target is four deliveries and four attacks"],
    ["bounty", "Finish bounties, plunders, and helps", "Counts vary with account progression"],
    ["fp", "Collect Full Preparedness medals", "Community target: 18 medals"],
    ["furylord", "Hit Furylord", "Community routine: up to four hits"],
    ["danger", "Claim the main Danger Lurks reward", "Stop when the useful reward is secured"],
    ["mines", "Keep available mines occupied", "Community routine: up to four"],
    ["idle", "Claim idle rewards before the cap", "Commonly reported around eight hours"],
    ["radar", "Clear radar without blocking refresh", "Current evidence favors eight-hour refreshes"],
    ["arena", "Use Arena attempts", "Community routine: aim for five wins"],
    ["daily-chest", "Finish the daily activity chest", "Community target: 150 points"],
    ["battlefield", "Check Hero Battlefield", "Use each available refresh"],
    ["alliance", "Donate alliance tech and tap helps", "Small actions, strong alliance value"],
    ["queues", "Keep troop queues running", "Avoid idle training buildings"],
  ];
  const FP = {
    1: ["Shelter", "Science", "Vehicle", "Hero", "Army", "Vehicle"], 2: ["Science", "Hero", "Shelter", "Army", "Vehicle", "Shelter"],
    3: ["Hero", "Army", "Science", "Vehicle", "Shelter", "Science"], 4: ["Army", "Vehicle", "Hero", "Shelter", "Science", "Army"],
    5: ["Vehicle", "Shelter", "Army", "Science", "Hero", "Army"], 6: ["Science", "Vehicle", "Hero", "Shelter", "Science", "Army"],
    7: ["Vehicle", "Shelter", "Army", "Science", "Hero", "Army"],
  };
  const formatTime = (date) => new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(date);
  const atNow = (now = new Date()) => FL2Daily.apocalypseNow(now);
  const atDateKey = (now = new Date()) => FL2Daily.apocalypseDateKey(now);
  const autoDay = (now = new Date()) => FL2Daily.duelDay(now);
  function nextUtcHour(hours, now = new Date()) {
    return FL2Daily.nextUtcWindow(hours.map((hour) => ({ hour })), now);
  }
  function nextUtcTime(hour, minute, now = new Date()) {
    return FL2Daily.nextUtcWindow([{ hour, minute }], now);
  }
  function getState() {
    const saved = store?.getFeatureState("daily") || {};
    const dateKey = atDateKey();
    return { dateKey, completed: saved.dateKey === dateKey && Array.isArray(saved.completed) ? saved.completed : [], duelDayOverride: saved.duelDayOverride || "auto" };
  }
  let state = getState();
  function chosenDay() { return state.duelDayOverride === "auto" ? autoDay() : Number(state.duelDayOverride); }
  function save() { store?.setFeatureState("daily", state); }
  function taskMarkup(id, title, note) { const checked = state.completed.includes(id); return `<label class="task-check"><input type="checkbox" value="${id}"${checked ? " checked" : ""} /><strong>${title}</strong><small>${note}</small></label>`; }
  function render() {
    const day = chosenDay(), data = DAY_DATA[day], now = new Date();
    document.getElementById("duelDay").value = state.duelDayOverride;
    document.getElementById("atDate").textContent = atNow(now).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
    document.getElementById("duelKicker").textContent = data.kicker;
    document.getElementById("todayTheme").textContent = data.name;
    document.getElementById("todayAction").textContent = data.action;
    document.getElementById("duelTaskTitle").textContent = data.name;
    document.getElementById("duelTasks").innerHTML = `<article class="task-group"><header><h3>Score intentionally</h3><span>${data.tasks.length} checks</span></header><div class="task-list">${data.tasks.map((task) => taskMarkup(`duel-${day}-${task[0]}`, task[1], task[2])).join("")}</div></article>`;
    document.getElementById("dailyTasks").innerHTML = `<article class="task-group"><header><h3>Daily account health</h3><span>${DAILY.length} checks</span></header><div class="task-list">${DAILY.map((task) => taskMarkup(`daily-${task[0]}`, task[1], task[2])).join("")}</div></article>`;
    document.querySelectorAll('.task-check input').forEach((input) => input.addEventListener("change", () => { state.completed = input.checked ? [...new Set([...state.completed, input.value])] : state.completed.filter((id) => id !== input.value); save(); renderProgress(); }));
    const fpHoursUtc = [2, 6, 10, 14, 18, 22];
    document.getElementById("fpWindows").innerHTML = fpHoursUtc.map((hour, index) => { const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour)); return `<div class="compact-row"><div><strong>${FP[day][index]}</strong><span>AT ${String(index * 4).padStart(2, "0")}:00</span></div><b>${formatTime(date)}</b></div>`; }).join("");
    renderProgress(); updateClocks();
  }
  function renderProgress() {
    const day = chosenDay(); const visibleIds = [...DAY_DATA[day].tasks.map((task) => `duel-${day}-${task[0]}`), ...DAILY.map((task) => `daily-${task[0]}`)];
    const done = visibleIds.filter((id) => state.completed.includes(id)).length;
    document.getElementById("taskProgress").textContent = `${done} / ${visibleIds.length}`;
    document.getElementById("taskPercent").textContent = done ? `${Math.round(done / visibleIds.length * 100)}% finished` : "Nothing checked yet";
  }
  function updateClocks() {
    const now = new Date(); const reset = nextUtcHour([2], now); const diff = Math.max(0, reset - now);
    const h = Math.floor(diff / 3_600_000), m = Math.floor(diff % 3_600_000 / 60_000), s = Math.floor(diff % 60_000 / 1000);
    document.getElementById("resetCountdown").textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    document.getElementById("resetLocal").textContent = `${formatTime(reset)} local · 00:00 AT`;
    document.getElementById("nextRadar").textContent = formatTime(nextUtcHour([2, 10, 18], now));
    const fp = nextUtcHour([2, 6, 10, 14, 18, 22], now); document.getElementById("nextFp").textContent = formatTime(fp);
    const fpIndex = [2, 6, 10, 14, 18, 22].indexOf(fp.getUTCHours());
    const fpDay = state.duelDayOverride === "auto" ? autoDay(fp) : chosenDay();
    document.getElementById("nextFpType").textContent = `${FP[fpDay][fpIndex]} window · reported`;
    document.getElementById("arenaTime").textContent = formatTime(nextUtcTime(1, 30, now));
  }
  document.getElementById("duelDay").addEventListener("change", (event) => { state.duelDayOverride = event.target.value; save(); render(); });
  window.addEventListener("fl2:profilechange", () => { state = getState(); render(); });
  render(); setInterval(updateClocks, 1000);
})();

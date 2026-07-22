(function initializeCommandCenter() {
  "use strict";
  const store = window.fl2Profiles;
  const byId = (id) => document.getElementById(id);
  const format = (value) => new Intl.NumberFormat().format(Math.round(value || 0));
  let researchData;
  let tankData;

  async function loadData() {
    [researchData, tankData] = await Promise.all([
      fetch("data/research-trees.json?v=20260722-command-v2").then((response) => response.json()),
      fetch("data/tank-modifications.json?v=20260722-command-v2").then((response) => response.json()),
    ]);
  }

  function state(namespace) { return store?.getFeatureState(namespace) || null; }

  function render() {
    const profile = store?.getProfile();
    const hq = state("hq");
    const hero = state("heroes");
    const merit = state("calculator");
    const research = state("research");
    const tank = state("tank");
    const daily = state("daily");
    byId("activeProfileName").textContent = profile?.name || "This browser";
    byId("profileSaveMeta").textContent = `${profile?.featureNamespaces?.length || Object.keys(profile?.features || {}).length} tools saved privately`;

    byId("summaryHq").textContent = hq?.current ? `Level ${hq.current}` : "Not set";
    byId("summaryHqMeta").textContent = hq?.target && hq.target > hq.current ? `Planning for HQ ${hq.target}` : "Add your account level";
    byId("cardHq").textContent = hq?.current ? `HQ ${hq.current} saved →` : "Set up →";

    const selectedHero = window.HeroPlanner?.HEROES?.find((item) => item.id === hero?.heroId);
    byId("summaryHero").textContent = selectedHero?.name || "Not set";
    byId("summaryHeroMeta").textContent = hero?.level ? `Level ${hero.level} → ${hero.targetLevel || hero.level}` : "Plan XP and fragments";
    byId("cardHeroes").textContent = selectedHero ? `${selectedHero.name} saved →` : "Set up →";

    if (tankData) {
      const tankSummary = FL2Tank.getTankSummary(tankData, tank?.completions || {});
      byId("summaryTank").textContent = `${Math.round(tankSummary.percent)}%`;
      byId("summaryTankMeta").textContent = `${format(tankSummary.remaining)} wrenches remain`;
      byId("cardTank").textContent = `${format(tankSummary.completed)} spent →`;
    }
    if (researchData) {
      const finished = researchData.trees.reduce((sum, tree) => sum + FL2Research.getTreeSummary(tree, research?.progress?.[tree.id] || {}).completedLevels, 0);
      byId("cardResearch").textContent = finished ? `${format(finished)} levels saved →` : "Track progress →";
    }

    const todayKey = FL2Daily.apocalypseDateKey();
    const dailyDone = daily?.dateKey === todayKey ? daily.completed?.length || 0 : 0;
    byId("summaryToday").textContent = `${dailyDone} done`;
    byId("summaryTodayMeta").textContent = dailyDone ? "Keep the streak moving" : "Open the daily plan";
    byId("cardDaily").textContent = dailyDone ? `${dailyDone} checked today →` : "Start checklist →";
    byId("cardMerit").textContent = merit?.currentMedals ? `${format(Number(merit.currentMedals))} medals saved →` : "Get answer →";

    let next = { title: "Set your HQ level", copy: "That unlocks useful account-aware recommendations across the rest of the command center.", href: "hq.html", label: "Set HQ now →" };
    if (hq?.current && !hero?.heroId) next = { title: "Add your lead hero", copy: "Get the exact XP, fragment, skill-book, and exclusive-equipment shortages for the hero you are building.", href: "heroes.html", label: "Plan hero →" };
    else if (hq?.current && hero?.heroId && dailyDone < 5) next = { title: "Open today’s battle plan", copy: "See the current Alliance Duel theme, the next Apocalypse Time reset, and the shortest high-value checklist.", href: "daily.html", label: "See today →" };
    else if (merit?.currentMedals) {
      const answer = MeritCalculator.recommendMeritSpend({ ...merit, slot: merit.gearSlot });
      next = { title: answer.kind === "forge" ? "Use the Merit advisor for red stones" : answer.kind === "save" ? "Hold your Merit Medals" : "Use the Merit advisor for Power Cores", copy: "Your saved equipment and shop state are ready for a current recommendation.", href: "calculator.html", label: "Open Merit answer →" };
    }
    byId("nextActionTitle").textContent = next.title;
    byId("nextActionCopy").textContent = next.copy;
    byId("nextActionLink").href = next.href;
    byId("nextActionLink").textContent = next.label;
  }

  byId("focusProfile").addEventListener("click", () => document.querySelector(".profile-switcher select")?.focus());
  byId("exportAll").addEventListener("click", () => {
    const blob = new Blob([store.stringifySnapshot()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `fl2-all-profiles-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url); window.fl2Toast("All local profiles backed up");
  });
  byId("importAll").addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    try { store.importSnapshot(await file.text()); window.fl2Toast("Backup restored"); render(); }
    catch { window.fl2Toast("That is not a valid FL2 backup"); }
    event.target.value = "";
  });
  byId("reportIssue").addEventListener("click", async () => {
    const report = `FL2 data correction\nPage: ${location.href}\nProfile: ${store?.getProfile()?.name || "local"}\nNumber shown:\nNumber seen in game:\nScreenshot/source:\nDate seen: ${new Date().toISOString().slice(0, 10)}`;
    try { await navigator.clipboard.writeText(report); window.fl2Toast("Correction report copied"); }
    catch { window.fl2Toast("Could not access the clipboard"); }
  });
  window.addEventListener("fl2:profilechange", render);
  loadData().then(render).catch(render);
})();

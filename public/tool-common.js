(function initializeToolCommon() {
  "use strict";

  const NAV = [
    ["tools.html", "Command Center"], ["calculator.html", "Merit"], ["research.html", "Research"],
    ["tank.html", "Tank"], ["hq.html", "HQ"], ["heroes.html", "Heroes"],
    ["daily.html", "Today"], ["shops.html", "Shops"], ["index.html", "Guides"],
  ];
  const currentFile = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".tool-nav").forEach((nav) => {
    nav.innerHTML = NAV.map(([href, label]) => `<a href="${href}"${href === currentFile ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  });

  const Profiles = window.FL2ProfileStore;
  const store = Profiles?.createProfileStore();
  window.fl2Profiles = store || null;

  const automaticCacheState = { offlineReady: false, persistentStorage: false };

  function publishAutomaticCacheState() {
    document.documentElement.dataset.offlineReady = String(automaticCacheState.offlineReady);
    document.documentElement.dataset.persistentStorage = String(automaticCacheState.persistentStorage);
    const profileLabel = store ? `${store.getProfile().name} ` : "";
    document.querySelectorAll("#localSaveStatus").forEach((status) => {
      status.textContent = automaticCacheState.offlineReady
        ? `${profileLabel}auto-saved · offline ready`
        : `${profileLabel}auto-saved on this device`;
    });
    window.dispatchEvent(new CustomEvent("fl2:cachestatus", { detail: { ...automaticCacheState } }));
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) return false;
    try {
      if (navigator.storage.persisted && await navigator.storage.persisted()) return true;
      return Boolean(await navigator.storage.persist());
    } catch {
      return false;
    }
  }

  async function enableAutomaticCaching() {
    publishAutomaticCacheState();
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      try {
        const registration = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
        registration.update().catch(() => {});
        await navigator.serviceWorker.ready;
        automaticCacheState.offlineReady = true;
      } catch {
        automaticCacheState.offlineReady = false;
      }
    }
    automaticCacheState.persistentStorage = await requestPersistentStorage();
    publishAutomaticCacheState();
    return { ...automaticCacheState };
  }

  window.fl2CacheReady = enableAutomaticCaching();

  function retryPersistenceAfterInteraction() {
    const retry = async () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      if (automaticCacheState.persistentStorage) return;
      automaticCacheState.persistentStorage = await requestPersistentStorage();
      publishAutomaticCacheState();
    };
    window.addEventListener("pointerdown", retry, { once: true, passive: true });
    window.addEventListener("keydown", retry, { once: true });
  }
  retryPersistenceAfterInteraction();

  function toast(message) {
    let element = document.querySelector(".profile-toast");
    if (!element) {
      element = document.createElement("div");
      element.className = "profile-toast";
      element.setAttribute("role", "status");
      document.body.append(element);
    }
    element.textContent = message;
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { element.hidden = true; }, 2600);
  }
  window.fl2Toast = toast;

  function announceProfileChange() {
    window.dispatchEvent(new CustomEvent("fl2:profilechange", { detail: { profileId: store.getActiveProfileId() } }));
  }

  function renderProfileSwitcher() {
    if (!store) return;
    let wrap = document.querySelector(".profile-switcher");
    if (!wrap) {
      const topbar = document.querySelector(".topbar");
      if (!topbar) return;
      wrap = document.createElement("div");
      wrap.className = "profile-switcher";
      wrap.setAttribute("aria-label", "Local player profile");
      topbar.append(wrap);
    }
    const profiles = store.listProfiles();
    wrap.innerHTML = `
      <label><span>Player profile</span><select aria-label="Active local player profile">${profiles.map((profile) => `<option value="${profile.id}"${profile.isActive ? " selected" : ""}>${profile.name}</option>`).join("")}</select></label>
      <button type="button" data-profile-action="add" aria-label="Add profile" title="Add profile">+</button>
      <button type="button" data-profile-action="rename" aria-label="Rename profile" title="Rename profile">✎</button>
      <button type="button" data-profile-action="delete" aria-label="Delete profile" title="Delete profile">×</button>`;
    wrap.querySelector("select").addEventListener("change", (event) => {
      store.setActiveProfile(event.target.value);
      toast(`Switched to ${store.getProfile().name}`);
      announceProfileChange();
      renderProfileSwitcher();
    });
    wrap.querySelector('[data-profile-action="add"]').addEventListener("click", () => {
      const name = prompt("Name this local player profile:", "New profile");
      if (!name) return;
      const profile = store.createProfile(name);
      toast(`${profile.name} created on this device`);
      announceProfileChange();
      renderProfileSwitcher();
    });
    wrap.querySelector('[data-profile-action="rename"]').addEventListener("click", () => {
      const profile = store.getProfile();
      const name = prompt("Rename this local profile:", profile.name);
      if (!name) return;
      const renamed = store.renameProfile(profile.id, name);
      toast(`Profile renamed to ${renamed.name}`);
      renderProfileSwitcher();
    });
    wrap.querySelector('[data-profile-action="delete"]').addEventListener("click", () => {
      const profile = store.getProfile();
      if (!confirm(`Delete ${profile.name} and its saved progress from this device?`)) return;
      try {
        store.deleteProfile(profile.id);
        toast(`${profile.name} deleted`);
        announceProfileChange();
        renderProfileSwitcher();
      } catch (error) { toast(error.message); }
    });
  }

  renderProfileSwitcher();
  store?.subscribe((event) => {
    if (event.source === "storage") {
      renderProfileSwitcher();
      announceProfileChange();
    }
  });

  const eventName = `page:${currentFile.replace(".html", "") || "home"}`;
  const payload = JSON.stringify({ event: eventName });
  if (navigator.onLine !== false) {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/event", new Blob([payload], { type: "application/json" }));
    else fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }

})();

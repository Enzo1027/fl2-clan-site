(function initializeProgressBackup() {
  "use strict";

  const BACKUP_FORMAT = "fl2-last-z-tools-backup";
  const STORAGE_KEYS = [
    "fl2-merit-calculator-level-aware-v3",
    "fl2-research-planner-v1",
    "fl2-tank-planner-v1",
  ];
  const exportButton = document.querySelector("#exportProgress");
  const importInput = document.querySelector("#importProgress");
  const status = document.querySelector("#localSaveStatus");
  if (!exportButton || !importInput) return;

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function readProgress() {
    const data = {};
    STORAGE_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    });
    return data;
  }

  function downloadBackup() {
    try {
      const payload = {
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: new Date().toISOString(),
        data: readProgress(),
      };
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fl2-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Backup downloaded");
    } catch {
      setStatus("Could not create a backup in this browser");
    }
  }

  async function restoreBackup(file) {
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.format !== BACKUP_FORMAT || !payload.data || typeof payload.data !== "object") {
        throw new Error("Unrecognized backup");
      }
      let restored = 0;
      STORAGE_KEYS.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(payload.data, key)) return;
        const value = payload.data[key];
        if (value === null || value === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        restored += 1;
      });
      if (!restored) throw new Error("No FL2 progress found");
      setStatus("Backup restored — reloading…");
      window.setTimeout(() => window.location.reload(), 450);
    } catch {
      setStatus("That file is not a valid FL2 progress backup");
      importInput.value = "";
    }
  }

  exportButton.addEventListener("click", downloadBackup);
  importInput.addEventListener("change", () => {
    const [file] = importInput.files || [];
    if (file) restoreBackup(file);
  });
})();

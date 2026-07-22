(function dailyEngine(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FL2Daily = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDailyEngine() {
  "use strict";
  const AT_OFFSET_MS = -2 * 60 * 60 * 1000;
  function validDate(value) { const date = value instanceof Date ? new Date(value) : new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
  function apocalypseNow(value = new Date()) { const date = validDate(value); return date ? new Date(date.getTime() + AT_OFFSET_MS) : null; }
  function apocalypseDateKey(value = new Date()) { return apocalypseNow(value)?.toISOString().slice(0, 10) || null; }
  function duelDay(value = new Date()) { const day = apocalypseNow(value)?.getUTCDay(); return day === undefined ? null : day === 0 ? 7 : day; }
  function nextUtcWindow(windows, value = new Date()) {
    const now = validDate(value); if (!now || !Array.isArray(windows) || !windows.length) return null;
    const candidates = windows.map(({ hour, minute = 0 }) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute))).filter((date) => date > now);
    if (candidates.length) return candidates.sort((a, b) => a - b)[0];
    const first = [...windows].sort((a, b) => (a.hour * 60 + (a.minute || 0)) - (b.hour * 60 + (b.minute || 0)))[0];
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, first.hour, first.minute || 0));
  }
  function countdown(targetValue, nowValue = new Date()) {
    const target = validDate(targetValue), now = validDate(nowValue); if (!target || !now) return null;
    const totalSeconds = Math.max(0, Math.floor((target - now) / 1000));
    return { totalSeconds, hours: Math.floor(totalSeconds / 3600), minutes: Math.floor(totalSeconds % 3600 / 60), seconds: totalSeconds % 60 };
  }
  return Object.freeze({ AT_OFFSET_MS, apocalypseNow, apocalypseDateKey, duelDay, nextUtcWindow, countdown });
});

const test = require("node:test");
const assert = require("node:assert/strict");
const Profiles = require("../public/profile-store.js");

const FIXED_NOW = "2026-07-22T20:00:00.000Z";

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type, event) {
      listeners.get(type)?.forEach((listener) => listener(event));
    },
  };
}

function makeStore(options = {}) {
  return Profiles.createProfileStore({
    storage: options.storage || Profiles.createMemoryStorage(),
    eventTarget: options.eventTarget || createEventTarget(),
    now: () => FIXED_NOW,
    generateId: options.generateId || (() => "test-id"),
    autoMigrate: options.autoMigrate,
  });
}

test("starts with local Main, Farm, and Alt profiles and no identity data", () => {
  const store = makeStore({ autoMigrate: false });
  assert.deepEqual(
    store.listProfiles().map(({ id, name, isActive }) => ({ id, name, isActive })),
    [
      { id: "main", name: "Main", isActive: true },
      { id: "farm", name: "Farm", isActive: false },
      { id: "alt", name: "Alt", isActive: false },
    ],
  );
  const document = store.getDocument();
  assert.deepEqual(Object.keys(document).sort(), [
    "activeProfileId", "createdAt", "format", "migrations", "profiles", "revision", "updatedAt", "version",
  ]);
  assert.equal(JSON.stringify(document).includes("email"), false);
  assert.equal(JSON.stringify(document).includes("visitorId"), false);
});

test("creates, activates, renames, and deletes custom profiles safely", () => {
  const store = makeStore({ autoMigrate: false });
  const created = store.createProfile("  Scout   Account  ");
  assert.equal(created.id, "profile-test-id");
  assert.equal(created.name, "Scout Account");
  assert.equal(store.getActiveProfileId(), created.id);

  const renamed = store.renameProfile(created.id, "Farm");
  assert.equal(renamed.name, "Farm (2)");
  store.deleteProfile(created.id);
  assert.equal(store.getActiveProfileId(), "main");
  assert.equal(store.listProfiles().some((profile) => profile.id === created.id), false);
});

test("never allows deletion of the final profile", () => {
  const store = makeStore({ autoMigrate: false });
  store.deleteProfile("farm");
  store.deleteProfile("alt");
  assert.throws(() => store.deleteProfile("main"), /last profile/i);
});

test("isolates feature state by profile and returns defensive copies", () => {
  const store = makeStore({ autoMigrate: false });
  const state = { progress: { weapon: 3 }, goals: ["hero"] };
  store.setFeatureState("research", state, "main");
  state.progress.weapon = 99;
  assert.equal(store.getFeatureState("research", "main").progress.weapon, 3);
  assert.equal(store.getFeatureState("research", "farm"), null);

  const read = store.getFeatureState("research", "main");
  read.progress.weapon = 42;
  assert.equal(store.getFeatureState("research", "main").progress.weapon, 3);
  assert.deepEqual(store.listProfiles()[0].featureNamespaces, ["research"]);
});

test("rejects unsafe namespaces and non-JSON feature state", () => {
  const store = makeStore({ autoMigrate: false });
  const circular = {};
  circular.self = circular;
  assert.throws(() => store.setFeatureState("__proto__", {}), /namespace/i);
  assert.throws(() => store.setFeatureState("research", circular), /circular/i);
  assert.throws(() => store.setFeatureState("research", { value: Infinity }), /finite/i);
});

test("migrates current calculator, research, and tank keys into Main without deleting them", () => {
  const legacy = {
    [Profiles.LEGACY_FEATURE_KEYS.calculator]: JSON.stringify({ hero: "Luna", currentCores: "12" }),
    [Profiles.LEGACY_FEATURE_KEYS.research]: JSON.stringify({ activeTreeId: "field", progress: { field: 2 } }),
    [Profiles.LEGACY_FEATURE_KEYS.tank]: JSON.stringify({ completions: { stage: 4 } }),
  };
  const storage = Profiles.createMemoryStorage(legacy);
  const store = makeStore({ storage });

  assert.equal(store.getFeatureState("calculator", "main").hero, "Luna");
  assert.equal(store.getFeatureState("research", "main").activeTreeId, "field");
  assert.equal(store.getFeatureState("tank", "main").completions.stage, 4);
  Object.entries(legacy).forEach(([key, raw]) => assert.equal(storage.getItem(key), raw));
  assert.deepEqual(store.getDocument().migrations.legacyFeatures, {
    calculator: true,
    research: true,
    tank: true,
  });
});

test("malformed legacy state is skipped while valid features still migrate", () => {
  const storage = Profiles.createMemoryStorage({
    [Profiles.LEGACY_FEATURE_KEYS.calculator]: "not-json",
    [Profiles.LEGACY_FEATURE_KEYS.research]: JSON.stringify({ progress: { a: 1 } }),
  });
  const store = makeStore({ storage });
  assert.equal(store.getFeatureState("calculator", "main"), null);
  assert.deepEqual(store.getFeatureState("research", "main"), { progress: { a: 1 } });
  const result = store.migrateLegacy();
  assert.deepEqual(result.malformed, ["calculator"]);
});

test("completed migration never overwrites newer profile state", () => {
  const storage = Profiles.createMemoryStorage({
    [Profiles.LEGACY_FEATURE_KEYS.tank]: JSON.stringify({ completions: { old: 1 } }),
  });
  const first = makeStore({ storage });
  first.setFeatureState("tank", { completions: { new: 9 } }, "main");
  first.destroy();

  const second = makeStore({ storage });
  assert.deepEqual(second.getFeatureState("tank", "main"), { completions: { new: 9 } });
});

test("auto-migration targets the active profile if Main no longer exists", () => {
  const storage = Profiles.createMemoryStorage();
  const first = makeStore({ storage, autoMigrate: false });
  first.setActiveProfile("farm");
  first.deleteProfile("main");
  first.destroy();
  storage.setItem(Profiles.LEGACY_FEATURE_KEYS.tank, JSON.stringify({ completions: { stage: 2 } }));

  const second = makeStore({ storage });
  assert.deepEqual(second.getFeatureState("tank", "farm"), { completions: { stage: 2 } });
});

test("profile snapshots round-trip through JSON and replace stale local state", () => {
  const source = makeStore({ autoMigrate: false });
  source.setFeatureState("calculator", { hero: "Mira" }, "alt");
  source.setActiveProfile("alt");
  source.createProfile("Scout", { activate: false, features: { tank: { level: 95 } } });
  const backup = source.stringifySnapshot();

  const target = makeStore({ autoMigrate: false, generateId: () => "other" });
  target.setFeatureState("research", { stale: true }, "main");
  const result = target.importSnapshot(backup);
  assert.equal(result.mode, "replace");
  assert.equal(target.getActiveProfileId(), "alt");
  assert.deepEqual(target.getFeatureState("calculator", "alt"), { hero: "Mira" });
  assert.equal(target.getFeatureState("research", "main"), null);
  assert.deepEqual(target.getFeatureState("tank", "profile-test-id"), { level: 95 });
});

test("merge imports add profile features without discarding local-only features", () => {
  const source = makeStore({ autoMigrate: false });
  source.setFeatureState("tank", { level: 145 }, "main");
  const target = makeStore({ autoMigrate: false });
  target.setFeatureState("research", { tree: "field" }, "main");

  target.importSnapshot(source.exportSnapshot(), { mode: "merge" });
  assert.deepEqual(target.getFeatureState("research", "main"), { tree: "field" });
  assert.deepEqual(target.getFeatureState("tank", "main"), { level: 145 });
});

test("imports the existing FL2 progress-backup format into a chosen profile", () => {
  const store = makeStore({ autoMigrate: false });
  const legacyBackup = {
    format: Profiles.LEGACY_BACKUP_FORMAT,
    version: 1,
    data: {
      [Profiles.LEGACY_FEATURE_KEYS.calculator]: { hero: "Sophia" },
      [Profiles.LEGACY_FEATURE_KEYS.tank]: { completions: { level95: 8 } },
    },
  };
  const result = store.importSnapshot(legacyBackup, { profileId: "farm" });
  assert.equal(result.legacy, true);
  assert.deepEqual(result.importedFeatures.sort(), ["calculator", "tank"]);
  assert.equal(store.getFeatureState("calculator", "farm").hero, "Sophia");
  assert.equal(store.getFeatureState("calculator", "main"), null);
});

test("falls back to clean defaults when persisted data is malformed", () => {
  const storage = Profiles.createMemoryStorage({ [Profiles.STORE_KEY]: "{broken" });
  const store = makeStore({ storage, autoMigrate: false });
  assert.equal(store.getActiveProfileId(), "main");
  assert.equal(store.listProfiles().length, 3);
  assert.doesNotThrow(() => JSON.parse(storage.getItem(Profiles.STORE_KEY)));
});

test("rejects malformed import snapshots without changing current state", () => {
  const store = makeStore({ autoMigrate: false });
  store.setFeatureState("tank", { level: 45 });
  const before = store.getDocument();
  assert.throws(() => store.importSnapshot("not-json"), /valid JSON/i);
  assert.throws(() => store.importSnapshot({ format: Profiles.BACKUP_FORMAT, data: { profiles: [] } }), /malformed/i);
  assert.deepEqual(store.getDocument(), before);
});

test("storage events update other tabs and malformed events preserve current state", () => {
  const storage = Profiles.createMemoryStorage();
  const eventTarget = createEventTarget();
  const store = makeStore({ storage, eventTarget, autoMigrate: false });
  const events = [];
  store.subscribe((event) => events.push(event));

  const externalDocument = store.getDocument();
  externalDocument.activeProfileId = "farm";
  externalDocument.revision += 1;
  eventTarget.dispatch("storage", {
    key: Profiles.STORE_KEY,
    storageArea: storage,
    newValue: JSON.stringify(externalDocument),
  });
  assert.equal(store.getActiveProfileId(), "farm");
  assert.equal(events.at(-1).type, "external-change");
  assert.equal(events.at(-1).source, "storage");

  eventTarget.dispatch("storage", { key: Profiles.STORE_KEY, storageArea: storage, newValue: "bad-json" });
  assert.equal(store.getActiveProfileId(), "farm");
  assert.equal(events.at(-1).type, "storage-error");
  assert.equal(events.at(-1).persisted, false);
});

test("continues in memory and reports persistence failure when storage is unavailable", () => {
  const unavailable = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  const store = makeStore({ storage: unavailable, autoMigrate: false });
  const events = [];
  store.subscribe((event) => events.push(event));
  assert.deepEqual(store.setFeatureState("tank", { level: 50 }), { level: 50 });
  assert.equal(events.at(-1).type, "feature-state-changed");
  assert.equal(events.at(-1).persisted, false);
});

test("unsubscribe and destroy detach notification hooks", () => {
  const storage = Profiles.createMemoryStorage();
  const eventTarget = createEventTarget();
  const store = makeStore({ storage, eventTarget, autoMigrate: false });
  let calls = 0;
  const unsubscribe = store.subscribe(() => { calls += 1; });
  store.setActiveProfile("farm");
  unsubscribe();
  store.setActiveProfile("alt");
  assert.equal(calls, 1);
  store.destroy();
  assert.throws(() => store.createProfile("After destroy"), /destroyed/i);
});

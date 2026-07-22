(function profileStoreModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FL2ProfileStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProfileStoreModule() {
  "use strict";

  const STORE_KEY = "fl2-local-profiles-v1";
  const STORE_FORMAT = "fl2-local-profiles";
  const BACKUP_FORMAT = "fl2-local-profiles-backup";
  const LEGACY_BACKUP_FORMAT = "fl2-last-z-tools-backup";
  const STORE_VERSION = 1;
  const MAX_NAME_LENGTH = 40;
  const MAX_PROFILES = 50;
  const MAX_JSON_DEPTH = 50;
  const DEFAULT_PROFILES = Object.freeze([
    Object.freeze({ id: "main", name: "Main" }),
    Object.freeze({ id: "farm", name: "Farm" }),
    Object.freeze({ id: "alt", name: "Alt" }),
  ]);
  const LEGACY_FEATURE_KEYS = Object.freeze({
    calculator: "fl2-merit-calculator-level-aware-v3",
    research: "fl2-research-planner-v1",
    tank: "fl2-tank-planner-v1",
  });
  const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const PROFILE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const NAMESPACE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function sanitizeJson(value, strict = true, depth = 0, ancestors = new Set()) {
    if (depth > MAX_JSON_DEPTH) {
      if (strict) throw new TypeError("Profile state is nested too deeply");
      return undefined;
    }
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (Number.isFinite(value)) return value;
      if (strict) throw new TypeError("Profile state must contain finite numbers");
      return null;
    }
    if (typeof value !== "object") {
      if (strict) throw new TypeError("Profile state must be JSON-compatible");
      return undefined;
    }
    if (ancestors.has(value)) {
      if (strict) throw new TypeError("Profile state cannot contain circular references");
      return undefined;
    }

    ancestors.add(value);
    let result;
    if (Array.isArray(value)) {
      result = value.map((item) => {
        const clean = sanitizeJson(item, strict, depth + 1, ancestors);
        return clean === undefined ? null : clean;
      });
    } else {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        ancestors.delete(value);
        if (strict) throw new TypeError("Profile state must use plain objects");
        return undefined;
      }
      result = {};
      Object.entries(value).forEach(([key, item]) => {
        if (FORBIDDEN_KEYS.has(key)) return;
        const clean = sanitizeJson(item, strict, depth + 1, ancestors);
        if (clean !== undefined) result[key] = clean;
      });
    }
    ancestors.delete(value);
    return result;
  }

  function cloneJson(value) {
    return sanitizeJson(value, true);
  }

  function cleanName(value, fallback = "Profile") {
    const name = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
    return name || fallback;
  }

  function validIso(value, fallback) {
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
    return new Date(value).toISOString();
  }

  function createDefaultDocument(timestamp) {
    return {
      format: STORE_FORMAT,
      version: STORE_VERSION,
      revision: 0,
      activeProfileId: "main",
      createdAt: timestamp,
      updatedAt: timestamp,
      profiles: DEFAULT_PROFILES.map(({ id, name }) => ({
        id,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
        features: {},
      })),
      migrations: { legacyFeatures: {} },
    };
  }

  function sanitizeFeatures(value) {
    const features = {};
    if (!isRecord(value)) return features;
    Object.entries(value).forEach(([namespace, state]) => {
      if (!NAMESPACE_PATTERN.test(namespace) || FORBIDDEN_KEYS.has(namespace)) return;
      const clean = sanitizeJson(state, false);
      if (clean !== undefined) features[namespace] = clean;
    });
    return features;
  }

  function normalizeDocument(value, timestamp) {
    if (!isRecord(value) || value.format !== STORE_FORMAT || Number(value.version) !== STORE_VERSION) return null;
    const rawProfiles = Array.isArray(value.profiles)
      ? value.profiles
      : isRecord(value.profiles) ? Object.values(value.profiles) : [];
    const profiles = [];
    const usedIds = new Set();

    rawProfiles.slice(0, MAX_PROFILES).forEach((candidate, index) => {
      if (!isRecord(candidate)) return;
      const id = String(candidate.id || "").toLowerCase();
      if (!PROFILE_ID_PATTERN.test(id) || usedIds.has(id) || FORBIDDEN_KEYS.has(id)) return;
      usedIds.add(id);
      const createdAt = validIso(candidate.createdAt, timestamp);
      profiles.push({
        id,
        name: cleanName(candidate.name, `Profile ${index + 1}`),
        createdAt,
        updatedAt: validIso(candidate.updatedAt, createdAt),
        features: sanitizeFeatures(candidate.features),
      });
    });
    if (!profiles.length) return null;

    const activeProfileId = profiles.some((profile) => profile.id === value.activeProfileId)
      ? value.activeProfileId
      : profiles[0].id;
    const legacyFeatures = {};
    const rawLegacy = value.migrations?.legacyFeatures;
    if (isRecord(rawLegacy)) {
      Object.keys(LEGACY_FEATURE_KEYS).forEach((namespace) => {
        if (rawLegacy[namespace] === true) legacyFeatures[namespace] = true;
      });
    }

    return {
      format: STORE_FORMAT,
      version: STORE_VERSION,
      revision: Number.isInteger(value.revision) && value.revision >= 0 ? value.revision : 0,
      activeProfileId,
      createdAt: validIso(value.createdAt, timestamp),
      updatedAt: validIso(value.updatedAt, timestamp),
      profiles,
      migrations: { legacyFeatures },
    };
  }

  function createMemoryStorage(initial = {}) {
    const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
    return {
      get length() { return values.size; },
      key(index) { return Array.from(values.keys())[index] ?? null; },
      getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
      setItem(key, value) { values.set(String(key), String(value)); },
      removeItem(key) { values.delete(String(key)); },
      clear() { values.clear(); },
    };
  }

  function createProfileStore(options = {}) {
    const storage = options.storage || (typeof localStorage !== "undefined" ? localStorage : createMemoryStorage());
    const eventTarget = options.eventTarget || (typeof window !== "undefined" ? window : null);
    const storageKey = options.storageKey || STORE_KEY;
    const listeners = new Set();
    let destroyed = false;

    function nowIso() {
      const supplied = typeof options.now === "function" ? options.now() : new Date();
      const date = supplied instanceof Date ? supplied : new Date(supplied);
      return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    function safeGet(key) {
      try { return storage.getItem(key); } catch { return null; }
    }

    function safeSet(key, value) {
      try {
        storage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }

    function safeRemove(key) {
      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }

    function readStoredDocument() {
      const raw = safeGet(storageKey);
      if (!raw) return null;
      try { return normalizeDocument(JSON.parse(raw), nowIso()); } catch { return null; }
    }

    let documentState = readStoredDocument() || createDefaultDocument(nowIso());

    function snapshotDocument() {
      return cloneJson(documentState);
    }

    function notify(type, detail = {}, source = "local", persisted = true) {
      const event = Object.freeze({ type, source, persisted, ...detail, document: snapshotDocument() });
      listeners.forEach((listener) => {
        try { listener(event); } catch { /* One listener must not break the store. */ }
      });
    }

    function persist() {
      return safeSet(storageKey, JSON.stringify(documentState));
    }

    function commit(type, detail, mutate) {
      if (destroyed) throw new Error("Profile store has been destroyed");
      const next = snapshotDocument();
      const result = mutate(next);
      next.revision = documentState.revision + 1;
      next.updatedAt = nowIso();
      documentState = next;
      const persisted = persist();
      notify(type, detail, "local", persisted);
      return { result, persisted };
    }

    function requireProfile(documentValue, profileId) {
      const id = profileId || documentValue.activeProfileId;
      const profile = documentValue.profiles.find((item) => item.id === id);
      if (!profile) throw new RangeError(`Unknown profile: ${id}`);
      return profile;
    }

    function uniqueName(documentValue, requested, excludeId) {
      const base = cleanName(requested, `Profile ${documentValue.profiles.length + 1}`);
      const names = new Set(documentValue.profiles
        .filter((profile) => profile.id !== excludeId)
        .map((profile) => profile.name.toLocaleLowerCase()));
      if (!names.has(base.toLocaleLowerCase())) return base;
      let suffix = 2;
      let suffixLabel = ` (${suffix})`;
      let candidate = `${base.slice(0, MAX_NAME_LENGTH - suffixLabel.length)}${suffixLabel}`;
      while (names.has(candidate.toLocaleLowerCase())) {
        suffix += 1;
        suffixLabel = ` (${suffix})`;
        candidate = `${base.slice(0, MAX_NAME_LENGTH - suffixLabel.length)}${suffixLabel}`;
      }
      return candidate;
    }

    function nextProfileId(documentValue) {
      const used = new Set(documentValue.profiles.map((profile) => profile.id));
      const requested = typeof options.generateId === "function"
        ? String(options.generateId())
        : (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`);
      const cleanBase = requested.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "custom";
      let id = `profile-${cleanBase}`;
      let suffix = 2;
      while (used.has(id)) {
        id = `profile-${cleanBase.slice(0, 55)}-${suffix}`;
        suffix += 1;
      }
      return id;
    }

    function listProfiles() {
      return documentState.profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        isActive: profile.id === documentState.activeProfileId,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        featureNamespaces: Object.keys(profile.features).sort(),
      }));
    }

    function getProfile(profileId) {
      return cloneJson(requireProfile(documentState, profileId));
    }

    function getActiveProfileId() {
      return documentState.activeProfileId;
    }

    function setActiveProfile(profileId) {
      requireProfile(documentState, profileId);
      if (profileId === documentState.activeProfileId) return getProfile(profileId);
      commit("active-profile-changed", { profileId }, (next) => { next.activeProfileId = profileId; });
      return getProfile(profileId);
    }

    function createProfile(name, createOptions = {}) {
      if (documentState.profiles.length >= MAX_PROFILES) throw new RangeError(`A maximum of ${MAX_PROFILES} profiles is supported`);
      const id = nextProfileId(documentState);
      const timestamp = nowIso();
      const activate = createOptions.activate !== false;
      const features = createOptions.features === undefined ? {} : sanitizeFeatures(createOptions.features);
      let created;
      commit("profile-created", { profileId: id }, (next) => {
        created = {
          id,
          name: uniqueName(next, name),
          createdAt: timestamp,
          updatedAt: timestamp,
          features,
        };
        next.profiles.push(created);
        if (activate) next.activeProfileId = id;
      });
      return cloneJson(created);
    }

    function renameProfile(profileId, name) {
      let renamed;
      commit("profile-renamed", { profileId }, (next) => {
        const profile = requireProfile(next, profileId);
        profile.name = uniqueName(next, name, profileId);
        profile.updatedAt = nowIso();
        renamed = profile;
      });
      return cloneJson(renamed);
    }

    function deleteProfile(profileId) {
      if (documentState.profiles.length === 1) throw new Error("The last profile cannot be deleted");
      requireProfile(documentState, profileId);
      commit("profile-deleted", { profileId }, (next) => {
        next.profiles = next.profiles.filter((profile) => profile.id !== profileId);
        if (next.activeProfileId === profileId) {
          next.activeProfileId = next.profiles.find((profile) => profile.id === "main")?.id || next.profiles[0].id;
        }
      });
      return listProfiles();
    }

    function validateNamespace(namespace) {
      const value = String(namespace || "").toLowerCase();
      if (!NAMESPACE_PATTERN.test(value) || FORBIDDEN_KEYS.has(value)) throw new TypeError("Invalid feature namespace");
      return value;
    }

    function getFeatureState(namespace, profileId) {
      const key = validateNamespace(namespace);
      const profile = requireProfile(documentState, profileId);
      return own(profile.features, key) ? cloneJson(profile.features[key]) : null;
    }

    function hasFeatureState(namespace, profileId) {
      const key = validateNamespace(namespace);
      return own(requireProfile(documentState, profileId).features, key);
    }

    function setFeatureState(namespace, state, profileId) {
      const key = validateNamespace(namespace);
      const clean = cloneJson(state);
      const id = profileId || documentState.activeProfileId;
      commit("feature-state-changed", { profileId: id, namespace: key }, (next) => {
        const profile = requireProfile(next, id);
        profile.features[key] = clean;
        profile.updatedAt = nowIso();
      });
      return getFeatureState(key, id);
    }

    function removeFeatureState(namespace, profileId) {
      const key = validateNamespace(namespace);
      const id = profileId || documentState.activeProfileId;
      if (!hasFeatureState(key, id)) return false;
      commit("feature-state-removed", { profileId: id, namespace: key }, (next) => {
        const profile = requireProfile(next, id);
        delete profile.features[key];
        profile.updatedAt = nowIso();
      });
      return true;
    }

    function migrateLegacy(migrationOptions = {}) {
      const targetProfileId = migrationOptions.profileId
        || (documentState.profiles.some((profile) => profile.id === "main") ? "main" : documentState.activeProfileId);
      const overwrite = migrationOptions.overwrite === true;
      const force = migrationOptions.force === true;
      const removeLegacy = migrationOptions.removeLegacy === true;
      requireProfile(documentState, targetProfileId);
      const found = [];
      const malformed = [];
      const skipped = [];

      Object.entries(LEGACY_FEATURE_KEYS).forEach(([namespace, key]) => {
        if (!force && documentState.migrations.legacyFeatures[namespace]) {
          skipped.push(namespace);
          return;
        }
        const raw = safeGet(key);
        if (raw === null) return;
        try {
          const parsed = JSON.parse(raw);
          found.push({ namespace, key, state: cloneJson(parsed) });
        } catch {
          malformed.push(namespace);
        }
      });

      if (!found.length) return { migrated: [], skipped, malformed, persisted: true };
      const migrated = [];
      const { persisted } = commit("legacy-state-migrated", { profileId: targetProfileId }, (next) => {
        const profile = requireProfile(next, targetProfileId);
        found.forEach(({ namespace, state }) => {
          if (overwrite || !own(profile.features, namespace)) {
            profile.features[namespace] = state;
            migrated.push(namespace);
          } else {
            skipped.push(namespace);
          }
          next.migrations.legacyFeatures[namespace] = true;
        });
        if (migrated.length) profile.updatedAt = nowIso();
      });
      if (removeLegacy) found.forEach(({ key }) => safeRemove(key));
      return { migrated, skipped: Array.from(new Set(skipped)), malformed, persisted };
    }

    function exportSnapshot() {
      return {
        format: BACKUP_FORMAT,
        version: STORE_VERSION,
        exportedAt: nowIso(),
        data: snapshotDocument(),
      };
    }

    function stringifySnapshot(space = 2) {
      return `${JSON.stringify(exportSnapshot(), null, space)}\n`;
    }

    function parseSnapshot(payload) {
      if (typeof payload === "string") {
        try { return JSON.parse(payload); } catch { throw new TypeError("Snapshot is not valid JSON"); }
      }
      if (!isRecord(payload)) throw new TypeError("Snapshot must be an object or JSON string");
      return payload;
    }

    function importLegacyBackup(payload, importOptions) {
      if (!isRecord(payload.data)) throw new TypeError("Legacy backup has no progress data");
      const profileId = importOptions.profileId || documentState.activeProfileId;
      requireProfile(documentState, profileId);
      const states = [];
      Object.entries(LEGACY_FEATURE_KEYS).forEach(([namespace, key]) => {
        if (!own(payload.data, key)) return;
        let value = payload.data[key];
        if (typeof value === "string") {
          try { value = JSON.parse(value); } catch { return; }
        }
        try { states.push([namespace, cloneJson(value)]); } catch { /* Ignore only the malformed feature. */ }
      });
      if (!states.length) throw new TypeError("Legacy backup contains no valid FL2 progress");
      const { persisted } = commit("snapshot-imported", { profileId, legacy: true }, (next) => {
        const profile = requireProfile(next, profileId);
        states.forEach(([namespace, state]) => {
          profile.features[namespace] = state;
          next.migrations.legacyFeatures[namespace] = true;
        });
        profile.updatedAt = nowIso();
      });
      return { importedProfiles: [profileId], importedFeatures: states.map(([namespace]) => namespace), legacy: true, persisted };
    }

    function importSnapshot(input, importOptions = {}) {
      const payload = parseSnapshot(input);
      if (payload.format === LEGACY_BACKUP_FORMAT) return importLegacyBackup(payload, importOptions);
      const rawDocument = payload.format === BACKUP_FORMAT ? payload.data : payload;
      const imported = normalizeDocument(rawDocument, nowIso());
      if (!imported) throw new TypeError("Unrecognized or malformed profile snapshot");
      const mode = importOptions.mode || "replace";
      if (mode !== "replace" && mode !== "merge") throw new TypeError("Import mode must be replace or merge");

      const importedIds = imported.profiles.map((profile) => profile.id);
      if (mode === "replace") {
        imported.revision = documentState.revision + 1;
        imported.updatedAt = nowIso();
        documentState = imported;
      } else {
        const next = snapshotDocument();
        imported.profiles.forEach((profile) => {
          const existing = next.profiles.find((candidate) => candidate.id === profile.id);
          if (existing) {
            existing.name = profile.name;
            existing.updatedAt = profile.updatedAt;
            existing.features = { ...existing.features, ...cloneJson(profile.features) };
          } else if (next.profiles.length < MAX_PROFILES) {
            next.profiles.push(cloneJson(profile));
          }
        });
        next.migrations.legacyFeatures = {
          ...next.migrations.legacyFeatures,
          ...imported.migrations.legacyFeatures,
        };
        if (next.profiles.some((profile) => profile.id === imported.activeProfileId)) next.activeProfileId = imported.activeProfileId;
        next.revision = documentState.revision + 1;
        next.updatedAt = nowIso();
        documentState = next;
      }
      const persisted = persist();
      notify("snapshot-imported", { profileIds: importedIds, legacy: false, mode }, "local", persisted);
      return { importedProfiles: importedIds, importedFeatures: [], legacy: false, mode, persisted };
    }

    function subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Subscriber must be a function");
      if (destroyed) throw new Error("Profile store has been destroyed");
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    function handleStorageEvent(event) {
      if (destroyed || event?.key !== storageKey) return;
      if (event.storageArea && event.storageArea !== storage) return;
      if (event.newValue === null) {
        documentState = createDefaultDocument(nowIso());
        notify("external-change", { reset: true }, "storage", true);
        return;
      }
      try {
        const incoming = normalizeDocument(JSON.parse(event.newValue), nowIso());
        if (!incoming) throw new TypeError("Malformed stored profile data");
        documentState = incoming;
        notify("external-change", { reset: false }, "storage", true);
      } catch (error) {
        notify("storage-error", { message: error.message }, "storage", false);
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.clear();
      eventTarget?.removeEventListener?.("storage", handleStorageEvent);
    }

    eventTarget?.addEventListener?.("storage", handleStorageEvent);
    if (!readStoredDocument()) persist();
    if (options.autoMigrate !== false) migrateLegacy();

    return Object.freeze({
      listProfiles,
      getProfile,
      getActiveProfileId,
      setActiveProfile,
      createProfile,
      renameProfile,
      deleteProfile,
      getFeatureState,
      hasFeatureState,
      setFeatureState,
      removeFeatureState,
      migrateLegacy,
      exportSnapshot,
      stringifySnapshot,
      importSnapshot,
      subscribe,
      destroy,
      getDocument: snapshotDocument,
    });
  }

  return Object.freeze({
    STORE_KEY,
    STORE_FORMAT,
    BACKUP_FORMAT,
    LEGACY_BACKUP_FORMAT,
    STORE_VERSION,
    DEFAULT_PROFILES,
    LEGACY_FEATURE_KEYS,
    createMemoryStorage,
    createProfileStore,
  });
});

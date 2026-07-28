const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SESSION_COOKIE = "fl2_mass_comms";
const SESSION_TTL_MS = 400 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;
const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SYSTEM_LABELS = new Set(["System", "Sistem", "Sistema", "Système", "Systeem", "النظام"]);

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, pair) => {
    const separator = pair.indexOf("=");
    if (separator === -1) return cookies;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function safeEqual(left, right) {
  const leftDigest = crypto.createHash("sha256").update(String(left)).digest();
  const rightDigest = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function createAuthStore(options = {}) {
  const sessionTtlMs = options.sessionTtlMs || SESSION_TTL_MS;
  const loginWindowMs = options.loginWindowMs || LOGIN_WINDOW_MS;
  const loginAttemptLimit = options.loginAttemptLimit || LOGIN_ATTEMPT_LIMIT;
  const loginAttempts = new Map();

  function prune(now = Date.now()) {
    for (const [ip, record] of loginAttempts) {
      if (record.resetAt <= now) loginAttempts.delete(ip);
    }
  }

  function sessionSecret() {
    const value = String(options.sessionSecret || process.env.MASS_COMMS_SESSION_SECRET || "");
    return value.length >= 32 ? value : "";
  }

  function signSession(payload) {
    return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  }

  function isAuthenticated(req, now = Date.now()) {
    prune(now);
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (!token || !sessionSecret()) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = `${parts[0]}.${parts[1]}`;
    if (!safeEqual(parts[2], signSession(payload))) return false;
    const issuedAt = Number(parts[0]);
    return Number.isFinite(issuedAt) && issuedAt <= now && now - issuedAt < sessionTtlMs;
  }

  function consumeLoginAttempt(ip, now = Date.now()) {
    prune(now);
    const record = loginAttempts.get(ip);
    if (!record || record.resetAt <= now) {
      loginAttempts.set(ip, { count: 1, resetAt: now + loginWindowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (record.count >= loginAttemptLimit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
      };
    }
    record.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  function clearLoginAttempts(ip) {
    loginAttempts.delete(ip);
  }

  function createSession(now = Date.now()) {
    if (!sessionSecret()) throw new Error("Mass communications session secret is not configured");
    const payload = `${now}.${crypto.randomBytes(18).toString("base64url")}`;
    const token = `${payload}.${signSession(payload)}`;
    return { token, maxAgeSeconds: Math.floor(sessionTtlMs / 1000) };
  }

  function destroySession() {}

  return {
    clearLoginAttempts,
    consumeLoginAttempt,
    createSession,
    destroySession,
    isAuthenticated,
  };
}

function sessionCookie(token, maxAgeSeconds, secure) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie(secure) {
  return sessionCookie("", 0, secure);
}

function requestIsSecure(req) {
  return req.socket?.encrypted || String(req.headers["x-forwarded-proto"] || "").toLowerCase() === "https";
}

function parseReplyAnnotation(raw = "") {
  return raw
    .replace(/^(replying to|yanıt(?:lıyor)?|en respuesta a|en réponse à|in antwoord op|membalas|antwort(?:et)? auf|رد(?:ًا|ا) على)\s*/iu, "")
    .trim();
}

function parseTranscript(raw, language) {
  const lines = String(raw).replace(/\r\n/g, "\n").split("\n");
  const sourceTitle = (lines.shift() || "").trim();
  const entries = [];
  let timestamp = "";
  let currentEntry = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const timestampMatch = line.match(/^\[([^\]]+)\]$/u);
    if (timestampMatch) {
      timestamp = timestampMatch[1].trim();
      currentEntry = null;
      continue;
    }

    const allianceMatch = line.match(/^\[([A-Z0-9]+)\]\s*([^:]+?)\s*:\s*(.*)$/u);
    if (allianceMatch) {
      const namePart = allianceMatch[2].trim();
      const replyMatch = namePart.match(/^(.*?)\s*\[([^\]]+)\]$/u);
      currentEntry = {
        timestamp,
        type: "message",
        alliance: allianceMatch[1],
        speaker: (replyMatch?.[1] || namePart).trim(),
        replyTo: replyMatch ? parseReplyAnnotation(replyMatch[2]) : "",
        message: allianceMatch[3].trim(),
      };
      entries.push(currentEntry);
      continue;
    }

    const systemMatch = line.match(/^([^:]+?)\s*:\s*(.*)$/u);
    if (systemMatch && SYSTEM_LABELS.has(systemMatch[1].trim())) {
      currentEntry = {
        timestamp,
        type: "system",
        alliance: "",
        speaker: systemMatch[1].trim(),
        replyTo: "",
        message: systemMatch[2].trim(),
      };
      entries.push(currentEntry);
      continue;
    }

    if (currentEntry) {
      currentEntry.message += `\n\n${line}`;
    }
  }

  return {
    sourceTitle,
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    entries,
    timestampCount: new Set(entries.map((entry) => entry.timestamp)).size,
  };
}

function contentKeyFromEnvironment() {
  const encoded = String(process.env.MASS_COMMS_CONTENT_KEY || "").trim();
  if (!encoded) throw new Error("Mass communications content key is not configured");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("Mass communications content key must be 32 bytes");
  return key;
}

function decryptTranscript(raw) {
  const envelope = JSON.parse(raw);
  if (
    envelope.version !== 1
    || typeof envelope.iv !== "string"
    || typeof envelope.tag !== "string"
    || typeof envelope.data !== "string"
  ) {
    throw new Error("Invalid encrypted transcript");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    contentKeyFromEnvironment(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function loadCatalog(contentDir) {
  const filePath = path.join(contentDir, "catalog.json");
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed.conversations)) throw new Error("Invalid mass communications catalog");
  return parsed;
}

function listConversations(contentDir, language) {
  const catalog = loadCatalog(contentDir);
  return {
    conversations: catalog.conversations.map((conversation) => {
      const selectedLanguage = conversation.languages[language] ? language : conversation.fallbackLanguage;
      return {
        slug: conversation.slug,
        title: conversation.title,
        description: conversation.description?.[language] || conversation.description?.en || "",
        selectedLanguage,
        requestedLanguage: language,
        isFallback: selectedLanguage !== language,
        availableLanguages: Object.keys(conversation.languages),
      };
    }),
  };
}

function loadConversation(contentDir, slug, language) {
  if (!SLUG_PATTERN.test(slug)) return null;
  const catalog = loadCatalog(contentDir);
  const conversation = catalog.conversations.find((item) => item.slug === slug);
  if (!conversation) return null;

  const selectedLanguage = conversation.languages[language] ? language : conversation.fallbackLanguage;
  const filename = conversation.languages[selectedLanguage];
  if (!filename || path.basename(filename) !== filename) return null;
  const transcriptPath = path.join(contentDir, conversation.slug, filename);
  const decrypted = decryptTranscript(fs.readFileSync(transcriptPath, "utf8"));
  const parsed = parseTranscript(decrypted, selectedLanguage);

  return {
    slug: conversation.slug,
    title: conversation.title,
    description: conversation.description?.[language] || conversation.description?.en || "",
    requestedLanguage: language,
    selectedLanguage,
    isFallback: selectedLanguage !== language,
    ...parsed,
  };
}

function normalizeLanguage(value, supportedLanguages) {
  const language = String(value || "en").toLowerCase();
  return LANGUAGE_CODE_PATTERN.test(language) && supportedLanguages.has(language) ? language : "en";
}

module.exports = {
  SESSION_COOKIE,
  clearSessionCookie,
  decryptTranscript,
  createAuthStore,
  getClientIp,
  listConversations,
  loadCatalog,
  loadConversation,
  normalizeLanguage,
  parseTranscript,
  requestIsSecure,
  safeEqual,
  sessionCookie,
};

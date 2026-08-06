const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SESSION_COOKIE = "fl2_mass_comms";
const SVS_STRATEGY_SESSION_COOKIE = "fl2_svs_strategy";
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
  const cookieName = options.cookieName || SESSION_COOKIE;
  const sessionNamespace = String(options.sessionNamespace || "");
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
    const scopedPayload = sessionNamespace ? `${sessionNamespace}:${payload}` : payload;
    return crypto.createHmac("sha256", sessionSecret()).update(scopedPayload).digest("base64url");
  }

  function isAuthenticated(req, now = Date.now()) {
    prune(now);
    const token = parseCookies(req.headers.cookie)[cookieName];
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
    cookieName,
    consumeLoginAttempt,
    createSession,
    destroySession,
    isAuthenticated,
  };
}

function sessionCookie(token, maxAgeSeconds, secure, cookieName = SESSION_COOKIE) {
  const parts = [
    `${cookieName}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie(secure, cookieName = SESSION_COOKIE) {
  return sessionCookie("", 0, secure, cookieName);
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

    const allianceMatch = line.match(/^\[([A-Za-z0-9]+)\]\s*([^:]+?)\s*:\s*(.*)$/u);
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

function contentKeyFromValue(value = process.env.MASS_COMMS_CONTENT_KEY) {
  const encoded = String(value || "").trim();
  if (!encoded) throw new Error("Mass communications content key is not configured");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("Mass communications content key must be 32 bytes");
  return key;
}

function decryptTranscript(raw, contentKey) {
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
    contentKeyFromValue(contentKey),
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

function localizedValue(value, language) {
  if (typeof value === "string") return value;
  return value?.[language] || value?.en || "";
}

function parseDocument(raw, language) {
  const normalized = String(raw).replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n\s*\n/u).map((block) => block.trim()).filter(Boolean);
  const sourceTitle = blocks.shift() || "";

  return {
    sourceTitle,
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    blocks: blocks.map((block) => {
      const numbered = block.match(/^(\d+)\.\s+([\s\S]*)$/u);
      if (numbered) {
        return { type: "numbered", number: Number(numbered[1]), text: numbered[2].replace(/\n+/g, " ") };
      }
      const compact = block.replace(/\n+/g, " ");
      const letters = compact.replace(/[^\p{L}]/gu, "");
      const isHeading = letters.length >= 3 && letters === letters.toLocaleUpperCase(language);
      return { type: isHeading ? "heading" : "paragraph", text: compact };
    }),
  };
}

function conversationAccessGroup(conversation) {
  return conversation.accessGroup || "alliance-archive";
}

function findConversation(contentDir, slug) {
  if (!SLUG_PATTERN.test(slug)) return null;
  return loadCatalog(contentDir).conversations.find((item) => item.slug === slug) || null;
}

function listConversations(contentDir, language, options = {}) {
  const catalog = loadCatalog(contentDir);
  const accessGroups = options.accessGroups ? new Set(options.accessGroups) : null;
  return {
    conversations: catalog.conversations
      .filter((conversation) => !accessGroups || accessGroups.has(conversationAccessGroup(conversation)))
      .map((conversation) => {
      const selectedLanguage = conversation.languages[language] ? language : conversation.fallbackLanguage;
      return {
        slug: conversation.slug,
        title: localizedValue(conversation.title, language),
        description: localizedValue(conversation.description, language),
        collection: localizedValue(conversation.collection, language),
        contentType: conversation.contentType || "transcript",
        selectedLanguage,
        requestedLanguage: language,
        isFallback: selectedLanguage !== language,
        availableLanguages: Object.keys(conversation.languages),
      };
      }),
  };
}

function loadConversation(contentDir, slug, language, options = {}) {
  const conversation = findConversation(contentDir, slug);
  if (!conversation) return null;

  const selectedLanguage = conversation.languages[language] ? language : conversation.fallbackLanguage;
  const filename = conversation.languages[selectedLanguage];
  if (!filename || path.basename(filename) !== filename) return null;
  const transcriptPath = path.join(contentDir, conversation.slug, filename);
  const decrypted = decryptTranscript(fs.readFileSync(transcriptPath, "utf8"), options.contentKey);
  const contentType = conversation.contentType || "transcript";
  const parsed = contentType === "document"
    ? parseDocument(decrypted, selectedLanguage)
    : parseTranscript(decrypted, selectedLanguage);

  return {
    slug: conversation.slug,
    title: localizedValue(conversation.title, language),
    description: localizedValue(conversation.description, language),
    collection: localizedValue(conversation.collection, language),
    contentType,
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
  SVS_STRATEGY_SESSION_COOKIE,
  clearSessionCookie,
  decryptTranscript,
  createAuthStore,
  getClientIp,
  findConversation,
  listConversations,
  loadCatalog,
  loadConversation,
  normalizeLanguage,
  parseDocument,
  parseTranscript,
  requestIsSecure,
  safeEqual,
  sessionCookie,
};

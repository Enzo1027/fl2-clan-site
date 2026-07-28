const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  clearSessionCookie,
  createAuthStore,
  getClientIp,
  listConversations,
  loadCatalog,
  loadConversation,
  normalizeLanguage,
  requestIsSecure,
  safeEqual,
  sessionCookie,
} = require("./mass-communications");

const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = process.env.DATA_DIR || path.join(root, ".data");
const counterFile = path.join(dataDir, "visits.json");
const analyticsFile = path.join(dataDir, "analytics.json");
const massCommunicationsDir = path.join(root, "content", "mass-communications");
const port = Number(process.env.PORT || 4173);
const massCommunicationsAuth = createAuthStore();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
};

function readCounter() {
  try {
    const raw = fs.readFileSync(counterFile, "utf8");
    const parsed = JSON.parse(raw);
    return {
      visits: Number(parsed.visits || 0),
      visitors: Array.isArray(parsed.visitors) ? parsed.visitors : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { visits: 0, visitors: [], updatedAt: null };
  }
}

function writeCounter(counter) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(counterFile, JSON.stringify(counter, null, 2) + "\n");
}

function hashVisitor(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    Vary: "Cookie",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) {
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", () => resolve(""));
  });
}

async function handleVisit(req, res) {
  if (req.method === "GET") {
    const counter = readCounter();
    sendJson(res, 200, {
      visits: counter.visits,
      uniqueVisitors: counter.visitors.length,
      updatedAt: counter.updatedAt,
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let visitorId = "";
  try {
    visitorId = JSON.parse(await readBody(req)).visitorId || "";
  } catch {
    visitorId = "";
  }

  const counter = readCounter();
  const visitorHash = visitorId ? hashVisitor(visitorId) : "";
  const visitors = new Set(counter.visitors);
  if (visitorHash) {
    visitors.add(visitorHash);
  }

  const next = {
    visits: counter.visits + 1,
    visitors: [...visitors],
    updatedAt: new Date().toISOString(),
  };
  writeCounter(next);

  sendJson(res, 200, {
    visits: next.visits,
    uniqueVisitors: next.visitors.length,
    updatedAt: next.updatedAt,
  });
}

function readAnalytics() {
  try {
    const parsed = JSON.parse(fs.readFileSync(analyticsFile, "utf8"));
    return { events: parsed.events && typeof parsed.events === "object" ? parsed.events : {}, updatedAt: parsed.updatedAt || null };
  } catch {
    return { events: {}, updatedAt: null };
  }
}

async function handleEvent(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, readAnalytics());
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  let eventName = "";
  try { eventName = String(JSON.parse(await readBody(req)).event || "").toLowerCase(); } catch { eventName = ""; }
  if (!/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(eventName)) {
    sendJson(res, 400, { error: "Invalid event" });
    return;
  }
  const analytics = readAnalytics();
  analytics.events[eventName] = Math.min(Number.MAX_SAFE_INTEGER, Number(analytics.events[eventName] || 0) + 1);
  analytics.updatedAt = new Date().toISOString();
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(analyticsFile, `${JSON.stringify(analytics, null, 2)}\n`);
  sendJson(res, 200, { ok: true });
}

function massCommunicationsLanguage(requestUrl) {
  const catalog = loadCatalog(massCommunicationsDir);
  const supportedLanguages = new Set(catalog.languages || ["en"]);
  return normalizeLanguage(new URL(requestUrl, "http://localhost").searchParams.get("lang"), supportedLanguages);
}

function requireMassCommunicationsAuth(req, res) {
  if (massCommunicationsAuth.isAuthenticated(req)) return true;
  sendJson(res, 401, { error: "Authentication required" });
  return false;
}

async function handleMassCommunications(req, res) {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const secure = requestIsSecure(req);

  if (pathname === "/api/mass-communications/session") {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }
    const authenticated = massCommunicationsAuth.isAuthenticated(req);
    const headers = {};
    if (authenticated) {
      try {
        const session = massCommunicationsAuth.createSession();
        headers["Set-Cookie"] = sessionCookie(session.token, session.maxAgeSeconds, secure);
      } catch {
        sendJson(res, 503, { authenticated: false, error: "Secure archive is not configured" });
        return;
      }
    }
    sendJson(res, 200, { authenticated }, headers);
    return;
  }

  if (pathname === "/api/mass-communications/login") {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }
    const configuredPassword = process.env.MASS_COMMS_PASSWORD;
    if (!configuredPassword || !process.env.MASS_COMMS_SESSION_SECRET) {
      sendJson(res, 503, { error: "Secure archive is not configured" });
      return;
    }

    const ip = getClientIp(req);
    const attempt = massCommunicationsAuth.consumeLoginAttempt(ip);
    if (!attempt.allowed) {
      sendJson(
        res,
        429,
        { error: "Too many attempts. Please try again later." },
        { "Retry-After": String(attempt.retryAfterSeconds) },
      );
      return;
    }

    let password = "";
    try {
      password = String(JSON.parse(await readBody(req)).password || "");
    } catch {
      password = "";
    }
    if (!safeEqual(password, configuredPassword)) {
      sendJson(res, 401, { error: "Incorrect password" });
      return;
    }

    massCommunicationsAuth.clearLoginAttempts(ip);
    let session;
    try {
      session = massCommunicationsAuth.createSession();
    } catch {
      sendJson(res, 503, { error: "Secure archive is not configured" });
      return;
    }
    sendJson(
      res,
      200,
      { authenticated: true },
      { "Set-Cookie": sessionCookie(session.token, session.maxAgeSeconds, secure) },
    );
    return;
  }

  if (pathname === "/api/mass-communications/logout") {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }
    massCommunicationsAuth.destroySession(req);
    sendJson(res, 200, { authenticated: false }, { "Set-Cookie": clearSessionCookie(secure) });
    return;
  }

  if (!requireMassCommunicationsAuth(req, res)) return;
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let language;
  try {
    language = massCommunicationsLanguage(req.url);
  } catch {
    sendJson(res, 500, { error: "Unable to load archive catalog" });
    return;
  }

  if (pathname === "/api/mass-communications/catalog") {
    try {
      sendJson(res, 200, listConversations(massCommunicationsDir, language));
    } catch {
      sendJson(res, 500, { error: "Unable to load archive catalog" });
    }
    return;
  }

  const conversationMatch = pathname.match(/^\/api\/mass-communications\/conversations\/([^/]+)$/);
  if (conversationMatch) {
    let conversation;
    try {
      conversation = loadConversation(massCommunicationsDir, conversationMatch[1], language);
    } catch (error) {
      const unavailable = /content key is not configured/i.test(error.message);
      sendJson(res, unavailable ? 503 : 500, {
        error: unavailable ? "Secure archive content is not configured" : "Unable to load conversation",
      });
      return;
    }
    if (!conversation) {
      sendJson(res, 404, { error: "Conversation not found" });
      return;
    }
    sendJson(res, 200, conversation);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

function safePublicPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return path.join(publicDir, "index.html");
  }
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^[/\\]+/, "");
  const requested = path.resolve(publicDir, relative);
  const containment = path.relative(publicDir, requested);
  return containment && !containment.startsWith("..") && !path.isAbsolute(containment)
    ? requested
    : path.join(publicDir, "index.html");
}

function serveStatic(req, res) {
  let filePath = safePublicPath(req.url || "/");
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(publicDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const relativePath = path.relative(publicDir, filePath).split(path.sep).join("/");
  const noStore = ext === ".html" || relativePath === "robots.txt";
  const versioned = /[?&]v=[a-z0-9._-]+/i.test(req.url || "");
  let cacheHeaders;
  if (noStore) {
    cacheHeaders = {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
    };
  } else if (versioned || ![".css", ".js", ".json"].includes(ext)) {
    cacheHeaders = { "Cache-Control": "public, max-age=31536000, immutable" };
  } else {
    cacheHeaders = { "Cache-Control": "public, max-age=300, must-revalidate" };
  }

  const securityHeaders = relativePath === "mass-communications.html"
    ? {
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      }
    : {};

  res.writeHead(200, {
    "Content-Type": contentType,
    ...cacheHeaders,
    ...securityHeaders,
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/api/mass-communications")) {
    handleMassCommunications(req, res);
    return;
  }
  if (req.url && req.url.startsWith("/api/visit")) {
    handleVisit(req, res);
    return;
  }
  if (req.url && req.url.startsWith("/api/event")) {
    handleEvent(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`FL2 site listening on ${port}`);
});

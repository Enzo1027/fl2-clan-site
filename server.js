const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = process.env.DATA_DIR || path.join(root, ".data");
const counterFile = path.join(dataDir, "visits.json");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
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

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
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

function safePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const requested = path.join(publicDir, normalized === "/" ? "index.html" : normalized);
  return requested.startsWith(publicDir) ? requested : path.join(publicDir, "index.html");
}

function serveStatic(req, res) {
  let filePath = safePublicPath(req.url || "/");
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(publicDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const cacheControl = filePath.endsWith("index.html")
    ? "no-cache"
    : "public, max-age=31536000, immutable";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/api/visit")) {
    handleVisit(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`FL2 site listening on ${port}`);
});

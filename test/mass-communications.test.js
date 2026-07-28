const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  createAuthStore,
  loadConversation,
  parseTranscript,
  sessionCookie,
} = require("../mass-communications");

function requestWithToken(token) {
  return { headers: { cookie: `fl2_mass_comms=${encodeURIComponent(token)}` } };
}

test("persistent signed session survives a new auth store", () => {
  const sessionSecret = "s".repeat(48);
  const now = 1_800_000_000_000;
  const firstStore = createAuthStore({ sessionSecret });
  const session = firstStore.createSession(now);
  const secondStore = createAuthStore({ sessionSecret });

  assert.equal(secondStore.isAuthenticated(requestWithToken(session.token), now + 60_000), true);
  assert.equal(secondStore.isAuthenticated(requestWithToken(`${session.token}x`), now + 60_000), false);
  assert.equal(secondStore.isAuthenticated(requestWithToken(session.token), now + 401 * 24 * 60 * 60 * 1000), false);
});

test("session cookie is persistent, HttpOnly, strict, and secure when requested", () => {
  const cookie = sessionCookie("token", 1234, true);
  assert.match(cookie, /Max-Age=1234/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
});

test("login limiter blocks after the configured attempt count", () => {
  const store = createAuthStore({
    sessionSecret: "s".repeat(48),
    loginAttemptLimit: 2,
    loginWindowMs: 60_000,
  });
  assert.equal(store.consumeLoginAttempt("127.0.0.1", 1000).allowed, true);
  assert.equal(store.consumeLoginAttempt("127.0.0.1", 1001).allowed, true);
  assert.equal(store.consumeLoginAttempt("127.0.0.1", 1002).allowed, false);
  assert.equal(store.consumeLoginAttempt("127.0.0.1", 61_001).allowed, true);
});

test("transcript parser preserves timestamps, speakers, replies, and paragraphs", () => {
  const parsed = parseTranscript(
    [
      "Example title",
      "",
      "[No timestamp visible]",
      "System: A joined.",
      "[11:02]",
      "[FL2]-Zion- [replying to King Konq]: First paragraph.",
      "",
      "Second paragraph.",
      "[IRNY]King Konq: Agreed.",
    ].join("\n"),
    "en",
  );

  assert.equal(parsed.sourceTitle, "Example title");
  assert.equal(parsed.entries.length, 3);
  assert.equal(parsed.entries[0].timestamp, "No timestamp visible");
  assert.equal(parsed.entries[1].speaker, "-Zion-");
  assert.equal(parsed.entries[1].replyTo, "King Konq");
  assert.equal(parsed.entries[1].message, "First paragraph.\n\nSecond paragraph.");
  assert.equal(parsed.entries[2].alliance, "IRNY");
});

test("encrypted conversation content loads only with the content key", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fl2-mass-comms-"));
  const contentDir = path.join(tempDir, "mass-communications");
  const conversationDir = path.join(contentDir, "sample-chat");
  fs.mkdirSync(conversationDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, "catalog.json"), JSON.stringify({
    languages: ["en"],
    conversations: [{
      slug: "sample-chat",
      title: "Sample",
      fallbackLanguage: "en",
      description: { en: "Sample description" },
      languages: { en: "en.enc.json" },
    }],
  }));

  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = "Sample\n\n[12:00]\n[FL2]KGbkmom: Hello.";
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  fs.writeFileSync(path.join(conversationDir, "en.enc.json"), JSON.stringify({
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  }));

  const previousKey = process.env.MASS_COMMS_CONTENT_KEY;
  process.env.MASS_COMMS_CONTENT_KEY = key.toString("base64");
  try {
    const conversation = loadConversation(contentDir, "sample-chat", "en");
    assert.equal(conversation.title, "Sample");
    assert.equal(conversation.entries[0].message, "Hello.");
    assert.equal(loadConversation(contentDir, "../catalog", "en"), null);
  } finally {
    if (previousKey === undefined) delete process.env.MASS_COMMS_CONTENT_KEY;
    else process.env.MASS_COMMS_CONTENT_KEY = previousKey;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

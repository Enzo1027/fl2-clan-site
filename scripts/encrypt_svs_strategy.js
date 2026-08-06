#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sourceRoot = process.argv[2];
const keyFile = process.argv[3];
const languages = ["en", "es", "fr", "de", "ar", "tr", "nl", "id"];
const sections = [
  "svs-strategy-transcript",
  "svs-strategy-summary",
  "svs-strategy-open-items",
];

if (!sourceRoot || !keyFile) {
  console.error("Usage: node scripts/encrypt_svs_strategy.js <translation-dir> <content-key-file>");
  process.exit(1);
}

function loadOrCreateKey(filename) {
  if (fs.existsSync(filename)) {
    const existing = Buffer.from(fs.readFileSync(filename, "utf8").trim(), "base64");
    if (existing.length !== 32) throw new Error("Existing content key is not 32 bytes");
    return existing;
  }
  const key = crypto.randomBytes(32);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${key.toString("base64")}\n`, { mode: 0o600 });
  return key;
}

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    version: 1,
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
}

const sourceDir = path.resolve(sourceRoot);
const contentKey = loadOrCreateKey(path.resolve(keyFile));

for (const section of sections) {
  const outputDir = path.join(repoRoot, "content", "mass-communications", section);
  fs.mkdirSync(outputDir, { recursive: true });
  for (const language of languages) {
    const sourcePath = path.join(sourceDir, section, `${language}.txt`);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing source document: ${sourcePath}`);
    const envelope = encrypt(fs.readFileSync(sourcePath, "utf8"), contentKey);
    fs.writeFileSync(
      path.join(outputDir, `${language}.enc.json`),
      `${JSON.stringify(envelope)}\n`,
      { mode: 0o644 },
    );
  }
}

console.log(`Encrypted ${sections.length * languages.length} SvS Strategy documents.`);
console.log(`Content key saved separately at ${path.resolve(keyFile)}.`);

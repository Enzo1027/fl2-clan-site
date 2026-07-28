#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "content", "mass-communications", "irny-and-fl2-group-chat");
const sourceDir = process.argv[2];
const keyFile = process.argv[3];

if (!sourceDir || !keyFile) {
  console.error("Usage: node scripts/encrypt_mass_communications.js <transcript-dir> <content-key-file>");
  process.exit(1);
}

const sources = {
  en: "FL2-conversation-English.txt",
  es: "FL2-conversation-Spanish.txt",
  fr: "FL2-conversation-French.txt",
  de: "FL2-conversation-German.txt",
  ar: "FL2-conversation-Arabic.txt",
  tr: "FL2-conversation-Turkish.txt",
  nl: "FL2-conversation-Dutch.txt",
  id: "FL2-conversation-Indonesian.txt",
};

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

const key = loadOrCreateKey(path.resolve(keyFile));
fs.mkdirSync(outputDir, { recursive: true });

for (const [language, filename] of Object.entries(sources)) {
  const sourcePath = path.join(path.resolve(sourceDir), filename);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing transcript: ${filename}`);
  const envelope = encrypt(fs.readFileSync(sourcePath, "utf8"), key);
  fs.writeFileSync(
    path.join(outputDir, `${language}.enc.json`),
    `${JSON.stringify(envelope)}\n`,
    { mode: 0o644 },
  );
}

console.log(`Encrypted ${Object.keys(sources).length} transcripts. Content key saved separately at ${path.resolve(keyFile)}.`);

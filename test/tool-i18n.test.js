const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const pages = ["tools", "calculator", "research", "tank", "hq", "heroes", "daily", "shops"];
const languages = ["es", "fr", "de", "ar", "tr", "nl", "id"];

function loadTranslations() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "public/tool-translations.js"), "utf8"), context);
  return context.window.FL2_TOOL_TRANSLATIONS;
}

test("every FL2 tool loads the offline translation layer before shared and page behavior", () => {
  for (const page of pages) {
    const source = fs.readFileSync(path.join(root, `public/${page}.html`), "utf8");
    const translations = source.indexOf("tool-translations.js");
    const i18n = source.indexOf("tool-i18n.js");
    const common = source.indexOf("tool-common.js");
    assert.ok(translations > 0, `${page} loads translations`);
    assert.ok(translations < i18n && i18n < common, `${page} uses the required script order`);
  }
});

test("all seven non-English tool dictionaries are complete and retain template tokens", () => {
  const translations = loadTranslations();
  const keySets = languages.map((language) => Object.keys(translations[language] || {}));
  for (const [index, language] of languages.entries()) {
    assert.ok(keySets[index].length >= 1_600, `${language} has the full phrase catalog`);
    assert.deepEqual(keySets[index], keySets[0], `${language} has the same keys as Spanish`);
    assert.notEqual(translations[language]["Command center"], "Command center");
    assert.notEqual(translations[language]["Download backup"], "Download backup");
    for (const [source, target] of Object.entries(translations[language])) {
      assert.equal(source.includes("{{"), false, `${language} source has no doubled template token`);
      for (const token of source.match(/\{\d+\}/g) || []) {
        assert.ok(target.includes(token), `${language} keeps ${token} in ${source}`);
      }
    }
  }
});

test("offline cache includes the complete tool localization runtime", () => {
  const serviceWorker = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
  assert.match(serviceWorker, /\/tool-translations\.js/);
  assert.match(serviceWorker, /\/tool-i18n\.js/);
  assert.match(serviceWorker, /fl2-command-center-v17/);
});

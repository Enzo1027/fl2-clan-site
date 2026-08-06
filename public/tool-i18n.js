(function initializeToolI18n() {
  "use strict";

  const STORAGE_KEY = "fl2-tools-language";
  const LANGUAGES = Object.freeze([
    { code: "en", short: "EN", native: "English", flag: "🇺🇸", locale: "en-US", dir: "ltr" },
    { code: "es", short: "ES", native: "Español", flag: "🇪🇸", locale: "es-ES", dir: "ltr" },
    { code: "fr", short: "FR", native: "Français", flag: "🇫🇷", locale: "fr-FR", dir: "ltr" },
    { code: "de", short: "DE", native: "Deutsch", flag: "🇩🇪", locale: "de-DE", dir: "ltr" },
    { code: "ar", short: "AR", native: "العربية", flag: "🇸🇦", locale: "ar", dir: "rtl" },
    { code: "tr", short: "TR", native: "Türkçe", flag: "🇹🇷", locale: "tr-TR", dir: "ltr" },
    { code: "nl", short: "NL", native: "Nederlands", flag: "🇳🇱", locale: "nl-NL", dir: "ltr" },
    { code: "id", short: "ID", native: "Indonesia", flag: "🇮🇩", locale: "id-ID", dir: "ltr" },
  ]);
  const TRANSLATIONS = window.FL2_TOOL_TRANSLATIONS || {};
  const SKIP_SELECTOR = "script,style,noscript,code,pre,[data-i18n-skip]";
  const ATTRIBUTE_NAMES = ["aria-label", "title", "placeholder", "alt"];
  const FRAGMENT_SOURCES = [
    "Active local player profile", "Local player profile", "Player profile", "Command Center",
    "All published stages finished", "after this step", "checked today", "on this device",
    "offline ready", "auto-saved", "Not safe yet", "Not entered", "Not needed", "Not set",
    "wrenches", "fragments", "resources", "published", "unpublished", "remaining", "completed",
    "finished", "started", "saved", "spent", "needed", "owned", "known", "unknown", "levels",
    "Level", "level", "stages", "stars", "skills", "badges", "medals", "weeks", "days",
    "Previous", "Next", "Current", "Target", "Progress", "Summary", "Results", "Sources", "Source",
    "Evidence", "Download", "Restore", "Search", "Close", "Delete", "Apply", "Ready", "Achieved",
    "not published yet", "not published", "known remaining", "known badges", "known spent", "known left",
    "selected levels remaining", "selected level remaining", "across all trees", "Unlocks with", "Requires",
    "completed costs", "completed cost", "level costs", "level cost", "node goals", "node goal",
    "per week", "per day", "this week", "after", "before", "through", "from", "with", "without", "away",
    "Plus", "costs", "cost", "goals", "goal", "nodes", "node", "trees", "tree", "future", "previous",
    "more", "less", "each", "all", "none", "only", "still", "shown", "already", "now", "total", "complete",
    "of", "and", "to", "at", "for",
  ];

  function storedLanguage() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function languageFromReferrer() {
    try {
      if (!document.referrer) return null;
      const referrer = new URL(document.referrer);
      if (referrer.origin !== location.origin) return null;
      const hashLanguage = new URLSearchParams(referrer.hash.replace(/^#/, "")).get("lang");
      return hashLanguage || referrer.searchParams.get("lang");
    } catch { return null; }
  }

  function validLanguage(candidate) {
    return LANGUAGES.some((item) => item.code === candidate) ? candidate : null;
  }

  const queryLanguage = new URLSearchParams(location.search).get("lang");
  const language = validLanguage(queryLanguage) || validLanguage(storedLanguage()) || validLanguage(languageFromReferrer()) || "en";
  const languageInfo = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];
  const dictionary = TRANSLATIONS[language] || {};
  const foldedDictionary = new Map(Object.entries(dictionary).map(([source, target]) => [source.toLocaleLowerCase("en"), target]));
  const invariantValues = new Set([
    "FL2", "FrostBorn Lions", "Last Z", "SvS", "HQ", "VIP", "UTC",
    ...(window.HeroPlanner?.HEROES || []).map((hero) => hero.name),
  ]);
  const templateMatchers = Object.keys(dictionary)
    .filter((source) => /\{\d+\}/.test(source) && source.replace(/\{\d+\}/g, "").trim().length >= 3)
    .map((source) => {
      const placeholders = [...source.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]));
      const expression = source.split(/\{\d+\}/g)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("(.*?)");
      return { source, placeholders, expression: new RegExp(`^${expression}$`, "u"), target: dictionary[source] };
    })
    .sort((left, right) => right.source.replace(/\{\d+\}/g, "").length - left.source.replace(/\{\d+\}/g, "").length);

  try { localStorage.setItem(STORAGE_KEY, language); } catch {}
  document.documentElement.lang = languageInfo.code;
  document.documentElement.dir = languageInfo.dir;
  document.documentElement.dataset.toolLanguage = languageInfo.code;

  function preserveWhitespace(source, translated) {
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    return `${leading}${translated}${trailing}`;
  }

  function restoreTokens(value, tokens) {
    let output = value;
    tokens.forEach((token, index) => {
      output = output.replaceAll(`{${index}}`, token);
    });
    return output;
  }

  function translateTemplate(source) {
    const tokens = [];
    const normalized = source.replace(/(^|[^\p{L}])(\p{N}[\p{N},.\u066B\u066C]*(?:%|٪|★)?)/gu, (_, prefix, token) => {
      const placeholder = `{${tokens.length}}`;
      tokens.push(token);
      return `${prefix}${placeholder}`;
    });
    const translated = dictionary[normalized] || foldedDictionary.get(normalized.toLocaleLowerCase("en"));
    return translated ? restoreTokens(translated, tokens) : null;
  }

  function translateFragments(source) {
    let output = source;
    let changed = false;
    for (const fragment of [...FRAGMENT_SOURCES].sort((left, right) => right.length - left.length)) {
      const translated = dictionary[fragment];
      if (!translated || translated === fragment || !output.includes(fragment)) continue;
      const pattern = fragment.length <= 8
        ? new RegExp(`\\b${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")
        : new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const next = output.replace(pattern, translated);
      if (next !== output) {
        output = next;
        changed = true;
      }
    }
    return changed ? output : null;
  }

  function translatePattern(source) {
    for (const template of templateMatchers) {
      const match = source.match(template.expression);
      if (!match) continue;
      let output = template.target;
      template.placeholders.forEach((placeholder, index) => {
        const sourceValue = match[index + 1];
        const localizedValue = invariantValues.has(sourceValue)
          ? sourceValue
          : dictionary[sourceValue] || foldedDictionary.get(sourceValue.toLocaleLowerCase("en")) || sourceValue;
        output = output.replaceAll(`{${placeholder}}`, localizedValue);
      });
      return output;
    }
    return null;
  }

  function translateText(value) {
    if (language === "en" || typeof value !== "string") return value;
    const source = value.trim();
    if (!source) return value;
    const translated = translateTemplate(source) || dictionary[source] || foldedDictionary.get(source.toLocaleLowerCase("en")) || translatePattern(source) || translateFragments(source);
    return translated ? preserveWhitespace(value, translated) : value;
  }

  function shouldSkip(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !element || Boolean(element.closest(SKIP_SELECTOR));
  }

  function translateElement(element) {
    if (!(element instanceof Element) || shouldSkip(element)) return;
    for (const attribute of ATTRIBUTE_NAMES) {
      if (!element.hasAttribute(attribute)) continue;
      const source = element.getAttribute(attribute);
      const translated = translateText(source);
      if (translated !== source) element.setAttribute(attribute, translated);
    }
    if (element.matches('meta[name="description"]')) {
      const source = element.getAttribute("content");
      const translated = translateText(source);
      if (translated !== source) element.setAttribute("content", translated);
    }
  }

  function translateNode(root) {
    if (!root || shouldSkip(root)) return;
    if (root.nodeType === Node.TEXT_NODE) {
      const translated = translateText(root.nodeValue);
      if (translated !== root.nodeValue) root.nodeValue = translated;
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
      else if (!shouldSkip(node)) {
        const translated = translateText(node.nodeValue);
        if (translated !== node.nodeValue) node.nodeValue = translated;
      }
      node = walker.nextNode();
    }
  }

  function localizedUrl(href, nextLanguage = language) {
    if (!href || ["#", "mailto:", "tel:", "javascript:"].some((prefix) => href.startsWith(prefix))) return href;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || !url.pathname.endsWith(".html")) return href;
      if (url.pathname.endsWith("index.html")) {
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        hash.set("lang", nextLanguage);
        if (!hash.has("day")) hash.set("day", "day-1");
        if (!hash.has("view")) hash.set("view", "poster");
        url.hash = hash.toString();
        url.searchParams.delete("lang");
      } else {
        url.searchParams.set("lang", nextLanguage);
      }
      return `${url.pathname.split("/").pop()}${url.search}${url.hash}`;
    } catch { return href; }
  }

  function localizeLinks(root = document) {
    root.querySelectorAll?.('a[href]').forEach((anchor) => {
      const localized = localizedUrl(anchor.getAttribute("href"));
      if (localized) anchor.setAttribute("href", localized);
    });
  }

  function selectLanguage(nextLanguage) {
    if (!validLanguage(nextLanguage) || nextLanguage === language) return;
    try { localStorage.setItem(STORAGE_KEY, nextLanguage); } catch {}
    location.assign(localizedUrl(location.href, nextLanguage));
  }

  function updateScrollControls(wrapper) {
    const tabs = wrapper.querySelector(".tool-language-tabs");
    const previous = wrapper.querySelector('[data-language-scroll="previous"]');
    const next = wrapper.querySelector('[data-language-scroll="next"]');
    const max = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
    previous.disabled = tabs.scrollLeft <= 2;
    next.disabled = tabs.scrollLeft >= max - 2;
  }

  function renderLanguageSwitcher() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || topbar.querySelector(".tool-language-switcher")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "tool-language-switcher";
    wrapper.setAttribute("aria-label", translateText("Language"));
    wrapper.innerHTML = `
      <button class="tool-language-scroll" data-language-scroll="previous" type="button" aria-label="${translateText("Previous languages")}"><span aria-hidden="true">‹</span></button>
      <div class="tool-language-tabs" role="group" aria-label="${translateText("Choose language")}"></div>
      <button class="tool-language-scroll" data-language-scroll="next" type="button" aria-label="${translateText("Next languages")}"><span aria-hidden="true">›</span></button>`;
    const tabs = wrapper.querySelector(".tool-language-tabs");
    for (const item of LANGUAGES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tool-language-option${item.code === language ? " is-active" : ""}`;
      button.dataset.language = item.code;
      button.setAttribute("aria-pressed", String(item.code === language));
      button.setAttribute("aria-label", item.native);
      button.innerHTML = `<span aria-hidden="true">${item.flag}</span><strong>${item.short}</strong>`;
      button.addEventListener("click", () => selectLanguage(item.code));
      tabs.append(button);
    }
    topbar.append(wrapper);
    wrapper.querySelectorAll(".tool-language-scroll").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.languageScroll === "previous" ? -1 : 1;
        tabs.scrollBy({ left: direction * Math.max(150, tabs.clientWidth * 0.72), behavior: "smooth" });
        window.setTimeout(() => updateScrollControls(wrapper), 260);
      });
    });
    tabs.addEventListener("scroll", () => updateScrollControls(wrapper), { passive: true });
    window.addEventListener("resize", () => updateScrollControls(wrapper), { passive: true });
    const active = tabs.querySelector(".is-active");
    requestAnimationFrame(() => {
      if (active) {
        const tabsRect = tabs.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        tabs.scrollLeft += activeRect.left - tabsRect.left - (tabs.clientWidth - active.offsetWidth) / 2;
      }
      updateScrollControls(wrapper);
    });
  }

  const api = Object.freeze({
    language,
    locale: languageInfo.locale,
    dir: languageInfo.dir,
    languages: LANGUAGES,
    t: translateText,
    format(source, ...values) {
      return values.reduce((output, value, index) => output.replaceAll(`{${index}}`, value), translateText(source));
    },
    translateText,
    translateNode,
    localizedUrl,
    localizeLinks,
    formatNumber(value, options) { return new Intl.NumberFormat(languageInfo.locale, options).format(value); },
    formatDate(value, options = { dateStyle: "medium" }) { return new Intl.DateTimeFormat(languageInfo.locale, options).format(value); },
  });
  window.fl2I18n = api;

  if (language !== "en") {
    document.title = translateText(document.title);
    translateNode(document.body);
  }
  localizeLinks();
  renderLanguageSwitcher();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") translateNode(mutation.target);
      if (mutation.type === "attributes") translateElement(mutation.target);
      for (const node of mutation.addedNodes) translateNode(node);
    }
    localizeLinks();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["aria-label", "title", "placeholder", "alt"],
  });
  window.dispatchEvent(new CustomEvent("fl2:i18nready", { detail: { language } }));
})();

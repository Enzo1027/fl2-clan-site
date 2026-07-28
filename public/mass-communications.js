"use strict";

const LANGUAGES = [
  { code: "en", native: "English", short: "EN", flag: "🇺🇸", dir: "ltr" },
  { code: "es", native: "Español", short: "ES", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", native: "Français", short: "FR", flag: "🇫🇷", dir: "ltr" },
  { code: "de", native: "Deutsch", short: "DE", flag: "🇩🇪", dir: "ltr" },
  { code: "ar", native: "العربية", short: "AR", flag: "🇸🇦", dir: "rtl" },
  { code: "tr", native: "Türkçe", short: "TR", flag: "🇹🇷", dir: "ltr" },
  { code: "nl", native: "Nederlands", short: "NL", flag: "🇳🇱", dir: "ltr" },
  { code: "id", native: "Bahasa Indonesia", short: "ID", flag: "🇮🇩", dir: "ltr" },
];

const COPY = {
  en: {
    library: "Field Library", secure: "Protected FL2 Archive", title: "Mass Communications",
    intro: "Alliance conversations, translated and organized for clear reading.", protected: "Password protected",
    restricted: "Restricted access", gate: "Enter the archive password",
    trust: "This browser will remain trusted until its site data is cleared or you log out.",
    password: "Password", unlock: "Unlock archive", unlocking: "Unlocking…", incorrect: "The password is incorrect.",
    unavailable: "The secure archive is temporarily unavailable.", catalog: "Conversation catalog", logout: "Log out",
    open: "Open conversation", all: "All conversations", search: "Search conversation", print: "Print",
    groupChat: "Alliance group chat", messages: "messages", timeSections: "time sections", language: "Language",
    fallback: "English fallback", noTime: "No timestamp visible", replying: "replying to",
    noMatches: "No messages match your search.", loadError: "Unable to load the conversation.",
    chooseLanguage: "Choose language",
  },
  es: {
    library: "Biblioteca de campo", secure: "Archivo FL2 protegido", title: "Comunicaciones masivas",
    intro: "Conversaciones de la alianza traducidas y organizadas para una lectura clara.", protected: "Protegido con contraseña",
    restricted: "Acceso restringido", gate: "Introduce la contraseña del archivo",
    trust: "Este navegador seguirá siendo de confianza hasta que borres los datos del sitio o cierres sesión.",
    password: "Contraseña", unlock: "Desbloquear archivo", unlocking: "Desbloqueando…", incorrect: "La contraseña es incorrecta.",
    unavailable: "El archivo seguro no está disponible temporalmente.", catalog: "Catálogo de conversaciones", logout: "Cerrar sesión",
    open: "Abrir conversación", all: "Todas las conversaciones", search: "Buscar en la conversación", print: "Imprimir",
    groupChat: "Chat grupal de la alianza", messages: "mensajes", timeSections: "secciones horarias", language: "Idioma",
    fallback: "Versión inglesa", noTime: "Sin hora visible", replying: "en respuesta a",
    noMatches: "Ningún mensaje coincide con tu búsqueda.", loadError: "No se pudo cargar la conversación.",
    chooseLanguage: "Elegir idioma",
  },
  fr: {
    library: "Bibliothèque de terrain", secure: "Archive FL2 protégée", title: "Communications de masse",
    intro: "Conversations de l’alliance traduites et organisées pour une lecture claire.", protected: "Protégé par mot de passe",
    restricted: "Accès restreint", gate: "Saisissez le mot de passe de l’archive",
    trust: "Ce navigateur restera approuvé jusqu’à la suppression des données du site ou votre déconnexion.",
    password: "Mot de passe", unlock: "Déverrouiller l’archive", unlocking: "Déverrouillage…", incorrect: "Le mot de passe est incorrect.",
    unavailable: "L’archive sécurisée est temporairement indisponible.", catalog: "Catalogue des conversations", logout: "Se déconnecter",
    open: "Ouvrir la conversation", all: "Toutes les conversations", search: "Rechercher dans la conversation", print: "Imprimer",
    groupChat: "Discussion de groupe de l’alliance", messages: "messages", timeSections: "plages horaires", language: "Langue",
    fallback: "Version anglaise", noTime: "Aucune heure visible", replying: "en réponse à",
    noMatches: "Aucun message ne correspond à votre recherche.", loadError: "Impossible de charger la conversation.",
    chooseLanguage: "Choisir la langue",
  },
  de: {
    library: "Feldbibliothek", secure: "Geschütztes FL2-Archiv", title: "Massenkommunikation",
    intro: "Übersetzte und übersichtlich organisierte Allianzgespräche.", protected: "Passwortgeschützt",
    restricted: "Eingeschränkter Zugriff", gate: "Archivpasswort eingeben",
    trust: "Dieser Browser bleibt vertrauenswürdig, bis die Websitedaten gelöscht werden oder du dich abmeldest.",
    password: "Passwort", unlock: "Archiv entsperren", unlocking: "Wird entsperrt…", incorrect: "Das Passwort ist falsch.",
    unavailable: "Das sichere Archiv ist vorübergehend nicht verfügbar.", catalog: "Gesprächskatalog", logout: "Abmelden",
    open: "Gespräch öffnen", all: "Alle Gespräche", search: "Gespräch durchsuchen", print: "Drucken",
    groupChat: "Allianz-Gruppenchat", messages: "Nachrichten", timeSections: "Zeitabschnitte", language: "Sprache",
    fallback: "Englische Ersatzversion", noTime: "Keine sichtbare Uhrzeit", replying: "Antwort an",
    noMatches: "Keine Nachrichten entsprechen deiner Suche.", loadError: "Das Gespräch konnte nicht geladen werden.",
    chooseLanguage: "Sprache auswählen",
  },
  ar: {
    library: "المكتبة الميدانية", secure: "أرشيف FL2 المحمي", title: "الاتصالات الجماعية",
    intro: "محادثات التحالف مترجمة ومنظمة لتسهيل قراءتها.", protected: "محمي بكلمة مرور",
    restricted: "وصول مقيّد", gate: "أدخل كلمة مرور الأرشيف",
    trust: "سيظل هذا المتصفح موثوقًا حتى تمسح بيانات الموقع أو تسجّل الخروج.",
    password: "كلمة المرور", unlock: "فتح الأرشيف", unlocking: "جارٍ الفتح…", incorrect: "كلمة المرور غير صحيحة.",
    unavailable: "الأرشيف الآمن غير متاح مؤقتًا.", catalog: "فهرس المحادثات", logout: "تسجيل الخروج",
    open: "فتح المحادثة", all: "كل المحادثات", search: "البحث في المحادثة", print: "طباعة",
    groupChat: "دردشة مجموعة التحالف", messages: "رسالة", timeSections: "أقسام زمنية", language: "اللغة",
    fallback: "النسخة الإنجليزية البديلة", noTime: "لا يوجد توقيت ظاهر", replying: "ردًا على",
    noMatches: "لا توجد رسائل مطابقة لبحثك.", loadError: "تعذر تحميل المحادثة.",
    chooseLanguage: "اختر اللغة",
  },
  tr: {
    library: "Saha Kütüphanesi", secure: "Korumalı FL2 Arşivi", title: "Toplu İletişimler",
    intro: "Kolay okunması için çevrilmiş ve düzenlenmiş ittifak görüşmeleri.", protected: "Parola korumalı",
    restricted: "Kısıtlı erişim", gate: "Arşiv parolasını girin",
    trust: "Site verileri temizlenene veya çıkış yapana kadar bu tarayıcı güvenilir kalır.",
    password: "Parola", unlock: "Arşivin kilidini aç", unlocking: "Kilit açılıyor…", incorrect: "Parola yanlış.",
    unavailable: "Güvenli arşiv geçici olarak kullanılamıyor.", catalog: "Görüşme kataloğu", logout: "Çıkış yap",
    open: "Görüşmeyi aç", all: "Tüm görüşmeler", search: "Görüşmede ara", print: "Yazdır",
    groupChat: "İttifak grup sohbeti", messages: "mesaj", timeSections: "zaman bölümü", language: "Dil",
    fallback: "İngilizce yedek sürüm", noTime: "Görünür zaman damgası yok", replying: "yanıtlıyor",
    noMatches: "Aramanızla eşleşen mesaj yok.", loadError: "Görüşme yüklenemedi.",
    chooseLanguage: "Dil seçin",
  },
  nl: {
    library: "Veldbibliotheek", secure: "Beveiligd FL2-archief", title: "Massacommunicatie",
    intro: "Alliantiegesprekken, vertaald en overzichtelijk georganiseerd.", protected: "Beveiligd met wachtwoord",
    restricted: "Beperkte toegang", gate: "Voer het archiefwachtwoord in",
    trust: "Deze browser blijft vertrouwd totdat je de sitegegevens wist of uitlogt.",
    password: "Wachtwoord", unlock: "Archief ontgrendelen", unlocking: "Ontgrendelen…", incorrect: "Het wachtwoord is onjuist.",
    unavailable: "Het beveiligde archief is tijdelijk niet beschikbaar.", catalog: "Gesprekscatalogus", logout: "Uitloggen",
    open: "Gesprek openen", all: "Alle gesprekken", search: "Gesprek doorzoeken", print: "Afdrukken",
    groupChat: "Alliantie-groepschat", messages: "berichten", timeSections: "tijdvakken", language: "Taal",
    fallback: "Engelse reserveversie", noTime: "Geen zichtbare tijd", replying: "antwoord aan",
    noMatches: "Geen berichten komen overeen met je zoekopdracht.", loadError: "Het gesprek kon niet worden geladen.",
    chooseLanguage: "Taal kiezen",
  },
  id: {
    library: "Pustaka Lapangan", secure: "Arsip FL2 Terlindungi", title: "Komunikasi Massal",
    intro: "Percakapan aliansi yang diterjemahkan dan ditata agar mudah dibaca.", protected: "Dilindungi kata sandi",
    restricted: "Akses terbatas", gate: "Masukkan kata sandi arsip",
    trust: "Peramban ini tetap dipercaya hingga data situs dihapus atau Anda keluar.",
    password: "Kata sandi", unlock: "Buka kunci arsip", unlocking: "Membuka…", incorrect: "Kata sandi salah.",
    unavailable: "Arsip aman sementara tidak tersedia.", catalog: "Katalog percakapan", logout: "Keluar",
    open: "Buka percakapan", all: "Semua percakapan", search: "Cari percakapan", print: "Cetak",
    groupChat: "Obrolan grup aliansi", messages: "pesan", timeSections: "bagian waktu", language: "Bahasa",
    fallback: "Versi Inggris cadangan", noTime: "Tidak ada waktu yang terlihat", replying: "membalas",
    noMatches: "Tidak ada pesan yang cocok dengan pencarian.", loadError: "Percakapan tidak dapat dimuat.",
    chooseLanguage: "Pilih bahasa",
  },
};

const elements = {
  homeLink: document.querySelector("#homeLink"),
  libraryLink: document.querySelector("#libraryLink"),
  libraryLinkLabel: document.querySelector("#libraryLinkLabel"),
  languageTabs: document.querySelector("#massLanguageTabs"),
  secureArchiveLabel: document.querySelector("#secureArchiveLabel"),
  massTitle: document.querySelector("#massTitle"),
  massIntro: document.querySelector("#massIntro"),
  vaultStatusLabel: document.querySelector("#vaultStatusLabel"),
  gate: document.querySelector("#passwordGate"),
  restrictedLabel: document.querySelector("#restrictedLabel"),
  gateTitle: document.querySelector("#gateTitle"),
  gateDescription: document.querySelector("#gateDescription"),
  form: document.querySelector("#passwordForm"),
  password: document.querySelector("#archivePassword"),
  passwordLabel: document.querySelector("#passwordLabel"),
  unlock: document.querySelector("#unlockButton"),
  loginStatus: document.querySelector("#loginStatus"),
  archive: document.querySelector("#archivePanel"),
  catalogLabel: document.querySelector("#catalogLabel"),
  archiveTitle: document.querySelector("#archiveTitle"),
  logout: document.querySelector("#logoutButton"),
  logoutLabel: document.querySelector("#logoutLabel"),
  catalog: document.querySelector("#conversationCatalog"),
  reader: document.querySelector("#conversationReader"),
  back: document.querySelector("#backToCatalog"),
  backLabel: document.querySelector("#backLabel"),
  search: document.querySelector("#conversationSearch"),
  searchLabel: document.querySelector("#searchLabel"),
  print: document.querySelector("#printConversation"),
  printLabel: document.querySelector("#printLabel"),
  conversationKicker: document.querySelector("#conversationKicker"),
  conversationTitle: document.querySelector("#conversationTitle"),
  conversationDescription: document.querySelector("#conversationDescription"),
  conversationMeta: document.querySelector("#conversationMeta"),
  timeline: document.querySelector("#conversationTimeline"),
  emptySearch: document.querySelector("#emptySearch"),
};

const state = {
  language: "en",
  authenticated: false,
  activeSlug: "",
  catalog: [],
  conversation: null,
};

function languageInfo(code = state.language) {
  return LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];
}

function t(key) {
  return COPY[state.language]?.[key] || COPY.en[key] || key;
}

function selectedLanguageFromUrl() {
  const candidate = new URLSearchParams(window.location.search).get("lang");
  return LANGUAGES.some((language) => language.code === candidate) ? candidate : "en";
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.language);
  history.replaceState(null, "", url);
}

function renderLanguageTabs() {
  elements.languageTabs.replaceChildren();
  for (const language of LANGUAGES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `language-tab${language.code === state.language ? " is-active" : ""}`;
    button.setAttribute("aria-pressed", String(language.code === state.language));
    button.innerHTML = `<span class="flag" aria-hidden="true">${language.flag}</span><strong>${language.short}</strong>`;
    button.addEventListener("click", async () => {
      state.language = language.code;
      updateUrl();
      renderChrome();
      if (state.authenticated) {
        await loadCatalog();
        if (state.activeSlug) await loadConversation(state.activeSlug);
      }
    });
    elements.languageTabs.append(button);
  }
  requestAnimationFrame(() => {
    elements.languageTabs.querySelector(".is-active")?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  });
}

function renderChrome() {
  const language = languageInfo();
  document.documentElement.lang = language.code;
  document.documentElement.dir = language.dir;
  document.title = `${t("title")} | FrostBorn Lions [FL2]`;
  const homeHref = `index.html#lang=${language.code}&day=day-1&view=poster`;
  elements.homeLink.href = homeHref;
  elements.libraryLink.href = homeHref;
  elements.languageTabs.setAttribute("aria-label", t("chooseLanguage"));
  elements.libraryLinkLabel.textContent = t("library");
  elements.secureArchiveLabel.textContent = t("secure");
  elements.massTitle.textContent = t("title");
  elements.massIntro.textContent = t("intro");
  elements.vaultStatusLabel.textContent = t("protected");
  elements.restrictedLabel.textContent = t("restricted");
  elements.gateTitle.textContent = t("gate");
  elements.gateDescription.textContent = t("trust");
  elements.passwordLabel.textContent = t("password");
  elements.unlock.textContent = t("unlock");
  elements.catalogLabel.textContent = t("catalog");
  elements.archiveTitle.textContent = t("title");
  elements.logoutLabel.textContent = t("logout");
  elements.backLabel.textContent = t("all");
  elements.searchLabel.textContent = t("search");
  elements.search.placeholder = t("search");
  elements.printLabel.textContent = t("print");
  elements.conversationKicker.textContent = t("groupChat");
  elements.emptySearch.textContent = t("noMatches");
  renderLanguageTabs();
}

function showGate(message = "") {
  state.authenticated = false;
  state.activeSlug = "";
  state.conversation = null;
  elements.gate.hidden = false;
  elements.archive.hidden = true;
  elements.loginStatus.textContent = message;
}

function showArchive() {
  state.authenticated = true;
  elements.gate.hidden = true;
  elements.archive.hidden = false;
  elements.catalog.hidden = false;
  elements.reader.hidden = true;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function renderCatalog() {
  elements.catalog.replaceChildren();
  for (const conversation of state.catalog) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conversation-card";

    const top = document.createElement("div");
    top.className = "conversation-card-top";
    const icon = document.createElement("span");
    icon.className = "conversation-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const language = document.createElement("span");
    language.className = "language-chip";
    language.textContent = languageInfo(conversation.selectedLanguage).native;
    top.append(icon, language);

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = conversation.title;
    const description = document.createElement("p");
    description.textContent = conversation.description;
    copy.append(title, description);

    const meta = document.createElement("div");
    meta.className = "conversation-card-meta";
    const available = document.createElement("span");
    available.textContent = `${conversation.availableLanguages.length} ${t("language")}`;
    const open = document.createElement("strong");
    open.textContent = `${t("open")} →`;
    meta.append(available, open);

    button.append(top, copy, meta);
    button.addEventListener("click", () => loadConversation(conversation.slug));
    elements.catalog.append(button);
  }
}

async function loadCatalog() {
  try {
    const payload = await api(`/api/mass-communications/catalog?lang=${encodeURIComponent(state.language)}`);
    state.catalog = payload.conversations || [];
    renderCatalog();
  } catch (error) {
    if (error.status === 401) {
      showGate();
      return;
    }
    elements.catalog.textContent = t("unavailable");
  }
}

function searchMatches(entry, query) {
  if (!query) return true;
  return `${entry.speaker} ${entry.alliance} ${entry.replyTo} ${entry.message}`.toLocaleLowerCase(state.language).includes(query);
}

function renderConversationEntries() {
  const conversation = state.conversation;
  const query = elements.search.value.trim().toLocaleLowerCase(state.language);
  const entries = conversation.entries.filter((entry) => searchMatches(entry, query));
  elements.timeline.replaceChildren();
  let previousTimestamp = Symbol("initial");

  for (const entry of entries) {
    if (entry.timestamp !== previousTimestamp) {
      const divider = document.createElement("div");
      divider.className = "time-divider";
      divider.textContent = entry.timestamp || t("noTime");
      elements.timeline.append(divider);
      previousTimestamp = entry.timestamp;
    }

    if (entry.type === "system") {
      const system = document.createElement("p");
      system.className = "system-message";
      system.textContent = entry.message;
      elements.timeline.append(system);
      continue;
    }

    const message = document.createElement("article");
    message.className = `message-card alliance-${entry.alliance.toLowerCase()}`;
    const byline = document.createElement("div");
    byline.className = "message-byline";
    const alliance = document.createElement("span");
    alliance.className = "alliance-badge";
    alliance.textContent = entry.alliance;
    const speaker = document.createElement("strong");
    speaker.className = "speaker-name";
    speaker.textContent = entry.speaker;
    byline.append(alliance, speaker);
    if (entry.replyTo) {
      const reply = document.createElement("span");
      reply.className = "reply-label";
      reply.textContent = `${t("replying")} ${entry.replyTo}`;
      byline.append(reply);
    }
    const body = document.createElement("p");
    body.className = "message-body";
    body.textContent = entry.message;
    message.append(byline, body);
    elements.timeline.append(message);
  }
  elements.emptySearch.hidden = entries.length > 0;
}

async function loadConversation(slug) {
  try {
    const conversation = await api(
      `/api/mass-communications/conversations/${encodeURIComponent(slug)}?lang=${encodeURIComponent(state.language)}`,
    );
    state.activeSlug = slug;
    state.conversation = conversation;
    elements.catalog.hidden = true;
    elements.reader.hidden = false;
    elements.search.value = "";
    elements.conversationTitle.textContent = conversation.title;
    elements.conversationDescription.textContent = conversation.description;
    elements.conversationMeta.replaceChildren();
    const language = document.createElement("span");
    language.textContent = `${t("language")}: ${languageInfo(conversation.selectedLanguage).native}`;
    const messages = document.createElement("span");
    messages.textContent = `${conversation.entries.length} ${t("messages")}`;
    const timeSections = document.createElement("span");
    timeSections.textContent = `${conversation.timestampCount} ${t("timeSections")}`;
    elements.conversationMeta.append(language, messages, timeSections);
    if (conversation.isFallback) {
      const fallback = document.createElement("span");
      fallback.className = "fallback-chip";
      fallback.textContent = t("fallback");
      elements.conversationMeta.append(fallback);
    }
    renderConversationEntries();
    elements.reader.scrollIntoView({ block: "start" });
  } catch (error) {
    if (error.status === 401) {
      showGate();
      return;
    }
    elements.catalog.hidden = false;
    elements.reader.hidden = true;
    elements.catalog.textContent = t("loadError");
  }
}

async function checkSession() {
  try {
    const session = await api("/api/mass-communications/session");
    if (!session.authenticated) {
      showGate();
      return;
    }
    showArchive();
    await loadCatalog();
  } catch {
    showGate(t("unavailable"));
  }
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.unlock.disabled = true;
  elements.unlock.textContent = t("unlocking");
  elements.loginStatus.textContent = "";
  try {
    await api("/api/mass-communications/login", {
      method: "POST",
      body: JSON.stringify({ password: elements.password.value }),
    });
    elements.password.value = "";
    showArchive();
    await loadCatalog();
  } catch (error) {
    elements.loginStatus.textContent = error.status === 401 ? t("incorrect") : (error.message || t("unavailable"));
    elements.password.select();
  } finally {
    elements.unlock.disabled = false;
    elements.unlock.textContent = t("unlock");
  }
});

elements.logout.addEventListener("click", async () => {
  try {
    await api("/api/mass-communications/logout", { method: "POST", body: "{}" });
  } finally {
    showGate();
    elements.password.focus();
  }
});

elements.back.addEventListener("click", () => {
  state.activeSlug = "";
  state.conversation = null;
  elements.reader.hidden = true;
  elements.catalog.hidden = false;
  window.scrollTo({ top: elements.archive.offsetTop - 80, behavior: "smooth" });
});

elements.search.addEventListener("input", renderConversationEntries);
elements.print.addEventListener("click", () => window.print());

state.language = selectedLanguageFromUrl();
renderChrome();
checkSession();

const APP_VERSION = "20260514-id-seven-days";
window.FL2_BUILD = APP_VERSION;

const state = {
  manifest: null,
  docs: null,
  language: "en",
  day: "day-1",
  view: "poster",
  zoom: 1,
  masterExpanded: false,
};

const els = {
  languageTabs: document.querySelector("#languageTabs"),
  dayTabs: document.querySelector("#dayTabs"),
  guideMeta: document.querySelector("#guideMeta"),
  guideTitle: document.querySelector("#guideTitle"),
  appSeason: document.querySelector("#appSeason"),
  appTitle: document.querySelector("#appTitle"),
  liveLabel: document.querySelector("#liveLabel"),
  posterModeLabel: document.querySelector("#posterModeLabel"),
  textModeLabel: document.querySelector("#textModeLabel"),
  guideImage: document.querySelector("#guideImage"),
  upcomingPoster: document.querySelector("#upcomingPoster"),
  upcomingPosterLabel: document.querySelector("#upcomingPosterLabel"),
  upcomingTitle: document.querySelector("#upcomingTitle"),
  textStage: document.querySelector("#textStage"),
  posterStage: document.querySelector("#posterStage"),
  currentFileLabel: document.querySelector("#currentFileLabel"),
  currentFileTitle: document.querySelector("#currentFileTitle"),
  languageTerm: document.querySelector("#languageTerm"),
  currentLanguage: document.querySelector("#currentLanguage"),
  formatTerm: document.querySelector("#formatTerm"),
  browserViewLabel: document.querySelector("#browserViewLabel"),
  imageTerm: document.querySelector("#imageTerm"),
  libraryLabel: document.querySelector("#libraryLabel"),
  liveCount: document.querySelector("#liveCount"),
  libraryList: document.querySelector("#libraryList"),
  masterShortcut: document.querySelector("#masterShortcut"),
  openMasterShortcut: document.querySelector("#openMasterShortcut"),
  masterShortcutLabel: document.querySelector("#masterShortcutLabel"),
  masterShortcutMeta: document.querySelector("#masterShortcutMeta"),
  masterGuideSection: document.querySelector("#masterGuideSection"),
  masterKicker: document.querySelector("#masterKicker"),
  masterTitle: document.querySelector("#masterTitle"),
  masterMeta: document.querySelector("#masterMeta"),
  masterCoverButton: document.querySelector("#masterCoverButton"),
  masterCover: document.querySelector("#masterCover"),
  masterStatus: document.querySelector("#masterStatus"),
  masterGuideName: document.querySelector("#masterGuideName"),
  masterLanguageLabel: document.querySelector("#masterLanguageLabel"),
  masterLanguageValue: document.querySelector("#masterLanguageValue"),
  masterFormatLabel: document.querySelector("#masterFormatLabel"),
  masterFormatValue: document.querySelector("#masterFormatValue"),
  masterPagesLabel: document.querySelector("#masterPagesLabel"),
  masterPagesValue: document.querySelector("#masterPagesValue"),
  toggleMasterReader: document.querySelector("#toggleMasterReader"),
  toggleMasterReaderLabel: document.querySelector("#toggleMasterReaderLabel"),
  downloadMasterGuide: document.querySelector("#downloadMasterGuide"),
  downloadMasterGuideLabel: document.querySelector("#downloadMasterGuideLabel"),
  masterReader: document.querySelector("#masterReader"),
  masterReaderLabel: document.querySelector("#masterReaderLabel"),
  masterReaderCount: document.querySelector("#masterReaderCount"),
  masterPages: document.querySelector("#masterPages"),
  guideGridKicker: document.querySelector("#guideGridKicker"),
  guideGridTitle: document.querySelector("#guideGridTitle"),
  sectionLanguage: document.querySelector("#sectionLanguage"),
  guideGrid: document.querySelector("#guideGrid"),
  uploadsKicker: document.querySelector("#uploadsKicker"),
  uploadsTitle: document.querySelector("#uploadsTitle"),
  uploadsSubhead: document.querySelector("#uploadsSubhead"),
  uploadList: document.querySelector("#uploadList"),
  siteFooter: document.querySelector(".site-footer"),
  visitsLabel: document.querySelector("#visitsLabel"),
  visitCount: document.querySelector("#visitCount"),
  uniqueVisitorsLabel: document.querySelector("#uniqueVisitorsLabel"),
  uniqueVisitorCount: document.querySelector("#uniqueVisitorCount"),
  expandGuide: document.querySelector("#expandGuide"),
  downloadPoster: document.querySelector("#downloadPoster"),
  posterDialog: document.querySelector("#posterDialog"),
  dialogImage: document.querySelector("#dialogImage"),
  dialogMeta: document.querySelector("#dialogMeta"),
  dialogTitle: document.querySelector("#dialogTitle"),
  closeDialog: document.querySelector("#closeDialog"),
  zoomIn: document.querySelector("#zoomIn"),
  zoomOut: document.querySelector("#zoomOut"),
  zoomFit: document.querySelector("#zoomFit"),
  modeButtons: [...document.querySelectorAll("[data-view]")],
};

const iconForLibrary = {
  "s2-guides": "book",
  "alliance-mails": "mail",
  "future-uploads": "upload",
};

const icons = {
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4z"></path><path d="M5 4v12"></path></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="m5 8 7 5 7-5"></path></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9"></path><path d="m7 14 5-5 5 5"></path><path d="M5 5h14"></path></svg>',
};

const I18N = {
  en: {
    season2: "Season 2",
    fieldLibrary: "Field Library",
    live: "Live",
    poster: "Poster",
    text: "Text",
    upcoming: "Upcoming",
    currentFile: "Current File",
    language: "Language",
    format: "Format",
    browserView: "Browser view",
    image: "Image",
    library: "Library",
    s2GuideSet: "S2 Guide Set",
    allDays: "All Days",
    clanRepository: "Clan Repository",
    otherUploads: "Other Uploads",
    browserFirst: "Browser-first",
    chooseLanguage: "Choose language",
    chooseDay: "Choose S2 day",
    libraryStatus: "Library status",
    guideDetails: "Guide details",
    savePoster: "Save poster",
    openPosterReader: "Open poster reader",
    posterReader: "Poster reader",
    zoomOut: "Zoom out",
    fitPoster: "Fit poster",
    zoomIn: "Zoom in",
    closePosterReader: "Close poster reader",
    day: "Day",
    guide: "Guide",
    posterNoun: "Poster",
    days: "days",
    season2Guides: "Season 2 Guides",
    allianceMailText: "Alliance Mail Text",
    uploadQueue: "Upload Queue",
    readyInBrowser: "Ready in browser",
    preparedForUploads: "Prepared for uploads",
    readyForFullGuide: "Ready for the full S2 guide",
    dropUploads: "Drop new browser-viewable files into the repo and add them to the upload manifest when they arrive.",
    extraResources: "extra resources",
    resource: "Resource",
    liveStatus: "Live",
    viewOnline: "View online",
    readOnlyTextView: "read-only text",
    posterOnlyView: "poster-only",
    browserPosterAnd: "browser poster and",
    noSourceFolder: "No source folder was present when this site was created.",
    noTextReader: "This language is available as the original poster view. Text reader content has not been provided for this day yet.",
    isUpcoming: "is upcoming",
    openText: "Open read-only text view",
    openPosterOnlyNote: "Open poster-only note",
    unableToLoad: "Unable to load guide data",
    visitCounter: "Visit counter",
    visits: "Visits",
    uniqueVisitors: "Unique visitors",
    everfrostArchive: "Everfrost Archive",
    masterGuide: "Master Guide",
    visualReader: "Visual reader",
    completeSeasonGuide: "Complete Season 2 Guide",
    readGuide: "Read guide",
    hideGuide: "Hide guide",
    downloadPdf: "Download PDF",
    sourcePdf: "Source PDF",
    pages: "Pages",
    page: "Page",
    englishOnly: "English only",
    notYetAvailable: "Not available in this language yet",
  },
  es: {
    season2: "Temporada 2",
    fieldLibrary: "Biblioteca de campo",
    live: "Activo",
    poster: "Póster",
    text: "Texto",
    upcoming: "Próximamente",
    currentFile: "Archivo actual",
    language: "Idioma",
    format: "Formato",
    browserView: "Vista en navegador",
    image: "Imagen",
    library: "Biblioteca",
    s2GuideSet: "Guías S2",
    allDays: "Todos los días",
    clanRepository: "Repositorio del clan",
    otherUploads: "Otros archivos",
    browserFirst: "Primero navegador",
    chooseLanguage: "Elegir idioma",
    chooseDay: "Elegir día S2",
    libraryStatus: "Estado de la biblioteca",
    guideDetails: "Detalles de la guía",
    savePoster: "Guardar póster",
    openPosterReader: "Abrir lector de póster",
    posterReader: "Lector de póster",
    zoomOut: "Alejar",
    fitPoster: "Ajustar póster",
    zoomIn: "Acercar",
    closePosterReader: "Cerrar lector de póster",
    day: "Día",
    guide: "Guía",
    posterNoun: "Póster",
    days: "días",
    season2Guides: "Guías de Temporada 2",
    allianceMailText: "Texto de correos de alianza",
    uploadQueue: "Cola de archivos",
    readyInBrowser: "Listo en navegador",
    preparedForUploads: "Preparado para archivos",
    readyForFullGuide: "Listo para la guía completa S2",
    dropUploads: "Agrega nuevos archivos visibles en navegador al repo y añádelos al manifiesto cuando lleguen.",
    extraResources: "recursos extra",
    resource: "Recurso",
    liveStatus: "Activo",
    viewOnline: "Ver en línea",
    readOnlyTextView: "texto de solo lectura",
    posterOnlyView: "solo póster",
    browserPosterAnd: "póster en navegador y",
    noSourceFolder: "No había carpeta fuente cuando se creó este sitio.",
    noTextReader: "Este idioma está disponible como póster original. Aún no hay contenido de texto para este día.",
    isUpcoming: "está próximamente",
    openText: "Abrir vista de texto de solo lectura",
    openPosterOnlyNote: "Abrir nota de solo póster",
    unableToLoad: "No se pudieron cargar los datos de la guía",
    visitCounter: "Contador de visitas",
    visits: "Visitas",
    uniqueVisitors: "Visitantes únicos",
    everfrostArchive: "Archivo de Everfrost",
    masterGuide: "Guía maestra",
    visualReader: "Lector visual",
    completeSeasonGuide: "Guía completa de Temporada 2",
    readGuide: "Leer guía",
    hideGuide: "Ocultar guía",
    downloadPdf: "Descargar PDF",
    sourcePdf: "PDF fuente",
    pages: "Páginas",
    page: "Página",
    englishOnly: "Solo inglés",
  },
  fr: {
    season2: "Saison 2",
    fieldLibrary: "Bibliothèque de terrain",
    live: "En ligne",
    poster: "Affiche",
    text: "Texte",
    upcoming: "À venir",
    currentFile: "Fichier actuel",
    language: "Langue",
    format: "Format",
    browserView: "Vue navigateur",
    image: "Image",
    library: "Bibliothèque",
    s2GuideSet: "Guides S2",
    allDays: "Tous les jours",
    clanRepository: "Dépôt du clan",
    otherUploads: "Autres ressources",
    browserFirst: "Priorité navigateur",
    chooseLanguage: "Choisir la langue",
    chooseDay: "Choisir le jour S2",
    libraryStatus: "État de la bibliothèque",
    guideDetails: "Détails du guide",
    savePoster: "Enregistrer l’affiche",
    openPosterReader: "Ouvrir le lecteur d’affiche",
    posterReader: "Lecteur d’affiche",
    zoomOut: "Dézoomer",
    fitPoster: "Ajuster l’affiche",
    zoomIn: "Zoomer",
    closePosterReader: "Fermer le lecteur d’affiche",
    day: "Jour",
    guide: "Guide",
    posterNoun: "Affiche",
    days: "jours",
    season2Guides: "Guides de Saison 2",
    allianceMailText: "Texte des mails d’alliance",
    uploadQueue: "File d’uploads",
    readyInBrowser: "Prêt dans le navigateur",
    preparedForUploads: "Préparé pour les uploads",
    readyForFullGuide: "Prêt pour le guide S2 complet",
    dropUploads: "Ajoutez les nouveaux fichiers consultables dans le navigateur au dépôt et au manifeste quand ils arrivent.",
    extraResources: "ressources en plus",
    resource: "Ressource",
    liveStatus: "En ligne",
    viewOnline: "Voir en ligne",
    readOnlyTextView: "texte en lecture seule",
    posterOnlyView: "affiche seule",
    browserPosterAnd: "affiche dans le navigateur et",
    noSourceFolder: "Aucun dossier source n’était présent lors de la création de ce site.",
    noTextReader: "Cette langue est disponible comme affiche originale. Le contenu texte de ce jour n’a pas encore été fourni.",
    isUpcoming: "est à venir",
    openText: "Ouvrir la vue texte en lecture seule",
    openPosterOnlyNote: "Ouvrir la note affiche seule",
    unableToLoad: "Impossible de charger les données du guide",
    visitCounter: "Compteur de visites",
    visits: "Visites",
    uniqueVisitors: "Visiteurs uniques",
    everfrostArchive: "Archive Everfrost",
    masterGuide: "Guide maître",
    visualReader: "Lecteur visuel",
    completeSeasonGuide: "Guide complet de la Saison 2",
    readGuide: "Lire le guide",
    hideGuide: "Masquer le guide",
    downloadPdf: "Télécharger le PDF",
    sourcePdf: "PDF source",
    pages: "Pages",
    page: "Page",
    englishOnly: "Anglais uniquement",
  },
  de: {
    season2: "Saison 2",
    fieldLibrary: "Feldbibliothek",
    live: "Live",
    poster: "Poster",
    text: "Text",
    upcoming: "Bald verfügbar",
    currentFile: "Aktuelle Datei",
    language: "Sprache",
    format: "Format",
    browserView: "Browseransicht",
    image: "Bild",
    library: "Bibliothek",
    s2GuideSet: "S2-Leitfäden",
    allDays: "Alle Tage",
    clanRepository: "Clan-Repository",
    otherUploads: "Weitere Uploads",
    browserFirst: "Browser zuerst",
    chooseLanguage: "Sprache wählen",
    chooseDay: "S2-Tag wählen",
    libraryStatus: "Bibliotheksstatus",
    guideDetails: "Leitfaden-Details",
    savePoster: "Poster speichern",
    openPosterReader: "Poster-Leser öffnen",
    posterReader: "Poster-Leser",
    zoomOut: "Verkleinern",
    fitPoster: "Poster einpassen",
    zoomIn: "Vergrößern",
    closePosterReader: "Poster-Leser schließen",
    day: "Tag",
    guide: "Leitfaden",
    posterNoun: "Poster",
    days: "Tage",
    season2Guides: "Saison-2-Leitfäden",
    allianceMailText: "Allianz-Mail-Text",
    uploadQueue: "Upload-Warteschlange",
    readyInBrowser: "Im Browser bereit",
    preparedForUploads: "Für Uploads vorbereitet",
    readyForFullGuide: "Bereit für den vollständigen S2-Leitfaden",
    dropUploads: "Neue browserfähige Dateien ins Repo legen und bei Ankunft dem Upload-Manifest hinzufügen.",
    extraResources: "zusätzliche Ressourcen",
    resource: "Ressource",
    liveStatus: "Live",
    viewOnline: "Online ansehen",
    readOnlyTextView: "schreibgeschützter Text",
    posterOnlyView: "nur Poster",
    browserPosterAnd: "Browser-Poster und",
    noSourceFolder: "Beim Erstellen dieser Seite war kein Quellordner vorhanden.",
    noTextReader: "Diese Sprache ist als Originalposter verfügbar. Textinhalt für diesen Tag wurde noch nicht bereitgestellt.",
    isUpcoming: "ist bald verfügbar",
    openText: "Schreibgeschützte Textansicht öffnen",
    openPosterOnlyNote: "Nur-Poster-Hinweis öffnen",
    unableToLoad: "Leitfaden-Daten konnten nicht geladen werden",
    visitCounter: "Besucherzähler",
    visits: "Besuche",
    uniqueVisitors: "Eindeutige Besucher",
    everfrostArchive: "Everfrost-Archiv",
    masterGuide: "Master-Guide",
    visualReader: "Visueller Leser",
    completeSeasonGuide: "Vollständiger Saison-2-Leitfaden",
    readGuide: "Guide lesen",
    hideGuide: "Guide ausblenden",
    downloadPdf: "PDF herunterladen",
    sourcePdf: "Quell-PDF",
    pages: "Seiten",
    page: "Seite",
    englishOnly: "Nur Englisch",
  },
  ar: {
    season2: "الموسم 2",
    fieldLibrary: "مكتبة الميدان",
    live: "مباشر",
    poster: "الملصق",
    text: "النص",
    upcoming: "قريباً",
    currentFile: "الملف الحالي",
    language: "اللغة",
    format: "التنسيق",
    browserView: "عرض المتصفح",
    image: "الصورة",
    library: "المكتبة",
    s2GuideSet: "مجموعة أدلة S2",
    allDays: "كل الأيام",
    clanRepository: "مستودع التحالف",
    otherUploads: "رفعيات أخرى",
    browserFirst: "المتصفح أولاً",
    chooseLanguage: "اختر اللغة",
    chooseDay: "اختر يوم S2",
    libraryStatus: "حالة المكتبة",
    guideDetails: "تفاصيل الدليل",
    savePoster: "حفظ الملصق",
    openPosterReader: "فتح قارئ الملصق",
    posterReader: "قارئ الملصق",
    zoomOut: "تصغير",
    fitPoster: "ملاءمة الملصق",
    zoomIn: "تكبير",
    closePosterReader: "إغلاق قارئ الملصق",
    day: "اليوم",
    guide: "الدليل",
    posterNoun: "الملصق",
    days: "أيام",
    season2Guides: "أدلة الموسم 2",
    allianceMailText: "نص رسائل التحالف",
    uploadQueue: "قائمة الرفع",
    readyInBrowser: "جاهز في المتصفح",
    preparedForUploads: "جاهز للرفع",
    readyForFullGuide: "جاهز لدليل S2 الكامل",
    dropUploads: "أضف الملفات الجديدة القابلة للعرض في المتصفح إلى المستودع وأضفها إلى بيان الرفع عند وصولها.",
    extraResources: "موارد إضافية",
    resource: "مورد",
    liveStatus: "مباشر",
    viewOnline: "عرض على الإنترنت",
    readOnlyTextView: "نص للقراءة فقط",
    posterOnlyView: "ملصق فقط",
    browserPosterAnd: "ملصق في المتصفح و",
    noSourceFolder: "لم يكن مجلد المصدر موجوداً عند إنشاء هذا الموقع.",
    noTextReader: "هذه اللغة متاحة كملصق أصلي. لم يتم توفير محتوى النص لهذا اليوم بعد.",
    isUpcoming: "قادم قريباً",
    openText: "فتح عرض النص للقراءة فقط",
    openPosterOnlyNote: "فتح ملاحظة الملصق فقط",
    unableToLoad: "تعذر تحميل بيانات الدليل",
    visitCounter: "عداد الزيارات",
    visits: "الزيارات",
    uniqueVisitors: "زوار فريدون",
    everfrostArchive: "أرشيف إيفرفروست",
    masterGuide: "الدليل الرئيسي",
    visualReader: "قارئ مرئي",
    completeSeasonGuide: "دليل الموسم 2 الكامل",
    readGuide: "قراءة الدليل",
    hideGuide: "إخفاء الدليل",
    downloadPdf: "تنزيل PDF",
    sourcePdf: "ملف PDF المصدر",
    pages: "الصفحات",
    page: "صفحة",
    englishOnly: "بالإنجليزية فقط",
  },
  tr: {
    season2: "Sezon 2",
    fieldLibrary: "Saha Kütüphanesi",
    live: "Canlı",
    poster: "Poster",
    text: "Metin",
    upcoming: "Yakında",
    currentFile: "Geçerli dosya",
    language: "Dil",
    format: "Format",
    browserView: "Tarayıcı görünümü",
    image: "Görsel",
    library: "Kütüphane",
    s2GuideSet: "S2 Rehber Seti",
    allDays: "Tüm Günler",
    clanRepository: "Klan Deposu",
    otherUploads: "Diğer Yüklemeler",
    browserFirst: "Önce tarayıcı",
    chooseLanguage: "Dil seç",
    chooseDay: "S2 günü seç",
    libraryStatus: "Kütüphane durumu",
    guideDetails: "Rehber ayrıntıları",
    savePoster: "Posteri kaydet",
    openPosterReader: "Poster okuyucuyu aç",
    posterReader: "Poster okuyucu",
    zoomOut: "Uzaklaştır",
    fitPoster: "Posteri sığdır",
    zoomIn: "Yakınlaştır",
    closePosterReader: "Poster okuyucuyu kapat",
    day: "Gün",
    guide: "Rehber",
    posterNoun: "Poster",
    days: "gün",
    season2Guides: "Sezon 2 Rehberleri",
    allianceMailText: "İttifak mail metni",
    uploadQueue: "Yükleme kuyruğu",
    readyInBrowser: "Tarayıcıda hazır",
    preparedForUploads: "Yüklemeler için hazır",
    readyForFullGuide: "Tam S2 rehberi için hazır",
    dropUploads: "Yeni tarayıcıda görüntülenebilir dosyaları repoya ekleyin ve geldiklerinde yükleme manifestine bağlayın.",
    extraResources: "ek kaynak",
    resource: "Kaynak",
    liveStatus: "Canlı",
    viewOnline: "Çevrim içi görüntüle",
    readOnlyTextView: "salt okunur metin",
    posterOnlyView: "sadece poster",
    browserPosterAnd: "tarayıcı posteri ve",
    noSourceFolder: "Bu site oluşturulduğunda kaynak klasör yoktu.",
    noTextReader: "Bu dil orijinal poster görünümü olarak kullanılabilir. Bu gün için metin içeriği henüz sağlanmadı.",
    isUpcoming: "yakında",
    openText: "Salt okunur metin görünümünü aç",
    openPosterOnlyNote: "Sadece poster notunu aç",
    unableToLoad: "Rehber verileri yüklenemedi",
    visitCounter: "Ziyaret sayacı",
    visits: "Ziyaretler",
    uniqueVisitors: "Benzersiz ziyaretçiler",
    everfrostArchive: "Everfrost Arşivi",
    masterGuide: "Ana Rehber",
    visualReader: "Görsel okuyucu",
    completeSeasonGuide: "Tam Sezon 2 Rehberi",
    readGuide: "Rehberi oku",
    hideGuide: "Rehberi gizle",
    downloadPdf: "PDF indir",
    sourcePdf: "Kaynak PDF",
    pages: "Sayfa",
    page: "Sayfa",
    englishOnly: "Yalnızca İngilizce",
  },
  nl: {
    season2: "Seizoen 2",
    fieldLibrary: "Veldbibliotheek",
    live: "Live",
    poster: "Poster",
    text: "Tekst",
    upcoming: "Binnenkort",
    currentFile: "Huidig bestand",
    language: "Taal",
    format: "Formaat",
    browserView: "Browserweergave",
    image: "Afbeelding",
    library: "Bibliotheek",
    s2GuideSet: "S2-gidsen",
    allDays: "Alle dagen",
    clanRepository: "Clanarchief",
    otherUploads: "Andere uploads",
    browserFirst: "Browser-first",
    chooseLanguage: "Kies taal",
    chooseDay: "Kies S2-dag",
    libraryStatus: "Bibliotheekstatus",
    guideDetails: "Gidsdetails",
    savePoster: "Poster opslaan",
    openPosterReader: "Posterlezer openen",
    posterReader: "Posterlezer",
    zoomOut: "Uitzoomen",
    fitPoster: "Poster passend maken",
    zoomIn: "Inzoomen",
    closePosterReader: "Posterlezer sluiten",
    day: "Dag",
    guide: "Gids",
    posterNoun: "Poster",
    days: "dagen",
    season2Guides: "Seizoen 2-gidsen",
    allianceMailText: "Alliantiemailtekst",
    uploadQueue: "Uploadwachtrij",
    readyInBrowser: "Klaar in de browser",
    preparedForUploads: "Klaar voor uploads",
    readyForFullGuide: "Klaar voor de volledige S2-gids",
    dropUploads: "Voeg nieuwe browserbestanden toe aan de repo en zet ze in het uploadmanifest zodra ze er zijn.",
    extraResources: "extra bronnen",
    resource: "Bron",
    liveStatus: "Live",
    viewOnline: "Online bekijken",
    readOnlyTextView: "alleen-lezen tekst",
    posterOnlyView: "alleen poster",
    browserPosterAnd: "browserposter en",
    noSourceFolder: "Er was geen bronmap aanwezig toen deze site werd gemaakt.",
    noTextReader: "Deze taal is beschikbaar als originele poster. Tekstinhoud is voor deze dag nog niet geleverd.",
    isUpcoming: "komt binnenkort",
    openText: "Alleen-lezen tekstweergave openen",
    openPosterOnlyNote: "Alleen-poster melding openen",
    unableToLoad: "Gidsgegevens konden niet worden geladen",
    visitCounter: "Bezoekersteller",
    visits: "Bezoeken",
    uniqueVisitors: "Unieke bezoekers",
    everfrostArchive: "Everfrost-archief",
    masterGuide: "Mastergids",
    visualReader: "Visuele lezer",
    completeSeasonGuide: "Volledige Seizoen 2-gids",
    readGuide: "Gids lezen",
    hideGuide: "Gids verbergen",
    downloadPdf: "PDF downloaden",
    sourcePdf: "Bron-PDF",
    pages: "Pagina's",
    page: "Pagina",
    englishOnly: "Alleen Engels",
  },
  id: {
    season2: "Musim 2",
    fieldLibrary: "Perpustakaan Lapangan",
    live: "Live",
    poster: "Poster",
    text: "Teks",
    upcoming: "Segera hadir",
    currentFile: "File saat ini",
    language: "Bahasa",
    format: "Format",
    browserView: "Tampilan browser",
    image: "Gambar",
    library: "Perpustakaan",
    s2GuideSet: "Panduan S2",
    allDays: "Semua hari",
    clanRepository: "Repositori klan",
    otherUploads: "Unggahan lain",
    browserFirst: "Utama di browser",
    chooseLanguage: "Pilih bahasa",
    chooseDay: "Pilih hari S2",
    libraryStatus: "Status perpustakaan",
    guideDetails: "Detail panduan",
    savePoster: "Simpan poster",
    openPosterReader: "Buka pembaca poster",
    posterReader: "Pembaca poster",
    zoomOut: "Perkecil",
    fitPoster: "Sesuaikan poster",
    zoomIn: "Perbesar",
    closePosterReader: "Tutup pembaca poster",
    day: "Hari",
    guide: "Panduan",
    posterNoun: "Poster",
    days: "hari",
    season2Guides: "Panduan Musim 2",
    allianceMailText: "Teks mail aliansi",
    uploadQueue: "Antrean unggahan",
    readyInBrowser: "Siap di browser",
    preparedForUploads: "Siap untuk unggahan",
    readyForFullGuide: "Siap untuk panduan S2 lengkap",
    dropUploads: "Tambahkan file baru yang bisa dilihat di browser ke repo dan masukkan ke manifest unggahan saat sudah ada.",
    extraResources: "sumber tambahan",
    resource: "Sumber",
    liveStatus: "Live",
    viewOnline: "Lihat online",
    readOnlyTextView: "teks baca-saja",
    posterOnlyView: "hanya poster",
    browserPosterAnd: "poster browser dan",
    noSourceFolder: "File sumber belum ada untuk pilihan ini.",
    noTextReader: "Bahasa ini tersedia sebagai poster asli. Konten teks untuk hari ini belum disediakan.",
    isUpcoming: "segera hadir",
    openText: "Buka tampilan teks baca-saja",
    openPosterOnlyNote: "Buka catatan poster saja",
    unableToLoad: "Tidak dapat memuat data panduan",
    visitCounter: "Penghitung kunjungan",
    visits: "Kunjungan",
    uniqueVisitors: "Pengunjung unik",
    everfrostArchive: "Arsip Everfrost",
    masterGuide: "Panduan Master",
    visualReader: "Pembaca visual",
    completeSeasonGuide: "Panduan Musim 2 Lengkap",
    readGuide: "Baca panduan",
    hideGuide: "Sembunyikan panduan",
    downloadPdf: "Unduh PDF",
    sourcePdf: "PDF sumber",
    pages: "Halaman",
    page: "Halaman",
    englishOnly: "Hanya Inggris",
    notYetAvailable: "Belum tersedia dalam bahasa ini",
  },
};

function normalizeHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const languages = new Set(state.manifest.languages.map((language) => language.code));
  const days = new Set(state.manifest.days.map((day) => day.id));
  const views = new Set(["poster", "text"]);

  state.language = languages.has(params.get("lang")) ? params.get("lang") : "en";
  state.day = days.has(params.get("day")) ? params.get("day") : "day-1";
  state.view = views.has(params.get("view")) ? params.get("view") : "poster";
}

function setHash(next) {
  const params = new URLSearchParams({
    lang: next.language ?? state.language,
    day: next.day ?? state.day,
    view: next.view ?? state.view,
  });
  window.location.hash = params.toString();
}

function getLanguage(code = state.language) {
  return state.manifest.languages.find((language) => language.code === code);
}

function t(key) {
  return I18N[state.language]?.[key] ?? I18N.en[key] ?? key;
}

function dayTitle(day) {
  return `S2 ${t("day")} ${day.number}`;
}

function guideTitle(day) {
  return `${dayTitle(day)} ${t("guide")}`;
}

function getDay(id = state.day) {
  return state.manifest.days.find((day) => day.id === id);
}

function getEntry(day = getDay(), language = state.language) {
  return day.languages[language];
}

function getFeaturedUpload() {
  return state.manifest.uploads?.find((upload) => upload.featured && (upload.pages?.length || upload.languages));
}

function getUploadEntry(upload, language = state.language) {
  return upload?.languages?.[language] ?? (upload?.languages ? null : upload);
}

function isLiveDay(day = getDay(), language = state.language) {
  return Boolean(day?.languages?.[language]?.image);
}

function imageFilename(day, language) {
  return `fl2-s2-${day.id}-${language}.png`;
}

function renderChromeLabels() {
  document.title = `FrostBorn Lions [FL2] | ${t("season2")} ${t("library")}`;
  const brand = document.querySelector(".brand");
  brand?.setAttribute("aria-label", "FrostBorn Lions FL2");
  brand?.setAttribute("href", `#lang=${state.language}&day=day-1&view=poster`);
  els.languageTabs.setAttribute("aria-label", t("chooseLanguage"));
  els.dayTabs.setAttribute("aria-label", t("chooseDay"));
  document.querySelector(".signal")?.setAttribute("aria-label", t("libraryStatus"));
  document.querySelector(".intel-panel")?.setAttribute("aria-label", t("guideDetails"));
  els.posterDialog.setAttribute("aria-label", t("posterReader"));
  els.downloadPoster.setAttribute("aria-label", t("savePoster"));
  els.expandGuide.setAttribute("aria-label", t("openPosterReader"));
  els.zoomOut.setAttribute("aria-label", t("zoomOut"));
  els.zoomFit.setAttribute("aria-label", t("fitPoster"));
  els.zoomIn.setAttribute("aria-label", t("zoomIn"));
  els.closeDialog.setAttribute("aria-label", t("closePosterReader"));
  els.siteFooter.setAttribute("aria-label", t("visitCounter"));

  els.appSeason.textContent = t("season2");
  els.appTitle.textContent = t("fieldLibrary");
  els.liveLabel.textContent = t("live");
  els.posterModeLabel.textContent = t("poster");
  els.textModeLabel.textContent = t("text");
  els.upcomingPosterLabel.textContent = t("upcoming");
  els.currentFileLabel.textContent = t("currentFile");
  els.languageTerm.textContent = t("language");
  els.formatTerm.textContent = t("format");
  els.browserViewLabel.textContent = t("browserView");
  els.imageTerm.textContent = t("image");
  els.libraryLabel.textContent = t("library");
  els.masterKicker.textContent = t("everfrostArchive");
  els.masterTitle.textContent = t("masterGuide");
  els.masterStatus.textContent = t("visualReader");
  els.masterShortcutLabel.textContent = t("completeSeasonGuide");
  els.masterLanguageLabel.textContent = t("language");
  els.masterFormatLabel.textContent = t("format");
  els.masterPagesLabel.textContent = t("pages");
  els.downloadMasterGuideLabel.textContent = t("downloadPdf");
  els.masterReaderLabel.textContent = t("visualReader");
  els.guideGridKicker.textContent = t("s2GuideSet");
  els.guideGridTitle.textContent = t("allDays");
  els.uploadsKicker.textContent = t("clanRepository");
  els.uploadsTitle.textContent = t("otherUploads");
  els.uploadsSubhead.textContent = t("browserFirst");
  els.visitsLabel.textContent = t("visits");
  els.uniqueVisitorsLabel.textContent = t("uniqueVisitors");
}

function renderLanguageTabs() {
  els.languageTabs.innerHTML = "";
  for (const language of state.manifest.languages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `language-tab${language.code === state.language ? " is-active" : ""}`;
    button.setAttribute("aria-pressed", String(language.code === state.language));
    button.innerHTML = `<span class="flag" aria-hidden="true">${language.flag}</span><strong>${language.short}</strong>`;
    button.addEventListener("click", () => setHash({ language: language.code }));
    els.languageTabs.append(button);
  }

  requestAnimationFrame(() => {
    els.languageTabs.querySelector(".is-active")?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  });
}

function renderDayTabs() {
  els.dayTabs.innerHTML = "";
  for (const day of state.manifest.days) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-tab${day.id === state.day ? " is-active" : ""}${day.status !== "live" ? " is-upcoming" : ""}`;
    button.setAttribute("aria-pressed", String(day.id === state.day));
    button.innerHTML = `<span>${t("day")} ${day.number}</span>${day.status !== "live" ? `<em>${t("upcoming")}</em>` : ""}`;
    button.addEventListener("click", () => setHash({ day: day.id }));
    els.dayTabs.append(button);
  }

  requestAnimationFrame(() => {
    els.dayTabs.querySelector(".is-active")?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  });
}

function blockLooksLikeHeading(text) {
  const trimmed = text.trim();
  const hasLatin = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(trimmed);
  return (
    trimmed.length < 92 &&
    (/^(⭐|❄️|✅|☠️|⚡)/.test(trimmed) ||
      (hasLatin && trimmed === trimmed.toUpperCase()) ||
      /^(Subject|Betreff|Asunto|Objet|Konu|الموضوع)/.test(trimmed))
  );
}

function createParagraph(text) {
  const p = document.createElement("p");
  p.className = `doc-block${blockLooksLikeHeading(text) ? " heading" : ""}`;
  p.textContent = text;
  return p;
}

function createTable(block) {
  const table = document.createElement("div");
  table.className = "doc-table";

  for (const row of block.rows) {
    const rowEl = document.createElement("div");
    rowEl.className = `doc-row${row.length === 1 ? " single-cell" : ""}`;
    for (const cell of row) {
      const cellEl = document.createElement("div");
      cellEl.className = "doc-cell";
      for (const line of cell) {
        const p = document.createElement("p");
        p.textContent = line;
        cellEl.append(p);
      }
      rowEl.append(cellEl);
    }
    table.append(rowEl);
  }

  return table;
}

function renderDocument() {
  const language = getLanguage();
  const doc = state.docs[state.day]?.[state.language];
  const reader = document.createElement("div");
  reader.className = "document-reader";
  reader.dir = language.dir;

  if (!doc?.blocks?.length) {
    const empty = document.createElement("p");
    empty.className = "doc-empty";
    empty.textContent = t("noTextReader");
    reader.append(empty);
  } else {
    for (const block of doc.blocks) {
      if (block.type === "paragraph") {
        reader.append(createParagraph(block.text));
      } else if (block.type === "table") {
        reader.append(createTable(block));
      }
    }
  }

  els.textStage.innerHTML = "";
  els.textStage.append(reader);
}

function renderMasterGuide() {
  const upload = getFeaturedUpload();
  const entry = getUploadEntry(upload);
  const language = getLanguage();
  if (!upload || !entry?.pages?.length) {
    els.masterGuideSection.hidden = true;
    els.masterShortcut.hidden = true;
    return;
  }

  const pageCount = entry.pageCount ?? entry.pages.length;
  const cover = entry.pages[0];
  els.masterGuideSection.hidden = false;
  els.masterShortcut.hidden = false;
  els.masterShortcutMeta.textContent = `${language.flag} ${language.native} · ${pageCount} ${t("pages")}`;
  els.masterMeta.textContent = `${language.flag} ${language.native} · ${pageCount} ${t("pages")}`;
  els.masterGuideName.textContent = upload.title;
  els.masterLanguageValue.textContent = `${language.flag} ${language.native}`;
  els.masterFormatValue.textContent = `${upload.type} · ${t("sourcePdf")}`;
  els.masterPagesValue.textContent = pageCount.toLocaleString();
  els.toggleMasterReaderLabel.textContent = state.masterExpanded ? t("hideGuide") : t("readGuide");
  els.toggleMasterReader.setAttribute(
    "aria-label",
    state.masterExpanded ? t("hideGuide") : t("readGuide"),
  );
  els.downloadMasterGuide.href = entry.href;
  els.downloadMasterGuide.download = entry.sourceFile || "";
  els.downloadMasterGuide.setAttribute("aria-label", t("downloadPdf"));

  if (cover?.image) {
    els.masterCover.src = cover.image;
    els.masterCover.alt = `${upload.title} ${t("page")} 1`;
  }
  els.masterCoverButton.setAttribute("aria-label", t("readGuide"));

  els.masterReader.hidden = !state.masterExpanded;
  els.masterReaderCount.textContent = `${pageCount} ${t("pages")}`;
  if (!state.masterExpanded) {
    els.masterPages.innerHTML = "";
    return;
  }

  els.masterPages.innerHTML = "";
  for (const page of entry.pages) {
    const figure = document.createElement("figure");
    figure.className = "master-page";
    figure.innerHTML = `
      <img src="${page.image}" alt="${upload.title} ${t("page")} ${page.number}" loading="lazy">
      <figcaption>${t("page")} ${page.number}</figcaption>
    `;
    els.masterPages.append(figure);
  }
}

function renderLibrary() {
  els.libraryList.innerHTML = "";
  const liveDays = state.manifest.days.filter((day) => day.status === "live").length;
  const uploadCount = state.manifest.uploads?.length ?? 0;
  els.liveCount.textContent = `${liveDays}/${state.manifest.days.length} ${t("days")}`;
  for (const item of state.manifest.library) {
    const row = document.createElement("div");
    row.className = "library-item";
    const symbol = iconForLibrary[item.id] || "book";
    const detail =
      item.id === "future-uploads"
        ? uploadCount
          ? `${uploadCount} ${t("extraResources")}`
          : t("readyForFullGuide")
        : item.status === "live"
          ? t("readyInBrowser")
          : t("preparedForUploads");
    const titleById = {
      "s2-guides": t("season2Guides"),
      "alliance-mails": t("allianceMailText"),
      "future-uploads": t("uploadQueue"),
    };
    row.innerHTML = `
      <span class="library-symbol">${icons[symbol]}</span>
      <span>
        <strong>${titleById[item.id] ?? item.title}</strong>
        <span>${detail}</span>
      </span>
    `;
    els.libraryList.append(row);
  }
}

function renderUploads() {
  els.uploadList.innerHTML = "";
  const uploads = state.manifest.uploads ?? [];
  if (!uploads.length) {
    const empty = document.createElement("div");
    empty.className = "upload-empty";
    empty.innerHTML = `
      <span class="library-symbol">${icons.upload}</span>
      <span>
        <strong>${t("readyForFullGuide")}</strong>
        <span>${t("dropUploads")}</span>
      </span>
    `;
    els.uploadList.append(empty);
    return;
  }

  for (const upload of uploads) {
    const entry = getUploadEntry(upload);
    const hasReader = Boolean(entry?.pages?.length);
    const item = document.createElement(hasReader ? "button" : upload.href ? "a" : "div");
    item.className = "upload-item";
    if (hasReader) {
      item.type = "button";
      item.addEventListener("click", () => {
        state.masterExpanded = true;
        renderMasterGuide();
        els.masterGuideSection.scrollIntoView({ block: "start" });
      });
    } else if (upload.href) {
      item.href = upload.href;
    }
    item.innerHTML = `
      <span class="library-symbol">${icons.book}</span>
      <span>
        <strong>${upload.title}</strong>
        <span>${upload.type ?? t("resource")} · ${
          entry?.pageCount ? `${entry.pageCount} ${t("pages")}` : t("notYetAvailable")
        }</span>
      </span>
    `;
    els.uploadList.append(item);
  }
}

function renderGuideGrid() {
  const language = getLanguage();
  els.sectionLanguage.textContent = `${language.flag} ${language.native}`;
  els.guideGrid.innerHTML = "";

  for (const day of state.manifest.days) {
    const entry = getEntry(day, language.code);
    const hasPoster = Boolean(entry?.image);
    const hasText = Boolean(state.docs[day.id]?.[language.code]);
    const live = hasPoster || hasText;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `guide-card${day.id === state.day ? " is-active" : ""}${live ? "" : " is-upcoming"}`;
    card.innerHTML = `
      <span class="guide-thumb">${
        hasPoster
          ? `<img src="${entry.image}" alt="${dayTitle(day)} ${language.native} ${t("posterNoun")}" loading="lazy">`
          : `<span class="upcoming-thumb"><img src="assets/brand/fl2-mark.svg" alt=""><strong>${t("upcoming")}</strong></span>`
      }</span>
      <span class="guide-card-body">
        <h3>${dayTitle(day)}</h3>
        <p>${
          hasPoster
            ? `${language.native} ${t("browserPosterAnd")} ${hasText ? t("readOnlyTextView") : t("posterOnlyView")}.`
            : hasText
              ? `${language.native} ${t("readOnlyTextView")}.`
            : t("noSourceFolder")
        }</p>
        <span class="card-tags"><span>${language.short}</span><span>${live ? t("viewOnline") : t("upcoming")}</span></span>
      </span>
    `;
    card.addEventListener("click", () => {
      setHash({ day: day.id });
      document.querySelector(".command-surface")?.scrollIntoView({ block: "start" });
    });
    els.guideGrid.append(card);
  }
}

function updateModeButtons() {
  for (const button of els.modeButtons) {
    const active = button.dataset.view === state.view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  els.posterStage.hidden = state.view !== "poster";
  els.textStage.hidden = state.view !== "text";
}

function updateCurrentGuide() {
  const language = getLanguage();
  const day = getDay();
  const entry = getEntry(day, language.code);
  const title = `${dayTitle(day)} ${language.native}`;
  const textAvailable = Boolean(state.docs[day.id]?.[language.code]);
  const hasPoster = isLiveDay(day, language.code);
  const hasAnyContent = hasPoster || textAvailable;
  if (!hasAnyContent && state.view !== "poster") {
    state.view = "poster";
    history.replaceState(null, "", `#${new URLSearchParams({ lang: state.language, day: state.day, view: state.view })}`);
  }

  document.documentElement.lang = language.code;
  document.documentElement.dir = language.dir;
  els.guideMeta.textContent = `${t("season2")} / ${language.native}`;
  els.guideTitle.textContent = guideTitle(day);
  els.guideImage.hidden = !hasPoster;
  els.upcomingPoster.hidden = hasPoster;
  els.upcomingTitle.textContent = guideTitle(day);
  els.currentFileTitle.textContent = hasPoster
    ? `${dayTitle(day)} ${t("posterNoun")}`
    : textAvailable
      ? `${dayTitle(day)} ${t("text")}`
      : `${dayTitle(day)} ${t("upcoming")}`;
  els.currentLanguage.textContent = `${language.flag} ${language.native}`;
  if (hasPoster) {
    els.downloadPoster.removeAttribute("aria-disabled");
  } else {
    els.downloadPoster.setAttribute("aria-disabled", "true");
  }
  els.downloadPoster.classList.toggle("is-disabled", !hasPoster);
  els.expandGuide.disabled = !hasPoster;
  if (hasPoster) {
    els.guideImage.src = entry.image;
    els.guideImage.alt = `${title} ${t("guide")} ${t("posterNoun")}`;
    els.downloadPoster.href = entry.image;
    els.downloadPoster.download = imageFilename(day, language.code);
    els.downloadPoster.title = `${t("savePoster")}: ${title}`;
    els.dialogImage.src = entry.image;
    els.dialogImage.alt = `${title} ${t("guide")} ${t("posterNoun")}`;
  } else {
    els.guideImage.removeAttribute("src");
    els.guideImage.alt = "";
    els.downloadPoster.removeAttribute("href");
    els.downloadPoster.removeAttribute("download");
    els.downloadPoster.title = `${dayTitle(day)} ${t("isUpcoming")}`;
    els.dialogImage.removeAttribute("src");
    els.dialogImage.alt = "";
  }
  els.dialogMeta.textContent = `${t("season2")} / ${language.native}`;
  els.dialogTitle.textContent = `${dayTitle(day)} ${t("posterReader")}`;

  const textButton = els.modeButtons.find((button) => button.dataset.view === "text");
  textButton.disabled = !hasAnyContent;
  textButton.title = textAvailable ? t("openText") : t("openPosterOnlyNote");

  renderDocument();
  updateModeButtons();
}

function renderAll() {
  renderChromeLabels();
  renderLanguageTabs();
  renderDayTabs();
  renderLibrary();
  renderMasterGuide();
  renderGuideGrid();
  renderUploads();
  updateCurrentGuide();
}

function openDialog() {
  if (!isLiveDay()) {
    return;
  }
  state.zoom = 1;
  applyZoom();
  if (typeof els.posterDialog.showModal === "function") {
    els.posterDialog.showModal();
  }
}

function applyZoom() {
  els.dialogImage.style.width = `${Math.round(760 * state.zoom)}px`;
  els.dialogImage.style.maxWidth = state.zoom === 1 ? "100%" : "none";
}

function wireEvents() {
  for (const button of els.modeButtons) {
    button.addEventListener("click", () => setHash({ view: button.dataset.view }));
  }

  els.expandGuide.addEventListener("click", openDialog);
  els.downloadPoster.addEventListener("click", (event) => {
    if (els.downloadPoster.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });
  els.closeDialog.addEventListener("click", () => els.posterDialog.close());

  els.posterDialog.addEventListener("click", (event) => {
    if (event.target === els.posterDialog) {
      els.posterDialog.close();
    }
  });

  els.zoomIn.addEventListener("click", () => {
    state.zoom = Math.min(2.2, state.zoom + 0.2);
    applyZoom();
  });

  els.zoomOut.addEventListener("click", () => {
    state.zoom = Math.max(0.6, state.zoom - 0.2);
    applyZoom();
  });

  els.zoomFit.addEventListener("click", () => {
    state.zoom = 1;
    applyZoom();
  });

  els.masterCoverButton.addEventListener("click", () => {
    state.masterExpanded = true;
    renderMasterGuide();
    els.masterReader.scrollIntoView({ block: "start" });
  });

  els.openMasterShortcut.addEventListener("click", () => {
    state.masterExpanded = true;
    renderMasterGuide();
    els.masterGuideSection.scrollIntoView({ block: "start" });
  });

  els.toggleMasterReader.addEventListener("click", () => {
    state.masterExpanded = !state.masterExpanded;
    renderMasterGuide();
    if (state.masterExpanded) {
      els.masterReader.scrollIntoView({ block: "start" });
    }
  });

  window.addEventListener("hashchange", () => {
    normalizeHash();
    renderAll();
  });
}

function getVisitorId() {
  const key = "fl2-visitor-id";
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

function renderVisitCounter(payload) {
  els.visitCount.textContent = Number(payload.visits || 0).toLocaleString();
  els.uniqueVisitorCount.textContent = Number(payload.uniqueVisitors || 0).toLocaleString();
}

async function reportVisit() {
  try {
    const response = await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    });
    if (!response.ok) {
      throw new Error("counter unavailable");
    }
    renderVisitCounter(await response.json());
  } catch {
    els.visitCount.textContent = "-";
    els.uniqueVisitorCount.textContent = "-";
  }
}

async function boot() {
  const [manifest, docs] = await Promise.all([
    fetch(`data/manifest.json?v=${APP_VERSION}`, { cache: "no-store" }).then((response) => response.json()),
    fetch(`data/docs.json?v=${APP_VERSION}`, { cache: "no-store" }).then((response) => response.json()),
  ]);

  state.manifest = manifest;
  state.docs = docs;
  normalizeHash();
  wireEvents();
  renderAll();
  reportVisit();
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="site-shell"><section class="command-surface"><h1>FL2 ${I18N.en.library}</h1><p class="doc-empty">${I18N.en.unableToLoad}: ${error.message}</p></section></main>`;
});

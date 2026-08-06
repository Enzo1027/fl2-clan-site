#!/usr/bin/env python3
"""Build the static, offline FL2 Tools translation bundle.

The generated browser asset contains every translation at build time. The website
never calls a translation service and keeps working when the device is offline.
"""

from __future__ import annotations

import argparse
import html
from html.parser import HTMLParser
import http.cookiejar
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PAGES = ("tools", "calculator", "research", "tank", "hq", "heroes", "daily", "shops")
ENGINE_SCRIPTS = ("calculator-engine", "hq-engine", "hero-engine", "shop-engine")
LANGUAGES = {"es": "Spanish", "fr": "French", "de": "German", "ar": "Arabic", "tr": "Turkish", "nl": "Dutch", "id": "Indonesian"}
VISIBLE_ATTRIBUTES = {"aria-label", "title", "placeholder", "alt", "content"}
SKIP_JSON_KEYS = {"id", "slug", "sourceUrl", "capturedAt", "image", "href", "url"}
PROTECTED_TERMS = (
    "FrostBorn Lions", "Last Z", "FL2", "SvS", "HQ", "R&D", "VIP", "UTC", "JSON", "Ava",
    "Apocalypse Time", "Everfrost", "Discord", "Reddit",
)
FRAGMENTS = (
    "Language", "Choose language", "Previous languages", "Next languages", "Tools", "Command Center", "Merit", "Research", "Tank", "Heroes", "Today", "Shops", "Guides",
    "Player profile", "Local player profile", "Active local player profile", "Add profile", "Rename profile", "Delete profile",
    "auto-saved", "offline ready", "on this device", "privately", "Not set", "Not entered", "Not needed", "Not safe yet",
    "Level", "levels", "level", "Stage", "stages", "stars", "star", "skills", "skill", "days", "weeks", "hours",
    "complete", "completed", "finished", "started", "saved", "spent", "remaining", "remain", "needed", "owned", "total",
    "published", "unpublished", "known", "unknown", "wrenches", "badges", "medals", "fragments", "books", "resources", "Ava points",
    "Starting path", "All published stages finished", "No goal", "Achieved", "Data status", "Ready", "Apply", "Clear all", "Daily planning",
    "Previous", "Next", "Current", "Target", "Cost", "Progress", "Summary", "Results", "Source", "Sources", "Evidence",
    "Buy", "Hold", "Skip", "Save", "Open", "Download", "Restore", "Copy", "Search", "Close", "Cancel", "Delete", "Add selection",
    "not published yet", "not published", "known remaining", "known badges", "known spent", "known left", "per badge",
    "Ava points earned", "Ava points remaining", "known Ava points", "known Ava points available", "known Ava points remaining",
    "selected levels remaining", "selected level remaining", "across all trees", "Unlocks with", "Requires",
    "completed costs", "completed cost", "level costs", "level cost", "node goals", "node goal",
    "Plus", "costs", "cost", "goals", "goal", "nodes", "node", "trees", "tree", "future", "previous",
    "more", "less", "each", "all", "none", "only", "still", "shown", "already", "now",
    "of", "and", "from", "to", "at", "for", "with", "without", "before", "after", "through", "away", "after this step", "checked today", "this week", "per week", "per day",
)
TEMPLATES = (
    "{0} tools auto-saved privately", "Level {0}", "Level {0} → {1}", "Planning for HQ {0}", "HQ {0} saved →",
    "{0} wrenches remain", "{0} spent →", "{0} levels saved →", "{0} done", "{0} checked today →",
    "{0} level short", "{0} levels short", "{0} Cores",
    "{0} medals saved →", "{0}% complete", "{0}% finished", "{0} of {1} stages started", "{0} wrenches away",
    "At Lv {0} · {1}", "{0} cumulative after this step", "{0} costs unpublished", "{0} known spent · {1} known left",
    "{0} of {1} levels finished.", "{0} / {1} levels", "{0} badges", "{0} Ava points", "{0} known Ava points", "{0} / {1} wrenches",
    "{0} Ava points earned", "{0} Ava points remaining", "{0} known Ava points available", "{0} known Ava points remaining",
    "{0} Ava points earned · {1} per badge", "{0} badges · {1} known Ava points",
    "Current saved level: {0}. The calculator will include levels {1} through your target.", "Level {0} is already complete.",
    "Levels {0}–{1}", "Remove {0} from today's Ava plan", "Ava points for {0} unpublished badge cost are not included.",
    "Ava points for {0} unpublished badge costs are not included.",
    "Switched to {0}", "{0} created on this device", "Profile renamed to {0}", "{0} deleted",
    "Delete {0} and its saved progress from this device?", "Clear all saved progress and goals for {0}?",
    "Jump to {0}, level {1}", "Open level {0} {1}, {2} of {3} complete", "Open {0}, level {1} of {2}",
    "Requirements snapshot checked {0}.", "Tank data could not load: {0}. Reload to try again.",
)
MANUAL_OVERRIDES = {
    "es": {"Tank": "Tanque", "wrenches": "llaves inglesas", "{0} wrenches remain": "{0} llaves inglesas restantes", "{0} done": "{0} completados", "{0} level short": "falta {0} nivel", "{0} levels short": "faltan {0} niveles", "{0} Cores": "{0} Núcleos", "Next Core section": "Siguiente sección de Núcleo", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "Sube {1} de {0} a Nv.20 con Aleación antes de usar Núcleos."},
    "fr": {"Tank": "Char", "wrenches": "clés anglaises", "{0} wrenches remain": "{0} clés anglaises restantes", "{0} done": "{0} terminés", "{0} level short": "il manque {0} niveau", "{0} levels short": "il manque {0} niveaux", "{0} Cores": "{0} Cœurs", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "Améliorez {1} de {0} au niv. 20 avec de l’alliage avant d’utiliser des Cœurs."},
    "de": {"Tank": "Panzer", "wrenches": "Schraubenschlüssel", "{0} wrenches remain": "{0} Schraubenschlüssel verbleiben", "{0} done": "{0} erledigt", "{0} level short": "noch {0} Stufe", "{0} levels short": "noch {0} Stufen", "{0} Cores": "{0} Kerne", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "Bringe {1} von {0} mit Legierung auf Stufe 20, bevor du Kerne verwendest."},
    "ar": {"Tank": "الدبابة", "Tank path": "مسار الدبابة", "Tank Requirements": "متطلبات الدبابة", "wrenches": "مفاتيح الربط", "{0} wrenches remain": "{0} مفتاح ربط متبقٍ", "{0} done": "{0} مكتمل", "{0} level short": "ينقص مستوى واحد ({0})", "{0} levels short": "ينقص {0} مستويات", "{0} Cores": "{0} نواة", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "ارفع {1} الخاصة بـ {0} إلى المستوى 20 باستخدام السبيكة قبل استخدام النوى."},
    "tr": {"Tank": "Tank", "wrenches": "anahtarlar", "{0} wrenches remain": "{0} anahtar kaldı", "{0} done": "{0} tamamlandı", "{0} level short": "{0} seviye eksik", "{0} levels short": "{0} seviye eksik", "{0} Cores": "{0} Çekirdek", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "{0} için {1} seviyesini Çekirdekleri kullanmadan önce Alaşım ile Sv.20’ye yükselt.", "Verified July {0} {1} · High community confidence through HQ {2} · Live game screen remains final authority": "Temmuz {0}, {1} tarihinde doğrulandı · HQ {2} seviyesine kadar yüksek topluluk güveni · Canlı oyun ekranı nihai yetkidir"},
    "nl": {"Tank": "Tank", "wrenches": "steeksleutels", "{0} wrenches remain": "nog {0} steeksleutels", "{0} done": "{0} voltooid", "{0} level short": "nog {0} niveau", "{0} levels short": "nog {0} niveaus", "{0} Cores": "{0} Kernen", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "Breng {1} van {0} met Legering naar Lv.20 voordat je Kernen gebruikt."},
    "id": {"Tank": "Tank", "wrenches": "kunci pas", "{0} wrenches remain": "{0} kunci pas tersisa", "{0} done": "{0} selesai", "{0} level short": "kurang {0} level", "{0} levels short": "kurang {0} level", "{0} Cores": "{0} Core", "Raise {0}'s {1} to Lv.20 with Alloy before using Cores.": "Naikkan {1} milik {0} ke Lv.20 dengan Alloy sebelum memakai Core."},
}


class TextCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.values: set[str] = set()
        self.ignored_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.ignored_depth += 1
        attribute_map = dict(attrs)
        for key, value in attrs:
            is_description = key == "content" and tag == "meta" and attribute_map.get("name") == "description"
            if (key in VISIBLE_ATTRIBUTES and key != "content" and value) or is_description:
                self.add(value or "")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.ignored_depth:
            self.ignored_depth -= 1

    def handle_data(self, value: str) -> None:
        if not self.ignored_depth:
            self.add(value)

    def add(self, value: str) -> None:
        value = " ".join(html.unescape(value).split())
        if is_visible_phrase(value):
            self.values.add(value)


def is_visible_phrase(value: str) -> bool:
    if len(value) < 2 or not any(character.isalpha() for character in value):
        return False
    if "${" in value or "=>" in value or ".join(" in value or "querySelector" in value:
        return False
    if value.startswith((".", "#", "/api/", "data-", "aria-")):
        return False
    if re.fullmatch(r"[a-z][a-zA-Z0-9_-]+", value) and " " not in value:
        return False
    if re.search(r"\.(?:html|js|json|css|png|webp|svg|jpeg)$", value):
        return False
    return True


def add_json_strings(value: object, values: set[str], parent_key: str = "") -> None:
    if parent_key in SKIP_JSON_KEYS:
        return
    if isinstance(value, dict):
        for key, child in value.items():
            add_json_strings(child, values, key)
    elif isinstance(value, list):
        for child in value:
            add_json_strings(child, values, parent_key)
    elif isinstance(value, str):
        phrase = " ".join(value.split())
        if is_visible_phrase(phrase):
            values.add(phrase)


def js_literal_phrases(source: str) -> set[str]:
    values: set[str] = set()
    literal = re.compile(r'''(?sx)(["'])(.*?)(?<!\\)\1|`(.*?)(?<!\\)`''')
    for match in literal.finditer(source):
        is_template = match.group(2) is None
        value = match.group(2) if not is_template else match.group(3)
        if not value:
            continue
        if is_template:
            placeholder = 0

            def mark_expression(_: re.Match[str]) -> str:
                nonlocal placeholder
                token = "{" + str(placeholder) + "}"
                placeholder += 1
                return token

            value = re.sub(r"\$\{.*?\}", mark_expression, value)
        else:
            value = re.sub(r"\$\{.*?\}", " ", value)
        if "<" in value and ">" in value:
            collector = TextCollector()
            collector.feed(value)
            values.update(collector.values)
        value = re.sub(r"<[^>]+>", " ", value)
        value = value.replace("\\n", " ").replace("\\u2192", "→")
        value = " ".join(html.unescape(value).split())
        if "{" in re.sub(r"\{\d+\}", "", value) or "}" in re.sub(r"\{\d+\}", "", value):
            continue
        value = re.sub(r"^[\s),;:+·–—-]+", "", value)
        value = re.sub(r"[\s(,;:+·–—-]+$", "", value)
        if is_visible_phrase(value):
            values.add(value)
    return values


def numbered_template(value: str) -> str | None:
    if re.search(r"\{\d+\}", value):
        return None
    index = 0

    def replace(_: re.Match[str]) -> str:
        nonlocal index
        token = "{" + str(index) + "}"
        index += 1
        return token

    normalized = re.sub(r"(?<![A-Za-z])\d[\d,.]*(?:%|★)?", replace, value)
    return normalized if index and normalized != value else None


def collect_catalog() -> list[str]:
    values: set[str] = set(FRAGMENTS) | set(TEMPLATES)
    index_collector = TextCollector()
    index_collector.feed((PUBLIC / "index.html").read_text(encoding="utf-8"))
    values.update(index_collector.values)
    for page in PAGES:
        collector = TextCollector()
        collector.feed((PUBLIC / f"{page}.html").read_text(encoding="utf-8"))
        values.update(collector.values)
        values.update(js_literal_phrases((PUBLIC / f"{page}.js").read_text(encoding="utf-8")))
    for script in ENGINE_SCRIPTS:
        values.update(js_literal_phrases((PUBLIC / f"{script}.js").read_text(encoding="utf-8")))
    values.update(js_literal_phrases((PUBLIC / "tool-common.js").read_text(encoding="utf-8")))
    for filename in ("research-trees.json", "tank-modifications.json"):
        add_json_strings(json.loads((PUBLIC / "data" / filename).read_text(encoding="utf-8")), values)
    for value in tuple(values):
        template = numbered_template(value)
        if template:
            values.add(template)
    return sorted(values, key=lambda value: (value.casefold(), value))


class BingTranslator:
    def __init__(self) -> None:
        self.cookie_jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookie_jar))
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        self.refresh()

    def refresh(self) -> None:
        request = urllib.request.Request("https://www.bing.com/translator", headers=self.headers)
        source = self.opener.open(request, timeout=30).read().decode("utf-8", "ignore")
        helper = re.search(r"params_AbusePreventionHelper\s*=\s*\[([^\]]+)", source)
        page_id = re.search(r'IG:"([^"]+)', source)
        if not helper or not page_id:
            raise RuntimeError("Could not initialize the translation session")
        self.key, self.token, _ = json.loads("[" + helper.group(1) + "]")
        self.page_id = page_id.group(1)

    def translate(self, source: str, language: str) -> str:
        data = urllib.parse.urlencode({
            "fromLang": "en", "text": source, "to": language,
            "token": self.token, "key": self.key,
            "tryFetchingGenderDebiasedTranslations": "true",
        }).encode()
        url = "https://www.bing.com/ttranslatev3?" + urllib.parse.urlencode({
            "isVertical": "1", "IG": self.page_id, "IID": "translator.5023.1",
        })
        headers = {
            **self.headers,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": "https://www.bing.com",
            "Referer": "https://www.bing.com/translator",
            "X-Requested-With": "XMLHttpRequest",
        }
        for attempt in range(4):
            try:
                request = urllib.request.Request(url, data=data, headers=headers)
                payload = json.loads(self.opener.open(request, timeout=45).read().decode("utf-8"))
                if not isinstance(payload, list):
                    raise RuntimeError(f"Translation service returned: {payload}")
                return payload[0]["translations"][0]["text"]
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(1.5 * (attempt + 1))
                self.refresh()
        raise AssertionError("unreachable")


def protect(value: str) -> tuple[str, dict[str, str]]:
    replacements: dict[str, str] = {}
    output = value
    terms = list(PROTECTED_TERMS) + re.findall(r"\{\d+\}", value)
    for index, term in enumerate(dict.fromkeys(terms)):
        if term not in output:
            continue
        token = f"__KEEP_{index:03d}__"
        output = output.replace(term, token)
        replacements[token] = term
    return output, replacements


def restore(value: str, replacements: dict[str, str]) -> str:
    for token, term in replacements.items():
        value = re.sub(re.escape(token), term, value, flags=re.IGNORECASE)
    return value


def chunks(values: list[str], limit: int = 850) -> list[list[str]]:
    result: list[list[str]] = []
    current: list[str] = []
    size = 0
    for value in values:
        addition = len(value) + 24
        if current and size + addition > limit:
            result.append(current)
            current = []
            size = 0
        current.append(value)
        size += addition
    if current:
        result.append(current)
    return result


def translate_catalog(values: list[str], language: str, translator: BingTranslator) -> dict[str, str]:
    result: dict[str, str] = {}
    for batch_number, batch in enumerate(chunks(values), start=1):
        protected: list[str] = []
        replacements: list[dict[str, str]] = []
        for value in batch:
            safe, tokens = protect(value)
            protected.append(safe)
            replacements.append(tokens)
        separators = [f"__FL2_{index:04d}__" for index in range(1, len(batch))]
        combined_parts: list[str] = []
        for index, value in enumerate(protected):
            combined_parts.append(value)
            if index < len(separators):
                combined_parts.append(separators[index])
        pattern = "|".join(re.escape(separator) for separator in separators)
        translated_parts: list[str] = []
        for retry in range(3):
            translated = translator.translate("\n".join(combined_parts), language)
            translated_parts = re.split(pattern, translated, flags=re.IGNORECASE) if separators else [translated]
            if len(translated_parts) == len(batch):
                break
            print(f"{language}: retrying batch {batch_number} after delimiter mismatch", flush=True)
            translator.refresh()
        if len(translated_parts) != len(batch):
            print(f"{language}: translating batch {batch_number} one phrase at a time", flush=True)
            translated_parts = [translator.translate(value, language) for value in protected]
        for source, target, tokens in zip(batch, translated_parts, replacements):
            result[source] = restore(target.strip(), tokens)
        print(f"{language}: batch {batch_number}/{len(chunks(values))}", flush=True)
        time.sleep(0.18)
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=PUBLIC / "tool-translations.js")
    parser.add_argument("--catalog-only", action="store_true")
    parser.add_argument("--update", action="store_true", help="Translate only phrases missing from an existing bundle")
    args = parser.parse_args()
    catalog = collect_catalog()
    print(f"Catalog: {len(catalog)} phrases, {sum(map(len, catalog))} characters")
    if args.catalog_only:
        print("\n".join(catalog))
        return
    translations: dict[str, dict[str, str]] = {}
    if args.update and args.output.exists():
        source = args.output.read_text(encoding="utf-8")
        translations = json.loads(source.split("window.FL2_TOOL_TRANSLATIONS=", 1)[1].rsplit(";", 1)[0])
    translator = BingTranslator()
    banner = "// Generated by scripts/build_tool_translations.py. Used locally at runtime; no translation API calls.\n"

    def write_bundle() -> None:
        payload = json.dumps(translations, ensure_ascii=False, separators=(",", ":"))
        args.output.write_text(banner + "window.FL2_TOOL_TRANSLATIONS=" + payload + ";\n", encoding="utf-8")

    for language in LANGUAGES:
        existing = {source: target for source, target in translations.get(language, {}).items() if source in set(catalog)}
        missing = [value for value in catalog if value not in existing]
        if missing:
            print(f"{language}: {len(missing)} new phrases")
            existing.update(translate_catalog(missing, language, translator))
        existing.update(MANUAL_OVERRIDES.get(language, {}))
        translations[language] = existing
        write_bundle()
    print(f"Wrote {args.output} ({args.output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()

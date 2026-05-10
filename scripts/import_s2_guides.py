from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from docx import Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/davidprice/Downloads/S2 Guide")
PUBLIC = ROOT / "public"
ASSET_ROOT = PUBLIC / "assets" / "guides" / "s2"
DATA_DIR = PUBLIC / "data"
SOURCE_DOCS = ROOT / "source-documents" / "s2"


LANGUAGES = [
    {"code": "en", "name": "English", "native": "English", "short": "EN", "flag": "🇺🇸", "dir": "ltr"},
    {"code": "es", "name": "Spanish", "native": "Español", "short": "ES", "flag": "🇪🇸", "dir": "ltr"},
    {"code": "fr", "name": "French", "native": "Français", "short": "FR", "flag": "🇫🇷", "dir": "ltr"},
    {"code": "de", "name": "German", "native": "Deutsch", "short": "DE", "flag": "🇩🇪", "dir": "ltr"},
    {"code": "ar", "name": "Arabic", "native": "العربية", "short": "AR", "flag": "🇸🇦", "dir": "rtl"},
    {"code": "tr", "name": "Turkish", "native": "Türkçe", "short": "TR", "flag": "🇹🇷", "dir": "ltr"},
]

LANGUAGE_ALIASES = {
    "en": ["english", " z day"],
    "es": ["spanish"],
    "fr": ["french"],
    "de": ["german"],
    "ar": ["arabic"],
    "tr": ["turkish"],
}

TOTAL_DAYS = 10


IMAGE_SOURCES = {
    1: {
        "en": "z day1.png",
        "es": "Spanish Day 1.png",
        "fr": "French Day 1.png",
        "de": "German.png",
        "ar": "Arabic Day 1.png",
        "tr": "Turkish.png",
    },
    2: {
        "en": "S2 Day 2 English.png",
        "es": "S2 Day 2 Spanish.png",
        "fr": "S2 Day 2 French.png",
        "de": "S2 Day 2 German.png",
        "ar": "S2 Day 2 Arabic.png",
        "tr": "S2 Day 2 Turkish.png",
    },
    3: {
        "en": "S2 Day 3 English.png",
        "es": "S2 Day 3 Spanish.png",
        "fr": "S2 Day 3 French.png",
        "de": "S2 Day 3 German.png",
        "ar": "S2 Day 3 Arabic.png",
        "tr": "S2 Day 3 Turkish.png",
    },
}


DOCX_SOURCES = {
    1: [
        "FL2_Day1_Master_Plan_Word_Outputs_DE_ES_AR_FR.docx",
    ],
    2: [
        "S2 Day 2 English.docx",
        "FL2_Day2_Master_Plan_All_Languages.docx",
    ],
    3: [
        "S2 Day 3 English.docx",
        "FL2_Day3_Master_Plan_All_Languages.docx",
    ],
}


@dataclass
class BlockRange:
    code: str
    start: int
    end: int | None


DAY1_PARAGRAPH_RANGES = [
    BlockRange("de", 0, 101),
    BlockRange("es", 101, 202),
    BlockRange("ar", 202, 303),
    BlockRange("fr", 303, None),
]

DAY3_BLOCK_RANGES = [
    BlockRange("ar", 0, 34),
    BlockRange("de", 34, 68),
    BlockRange("es", 68, 102),
    BlockRange("fr", 102, 136),
    BlockRange("tr", 136, None),
]


def child_to_block(child, document: Document) -> dict | None:
    if isinstance(child, CT_P):
        paragraph = Paragraph(child, document)
        text = paragraph.text.strip()
        if not text:
            return None
        return {"type": "paragraph", "text": text}

    if isinstance(child, CT_Tbl):
        table = Table(child, document)
        rows = []
        for row in table.rows:
            row_cells = []
            for cell in row.cells:
                lines = [p.text.strip() for p in cell.paragraphs if p.text.strip()]
                row_cells.append(lines)
            rows.append(row_cells)
        return {"type": "table", "rows": rows}

    return None


def iter_blocks(path: Path) -> list[dict]:
    document = Document(path)
    blocks = []
    for child in document.element.body.iterchildren():
        block = child_to_block(child, document)
        if block:
            blocks.append(block)
    return blocks


def paragraph_blocks(path: Path) -> list[dict]:
    document = Document(path)
    return [
        {"type": "paragraph", "text": paragraph.text.strip()}
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ]


def split_ranges(blocks: list[dict], ranges: list[BlockRange]) -> dict[str, list[dict]]:
    split = {}
    for item in ranges:
        split[item.code] = blocks[item.start : item.end]
    return split


def split_labeled_sections(blocks: list[dict]) -> dict[str, list[dict]]:
    labels = {
        "ARABIC": "ar",
        "GERMAN": "de",
        "SPANISH": "es",
        "FRENCH": "fr",
        "TURKISH": "tr",
    }
    sections: dict[str, list[dict]] = {}
    current = None
    for block in blocks:
        text = block.get("text", "")
        if block["type"] == "paragraph" and text in labels:
            current = labels[text]
            sections[current] = []
            continue
        if current:
            sections[current].append(block)
    return sections


def copy_assets() -> list[dict]:
    days = []
    for day in range(1, TOTAL_DAYS + 1):
        language_files = IMAGE_SOURCES.get(day, {})
        source_day = SOURCE / f"S2 Day {day}"
        day_exists = source_day.is_dir()
        entries = {}
        if day_exists:
            target_day = ASSET_ROOT / f"day-{day}"
            target_day.mkdir(parents=True, exist_ok=True)
            if not language_files:
                language_files = discover_images(source_day)

            for code, filename in language_files.items():
                source_path = source_day / filename
                if not source_path.exists():
                    continue
                target_path = target_day / f"{code}.png"
                shutil.copy2(source_path, target_path)
                entries[code] = {
                    "image": f"assets/guides/s2/day-{day}/{code}.png",
                    "sourceFile": filename,
                }

            source_doc_day = SOURCE_DOCS / f"day-{day}"
            source_doc_day.mkdir(parents=True, exist_ok=True)
            for filename in DOCX_SOURCES.get(day, []):
                source_doc = source_day / filename
                if source_doc.exists():
                    shutil.copy2(source_doc, source_doc_day / filename)

        days.append(
            {
                "id": f"day-{day}",
                "number": day,
                "title": f"S2 Day {day}",
                "label": f"Day {day}",
                "season": "Season 2",
                "status": "live" if len(entries) == len(LANGUAGES) else "upcoming",
                "languages": entries,
            }
        )
    return days


def discover_images(source_day: Path) -> dict[str, str]:
    discovered = {}
    images = [path for path in source_day.iterdir() if path.suffix.lower() == ".png"]
    for code, aliases in LANGUAGE_ALIASES.items():
        for path in images:
            name = f" {path.stem.lower()} "
            if any(alias in name for alias in aliases):
                discovered[code] = path.name
                break
    return discovered


def extract_docs() -> dict:
    docs: dict[str, dict[str, dict]] = {"day-1": {}, "day-2": {}, "day-3": {}}

    day1 = SOURCE / "S2 Day 1" / "FL2_Day1_Master_Plan_Word_Outputs_DE_ES_AR_FR.docx"
    for code, blocks in split_ranges(paragraph_blocks(day1), DAY1_PARAGRAPH_RANGES).items():
        docs["day-1"][code] = {
            "source": day1.name,
            "title": "S2 Day 1 Master Plan",
            "blocks": blocks,
        }

    day2_en = SOURCE / "S2 Day 2" / "S2 Day 2 English.docx"
    docs["day-2"]["en"] = {
        "source": day2_en.name,
        "title": "S2 Day 2 Alliance Mails",
        "blocks": iter_blocks(day2_en),
    }

    day2_all = SOURCE / "S2 Day 2" / "FL2_Day2_Master_Plan_All_Languages.docx"
    for code, blocks in split_labeled_sections(iter_blocks(day2_all)).items():
        docs["day-2"][code] = {
            "source": day2_all.name,
            "title": "S2 Day 2 Alliance Mails",
            "blocks": blocks,
        }

    day3_en = SOURCE / "S2 Day 3" / "S2 Day 3 English.docx"
    docs["day-3"]["en"] = {
        "source": day3_en.name,
        "title": "S2 Day 3 Master Plan",
        "blocks": iter_blocks(day3_en),
    }

    day3_all = SOURCE / "S2 Day 3" / "FL2_Day3_Master_Plan_All_Languages.docx"
    for code, blocks in split_ranges(iter_blocks(day3_all), DAY3_BLOCK_RANGES).items():
        docs["day-3"][code] = {
            "source": day3_all.name,
            "title": "S2 Day 3 Master Plan",
            "blocks": blocks,
        }

    return docs


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    manifest = {
        "clan": "FrostBorn Lions",
        "tag": "FL2",
        "season": "Season 2",
        "languages": LANGUAGES,
        "days": copy_assets(),
        "uploads": [],
        "library": [
            {"id": "s2-guides", "title": "Season 2 Guides", "status": "live"},
            {"id": "alliance-mails", "title": "Alliance Mail Text", "status": "live"},
            {"id": "future-uploads", "title": "Upload Queue", "status": "ready"},
        ],
    }
    write_json(DATA_DIR / "manifest.json", manifest)
    write_json(DATA_DIR / "docs.json", extract_docs())


if __name__ == "__main__":
    main()

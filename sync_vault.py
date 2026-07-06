#!/usr/bin/env python3
"""
sync_vault.py — Obsidian vault → binyoun.com JSON data files

Reads structured frontmatter from the Obsidian vault and updates
the data/ JSON files that power the website.

Usage:
    python3 sync_vault.py

    # Preview without writing files:
    python3 sync_vault.py --dry-run

Sync semantics (merge, not regenerate):
  - Vault notes are matched to existing JSON entries by title.
  - Matched entries get their year/image/link/venue/... updated from
    frontmatter, but only when the frontmatter value is non-empty, and
    hand-maintained fields the vault doesn't know about (cat, still,
    coauthors edits, ...) are always preserved.
  - New vault entries are appended (works need an image in frontmatter
    to be appended, so the site never renders an empty thumbnail).
  - Nothing is ever deleted by this script; remove entries by hand.
  - Publications/talks sync ONLY from Research/Accepted/ — Ongoing,
    Rejected, Withdrawn, and Archive never reach the site.
  - Sections that are curated by hand (sculptures table, committee,
    initiatives, decks, poem, exhibitions, workshops) are preserved.
"""

import json
import sys
from pathlib import Path
import re

DRY_RUN = "--dry-run" in sys.argv

VAULT = Path.home() / "Documents" / "Obsidian Vault"
DATA  = Path(__file__).parent / "data"

REPORT = []   # human-readable notes about what happened / needs attention

# ── helpers ──────────────────────────────────────────────────────────────────

def parse_frontmatter(path: Path) -> dict:
    """Return frontmatter dict from a markdown file. Returns {} on failure."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    raw = text[3:end].strip()
    result = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip().lstrip("- ")
        val = val.strip().strip('"').strip("'")
        if val:
            result[key] = val
    # parse tags list (multiline yaml list)
    tags = re.findall(r"^\s+- (.+)$", raw, re.MULTILINE)
    if tags:
        result["tags"] = [t.strip() for t in tags]
    return result

ORIGINALS = {}  # parsed snapshot at load time, to skip no-op rewrites

def load_json(filename: str) -> dict:
    text = (DATA / filename).read_text(encoding="utf-8")
    ORIGINALS[filename] = json.loads(text)
    return json.loads(text)

def save_json(filename: str, data: dict):
    if data == ORIGINALS.get(filename):
        print(f"  =  {filename} unchanged, not rewritten")
        return
    out = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if DRY_RUN:
        print(f"  (dry run) would write {filename}")
    else:
        (DATA / filename).write_text(out, encoding="utf-8")
        print(f"  ✓  {filename}")

def fm_str(fm: dict, key: str) -> str:
    return fm.get(key, "") or ""

def norm_title(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().casefold()

def merge_entries(existing: list, incoming: list, section: str,
                  overwrite=(), fill=(), append=True, append_requires=()):
    """Merge vault-derived entries into an existing JSON list by title.

    `overwrite` fields: vault is the source of truth, replaces site value.
    `fill` fields: only set when the site entry is missing them, so curated
    site values (internal page links, edited venue strings) always win.
    Every field the vault doesn't provide is kept. Unmatched vault entries
    are appended (when allowed and append_requires fields are present).
    Never deletes.
    """
    by_title = {norm_title(e.get("title", "")): e for e in existing if e.get("title")}
    for inc in incoming:
        key = norm_title(inc.get("title", ""))
        cur = by_title.get(key)
        if cur is not None:
            for f in overwrite:
                val = inc.get(f, "")
                if val and str(cur.get(f, "")) != str(val):
                    REPORT.append(f"{section}: '{cur['title']}' {f}: {cur.get(f, '(none)')!r} → {val!r}")
                    cur[f] = val
            for f in fill:
                val = inc.get(f, "")
                if val and not cur.get(f):
                    REPORT.append(f"{section}: '{cur['title']}' filled missing {f}: {val!r}")
                    cur[f] = val
        elif append:
            missing = [f for f in append_requires if not inc.get(f)]
            if missing:
                REPORT.append(f"{section}: NOT appended (missing {', '.join(missing)} in vault note): '{inc.get('title','?')}'")
            else:
                REPORT.append(f"{section}: appended new entry '{inc.get('title','?')}'")
                existing.append(inc)
        else:
            REPORT.append(f"{section}: vault note has no matching site entry (section is hand-curated, not appending): '{inc.get('title','?')}'")
    return existing

# ── artist.json ───────────────────────────────────────────────────────────────

def build_artist():
    data = load_json("artist.json")
    buckets = {"current": [], "installation": [], "sculpture": [], "lens": []}

    for md in sorted((VAULT / "Works").rglob("*.md")):
        fm = parse_frontmatter(md)
        if not fm.get("title"):
            continue
        # skip index/series notes that don't map to single works
        if md.name == "INDEX.md" or fm.get("title") in (
            "Sensory-Based Moving Image Installations", "Sculptures (Series)"
        ):
            continue

        cat = fm.get("category", "installation")
        if cat not in buckets:
            continue

        entry = {"title": fm_str(fm, "title"), "year": fm_str(fm, "year"), "cat": cat}
        for f in ("image", "link"):
            if fm.get(f):
                entry[f] = fm_str(fm, f)
        if cat == "sculpture" and fm.get("medium"):
            entry["medium"] = fm_str(fm, "medium")
        buckets[cat].append(entry)

    # current + installations + lens: update matched, append new works that
    # have an image (an entry without a thumbnail would render broken).
    # link/image are fill-only: the site's internal /artist/ page links must
    # never be replaced by the vault's external documentation links.
    merge_entries(data.get("current", []),       buckets["current"], "artist/current",
                  overwrite=("year",), fill=("image", "link"), append_requires=("image",))
    merge_entries(data.get("installations", []), buckets["installation"], "artist/installations",
                  overwrite=("year",), fill=("image", "link"), append_requires=("image",))
    merge_entries(data.get("lens", []),          buckets["lens"], "artist/lens",
                  overwrite=("year",), fill=("image", "link"), append_requires=("image",))
    # sculptures are managed via the Sculptures note table: update only.
    merge_entries(data.get("sculptures", []),    buckets["sculpture"], "artist/sculptures",
                  overwrite=("year", "medium"), fill=("image", "link"), append=False)

    # "current" keeps its hand-curated order; the archives sort newest-first
    for key in ("installations", "lens"):
        data[key].sort(key=lambda x: str(x.get("year", "0")), reverse=True)

    save_json("artist.json", data)

# ── researcher.json ───────────────────────────────────────────────────────────

PUBLICATION_TYPES = {"publication", "paper", "research-artefact"}

def build_researcher():
    data = load_json("researcher.json")
    publications = []
    talks = []

    # Accepted only: Ongoing/Rejected/Withdrawn/Archive never reach the site.
    for md in sorted((VAULT / "Research" / "Accepted").rglob("*.md")):
        fm = parse_frontmatter(md)
        if not fm.get("title"):
            continue

        note_type = fm.get("type", "")
        tags = fm.get("tags", [])

        # explicit type wins over tags: an 'initiative' note tagged
        # 'publication' is still an initiative, not a publication
        is_publication = (note_type in PUBLICATION_TYPES if note_type
                          else "publication" in tags)
        if is_publication:
            entry = {"title": fm_str(fm, "title"), "venue": fm_str(fm, "venue")}
            for f in ("year", "coauthors"):
                if fm.get(f):
                    entry[f] = fm_str(fm, f)
            link = fm.get("link") or fm.get("doi")
            if link:
                entry["link"] = link
            publications.append(entry)

        elif note_type == "talk":
            entry = {"title": fm_str(fm, "title"), "venue": fm_str(fm, "venue")}
            link = fm.get("link") or fm.get("doi")
            if link:
                entry["link"] = link
            talks.append(entry)

    # venue/coauthors/link are fill-only: the site's venue strings are
    # curated (and vault ones can carry em-dashes, banned in site copy)
    merge_entries(data.get("publications", []), publications, "researcher/publications",
                  overwrite=("year",), fill=("venue", "coauthors", "link"))
    merge_entries(data.get("talks", []), talks, "researcher/talks",
                  fill=("venue", "link"))

    data["publications"].sort(key=lambda x: str(x.get("year", "0")), reverse=True)

    save_json("researcher.json", data)

# ── educator.json ─────────────────────────────────────────────────────────────

def build_educator():
    """Educator JSON is mostly hand-maintained; this syncs the role block."""
    existing = load_json("educator.json")
    md_path = VAULT / "Teaching" / "RMIT Vietnam.md"

    if md_path.exists():
        fm = parse_frontmatter(md_path)
        # "title" in RMIT Vietnam.md is the note name, not the role title
        # role details are preserved from existing JSON
        if fm.get("institution"):
            existing["role"]["institution"] = fm_str(fm, "institution")

    save_json("educator.json", existing)

# ── bio.json ──────────────────────────────────────────────────────────────────

def build_bio():
    """Bio JSON is mostly hand-maintained; this is a no-op placeholder."""
    existing = load_json("bio.json")
    save_json("bio.json", existing)

# ── main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if DRY_RUN:
        print("DRY RUN — no files will be written\n")
    else:
        print("Syncing vault → data/\n")

    build_artist()
    build_researcher()
    build_educator()
    build_bio()

    if REPORT:
        print("\nChanges and notes:")
        for line in REPORT:
            print("  •", line)
    else:
        print("\nNo differences between vault frontmatter and site data.")

    if not DRY_RUN:
        print("\nDone. Commit and push to deploy:")
        print("  cd ~/Projects/site && git add data/ && git commit -m 'sync: update content from vault' && git push")

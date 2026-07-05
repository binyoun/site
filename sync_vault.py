#!/usr/bin/env python3
"""
sync_vault.py — Obsidian vault → binyoun.com JSON data files

Reads structured frontmatter from the Obsidian vault and regenerates
the data/ JSON files that power the website.

Usage:
    python3 sync_vault.py

    # Preview without writing files:
    python3 sync_vault.py --dry-run

The script preserves sections it cannot derive from the vault
(e.g. poem, exhibitions, workshops) so it is safe to run at any time.
"""

import json
import re
import sys
import os
from pathlib import Path

DRY_RUN = "--dry-run" in sys.argv

VAULT = Path.home() / "Documents" / "Obsidian Vault"
DATA  = Path(__file__).parent / "data"

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

def load_json(filename: str) -> dict:
    return json.loads((DATA / filename).read_text(encoding="utf-8"))

def save_json(filename: str, data: dict):
    out = json.dumps(data, ensure_ascii=False, indent=2)
    if DRY_RUN:
        print(f"\n── {filename} (dry run) ──\n{out[:600]}{'...' if len(out) > 600 else ''}")
    else:
        (DATA / filename).write_text(out, encoding="utf-8")
        print(f"  ✓  {filename}")

def fm_str(fm: dict, key: str) -> str:
    return fm.get(key, "") or ""

# ── artist.json ───────────────────────────────────────────────────────────────

def build_artist():
    existing = load_json("artist.json")
    buckets = {"current": [], "installation": [], "sculpture": [], "lens": []}

    for md in sorted((VAULT / "Works").glob("*.md")):
        fm = parse_frontmatter(md)
        if not fm.get("title"):
            continue

        # skip index/series notes that don't map to single works
        if fm.get("title") in ("Sensory-Based Moving Image Installations", "Sculptures (Series)"):
            continue

        cat = fm.get("category", "installation")
        if cat not in buckets:
            continue

        entry = {"title": fm_str(fm, "title"), "year": fm_str(fm, "year")}
        if fm.get("image"):
            entry["image"] = fm_str(fm, "image")
        if fm.get("link"):
            entry["link"] = fm_str(fm, "link")
        if cat == "sculpture" and fm.get("medium"):
            entry["medium"] = fm_str(fm, "medium")

        buckets[cat].append(entry)

    # sort each bucket by year descending (newest first)
    for key in buckets:
        buckets[key].sort(key=lambda x: x.get("year", "0"), reverse=True)

    # Sculptures are managed manually in the Sculptures.md note table,
    # so fall back to existing JSON to avoid losing medium/image data.
    updated = {
        "_note": existing.get("_note", ""),
        # current is curated manually — exhibition-specific entries, not work records
        "current":       existing.get("current", []),
        "installations": buckets["installation"]  or existing.get("installations", []),
        "sculptures":    existing.get("sculptures", []),  # preserved — edit Sculptures.md
        "lens":          buckets["lens"]           or existing.get("lens", []),
        "poem":          existing.get("poem", ""),
        "exhibitions":   existing.get("exhibitions", {}),
    }
    save_json("artist.json", updated)

# ── researcher.json ───────────────────────────────────────────────────────────

def build_researcher():
    existing = load_json("researcher.json")
    publications = []
    talks = []

    for md in sorted((VAULT / "Research").glob("*.md")):
        fm = parse_frontmatter(md)
        if not fm.get("title"):
            continue

        note_type = fm.get("type", "")
        tags = fm.get("tags", [])

        if note_type == "publication" or "publication" in tags:
            entry = {"title": fm_str(fm, "title"), "venue": fm_str(fm, "venue")}
            if fm.get("coauthors"):
                entry["coauthors"] = fm_str(fm, "coauthors")
            if fm.get("doi"):
                entry["doi"] = fm_str(fm, "doi")
            publications.append(entry)

        elif note_type == "talk":
            entry = {
                "venue": fm_str(fm, "venue"),
                "title": fm_str(fm, "title"),
            }
            if fm.get("doi"):
                entry["link"] = fm_str(fm, "doi")
            talks.append(entry)

    updated = {
        "_note": existing.get("_note", ""),
        "committee":    existing.get("committee", []),
        "publications": publications or existing.get("publications", []),
        "talks":        talks        or existing.get("talks", []),
        "decks":        existing.get("decks", []),
    }
    save_json("researcher.json", updated)

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

    if not DRY_RUN:
        print("\nDone. Commit and push to deploy:")
        print("  cd ~/Projects/site && git add data/ && git commit -m 'sync: update content from vault' && git push")

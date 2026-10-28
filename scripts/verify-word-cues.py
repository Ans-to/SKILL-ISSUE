#!/usr/bin/env python3
"""Validate transcript-to-word cue coverage and monotonic alignment bounds."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CUES = ROOT / "src" / "kinetic" / "word-cues.json"
DURATIONS = {"scene-1.mp3": 10.87, "scene-2.mp3": 11.08, "scene-3.mp3": 9.04}


def tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def main() -> None:
    payload = json.loads(CUES.read_text(encoding="utf-8"))
    total = 0
    for track in payload["tracks"]:
        name = track["audio"]
        if name not in DURATIONS:
            raise SystemExit(f"Unexpected narration asset: {name}")
        spoken = tokens(track["text"])
        aligned = [re.sub(r"[^a-z0-9]", "", item["text"].lower()) for item in track["words"]]
        if spoken != aligned:
            raise SystemExit(f"Transcript and word cues diverge in {name}: {spoken} != {aligned}")
        previous_start = -1.0
        for cue in track["words"]:
            start, end = float(cue["start"]), float(cue["end"])
            if not (0 <= start < end <= DURATIONS[name]):
                raise SystemExit(f"Out-of-range word cue in {name}: {cue}")
            if start < previous_start:
                raise SystemExit(f"Non-monotonic word order in {name}: {cue}")
            previous_start = start
        total += len(aligned)
    if len(payload["tracks"]) != len(DURATIONS):
        raise SystemExit("Expected exactly three aligned narration tracks")
    print(f"Verified {total} word cues across {len(payload['tracks'])} narration tracks.")


if __name__ == "__main__":
    main()

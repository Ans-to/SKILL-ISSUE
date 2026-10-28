#!/usr/bin/env python3
"""Validate exact narration spelling and monotonic word-level timestamps."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CUES = ROOT / "src" / "engine" / "word-cues.json"
AUDIO_NAME = "voiceover.wav"
DURATION_SECONDS = 60.0


def tokens(text: str) -> list[str]:
    return re.findall(r"\d+(?:\.\d+)+|\d+|[a-z]+(?:['’][a-z]+)?", text.lower())


def main() -> None:
    payload = json.loads(CUES.read_text(encoding="utf-8"))
    if len(payload["tracks"]) != 1:
        raise SystemExit("Expected exactly one narration track.")
    track = payload["tracks"][0]
    if track["audio"] != AUDIO_NAME:
        raise SystemExit(f"Unexpected narration asset: {track['audio']}")

    spoken = tokens(track["text"])
    aligned = tokens(" ".join(item["text"] for item in track["words"]))
    if spoken != aligned:
        raise SystemExit(f"Transcript and word cues diverge: {spoken} != {aligned}")
    previous_start = -1.0
    for cue in track["words"]:
        start, end = float(cue["start"]), float(cue["end"])
        if not (0 <= start < end <= DURATION_SECONDS):
            raise SystemExit(f"Out-of-range word cue: {cue}")
        if start < previous_start:
            raise SystemExit(f"Non-monotonic word order: {cue}")
        previous_start = start
    print(f"Verified {len(track['words'])} exact script word cues in one 60-second narration track.")


if __name__ == "__main__":
    main()

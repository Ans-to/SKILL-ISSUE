#!/usr/bin/env python3
"""Validate the canonical narration, WAV binding and absolute word-frame map."""
from __future__ import annotations

import hashlib
import json
import math
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CUES = ROOT / "src" / "engine" / "agent-engine-word-cues.json"
FRAME_CUES = ROOT / "src" / "engine" / "agent-engine-frame-cues.json"
AUDIO = ROOT / "public" / "agent-engine" / "voiceover.wav"
ENVELOPE = ROOT / "src" / "engine" / "agent-engine-audio-envelope.json"


def frame_at_or_after(seconds: float, fps: int) -> int:
    return math.ceil(seconds * fps - 1e-9)


def main() -> None:
    payload = json.loads(CUES.read_text(encoding="utf-8"))
    frame_cues = json.loads(FRAME_CUES.read_text(encoding="utf-8"))
    envelope = json.loads(ENVELOPE.read_text(encoding="utf-8"))
    if len(payload["tracks"]) != 1:
        raise SystemExit("Expected exactly one narration track.")
    track = payload["tracks"][0]
    if track["audio"] != AUDIO.name:
        raise SystemExit(f"Unexpected narration asset: {track['audio']}")

    digest = hashlib.sha256(AUDIO.read_bytes()).hexdigest()
    if payload.get("audioSha256") != digest or frame_cues.get("audioSha256") != digest:
        raise SystemExit("Word/frame cues are not bound to the current WAV; regenerate alignment.")
    fps = frame_cues["fps"]
    if frame_cues["format"] != "absolute-frame-cues-v1" or fps != 30 or envelope["fps"] != fps:
        raise SystemExit("Unexpected frame-cue format or mismatched frame rate.")

    with wave.open(str(AUDIO), "rb") as wav:
        audio_duration = wav.getnframes() / wav.getframerate()
    duration_frames = envelope["trackFrames"][0]
    if duration_frames != math.ceil(audio_duration * fps) or len(envelope["energy"]) != duration_frames:
        raise SystemExit("Audio envelope/composition duration does not match the WAV.")

    expected_words = track["text"].replace("—", "— ").replace("-", "- ").split()
    words = track["words"]
    if expected_words != [item["text"] for item in words]:
        raise SystemExit("The visible words do not exactly preserve transcript spelling and punctuation.")
    starts, ends = frame_cues["startFrames"], frame_cues["endFrames"]
    if len(starts) != len(words) or len(ends) != len(words):
        raise SystemExit("There must be exactly one absolute start and end frame per word.")

    previous_end = 0.0
    previous_end_frame = 0
    total_active_frames = 0
    for index, cue in enumerate(words):
        start, end = float(cue["start"]), float(cue["end"])
        first_frame, end_frame = starts[index], ends[index]
        if not (0 <= start < end <= audio_duration and 0 <= first_frame < end_frame <= duration_frames):
            raise SystemExit(f"Out-of-range or empty word cue: {cue}")
        if start < previous_end or first_frame < previous_end_frame:
            raise SystemExit(f"Overlapping or out-of-order word cue: {cue}")
        if first_frame != frame_at_or_after(start, fps) or end_frame != frame_at_or_after(end, fps):
            raise SystemExit(f"Absolute frame boundary differs from alignment: {cue}")
        previous_end = end
        previous_end_frame = end_frame
        total_active_frames += end_frame - first_frame

    print(f"Verified {len(words)} exact transcript words and absolute frame intervals against WAV SHA-256 {digest[:12]}.")
    print(f"Track: {duration_frames} frames at {fps} fps; {total_active_frames} active-word frames; {duration_frames - total_active_frames} pause frames.")


if __name__ == "__main__":
    main()

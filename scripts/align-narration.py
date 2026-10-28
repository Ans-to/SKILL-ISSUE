#!/usr/bin/env python3
"""Align the supplied script to its generated narration with word timestamps."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
AUDIO_FILE = ROOT / "public" / "after-effects" / "voiceover.wav"
OUTPUT = ROOT / "src" / "engine" / "word-cues.json"
SCRIPT = """Holy shit... you are not ready for this.
I made these motion graphics without even opening After Effects. And no—I'm not talking about an After Effects MCP.
This is Claude Opus 5.5. Instead of controlling After Effects, you basically tell Claude what you want the animation to look like.
Claude doesn’t actually generate an MP4 directly. It writes the animation itself as code—the text, shapes, positions, easing, transitions, particles—basically every visual element is defined mathematically over time.
So instead of: After Effects to layers to keyframes to graph editor to render... you’re essentially doing: Prompt to code to render to video.
And because the animation is procedural, you can literally tell Claude: “Make this transition smoother, change the color, slow this section down, make the ending seamlessly loop into the beginning.” And it modifies the underlying animation instead of you manually moving hundreds of keyframes.
Does this replace After Effects? Not really. But for certain types of motion graphics... the fact that you can go from an idea to a working animation without touching a timeline is pretty insane."""


def canonical_words(text: str) -> list[str]:
    # Split em-dash compounds into spoken word cues while keeping the dash on the first word.
    return text.replace("—", "— ").split()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", required=True, help="Local faster-whisper CTranslate2 model folder")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--compute-type", default="int8")
    args = parser.parse_args()

    model = WhisperModel(args.model_dir, device=args.device, compute_type=args.compute_type, cpu_threads=2, num_workers=1)
    segments, info = model.transcribe(
        str(AUDIO_FILE), language="en", beam_size=5, word_timestamps=True,
        vad_filter=False, condition_on_previous_text=False,
    )
    recognized = []
    recognized_text = []
    for segment in segments:
        if segment.text.strip():
            recognized_text.append(segment.text.strip())
        for item in segment.words or []:
            if item.word.strip():
                recognized.append({"text": item.word.strip(), "start": float(item.start), "end": float(item.end)})

    # Whisper splits the spoken decimal “five point five” into two word events; join it
    # into the exact written cue “5.5.” so the on-screen transcript matches the script.
    merged = []
    index = 0
    while index < len(recognized):
        current = recognized[index]
        if current["text"].strip() == "5" and index + 1 < len(recognized) and recognized[index + 1]["text"].strip().lower().strip(".") == "5":
            following = recognized[index + 1]
            merged.append({"start": current["start"], "end": following["end"]})
            index += 2
        else:
            merged.append({"start": current["start"], "end": current["end"]})
            index += 1

    words = canonical_words(SCRIPT)
    if len(merged) != len(words):
        raise SystemExit(
            f"Script/ASR word count mismatch: {len(words)} script words, {len(merged)} aligned events. "
            f"ASR heard: {' '.join(recognized_text)}"
        )

    timed_words = [
        {"text": word, "start": round(timing["start"], 3), "end": round(timing["end"], 3)}
        for word, timing in zip(words, merged)
    ]
    track = {
        "audio": "voiceover.wav",
        "language": info.language,
        "text": SCRIPT,
        "words": timed_words,
    }
    payload = {
        "format": "word-cues-v1",
        "aligner": "faster-whisper small / word_timestamps, canonical script text",
        "tracks": [track],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Aligned {len(timed_words)} exact script words to voiceover.wav ({info.duration:.2f}s).")
    print(f"Recognized transcript: {' '.join(recognized_text)}")
    print(f"Wrote aligned cues to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

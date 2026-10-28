#!/usr/bin/env python3
"""Derive a render-frame RMS envelope from the full natural-speed narration."""
from __future__ import annotations

import array
import json
import math
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO_FILE = ROOT / "public" / "agent-engine" / "voiceover.wav"
OUTPUT = ROOT / "src" / "engine" / "agent-engine-audio-envelope.json"
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
FPS = 30
SAMPLE_RATE = 8000


def decode(path: Path) -> tuple[list[int], int]:
    ffmpeg = str(FFMPEG) if FFMPEG.exists() else "ffmpeg"
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        subprocess.run(
            [ffmpeg, "-y", "-i", str(path), "-ac", "1", "-ar", str(SAMPLE_RATE), "-sample_fmt", "s16", tmp.name],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with wave.open(tmp.name, "rb") as wav:
            rate = wav.getframerate()
            samples = array.array("h")
            samples.frombytes(wav.readframes(wav.getnframes()))
            return list(samples), rate


def main() -> None:
    samples, sample_rate = decode(AUDIO_FILE)
    duration_seconds = len(samples) / sample_rate
    frame_count = math.ceil(duration_seconds * FPS)
    raw: list[float] = []
    for frame in range(frame_count):
        start = round(frame * sample_rate / FPS)
        end = min(len(samples), round((frame + 1) * sample_rate / FPS))
        window = samples[start:end]
        rms = math.sqrt(sum(value * value for value in window) / len(window)) if window else 0.0
        raw.append(rms)

    nonzero = sorted(value for value in raw if value > 0)
    reference = nonzero[round((len(nonzero) - 1) * 0.95)] if nonzero else 1.0
    compressed = [min(1.0, (value / max(reference, 1.0)) ** 0.62) for value in raw]
    smoothed = [
        sum(compressed[max(0, i - 1): min(len(compressed), i + 2)]) / len(compressed[max(0, i - 1): min(len(compressed), i + 2)])
        for i in range(len(compressed))
    ]
    result = {"fps": FPS, "playbackRate": 1.0, "sampleRate": SAMPLE_RATE, "trackFrames": [frame_count], "energy": [round(value, 5) for value in smoothed]}
    OUTPUT.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(smoothed)} frame samples to {OUTPUT.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Derive a render-frame RMS/momentum envelope from the narration MP3s."""
from __future__ import annotations

import array
import json
import math
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "public" / "audio"
OUTPUT = ROOT / "src" / "kinetic" / "audio-envelope.json"
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
FPS = 30
PLAYBACK_RATE = 1.0
SAMPLE_RATE = 8000
TRACKS = [
    ("scene-1.mp3", 10.87),
    ("scene-2.mp3", 11.08),
    ("scene-3.mp3", 9.04),
]


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
    frame_count_by_track = [math.ceil(seconds / PLAYBACK_RATE * FPS) for _, seconds in TRACKS]
    raw: list[float] = []
    for (filename, _), frame_count in zip(TRACKS, frame_count_by_track):
        samples, sample_rate = decode(AUDIO_DIR / filename)
        for local_frame in range(frame_count):
            start = round(local_frame * PLAYBACK_RATE / FPS * sample_rate)
            end = min(len(samples), round((local_frame + 1) * PLAYBACK_RATE / FPS * sample_rate))
            window = samples[start:end]
            rms = math.sqrt(sum(value * value for value in window) / len(window)) if window else 0.0
            raw.append(rms)

    nonzero = sorted(value for value in raw if value > 0)
    reference = nonzero[round((len(nonzero) - 1) * 0.95)] if nonzero else 1.0
    compressed = [min(1.0, (value / max(reference, 1.0)) ** 0.62) for value in raw]
    # Smooth brief codec/sample fluctuations without suppressing consonant transients.
    smoothed: list[float] = []
    for i in range(len(compressed)):
        neighbors = compressed[max(0, i - 1): min(len(compressed), i + 2)]
        smoothed.append(sum(neighbors) / len(neighbors))

    result = {
        "fps": FPS,
        "playbackRate": PLAYBACK_RATE,
        "sampleRate": SAMPLE_RATE,
        "trackFrames": frame_count_by_track,
        "energy": [round(value, 5) for value in smoothed],
    }
    OUTPUT.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(smoothed)} frame samples to {OUTPUT.relative_to(ROOT)}; track frames: {frame_count_by_track}")


if __name__ == "__main__":
    main()

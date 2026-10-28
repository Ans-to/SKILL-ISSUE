#!/usr/bin/env python3
"""Align exact spoken words to the narration tracks with faster-whisper word timestamps."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "public" / "audio"
OUTPUT = ROOT / "src" / "kinetic" / "word-cues.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", required=True, help="Local faster-whisper CTranslate2 model folder")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--compute-type", default="int8")
    args = parser.parse_args()

    model = WhisperModel(args.model_dir, device=args.device, compute_type=args.compute_type, cpu_threads=2, num_workers=1)
    tracks = []
    for path in sorted(AUDIO_DIR.glob("scene-*.mp3")):
        segments, info = model.transcribe(
            str(path), language="en", beam_size=5, word_timestamps=True,
            vad_filter=False, condition_on_previous_text=False,
        )
        words = []
        transcript = []
        for segment in segments:
            if segment.text.strip():
                transcript.append(segment.text.strip())
            for item in segment.words or []:
                text = item.word.strip()
                if text:
                    words.append({"text": text, "start": round(item.start, 3), "end": round(item.end, 3)})
        tracks.append({"audio": path.name, "language": info.language, "text": " ".join(transcript), "words": words})
        print(f"Aligned {len(words)} words in {path.name}: {' '.join(transcript)}")

    payload = {"format": "word-cues-v1", "aligner": "faster-whisper small / word_timestamps", "tracks": tracks}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote aligned cues to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

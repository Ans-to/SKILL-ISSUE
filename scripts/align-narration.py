#!/usr/bin/env python3
"""Align the submitted engine-first script to its generated narration."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
AUDIO_FILE = ROOT / "public" / "agent-engine" / "voiceover.wav"
OUTPUT = ROOT / "src" / "engine" / "agent-engine-word-cues.json"
SCRIPT = """Your AI agent didn’t build anything. It pasted a template.
It looks finished. That’s the trick. Boilerplate demos clean. Real codebases break.
Prompt harder? No. It still can’t infer your codebase’s timing model, render graph, or hard constraints from a pretty prompt.
Engine-first means physics, isolation, timing, positions, easing, transitions—defined as math. Same inputs. Same frames. No template roulette.
Feed intent into the engine. It compiles the prompt to code, code to frames, frames to MP4. Fast. Inspectable. Repeatable.
Stop playing with templates. Build the engine—or ship toys."""


def canonical_words(text: str) -> list[str]:
    # Split compounds into word-sized cues while retaining their original hyphen or dash.
    return text.replace("—", "— ").replace("-", "- ").split()


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

    # Whisper splits “codebases” into “co” + “-bases/-basis” and contracts
    # “prompt to” into “prompter”. Restore the script's lexical events while
    # keeping each merged/split event on the observed acoustic interval.
    merged = []
    index = 0
    while index < len(recognized):
        current = recognized[index]
        token = current["text"].strip().lower().strip(".,!?;:")
        following = recognized[index + 1] if index + 1 < len(recognized) else None
        next_token = following["text"].strip().lower().strip(".,!?;:") if following else ""
        if token in {"co", "code"} and next_token in {"-bases", "bases", "-basis", "basis"}:
            merged.append({"start": current["start"], "end": following["end"]})
            index += 2
        elif token in {"prompter", "promptto"}:
            split = current["start"] + (current["end"] - current["start"]) * 0.62
            merged.extend([
                {"start": current["start"], "end": split},
                {"start": split, "end": current["end"]},
            ])
            index += 1
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
        {"text": word, "start": round(item["start"], 3), "end": round(item["end"], 3)}
        for word, item in zip(words, merged)
    ]
    track = {"audio": "voiceover.wav", "language": info.language, "text": SCRIPT, "words": timed_words}
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

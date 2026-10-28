#!/usr/bin/env python3
"""Force-align the approved transcript and generate absolute 30 fps frame cues.

Requires PocketSphinx 5.1.1 (pip install pocketsphinx==5.1.1) and ffmpeg. The transcript and
its spelling come from the existing word-cue JSON; this script never invents or
reorders words. Reviewed corrections are bound to the exact WAV hash.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import subprocess
import tempfile
import wave
from pathlib import Path

from pocketsphinx import Decoder

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public" / "agent-engine" / "voiceover.wav"
CUES = ROOT / "src" / "engine" / "agent-engine-word-cues.json"
FRAME_CUES = ROOT / "src" / "engine" / "agent-engine-frame-cues.json"
OVERRIDES = ROOT / "scripts" / "agent-engine-align-overrides.json"
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
FPS = 30

# Words absent from the English CMU dictionary or spoken as initialisms.
PRONUNCIATIONS = {
    "aiword": "EY AY",
    "codebases": "K OW D B EY S IH Z",
    "codebasespossessive": "K OW D B EY S IH Z",
    "mp4word": "EH M P IY F AO R",
    "inspectable": "IH N S P EH K T AH B AH L",
}
SPECIAL_WORDS = {"ai": "aiword", "mp4": "mp4word", "codebase's": "codebasespossessive"}


def normalize_for_dictionary(text: str) -> str:
    normalized = text.lower().replace("’", "'").strip(".,!?;:—-")
    return SPECIAL_WORDS.get(normalized, normalized)


def frame_at_or_after(seconds: float) -> int:
    # A frame cannot be displayed at a subframe time. Do not preview a word
    # before the aligned acoustic onset; error is strictly less than one frame.
    return math.ceil(seconds * FPS - 1e-9)


def main() -> None:
    payload = json.loads(CUES.read_text(encoding="utf-8"))
    if len(payload["tracks"]) != 1:
        raise SystemExit("Expected one canonical narration track.")
    track = payload["tracks"][0]
    words = track["words"]
    audio_hash = hashlib.sha256(AUDIO.read_bytes()).hexdigest()
    adjustments = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    if adjustments["audioSha256"] != audio_hash:
        raise SystemExit("Alignment overrides are for a different WAV; review them before regenerating cues.")

    decoder = Decoder(samprate=16000, loglevel="ERROR")
    for word, phones in PRONUNCIATIONS.items():
        decoder.add_word(word, phones, False)
    dictionary_words = [normalize_for_dictionary(cue["text"]) for cue in words]
    missing = [word for word in dictionary_words if not decoder.lookup_word(word)]
    if missing:
        raise SystemExit(f"Missing pronunciations: {missing}")
    decoder.set_align_text(" ".join(dictionary_words))

    ffmpeg = str(FFMPEG) if FFMPEG.exists() else "ffmpeg"
    with tempfile.TemporaryDirectory(prefix="agent-word-align-") as directory:
        wav_path = Path(directory) / "mono-16khz.wav"
        subprocess.run(
            [ffmpeg, "-v", "error", "-y", "-i", str(AUDIO), "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(wav_path)],
            check=True,
        )
        with wave.open(str(wav_path), "rb") as wav:
            audio = wav.readframes(wav.getnframes())
        decoder.start_utt()
        decoder.process_raw(audio, False, True)
        decoder.end_utt()

    segments = [segment for segment in decoder.seg() if segment.word not in {"<sil>", "<s>", "</s>"}]
    if len(segments) != len(words):
        raise SystemExit(f"Phonetic alignment produced {len(segments)} words, expected {len(words)}.")
    timed = []
    for original, expected, segment in zip(words, dictionary_words, segments):
        observed = re.sub(r"\(\d+\)$", "", segment.word.lower())
        if observed != expected:
            raise SystemExit(f"Phonetic sequence mismatch: expected {expected!r}, got {segment.word!r}.")
        timed.append({
            "text": original["text"],
            "start": round(segment.start_frame / 100, 3),
            "end": round((segment.end_frame + 1) / 100, 3),
        })
    for override in adjustments["overrides"]:
        index = override["wordIndex"]
        if timed[index]["text"] != override["text"]:
            raise SystemExit(f"Override no longer matches word {index}.")
        timed[index]["start"] = override["start"]
        timed[index]["end"] = override["end"]

    start_frames = [frame_at_or_after(cue["start"]) for cue in timed]
    end_frames = [frame_at_or_after(cue["end"]) for cue in timed]
    for i, cue in enumerate(timed):
        if cue["start"] >= cue["end"] or start_frames[i] >= end_frames[i]:
            raise SystemExit(f"Empty word/frame interval: {cue}")
        if i and (timed[i - 1]["end"] > cue["start"] or end_frames[i - 1] > start_frames[i]):
            raise SystemExit(f"Overlapping words/frames: {timed[i - 1]} / {cue}")

    track["words"] = timed
    payload["aligner"] = "PocketSphinx phonetic forced alignment with audio-bound reviewed correction"
    payload["audioSha256"] = audio_hash
    frames = {
        "format": "absolute-frame-cues-v1",
        "audioSha256": audio_hash,
        "fps": FPS,
        "quantization": "first frame at or after each aligned boundary",
        "startFrames": start_frames,
        "endFrames": end_frames,
    }
    CUES.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    FRAME_CUES.write_text(json.dumps(frames, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Aligned {len(timed)} canonical words to {audio_hash[:12]} and generated absolute {FPS} fps frame arrays.")
    print(f"Applied {len(adjustments['overrides'])} reviewed audio-bound correction(s).")


if __name__ == "__main__":
    main()

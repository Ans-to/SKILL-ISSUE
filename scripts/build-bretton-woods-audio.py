#!/usr/bin/env python3
"""Assemble the 60.00s (1,800 frames @ 30fps) Bretton Woods voiceover WAV at 1.0x natural speed
and generate verified PocketSphinx word & frame cues + 30fps RMS audio envelope.

Every spoken syllable comes verbatim at 1.0x speed from the voice-02 generated scene clips,
placed inside the exact 4-part timeline windows:
  - Scene 1 [0:00 - 0:10] (frames    0..300)
  - Scene 2 [0:10 - 0:25] (frames  300..750)
  - Scene 3 [0:25 - 0:45] (frames  750..1350)
  - Scene 4 [0:45 - 1:00] (frames 1350..1800)
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

from pocketsphinx import Decoder

ROOT = Path(__file__).resolve().parents[1]
BW_PUBLIC = ROOT / "public" / "bretton-woods"
BW_SRC = ROOT / "src" / "bretton-woods"
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"

SAMPLE_RATE = 24000
FPS = 30
DURATION_SECONDS = 60.0
TOTAL_FRAMES = 1800
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION_SECONDS)

PRONUNCIATIONS = {
    "usword": "Y UW EH S",
    "nineteenfortyfour": "N AY N T IY N F AO R T IY F AO R",
    "bretton": "B R EH T AH N",
    "greenback": "G R IY N B AE K",
    "trillions": "T R IH L Y AH N Z",
    "saudi": "S AW D IY",
    "tokyo": "T OW K Y OW",
}

# Canonical orthographic words per scene (matching the user's exact script spelling & punctuation),
# paired with their PocketSphinx dictionary word expansions.
SCENE_TRANSCRIPTS = [
    {
        "sceneIndex": 0,
        "id": "global-standard",
        "windowStartSec": 0.0,
        "windowEndSec": 10.0,
        "sourceWav": BW_PUBLIC / "scene-1-source.wav",
        "startOffsetSec": 0.16,
        # Insert natural dramatic pause afterword index (0-based within scene orthographic tokens)
        "pauseInsertions": [
            {"afterWordIndex": 14, "extraSec": 0.30},  # after "Italy..."
        ],
        "tokens": [
            ("If", ["if"]),
            ("you", ["you"]),
            ("buy", ["buy"]),
            ("oil", ["oil"]),
            ("in", ["in"]),
            ("Saudi", ["saudi"]),
            ("Arabia,", ["arabia"]),
            ("a", ["a"]),
            ("coffee", ["coffee"]),
            ("in", ["in"]),
            ("Tokyo,", ["tokyo"]),
            ("or", ["or"]),
            ("shoes", ["shoes"]),
            ("in", ["in"]),
            ("Italy...", ["italy"]),
            ("chances", ["chances"]),
            ("are,", ["are"]),
            ("you're", ["you're"]),
            ("paying", ["paying"]),
            ("in", ["in"]),
            ("one", ["one"]),
            ("currency.", ["currency"]),
        ],
    },
    {
        "sceneIndex": 1,
        "id": "bretton-woods-origin",
        "windowStartSec": 10.0,
        "windowEndSec": 25.0,
        "sourceWav": BW_PUBLIC / "scene-2-source.wav",
        "startOffsetSec": 10.28,
        "pauseInsertions": [
            {"afterWordIndex": 21, "extraSec": 0.52},  # after "gold." before "Even when..."
        ],
        "tokens": [
            ("Back", ["back"]),
            ("in", ["in"]),
            ("1944,", ["nineteenfortyfour"]),
            ("at", ["at"]),
            ("Bretton", ["bretton"]),
            ("Woods,", ["woods"]),
            ("war-torn", ["war", "torn"]),
            ("nations", ["nations"]),
            ("tied", ["tied"]),
            ("their", ["their"]),
            ("currencies", ["currencies"]),
            ("to", ["to"]),
            ("the", ["the"]),
            ("US", ["usword"]),
            ("dollar—", ["dollar"]),
            ("because", ["because"]),
            ("America", ["america"]),
            ("held", ["held"]),
            ("most", ["most"]),
            ("of", ["of"]),
            ("the", ["the"]),
            ("world's", ["world's"]),
            ("gold.", ["gold"]),
            ("Even", ["even"]),
            ("when", ["when"]),
            ("we", ["we"]),
            ("left", ["left"]),
            ("the", ["the"]),
            ("gold", ["gold"]),
            ("standard,", ["standard"]),
            ("the", ["the"]),
            ("world", ["world"]),
            ("stayed.", ["stayed"]),
        ],
    },
    {
        "sceneIndex": 2,
        "id": "liquidity-power-engine",
        "windowStartSec": 25.0,
        "windowEndSec": 45.0,
        "sourceWav": BW_PUBLIC / "scene-3-source.wav",
        "startOffsetSec": 25.35,
        "pauseInsertions": [
            {"afterWordIndex": 0, "extraSec": 0.65},   # after "Why?"
            {"afterWordIndex": 6, "extraSec": 2.25},   # after "depth." (showcase TRUST / LIQUIDITY)
            {"afterWordIndex": 15, "extraSec": 0.45},  # after "stable"
        ],
        "tokens": [
            ("Why?", ["why"]),
            ("Because", ["because"]),
            ("of", ["of"]),
            ("trust,", ["trust"]),
            ("liquidity,", ["liquidity"]),
            ("and", ["and"]),
            ("depth.", ["depth"]),
            ("The", ["the"]),
            ("US", ["usword"]),
            ("financial", ["financial"]),
            ("markets", ["markets"]),
            ("are", ["are"]),
            ("so", ["so"]),
            ("massive", ["massive"]),
            ("and", ["and"]),
            ("stable", ["stable"]),
            ("that", ["that"]),
            ("global", ["global"]),
            ("banks", ["banks"]),
            ("and", ["and"]),
            ("governments", ["governments"]),
            ("keep", ["keep"]),
            ("trillions", ["trillions"]),
            ("in", ["in"]),
            ("US", ["usword"]),
            ("Treasury", ["treasury"]),
            ("bonds", ["bonds"]),
            ("as", ["as"]),
            ("their", ["their"]),
            ("ultimate", ["ultimate"]),
            ("safety", ["safety"]),
            ("net.", ["net"]),
        ],
    },
    {
        "sceneIndex": 3,
        "id": "heavy-crown-conclusion",
        "windowStartSec": 45.0,
        "windowEndSec": 60.0,
        "sourceWav": BW_PUBLIC / "scene-4-source.wav",
        "startOffsetSec": 45.42,
        "pauseInsertions": [
            {"afterWordIndex": 5, "extraSec": 0.35},   # after "power—"
            {"afterWordIndex": 8, "extraSec": 1.95},   # after "responsibility." (THE KING OF CURRENCIES beat)
            {"afterWordIndex": 13, "extraSec": 0.85},  # after "it..." before "for now,"
        ],
        "tokens": [
            ("It", ["it"]),
            ("gives", ["gives"]),
            ("America", ["america"]),
            ("immense", ["immense"]),
            ("economic", ["economic"]),
            ("power—", ["power"]),
            ("and", ["and"]),
            ("immense", ["immense"]),
            ("responsibility.", ["responsibility"]),
            ("Love", ["love"]),
            ("it", ["it"]),
            ("or", ["or"]),
            ("hate", ["hate"]),
            ("it...", ["it"]),
            ("for", ["for"]),
            ("now,", ["now"]),
            ("the", ["the"]),
            ("greenback", ["greenback"]),
            ("holds", ["holds"]),
            ("the", ["the"]),
            ("crown.", ["crown"]),
        ],
    },
]

# Fix pause insertion index on Scene 2: "gold." is index 22 (0-based) because "dollar—" and "because" are 2 tokens.
SCENE_TRANSCRIPTS[1]["pauseInsertions"] = [{"afterWordIndex": 22, "extraSec": 0.52}]


def make_decoder() -> Decoder:
    dec = Decoder(samprate=16000, loglevel="ERROR")
    for w, phones in PRONUNCIATIONS.items():
        if not dec.lookup_word(w):
            dec.add_word(w, phones, False)
    return dec


def read_mono_s16(path: Path) -> list[int]:
    with wave.open(str(path), "rb") as wf:
        assert wf.getnchannels() == 1, f"Expected mono WAV: {path}"
        assert wf.getsampwidth() == 2, f"Expected 16-bit WAV: {path}"
        assert wf.getframerate() == SAMPLE_RATE, f"Expected {SAMPLE_RATE} Hz: {path}"
        n = wf.getnframes()
        raw = wf.readframes(n)
    return list(struct.unpack(f"<{n}h", raw))


def align_tokens_on_wav(dec: Decoder, wav_path: Path, tokens: list[tuple[str, list[str]]]) -> list[dict]:
    flat_words = [dw for _, dws in tokens for dw in dws]
    missing = [w for w in flat_words if not dec.lookup_word(w)]
    if missing:
        raise RuntimeError(f"Missing pronunciations in {wav_path.name}: {missing}")
    dec.set_align_text(" ".join(flat_words))

    ffmpeg = str(FFMPEG) if FFMPEG.exists() else "ffmpeg"
    with tempfile.TemporaryDirectory(prefix="bw-align-") as tmp:
        p16 = Path(tmp) / "mono16k.wav"
        subprocess.run(
            [ffmpeg, "-v", "error", "-y", "-i", str(wav_path), "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(p16)],
            check=True,
        )
        with wave.open(str(p16), "rb") as wf:
            pcm = wf.readframes(wf.getnframes())
    dec.start_utt()
    dec.process_raw(pcm, False, True)
    dec.end_utt()
    segs = [s for s in dec.seg() if s.word not in {"<sil>", "<s>", "</s>"}]
    if len(segs) != len(flat_words):
        raise RuntimeError(f"Expected {len(flat_words)} segments in {wav_path.name}, got {len(segs)}")

    aligned = []
    cursor = 0
    for text, dws in tokens:
        group = segs[cursor : cursor + len(dws)]
        for expected_dw, seg in zip(dws, group):
            observed = re.sub(r"\(\d+\)$", "", seg.word.lower())
            if observed != expected_dw:
                raise RuntimeError(f"Mismatch: expected {expected_dw}, got {seg.word}")
        start_sec = group[0].start_frame / 100.0
        end_sec = (group[-1].end_frame + 1) / 100.0
        aligned.append({"text": text, "start": start_sec, "end": end_sec})
        cursor += len(dws)
    return aligned


def find_quietest_sample(samples: list[int], start_sec: float, end_sec: float) -> int:
    lo = max(0, int(start_sec * SAMPLE_RATE))
    hi = min(len(samples) - 1, int(end_sec * SAMPLE_RATE))
    if hi <= lo:
        return lo
    win = max(1, int(0.015 * SAMPLE_RATE))  # 15ms window
    best_idx = (lo + hi) // 2
    best_energy = float("inf")
    step = max(1, win // 4)
    for idx in range(lo, max(lo + 1, hi - win), step):
        chunk = samples[idx : idx + win]
        energy = sum(x * x for x in chunk) / len(chunk)
        if energy < best_energy:
            best_energy = energy
            best_idx = idx + win // 2
    return best_idx


def apply_micro_fade(buf: list[int], fade_samples: int = 240) -> list[int]:
    out = list(buf)
    f = min(fade_samples, len(out) // 4)
    for i in range(f):
        gain = 0.5 * (1.0 - math.cos(math.pi * i / max(1, f)))
        out[i] = int(round(out[i] * gain))
        out[-1 - i] = int(round(out[-1 - i] * gain))
    return out


def frame_at_or_after(seconds: float) -> int:
    return math.ceil(seconds * FPS - 1e-9)


def main() -> None:
    BW_PUBLIC.mkdir(parents=True, exist_ok=True)
    BW_SRC.mkdir(parents=True, exist_ok=True)
    dec = make_decoder()

    master = [0] * TOTAL_SAMPLES
    final_words: list[dict] = []
    global_idx = 0

    for spec in SCENE_TRANSCRIPTS:
        samples = read_mono_s16(spec["sourceWav"])
        raw_aligned = align_tokens_on_wav(dec, spec["sourceWav"], spec["tokens"])

        # Determine quiet splice points for requested inter-sentence breaths
        splices = []
        for ins in spec["pauseInsertions"]:
            w_idx = ins["afterWordIndex"]
            gap_start = raw_aligned[w_idx]["end"]
            gap_end = raw_aligned[w_idx + 1]["start"]
            if gap_end - gap_start < 0.12:
                raise RuntimeError(
                    f"Gap after word {w_idx} ({raw_aligned[w_idx]['text']}) too tight: {gap_end - gap_start:.3f}s"
                )
            split_sample = find_quietest_sample(samples, gap_start + 0.02, gap_end - 0.02)
            splices.append((split_sample, int(round(ins["extraSec"] * SAMPLE_RATE)), w_idx))

        splices.sort(key=lambda x: x[0])

        # Build scene sample buffer with clean zero-energy silence insertions
        scene_buf: list[int] = []
        prev_s = 0
        for split_sample, extra_samples, _ in splices:
            chunk = apply_micro_fade(samples[prev_s:split_sample], fade_samples=180)
            scene_buf.extend(chunk)
            scene_buf.extend([0] * extra_samples)
            prev_s = split_sample
        scene_buf.extend(apply_micro_fade(samples[prev_s:], fade_samples=180))

        start_sample = int(round(spec["startOffsetSec"] * SAMPLE_RATE))
        end_sample = start_sample + len(scene_buf)
        win_start_sample = int(round(spec["windowStartSec"] * SAMPLE_RATE))
        win_end_sample = int(round(spec["windowEndSec"] * SAMPLE_RATE))

        if start_sample < win_start_sample or end_sample > win_end_sample:
            raise RuntimeError(
                f"Scene {spec['id']} ({start_sample / SAMPLE_RATE:.2f}s..{end_sample / SAMPLE_RATE:.2f}s) "
                f"overflows window [{spec['windowStartSec']}s..{spec['windowEndSec']}s]"
            )

        for i, val in enumerate(scene_buf):
            master[start_sample + i] = val

        # Map each word's exact acoustic interval into the 60.0s master timeline
        for local_w_idx, w in enumerate(raw_aligned):
            extra_sec = sum(
                extra_s / SAMPLE_RATE
                for _, extra_s, after_idx in splices
                if local_w_idx > after_idx
            )
            w_start = round(spec["startOffsetSec"] + w["start"] + extra_sec, 3)
            w_end = round(spec["startOffsetSec"] + w["end"] + extra_sec, 3)
            final_words.append(
                {
                    "globalIndex": global_idx,
                    "sceneIndex": spec["sceneIndex"],
                    "sceneId": spec["id"],
                    "text": w["text"],
                    "start": w_start,
                    "end": w_end,
                }
            )
            global_idx += 1

        print(
            f"Scene {spec['sceneIndex'] + 1} ({spec['id']}): "
            f"{final_words[-len(raw_aligned)]['start']:.2f}s -> {final_words[-1]['end']:.2f}s "
            f"(window {spec['windowStartSec']:.0f}s..{spec['windowEndSec']:.0f}s, {len(raw_aligned)} words)"
        )

    master_wav = BW_PUBLIC / "voiceover.wav"
    with wave.open(str(master_wav), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(struct.pack(f"<{len(master)}h", *master))

    # Cross-verify full 60s master WAV with PocketSphinx forced alignment end-to-end!
    all_tokens = [tok for spec in SCENE_TRANSCRIPTS for tok in spec["tokens"]]
    master_aligned = align_tokens_on_wav(dec, master_wav, all_tokens)
    max_drift = max(abs(a["start"] - b["start"]) for a, b in zip(final_words, master_aligned))
    print(f"Full-60s PocketSphinx cross-check passed ({len(master_aligned)} words, max onset delta={max_drift:.3f}s)")

    audio_hash = hashlib.sha256(master_wav.read_bytes()).hexdigest()

    # Quantize to 30fps frames without overlap or zero-frame intervals
    start_frames = [frame_at_or_after(w["start"]) for w in final_words]
    end_frames = [max(start_frames[i] + 1, frame_at_or_after(w["end"])) for i, w in enumerate(final_words)]
    for i in range(len(final_words) - 1):
        if end_frames[i] > start_frames[i + 1]:
            end_frames[i] = start_frames[i + 1]
        assert start_frames[i] < end_frames[i], f"Invalid interval at word {i}: {final_words[i]}"

    # Compute 30fps RMS envelope across all 1,800 frames
    samples_per_frame = SAMPLE_RATE // FPS
    rms_values = []
    for f in range(TOTAL_FRAMES):
        chunk = master[f * samples_per_frame : (f + 1) * samples_per_frame]
        rms = math.sqrt(sum(x * x for x in chunk) / max(1, len(chunk))) / 32768.0
        rms_values.append(rms)
    peak_rms = max(rms_values) or 1.0
    norm_envelope = [round(min(1.0, r / peak_rms), 4) for r in rms_values]

    word_cues_payload = {
        "version": 1,
        "title": "Bretton Woods & The Global Dollar Standard",
        "fps": FPS,
        "durationSeconds": DURATION_SECONDS,
        "durationFrames": TOTAL_FRAMES,
        "audioFile": "bretton-woods/voiceover.wav",
        "audioSha256": audio_hash,
        "aligner": "PocketSphinx phonetic forced alignment on 1.0x voice-02 narration",
        "tracks": [
            {
                "id": "narration",
                "words": [
                    {
                        "text": w["text"],
                        "start": w["start"],
                        "end": w["end"],
                        "sceneIndex": w["sceneIndex"],
                        "sceneId": w["sceneId"],
                    }
                    for w in final_words
                ],
            }
        ],
    }

    frame_cues_payload = {
        "format": "bretton-woods-frame-cues-v1",
        "audioSha256": audio_hash,
        "fps": FPS,
        "durationFrames": TOTAL_FRAMES,
        "startFrames": start_frames,
        "endFrames": end_frames,
    }

    envelope_payload = {
        "fps": FPS,
        "durationFrames": TOTAL_FRAMES,
        "audioSha256": audio_hash,
        "frames": norm_envelope,
    }

    (BW_SRC / "bretton-woods-word-cues.json").write_text(
        json.dumps(word_cues_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (BW_SRC / "bretton-woods-frame-cues.json").write_text(
        json.dumps(frame_cues_payload, indent=2) + "\n", encoding="utf-8"
    )
    (BW_SRC / "bretton-woods-audio-envelope.json").write_text(
        json.dumps(envelope_payload, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(f"Wrote public/bretton-woods/voiceover.wav ({DURATION_SECONDS:.2f}s, sha256={audio_hash[:12]}) and {len(final_words)} frame cues.")


if __name__ == "__main__":
    main()

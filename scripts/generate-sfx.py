#!/usr/bin/env python3
"""
Deterministic stereo spatial SFX generator for EngineFirstExplainer.
Synthesizes 48 kHz 16-bit stereo WAVs and encodes MP3 assets into public/sfx/
using Remotion's bundled ffmpeg (libmp3lame).
"""
import math
import os
import random
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SFX_DIR = ROOT / "public" / "sfx"
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
SAMPLE_RATE = 48000


def clamp_sample(x: float) -> int:
    v = max(-0.98, min(0.98, x))
    return int(round(v * 32767.0))


def write_stereo_mp3(name: str, left: list[float], right: list[float]) -> None:
    assert len(left) == len(right)
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    mp3_path = SFX_DIR / name
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = Path(tmp.name)
    try:
        frames = bytearray()
        for l_val, r_val in zip(left, right):
            frames += struct.pack("<hh", clamp_sample(l_val), clamp_sample(r_val))
        with wave.open(str(wav_path), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(bytes(frames))
        subprocess.run(
            [
                str(FFMPEG),
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(wav_path),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "192k",
                "-ar",
                str(SAMPLE_RATE),
                str(mp3_path),
            ],
            check=True,
        )
    finally:
        if wav_path.exists():
            os.remove(wav_path)


def synth_click() -> tuple[list[float], list[float]]:
    """Sharp digital mechanical transient (75 ms) biased slightly to right kinetic column."""
    n = int(SAMPLE_RATE * 0.075)
    rng = random.Random(10801920)
    left, right = [], []
    phase1 = 0.0
    phase2 = 0.0
    noise_lp = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        attack = min(1.0, i / (SAMPLE_RATE * 0.0008))
        env_fast = math.exp(-t / 0.0065)
        env_body = math.exp(-t / 0.017)

        f1 = 920.0 + 2600.0 * math.exp(-t / 0.0045)
        f2 = 4850.0 * math.exp(-t / 0.003) + 1450.0
        phase1 += 2.0 * math.pi * f1 / SAMPLE_RATE
        phase2 += 2.0 * math.pi * f2 / SAMPLE_RATE

        white = rng.uniform(-1.0, 1.0)
        noise_lp = 0.52 * noise_lp + 0.48 * white
        transient = (white - noise_lp) * env_fast * 0.55

        sig = attack * (
            0.52 * math.sin(phase1) * env_body
            + 0.28 * math.sin(phase2) * env_fast
            + transient
        )
        left.append(sig * 0.58)
        right.append(sig * 0.78)

    # Slight 0.35 ms Haas offset on left channel so kinetic snap localizes to right stage
    delay = int(SAMPLE_RATE * 0.00035)
    left_delayed = [0.0] * delay + left[:-delay]
    return left_delayed, right


def synth_click_accent() -> tuple[list[float], list[float]]:
    """Punchier kinetic lock transient (130 ms) for emphasis words."""
    n = int(SAMPLE_RATE * 0.13)
    rng = random.Random(20261028)
    left, right = [], []
    p_sub = 0.0
    p_mid = 0.0
    p_hi = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        attack = min(1.0, i / (SAMPLE_RATE * 0.001))
        f_sub = 58.0 + 115.0 * math.exp(-t / 0.018)
        f_mid = 680.0 + 1900.0 * math.exp(-t / 0.007)
        f_hi = 3400.0
        p_sub += 2.0 * math.pi * f_sub / SAMPLE_RATE
        p_mid += 2.0 * math.pi * f_mid / SAMPLE_RATE
        p_hi += 2.0 * math.pi * f_hi / SAMPLE_RATE

        sub = math.sin(p_sub) * math.exp(-t / 0.042) * 0.56
        mid = math.sin(p_mid) * math.exp(-t / 0.015) * 0.36
        snap = (math.sin(p_hi) * 0.24 + rng.uniform(-0.35, 0.35)) * math.exp(-t / 0.005)
        sig = attack * (sub + mid + snap)
        left.append(sig * 0.68)
        right.append(sig * 0.84)
    return left, right


def synth_whoosh() -> tuple[list[float], list[float]]:
    """Low sub-bass whoosh & stereo riser (420 ms) across scene cuts."""
    dur = 0.42
    n = int(SAMPLE_RATE * dur)
    rng = random.Random(320760)
    left, right = [], []
    p_sub = 0.0
    bp_state1 = 0.0
    bp_state2 = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        u = t / dur
        # Smooth bell envelope peaking at 42% of duration
        env = math.sin(math.pi * (u ** 0.72)) ** 1.5

        f_sub = 44.0 + 96.0 * math.sin(math.pi * u)
        p_sub += 2.0 * math.pi * f_sub / SAMPLE_RATE
        sub = math.sin(p_sub) * 0.58 + 0.18 * math.sin(2.0 * p_sub)

        # Swept resonant low-mid air
        white = rng.uniform(-1.0, 1.0)
        alpha = 0.04 + 0.22 * math.sin(math.pi * u)
        bp_state1 += alpha * (white - bp_state1)
        bp_state2 += alpha * (bp_state1 - bp_state2)
        air = (bp_state1 - bp_state2) * 1.35

        # Spatial pan from left HUD (0.3) toward right kinetic canvas (0.75)
        pan = 0.3 + 0.45 * u
        sig = env * (sub * 0.68 + air * 0.48)
        left.append(sig * math.cos(pan * math.pi * 0.5) * 0.92)
        right.append(sig * math.sin(pan * math.pi * 0.5) * 0.92)
    return left, right


def synth_slash_impact() -> tuple[list[float], list[float]]:
    """Engineered metallic fracture / stage lock impact (460 ms)."""
    dur = 0.46
    n = int(SAMPLE_RATE * dur)
    rng = random.Random(911547)
    left, right = [], []
    p_sub = 0.0
    p_m1 = 0.0
    p_m2 = 0.0
    lp = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        attack = min(1.0, i / (SAMPLE_RATE * 0.0012))
        f_sub = 46.0 + 130.0 * math.exp(-t / 0.028)
        p_sub += 2.0 * math.pi * f_sub / SAMPLE_RATE
        p_m1 += 2.0 * math.pi * (412.0 + 820.0 * math.exp(-t / 0.012)) / SAMPLE_RATE
        p_m2 += 2.0 * math.pi * 1288.0 / SAMPLE_RATE

        white = rng.uniform(-1.0, 1.0)
        lp = 0.72 * lp + 0.28 * white
        burst = (white - lp) * math.exp(-t / 0.022) * 0.52

        sub = math.sin(p_sub) * math.exp(-t / 0.14) * 0.64
        metal = (0.26 * math.sin(p_m1) + 0.16 * math.sin(p_m2)) * math.exp(-t / 0.055)
        sig = attack * (sub + metal + burst)
        left.append(sig * 0.76)
        right.append(sig * 0.88)
    return left, right


def synth_telemetry_hum() -> tuple[list[float], list[float]]:
    """
    Seamless 4.000s high-tech data stream hum loop.
    All frequencies are integer multiples of 0.25 Hz so endpoints match in phase,
    with wide stereo telemetry harmonics across the full 1080x1920 canvas.
    """
    dur = 4.0
    n = int(SAMPLE_RATE * dur)
    left, right = [], []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Warm server / reactor carrier harmonics (integer Hz -> exact 4.0s phase lock)
        carrier = (
            0.22 * math.sin(2.0 * math.pi * 55.0 * t)
            + 0.14 * math.sin(2.0 * math.pi * 110.0 * t + 0.4)
            + 0.07 * math.sin(2.0 * math.pi * 165.0 * t)
        )
        # 15 Hz & 30 Hz frame-rate quantized telemetry pulse modulation
        frame_gate = 0.5 + 0.5 * math.sin(2.0 * math.pi * 15.0 * t)
        sub_gate = 0.5 + 0.5 * math.cos(2.0 * math.pi * 3.75 * t)
        data_tone_l = (
            0.055 * math.sin(2.0 * math.pi * 880.0 * t) * (frame_gate ** 3) * sub_gate
            + 0.03 * math.sin(2.0 * math.pi * 1320.0 * t) * ((1.0 - frame_gate) ** 4)
        )
        data_tone_r = (
            0.045 * math.sin(2.0 * math.pi * 990.0 * t) * ((1.0 - frame_gate) ** 3) * sub_gate
            + 0.028 * math.sin(2.0 * math.pi * 1760.0 * t) * (frame_gate ** 4)
        )
        left.append((carrier * 0.96 + data_tone_l) * 0.62)
        right.append((carrier * 0.94 + data_tone_r) * 0.62)
    return left, right


def synth_tension_riser() -> tuple[list[float], list[float]]:
    """
    1.20s (36-frame) ascending-pitch high-tension telemetry riser leading into
    sentence climaxes. Sweeps fundamental 55->172 Hz and data harmonics 330->1120 Hz.
    """
    dur = 1.20
    n = int(SAMPLE_RATE * dur)
    rng = random.Random(361200)
    left, right = [], []
    p_low = 0.0
    p_mid_l = 0.0
    p_mid_r = 0.0
    bp1 = 0.0
    bp2 = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        u = t / dur
        # Exponential tension curve peaking right before climax downbeat, 15ms tail taper
        tail = min(1.0, (1.0 - u) / 0.025)
        env = (u ** 1.65) * tail

        f_low = 55.0 + 118.0 * (u ** 1.85)
        f_mid_l = 330.0 + 780.0 * (u ** 2.0)
        f_mid_r = 334.0 + 810.0 * (u ** 2.0)
        p_low += 2.0 * math.pi * f_low / SAMPLE_RATE
        p_mid_l += 2.0 * math.pi * f_mid_l / SAMPLE_RATE
        p_mid_r += 2.0 * math.pi * f_mid_r / SAMPLE_RATE

        # Accelerating pulse gate (8 Hz -> 28 Hz)
        pulse = 0.62 + 0.38 * math.sin(2.0 * math.pi * (8.0 + 18.0 * u) * t)

        white = rng.uniform(-1.0, 1.0)
        alpha = 0.03 + 0.26 * (u ** 1.7)
        bp1 += alpha * (white - bp1)
        bp2 += alpha * (bp1 - bp2)
        air = (bp1 - bp2) * 0.85

        low = math.sin(p_low) * 0.46 + 0.18 * math.sin(2.0 * p_low)
        sig_l = env * (low + 0.24 * math.sin(p_mid_l) * pulse + air * 0.44)
        sig_r = env * (low + 0.24 * math.sin(p_mid_r) * pulse - air * 0.44)
        left.append(sig_l * 0.78)
        right.append(sig_r * 0.78)
    return left, right


def synth_sub_drop() -> tuple[list[float], list[float]]:
    """
    0.68s (20-frame) heavy cinematic sub-bass drop synced to sentence climaxes.
    Exponentially drops from 98 Hz -> 31 Hz with upper-bass harmonic translation
    and clean zero-crossing decay.
    """
    dur = 0.68
    n = int(SAMPLE_RATE * dur)
    rng = random.Random(980031)
    left, right = [], []
    p_sub = 0.0
    p_punch = 0.0
    lp = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        u = t / dur
        attack = min(1.0, i / (SAMPLE_RATE * 0.0022))
        release = min(1.0, (1.0 - u) / 0.08)
        env_sub = attack * math.exp(-t / 0.28) * release
        env_punch = attack * math.exp(-t / 0.026)

        f_sub = 31.0 + 67.0 * math.exp(-t / 0.075)
        f_punch = 140.0 + 280.0 * math.exp(-t / 0.014)
        p_sub += 2.0 * math.pi * f_sub / SAMPLE_RATE
        p_punch += 2.0 * math.pi * f_punch / SAMPLE_RATE

        white = rng.uniform(-1.0, 1.0)
        lp = 0.82 * lp + 0.18 * white
        thump_air = (white - lp) * math.exp(-t / 0.012) * 0.26

        # Pure mono-compatible sub core + subtle stereo transient width
        sub_core = (
            0.66 * math.sin(p_sub)
            + 0.22 * math.sin(2.0 * p_sub)
            + 0.07 * math.tanh(2.2 * math.sin(p_sub))
        ) * env_sub
        punch = math.sin(p_punch) * env_punch * 0.28

        left.append((sub_core + punch + thump_air) * 0.84)
        right.append((sub_core + punch - thump_air * 0.6) * 0.84)
    return left, right


def main() -> None:
    assets = {
        "click.mp3": synth_click(),
        "click-accent.mp3": synth_click_accent(),
        "whoosh.mp3": synth_whoosh(),
        "slash-impact.mp3": synth_slash_impact(),
        "telemetry-hum.mp3": synth_telemetry_hum(),
        "tension-riser.mp3": synth_tension_riser(),
        "sub-drop.mp3": synth_sub_drop(),
    }
    for filename, (left, right) in assets.items():
        write_stereo_mp3(filename, left, right)
        size = (SFX_DIR / filename).stat().st_size
        print(f"Generated public/sfx/{filename} ({size} bytes)")


if __name__ == "__main__":
    main()

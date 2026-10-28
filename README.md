# The Code That Replaced After Effects

A 60-second, word-synchronized Remotion explainer built around the submitted storyboard. The root timeline renders through `src/engine/MotionEngine.tsx`; all motion is deterministic and cue-driven, with the Three.js layer isolated behind the front-facing 2D typography.

## Visual sequence

- **Shock hook:** center-slamming words over a perspective grid and an audio-reactive orange vector streak.
- **Core claim:** traditional timeline tracks are crossed out, then a cue-populated graph takes over.
- **Reveal:** `THIS IS CLAUDE OPUS 5.5` and a prompt window that types only words already spoken.
- **Mechanics:** live code cues on the left; a coordinate grid with morphing geometry and live coordinates on the right.
- **Workflow:** spoken After Effects steps are struck through as they arrive, then the prompt-to-code-to-render-to-video path replaces them.
- **Control and close:** a square morphs, changes color and easing, and returns to its starting state; `PRETTY INSANE` punches forward before the radial-black data-point close.

Palette: deep obsidian `#0b0f19`, electric white, and safety orange `#ff4500`. Narration is aligned to **182 exact script word cues** with no future-word preview. The selected conversational voiceover was accelerated to fit the one-minute brief while retaining the complete supplied copy.

## Local checks and preview

```sh
npm ci
npm run typecheck
npm run verify:sync
npm run start
```

Regenerate exact word timestamps from the local faster-whisper small model:

```sh
python3 scripts/align-narration.py --model-dir /path/to/whisper-model
```

Regenerate the frame RMS envelope:

```sh
python3 scripts/derive-audio-envelope.py
```

Render at the maximum supported Remotion concurrency:

```sh
npm run render
```

Remotion 4.0.539 rejects the literal `--concurrency=max`; `--concurrency=100%` selects its maximum. If needed, provide a local browser with `npm run render -- --browser-executable=/path/to/chromium`. The 1920×1080, 30 fps MP4 is written to `out/The-Code-That-Replaced-After-Effects.mp4` and published under `deliverables/`.

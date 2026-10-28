# Nokia MotionEngine

The Remotion timeline now renders exclusively through `src/engine/MotionEngine.tsx`. The engine contains three explicit layers: the obsidian background, procedural 3D word-cue graphics, and an isolated 2D kinetic-typography plane at z-index 10.

## Deterministic components

- **`KineticText`** — exact active narration word, with hardcoded Remotion spring (`damping: 12`, `stiffness: 120`), 96px/900-weight type, orange/white fills, and word-aligned onset.
- **`CinematicStack`** — background layer 1, Three.js layer 2, and isolated front-facing 2D typography at z-index 10.
- **`SemanticFlow`** — a live graph that grows from already-started script cues; future word nodes are not exposed early.

The final render remains 1920×1080, 30 fps, with all narration at natural speed. Word-level cue data and the audio-energy envelope are stored in `src/engine/`.

## Preview, alignment, and render

```sh
npm ci
npm run typecheck
npm run verify:sync
npm run start
```

Regenerate word cues after changing narration with a local faster-whisper model:

```sh
python3 scripts/align-narration.py --model-dir /path/to/whisper-model
```

Regenerate the frame RMS envelope:

```sh
python3 scripts/derive-audio-envelope.py
```

Render locally at maximum supported Remotion concurrency:

```sh
npm run render
```

If needed, pass the local Chromium executable: `npm run render -- --browser-executable=/path/to/chromium`. Remotion 4.0.539 uses `--concurrency=100%` for its maximum; it does not accept the literal `max`. The MP4 is written to `out/Nokia-Documentary.mp4` and published in `deliverables/Nokia-Documentary.mp4`.

# Deterministic Motion Documentaries

This Remotion project contains two separate, word-synchronized films. Each uses the same independent compositing architecture: an obsidian background, an isolated Three.js depth layer, and front-facing 2D typography. The established one-minute After Effects explainer remains available alongside the engine-first AI-agent film, now using its selected natural-speed narration.

## Engine-First AI Agent Documentary (about 52 seconds)

The new film contrasts template-shaped agent demos with deterministic, code-driven production:

- **Hook:** spring-slamming electric-white words over a gridded, audio-reactive vector streak.
- **Twist:** an intentionally generic dashboard is cut by a safety-orange vector slash on “break.”
- **Shift:** split chat/terminal views update only with the active spoken word.
- **Mechanism:** physics, isolation, math, and timing details snap in and out on their own narration cues.
- **Payoff:** a fast-scrolling timeline highlights prompt, code, frames, and MP4 only as each is spoken.
- **Outro:** the final words hit individually, then cut to black.

The palette is deep obsidian `#0b0f19`, electric white, and safety orange `#ff4500`. The selected narration stays at natural speed: its decoded WAV is about 51.56 seconds, with a 1,547-frame composition (51.57 seconds at 30 fps). The 91 canonical words have phonetic audio alignment and a reviewed correction tied to the WAV's SHA-256. `agent-engine-frame-cues.json` stores absolute start/end frame arrays; the runtime builds a direct per-frame lookup with no accumulating timers, crossfades, previous-word echoes, or future-word previews. Every aligned boundary uses the first frame at or after its timestamp, so a 30 fps render can resolve it to within one frame rather than arbitrary subframe milliseconds. Genuine pauses remain pauses.

The telemetry, kinetic typography layout, background grid state, node constellation, and Three.js rig are isolated per `<Sequence>` so every beat unmounts cleanly before the next scene hard-cuts in—no elements, history, or geometry bleed across scene boundaries:

- `src/Root.tsx` (re-exported by `src/RootComposition.tsx`) exports `Root` and `RemotionRoot`, registering `EngineFirstExplainer` as a vertical `1080×1920` composition (`1,547` frames at `30 fps`) and assembling six non-overlapping `<Sequence durationInFrames={...} from={...}>` blocks.
- `src/SceneContainer.tsx` defines the shared `1080×1920` root layout grid (`gridTemplateColumns: '320px 1fr'`) inherited by all six scene components so the left `320px` `<TelemetryHud />` spine never jumps across `<Sequence>` cuts while the right `760px` column hosts each scene's isolated kinetic typography and engine canvas.
- `src/SceneAudio.tsx` and `public/sfx/{click,click-accent,whoosh,slash-impact,telemetry-hum}.mp3` (synthesized deterministically via `scripts/generate-sfx.py`) embed scene-isolated Remotion `<Audio>` triggers in every scene: sharp digital word-snap clicks mapped directly from `WORD_START_FRAMES`, scene-cut sub-bass whooshes/risers, visual impact hits, and a looped `volume={0.15}` telemetry data-stream hum.
- `src/TelemetryHud.tsx` provides the persistent `320px` left-column telemetry HUD and `760×1920` right-column scene constellations.
- `src/KineticEngine.tsx` handles `{damping: 10, stiffness: 180}` spring physics and word-by-word absolute-frame snapping across distinct vertical stage layouts.
- `src/scenes/HookScene.tsx`, `src/scenes/TwistScene.tsx`, `src/scenes/ShiftScene.tsx`, `src/scenes/MechanismScene.tsx`, `src/scenes/PayoffScene.tsx`, and `src/scenes/OutroScene.tsx` implement each isolated `<Sequence>` beat (`src/TimelineGrid.tsx` renders the Payoff timeline).
- `src/engine/agentEngineModel.ts` owns cue lookup, non-overlapping `<Sequence>` boundaries, scene-scoped selectors, color, and audio-envelope data.

Render the new AI-agent film:

```sh
npm run render
```

The MP4 is written to `out/AI-Agent-Engine-First.mp4`.

## The Code That Replaced After Effects (60 seconds)

The previously completed one-minute video and its independent composition are preserved:

- Composition: `TheCodeThatReplacedAfterEffects`
- Source: `src/engine/MotionEngine.tsx`
- Narration/cues: `public/after-effects/voiceover.wav` and `src/engine/word-cues.json`
- Deliverable: `deliverables/The-Code-That-Replaced-After-Effects.mp4`

Render that film separately with:

```sh
npm run render:after-effects
```

## Checks and preview

```sh
npm ci
npm run typecheck
npm run verify:sync
npm run start
```

The sync check verifies spelling and punctuation, WAV SHA-256, every absolute frame boundary, every composition frame, and telemetry/graph changes on all 91 word onsets. To regenerate phonetic word and frame cues for the current WAV:

```sh
python3 -m pip install pocketsphinx==5.1.1
python3 scripts/align-narration-phonetic.py
npm run verify:sync
```

The reviewed correction in `scripts/agent-engine-align-overrides.json` is bound to this exact WAV. A different narration requires reviewing the correction and updating its audio hash before re-alignment. `scripts/align-narration.py` can optionally provide a separate faster-whisper transcript check; run the phonetic aligner afterwards to regenerate the frame map.

Regenerate the AI-agent frame-level RMS envelope:

```sh
python3 scripts/derive-audio-envelope.py
```

Remotion 4.0.539 rejects literal `--concurrency=max`; `--concurrency=100%` selects its maximum. If required, pass local Chromium using `npm run render -- --browser-executable=/path/to/chromium`.

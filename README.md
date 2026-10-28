# Deterministic Motion Documentaries

This Remotion project contains two separate, word-synchronized films. Each uses the same independent compositing architecture: an obsidian background, an isolated Three.js depth layer, and front-facing 2D typography. The established one-minute After Effects explainer remains available alongside the engine-first AI-agent film, now using its selected natural-speed narration.

## Engine-First AI Agent Documentary (about 52 seconds)

The new film contrasts template-shaped agent demos with deterministic, code-driven production:

- **Hook:** spring-slamming electric-white words over a gridded, audio-reactive vector streak.
- **Twist:** an intentionally generic dashboard is cut by a safety-orange vector slash on “break.”
- **Shift:** split chat/terminal view reveals spoken codebase constraints as they arrive.
- **Mechanism:** physics, isolation, and math scale into view on exact narration cues; timing/easing details and same-input/same-frame proof reveal progressively.
- **Payoff:** a fast-scrolling timeline resolves through prompt, code, frames, and MP4 stages as each is spoken.
- **Outro:** “BUILD THE ENGINE” punches forward, then cuts to black.

The palette is deep obsidian `#0b0f19`, electric white, and safety orange `#ff4500`. This film uses the selected natural-speed narration, 91 exact word cues, and a frame-level audio envelope under `public/agent-engine/` and `src/engine/agent-engine-*.json`. The voiceover is not time-compressed; its decoded source is about 51.56 seconds, with the Remotion composition rounded to 51.57 seconds at 30 fps. Scene transitions follow their aligned spoken cues. Every scene uses an asymmetric 30/70 composition: a persistent left telemetry/terminal rail and a center-right visual field with atmospheric coordinate marks. `timestamps[]` drives per-word spring hits to the nearest 30 fps frame; each word dissolves after its cue, with no future-word preview.

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

Regenerate exact AI-agent narration timestamps from a local faster-whisper model:

```sh
python3 scripts/align-narration.py --model-dir /path/to/whisper-model
```

Regenerate the AI-agent frame-level RMS envelope:

```sh
python3 scripts/derive-audio-envelope.py
```

Remotion 4.0.539 rejects literal `--concurrency=max`; `--concurrency=100%` selects its maximum. If required, pass local Chromium using `npm run render -- --browser-executable=/path/to/chromium`.

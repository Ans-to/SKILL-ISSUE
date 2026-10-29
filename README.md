# Deterministic Motion Documentaries

This Remotion project contains two separate, word-synchronized films. Each uses the same independent compositing architecture: an obsidian background, an isolated Three.js depth layer, and front-facing 2D typography. The established one-minute After Effects explainer remains available alongside the engine-first AI-agent film, now using its selected natural-speed narration.

## Engine-First AI Agent Documentary (about 52 seconds)

The new film contrasts template-shaped agent demos with deterministic, code-driven production:

- **Hook:** spring-slamming electric-white and safety-orange words framed by a live AI Agent Build-Verification Pipeline (`0_ARTIFACTS_BUILT` audit terminal) and a Boilerplate Paste CLI Tokenizer (`"It pasted a template."`).
- **Twist:** surface-illusion mock pipeline X-ray inspector ramping production load before `"Real codebases break."` triggers a full crimson **Diagnostic Warning Overlay with real-time Stack-Trace Logs**, screen shake, and crimson impact flash.
- **Shift:** animated **AI Command-Line / Chat Input Box** components (`"Prompt harder? No."` and `"from a pretty prompt."`) with live syntax tokenization, blinking block cursor, and real-time prompt compilation status—framing a 3-node Codebase Engine Graph + quantized `TimelineGrid` across `"timing model, render graph, or hard constraints"`.
- **Mechanism:** calm `easeInOutCubic` precision typography framed by a live Engine-First Mathematical Solver (damped harmonic spring on `"physics,"`, quantized `30fps` keyframe grid on `"timing,"`, cubic-bezier curve on `"easing,"`) + connecting 6-primitive execution terminal, deterministic CLI input hash verifier (`"Same inputs. Same frames."`), and diagnostic roulette quarantine (`"No template roulette."`).
- **Payoff:** structured Intent CLI ingest (`"Feed intent into the engine."`) transitioning into a **4-Stage Live Compiler Node-Graph Pipeline** (`[01 PROMPT] -> [02 TSX_CODE] -> [03 FRAMES] -> [04 H264_MP4]`) and real-time compiler execution terminal (`"It compiles the prompt to code, code to frames, frames to MP4. Fast. Inspectable. Repeatable."`).
- **Outro:** crimson template-deprecation diagnostic teardown (`"Stop playing with templates."`), full-power Engine Monolith pipeline (`"Build the engine—"`), and fatal toy-artifact release blocker with stack-trace dump (`"or ship toys."`) before cutting cleanly to black at `F1541`.

The palette is deep obsidian `#0b0f19`, electric white, and safety orange `#ff4500`. The selected narration stays at natural speed: its decoded WAV is about 51.56 seconds, with a 1,547-frame composition (51.57 seconds at 30 fps). The 91 canonical words have phonetic audio alignment and a reviewed correction tied to the WAV's SHA-256. `agent-engine-frame-cues.json` stores absolute start/end frame arrays; the runtime builds a direct per-frame lookup with no accumulating timers, crossfades, previous-word echoes, or future-word previews. Every aligned boundary uses the first frame at or after its timestamp, so a 30 fps render can resolve it to within one frame rather than arbitrary subframe milliseconds. Genuine pauses remain pauses.

The telemetry, kinetic typography layout, background grid state, node constellation, and Three.js rig are isolated per `<Sequence>` so every beat unmounts cleanly before the next scene hard-cuts in—no elements, history, or geometry bleed across scene boundaries:

- `src/Root.tsx` (re-exported by `src/RootComposition.tsx`) exports `Root` and `RemotionRoot`, registering `EngineFirstExplainer` as a vertical `1080×1920` composition (`1,547` frames at `30 fps`) and assembling six non-overlapping `<Sequence durationInFrames={...} from={...}>` blocks.
- `src/SceneContainer.tsx` and `src/scenes/SceneStage.tsx` enforce **Full-Canvas Layer Decoupling** across `1080×1920` (`CANVAS_Z_LAYERS`): zero parent flex, grid, or unified board wrapper groups background UI widgets with central hero text. Every visual plane mounts directly onto `<AbsoluteFill>` as an independent `position: 'absolute'` layer stratified by `zIndex` (`z=1` coordinate grid, `z=10` Three.js WebGL horizon, `z=20` background UI widget, `z=30` active terminal box, `z=36` calibration hairlines, `z=42` clause telemetry ribbon, `z=55` foreground hero kinetic text, `z=65` conflict flash, `z=75/76` floating HUD header/footer) with multi-plane depth parallax and asymmetric horizontal offsets.
- `src/ContextualUiSimulation.tsx` (bridged by `src/ContextualBroll.tsx`) enforces **Active Contextual UI Simulation** across all `1,531` active frames—locking interactive visual AI chat windows + live code-input buffers (`[SEND ⏎]` button, user prompt typing, blinking cursor, streaming AST/code buffer, syntax tokenization on `'prompt-cli'`), live code-compiler source bars + connecting 4-node DAG pipelines + real-time execution terminals (`'engine-pipeline'`), and crimson diagnostic warning overlays + stack-trace dumps (`'error-diagnostic'`) to every action verb in the script. All 16 UI clauses use distinct non-repeating `CLAUSE_MOTION_SIGNATURES` (`'heavy-spring-pop'`, `'horizontal-terminal-slide'`, `'digital-flicker-fade'`) with smooth 12-frame entrances and reverse-eased exits.
- `src/TelemetryHud.tsx` provides dynamic, semi-transparent floating HUD chips, tactical lower-thirds, and minimal corner calibration hairlines with six distinct per-scene `SCENE_HUD_PROFILES` (`spring-pop`, `terminal-slide-x`, `digital-flicker`, `aperture-glide`, `cascade-lock`, `monolith-snap`) so consecutive scenes never share HUD entrance transitions or spring physics.
- `src/KineticEngine.tsx` implements 29 non-repeating hero phrases (`ALL_HERO_PHRASES`, zero consecutive duplicate schemas or spring physics across all 91 tokens and scene boundaries): (1) `hook-climax` (heavy high-velocity spring pops from `scale(0.8)` with horizontal vector slice and crimson glow flash), (2) `code-typewriter` (smooth horizontal `translateX` terminal slides + character-by-character monospaced typing with a live blinking `_` cursor), and (3) `metric-glitch` (sharp digital shutter flicker-fades + RGB chromatic aberration lock).
- `src/StaggeredTextItem.tsx` implements polymorphic per-element entrances (`'hook-pop'` heavy high-velocity spring pops, `'terminal-slide'` smooth horizontal `translateX` slides, `'telemetry-flicker'` sharp digital flicker-fades) with rotating `variantSeed` physics tables so consecutive words, Clause Strip tokens, card titles/badges, syntax tokens, and terminal rows never share identical spring physics or entrance curves.
- `src/scenes/HookScene.tsx`, `src/scenes/TwistScene.tsx`, `src/scenes/ShiftScene.tsx`, `src/scenes/MechanismScene.tsx`, `src/scenes/PayoffScene.tsx`, and `src/scenes/OutroScene.tsx` implement each isolated `<Sequence>` beat over `CleanCoordinateGrid` (`src/TimelineGrid.tsx` renders the quantized linear keyframe grid on semantic `"timing"` cues).
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

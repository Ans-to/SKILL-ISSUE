import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {computeAssetTransition, type AssetTransitionEnvelope} from './ContextualUiSimulation';
import {CRIMSON, TENSION_SPRING_CONFIG, getConflictImpactWeight} from './EmotionalPacing';
import {StaggeredTextItem} from './StaggeredTextItem';
import {
  FPS,
  MUTED,
  ORANGE,
  OUTRO_CUT_FRAME,
  SCENE_SEQUENCES,
  SCRIPT_CUES,
  WHITE,
  clamp,
  isSceneCleared,
  normalize,
  sceneSpokenCues,
  type SceneKey,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

export type TypographicSchemaKind = 'hook-climax' | 'code-typewriter' | 'metric-glitch';

export const EMPHASIS_WORDS = new Set([
  'didnt',
  'anything',
  'pasted',
  'template',
  'templates',
  'break',
  'no',
  'cant',
  'timing',
  'graph',
  'constraints',
  'engine',
  'physics',
  'isolation',
  'math',
  'roulette',
  'compiles',
  'mp4',
  'fast',
  'inspectable',
  'repeatable',
  'stop',
  'build',
  'toys',
]);

export const isEmphasis = (text: string): boolean => EMPHASIS_WORDS.has(normalize(text));

const CODE_PROMPT_TOKENS = new Set([
  'prompt',
  'prompts',
  'code',
  'codebase',
  'codebases',
  'template',
  'pasted',
  'input',
  'inputs',
  'intent',
  'compiles',
  'compiler',
  'compile',
  'infer',
  'defined',
]);

const METRIC_DATA_TOKENS = new Set([
  'looks',
  'finished',
  'boilerplate',
  'demos',
  'clean',
  'templates',
  'timing',
  'model',
  'render',
  'graph',
  'hard',
  'constraints',
  'physics',
  'isolation',
  'positions',
  'easing',
  'transitions',
  'frames',
  'fast',
  'inspectable',
  'repeatable',
  'data',
  'metric',
  'telemetry',
  'config',
]);

export const classifyTokenTypographicSchema = (rawWord: string): TypographicSchemaKind => {
  const token = normalize(rawWord);
  if (CODE_PROMPT_TOKENS.has(token)) return 'code-typewriter';
  if (METRIC_DATA_TOKENS.has(token)) return 'metric-glitch';
  return 'hook-climax';
};

/**
 * Deterministic 29-phrase non-repeating motion & typographic mapping across all 91 tokens:
 *  - 'hook-climax'     -> Hooks / Errors: heavy, high-velocity spring pops
 *  - 'code-typewriter' -> Code / Prompts: smooth horizontal terminal slides
 *  - 'metric-glitch'   -> Telemetry / Data: sharp digital flicker-fades
 * Consecutive phrases NEVER repeat the same schema, entrance animation, or spring physics.
 */
export const resolveCueTypographicSchema = (
  cue: ScriptCue,
  _variant?: SceneKey,
): TypographicSchemaKind => {
  const idx = cue.globalIndex;
  // Scene 1: Hook
  if (idx >= 0 && idx <= 5) return 'hook-climax'; // "Your AI agent didn’t build anything."
  if (idx >= 6 && idx <= 9) return 'code-typewriter'; // "It pasted a template."
  // Scene 2: Twist
  if (idx >= 10 && idx <= 12) return 'metric-glitch'; // "It looks finished."
  if (idx >= 13 && idx <= 15) return 'hook-climax'; // "That’s the trick."
  if (idx >= 16 && idx <= 18) return 'metric-glitch'; // "Boilerplate demos clean."
  if (idx >= 19 && idx <= 20) return 'code-typewriter'; // "Real codebases"
  if (idx === 21) return 'hook-climax'; // "break."
  // Scene 3: Shift
  if (idx >= 22 && idx <= 23) return 'code-typewriter'; // "Prompt harder?"
  if (idx >= 24 && idx <= 27) return 'hook-climax'; // "No. It still can’t"
  if (idx >= 28 && idx <= 30) return 'code-typewriter'; // "infer your codebase’s"
  if (idx >= 31 && idx <= 37) return 'metric-glitch'; // "timing model, render graph, or hard constraints"
  if (idx >= 38 && idx <= 41) return 'code-typewriter'; // "from a pretty prompt."
  // Scene 4: Mechanism
  if (idx >= 42 && idx <= 44) return 'hook-climax'; // "Engine- first means"
  if (idx >= 45 && idx <= 50) return 'metric-glitch'; // "physics, isolation, timing, positions, easing, transitions—"
  if (idx >= 51 && idx <= 52) return 'code-typewriter'; // "defined as"
  if (idx === 53) return 'hook-climax'; // "math."
  if (idx >= 54 && idx <= 55) return 'code-typewriter'; // "Same inputs."
  if (idx >= 56 && idx <= 57) return 'metric-glitch'; // "Same frames."
  if (idx >= 58 && idx <= 60) return 'hook-climax'; // "No template roulette."
  // Scene 5: Payoff
  if (idx >= 61 && idx <= 62) return 'code-typewriter'; // "Feed intent"
  if (idx >= 63 && idx <= 65) return 'hook-climax'; // "into the engine."
  if (idx >= 66 && idx <= 73) return 'code-typewriter'; // "It compiles the prompt to code, code to"
  if (idx >= 74 && idx <= 76) return 'metric-glitch'; // "frames, frames to"
  if (idx === 77) return 'hook-climax'; // "MP4."
  if (idx >= 78 && idx <= 80) return 'metric-glitch'; // "Fast. Inspectable. Repeatable."
  // Scene 6: Outro
  if (idx >= 81 && idx <= 83) return 'hook-climax'; // "Stop playing with"
  if (idx === 84) return 'metric-glitch'; // "templates."
  if (idx >= 85 && idx <= 87) return 'code-typewriter'; // "Build the engine—"
  if (idx >= 88 && idx <= 90) return 'hook-climax'; // "or ship toys."
  return classifyTokenTypographicSchema(cue.text);
};

export type HeroPhraseSpec = {
  id: string;
  globalPhraseIndex: number;
  sceneId: SceneKey;
  schema: TypographicSchemaKind;
  springSignature: {damping: number; stiffness: number; mass: number};
  firstWordIndex: number;
  lastWordIndex: number;
  firstWordStartFrame: number;
  lastWordEndFrame: number;
  renderStartFrame: number;
  renderEndFrame: number;
  fullCharCount: number;
};

const HERO_PHRASE_RANGES: Readonly<Record<SceneKey, ReadonlyArray<readonly [number, number]>>> = {
  hook: [
    [0, 5], // hook-climax:     "Your AI agent didn’t build anything."
    [6, 9], // code-typewriter: "It pasted a template."
  ],
  twist: [
    [10, 12], // metric-glitch:   "It looks finished."
    [13, 15], // hook-climax:     "That’s the trick."
    [16, 18], // metric-glitch:   "Boilerplate demos clean."
    [19, 20], // code-typewriter: "Real codebases"
    [21, 21], // hook-climax:     "break."
  ],
  shift: [
    [22, 23], // code-typewriter: "Prompt harder?"
    [24, 27], // hook-climax:     "No. It still can’t"
    [28, 30], // code-typewriter: "infer your codebase’s"
    [31, 37], // metric-glitch:   "timing model, render graph, or hard constraints"
    [38, 41], // code-typewriter: "from a pretty prompt."
  ],
  mechanism: [
    [42, 44], // hook-climax:     "Engine- first means"
    [45, 50], // metric-glitch:   "physics, isolation, timing, positions, easing, transitions—"
    [51, 52], // code-typewriter: "defined as"
    [53, 53], // hook-climax:     "math."
    [54, 55], // code-typewriter: "Same inputs."
    [56, 57], // metric-glitch:   "Same frames."
    [58, 60], // hook-climax:     "No template roulette."
  ],
  payoff: [
    [61, 62], // code-typewriter: "Feed intent"
    [63, 65], // hook-climax:     "into the engine."
    [66, 73], // code-typewriter: "It compiles the prompt to code, code to"
    [74, 76], // metric-glitch:   "frames, frames to"
    [77, 77], // hook-climax:     "MP4."
    [78, 80], // metric-glitch:   "Fast. Inspectable. Repeatable."
  ],
  outro: [
    [81, 83], // hook-climax:     "Stop playing with"
    [84, 84], // metric-glitch:   "templates."
    [85, 87], // code-typewriter: "Build the engine—"
    [88, 90], // hook-climax:     "or ship toys."
  ],
};

export const TYPEWRITER_ENTER_FRAMES = 12;
export const TYPEWRITER_EXIT_FRAMES = 10;

export const SCENE_HERO_PHRASES: Readonly<Record<SceneKey, readonly HeroPhraseSpec[]>> = (() => {
  const byScene: Record<SceneKey, HeroPhraseSpec[]> = {
    hook: [],
    twist: [],
    shift: [],
    mechanism: [],
    payoff: [],
    outro: [],
  };

  let globalPhraseCounter = 0;

  for (const scene of SCENE_SEQUENCES) {
    const activeEnd =
      scene.id === 'outro' ? OUTRO_CUT_FRAME : scene.endFrame - scene.clearFrames;
    const ranges = HERO_PHRASE_RANGES[scene.id];

    ranges.forEach(([startIdx, endIdx], pIdx) => {
      const schema = resolveCueTypographicSchema(SCRIPT_CUES[startIdx], scene.id);
      const firstWordStartFrame = SCRIPT_CUES[startIdx].startFrame;
      const lastWordEndFrame = SCRIPT_CUES[endIdx].endFrame;
      const prevEnd = pIdx > 0 ? SCRIPT_CUES[ranges[pIdx - 1][1]].endFrame : scene.from;
      const nextStart =
        pIdx + 1 < ranges.length ? SCRIPT_CUES[ranges[pIdx + 1][0]].startFrame : activeEnd;

      const renderStartFrame =
        schema === 'code-typewriter'
          ? Math.max(scene.from, Math.max(prevEnd, firstWordStartFrame - 8))
          : firstWordStartFrame;

      const renderEndFrame = Math.min(
        activeEnd,
        nextStart,
        lastWordEndFrame + TYPEWRITER_EXIT_FRAMES,
      );

      const fullCharCount = SCRIPT_CUES.slice(startIdx, endIdx + 1)
        .map((c) => c.text)
        .join(' ').length;

      // Distinct physics signature per phrase so consecutive phrases never share spring constants
      const springSignature =
        schema === 'hook-climax'
          ? {
              damping: Number((7.6 + (globalPhraseCounter % 4) * 0.5).toFixed(2)),
              stiffness: 315 + (globalPhraseCounter % 5) * 18,
              mass: Number((0.84 + (globalPhraseCounter % 3) * 0.09).toFixed(2)),
            }
          : schema === 'code-typewriter'
            ? {
                damping: 17 + (globalPhraseCounter % 4) * 2,
                stiffness: 190 + (globalPhraseCounter % 5) * 14,
                mass: Number((0.92 + (globalPhraseCounter % 3) * 0.06).toFixed(2)),
              }
            : {
                damping: 24 + (globalPhraseCounter % 4) * 2,
                stiffness: 255 + (globalPhraseCounter % 4) * 15,
                mass: Number((0.72 + (globalPhraseCounter % 3) * 0.07).toFixed(2)),
              };

      byScene[scene.id].push({
        id: `${scene.id}-phrase-${startIdx}-${endIdx}`,
        globalPhraseIndex: globalPhraseCounter,
        sceneId: scene.id,
        schema,
        springSignature,
        firstWordIndex: startIdx,
        lastWordIndex: endIdx,
        firstWordStartFrame,
        lastWordEndFrame,
        renderStartFrame,
        renderEndFrame,
        fullCharCount,
      });

      globalPhraseCounter += 1;
    });
  }

  return byScene;
})();

export const ALL_HERO_PHRASES: readonly HeroPhraseSpec[] = SCENE_SEQUENCES.flatMap(
  (s) => SCENE_HERO_PHRASES[s.id],
);

export type TypewriterWindowSpec = {
  id: string;
  sceneId: SceneKey;
  firstWordIndex: number;
  lastWordIndex: number;
  firstWordStartFrame: number;
  lastWordEndFrame: number;
  renderStartFrame: number;
  renderEndFrame: number;
};

export const SCENE_TYPEWRITER_WINDOWS: Readonly<Record<SceneKey, readonly TypewriterWindowSpec[]>> =
  (() => {
    const byScene: Record<SceneKey, TypewriterWindowSpec[]> = {
      hook: [],
      twist: [],
      shift: [],
      mechanism: [],
      payoff: [],
      outro: [],
    };

    for (const scene of SCENE_SEQUENCES) {
      for (const p of SCENE_HERO_PHRASES[scene.id]) {
        if (p.schema === 'code-typewriter') {
          byScene[scene.id].push({
            id: `${scene.id}-tw-${p.firstWordIndex}-${p.lastWordIndex}`,
            sceneId: scene.id,
            firstWordIndex: p.firstWordIndex,
            lastWordIndex: p.lastWordIndex,
            firstWordStartFrame: p.firstWordStartFrame,
            lastWordEndFrame: p.lastWordEndFrame,
            renderStartFrame: p.renderStartFrame,
            renderEndFrame: p.renderEndFrame,
          });
        }
      }
    }

    return byScene;
  })();

export const getTypewriterWindowEnvelope = (
  scene: SceneSpec,
  cue: ScriptCue,
  globalFrame: number,
): AssetTransitionEnvelope => {
  const win = SCENE_TYPEWRITER_WINDOWS[scene.id].find(
    (w) => cue.globalIndex >= w.firstWordIndex && cue.globalIndex <= w.lastWordIndex,
  );
  if (!win) {
    const dur = Math.max(10, cue.endFrame - cue.startFrame);
    return computeAssetTransition(globalFrame - cue.startFrame, dur, {
      enterFrames: TYPEWRITER_ENTER_FRAMES,
      exitFrames: TYPEWRITER_EXIT_FRAMES,
      slidePx: 18,
    });
  }
  const dur = Math.max(12, win.renderEndFrame - win.renderStartFrame);
  return computeAssetTransition(globalFrame - win.renderStartFrame, dur, {
    enterFrames: TYPEWRITER_ENTER_FRAMES,
    exitFrames: TYPEWRITER_EXIT_FRAMES,
    slidePx: 18,
  });
};

export type TypographicKinematics = {
  schema: TypographicSchemaKind;
  localCueFrame: number;
  springPop: number;
  scale: number;
  sliceIntensity: number;
  redGlowFlash: number;
  visibleText: string;
  visibleChars: number;
  totalChars: number;
  cursorBlinkOn: boolean;
  terminalSlideX: number;
  slideTranslateX: number;
  chromaticOffsetPx: number;
  flickerOpacity: number;
};

const TELEMETRY_SHUTTER_PATTERNS: ReadonlyArray<readonly number[]> = [
  [0.26, 0.94, 0.34, 0.98, 0.62, 1.0],
  [0.42, 0.18, 0.92, 0.48, 0.96, 1.0],
  [0.32, 0.88, 0.24, 0.86, 0.72, 1.0],
];

export const computeTypographicKinematics = (
  cue: ScriptCue,
  variant: SceneKey,
  globalFrame: number,
): TypographicKinematics => {
  const schema = resolveCueTypographicSchema(cue, variant);
  const localCueFrame = Math.max(0, globalFrame - cue.startFrame);
  const cueSpan = Math.max(1, cue.endFrame - cue.startFrame);
  const totalChars = cue.text.length;

  // 1. Heavy, high-velocity spring pop (Hooks / Errors) with per-cue varied physics
  const popSpringConfig = {
    damping: TENSION_SPRING_CONFIG.damping + (cue.globalIndex % 3) * 0.5,
    stiffness: TENSION_SPRING_CONFIG.stiffness + (cue.globalIndex % 4) * 22,
    mass: 0.86 + (cue.globalIndex % 3) * 0.07,
  };
  const springPop = spring({
    frame: localCueFrame,
    fps: FPS,
    config: popSpringConfig,
  });
  const scale = 0.8 + 0.2 * springPop;
  const sliceIntensity = interpolate(localCueFrame, [0, 1, 7], [1, 0.92, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const conflictBoost = getConflictImpactWeight(cue.text);
  const baseGlowPeak = conflictBoost >= 0.6 ? 0.95 : isEmphasis(cue.text) ? 0.72 : 0.48;
  const redGlowFlash = interpolate(
    localCueFrame,
    [0, 1.5, 9],
    [baseGlowPeak * 0.9, baseGlowPeak, 0.08],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  // 2. Smooth horizontal terminal slide + live character typing (Code / Prompts)
  const typeFrames =
    totalChars <= 1 || cueSpan <= 1 ? 1 : clamp(Math.floor(cueSpan * 0.55), 1, 8);
  const visibleChars =
    totalChars <= 1 || cueSpan <= 1
      ? totalChars
      : clamp(1 + Math.floor((localCueFrame / typeFrames) * (totalChars - 1)), 1, totalChars);
  const visibleText = cue.text.slice(0, visibleChars);
  const cursorBlinkOn =
    localCueFrame < typeFrames ? true : Math.floor(globalFrame / 4) % 2 === 0;
  const termSlideSpan = Math.min(10, Math.max(4, Math.floor(cueSpan * 0.75)));
  const termSlideProgress = interpolate(localCueFrame, [0, termSlideSpan], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const terminalSlideX = Number(((1 - termSlideProgress) * -76).toFixed(2));

  // 3. Sharp digital flicker-fade + telemetry lock (Telemetry / Data)
  const slideFrames = Math.min(6, Math.max(2, Math.floor(cueSpan * 0.45)));
  const slideProgress = interpolate(localCueFrame, [0, slideFrames], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slideDir = cue.globalIndex % 2 === 0 ? -1 : 1;
  const slideTranslateX = Number(((1 - slideProgress) * 96 * slideDir).toFixed(2));
  const chromaticOffsetPx = Number(
    ((1 - slideProgress) * 10.5 + (localCueFrame < 6 ? 1.8 : 0)).toFixed(2),
  );
  const shutterPattern = TELEMETRY_SHUTTER_PATTERNS[cue.globalIndex % TELEMETRY_SHUTTER_PATTERNS.length];
  const flickerOpacity =
    localCueFrame < shutterPattern.length ? shutterPattern[localCueFrame] : 1.0;

  return {
    schema,
    localCueFrame,
    springPop,
    scale,
    sliceIntensity,
    redGlowFlash,
    visibleText,
    visibleChars,
    totalChars,
    cursorBlinkOn,
    terminalSlideX,
    slideTranslateX,
    chromaticOffsetPx,
    flickerOpacity,
  };
};

const fitSansWordSize = (text: string, maxPx: number, innerWidthPx: number): number =>
  Math.min(maxPx, Math.floor(innerWidthPx / Math.max(4.0, text.length * 0.58)));

const fitSansPhraseSize = (fullCharCount: number, wordCount: number): number => {
  if (wordCount <= 1) return fitSansWordSize('x'.repeat(fullCharCount), 154, 936);
  if (fullCharCount <= 15) return 88;
  if (fullCharCount <= 22) return 72;
  if (fullCharCount <= 38) return 60;
  if (fullCharCount <= 50) return 54;
  return 50;
};

const fitMonoPhraseSize = (fullCharCount: number): number => {
  if (fullCharCount > 32) return 46;
  return clamp(Math.floor(852 / Math.max(5.5, (fullCharCount + 3.2) * 0.62)), 44, 98);
};

const MONO_STACK =
  '"JetBrains Mono", "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace';

const TerminalTypewriterBox: React.FC<{
  variant: SceneKey;
  sceneFrom: number;
  envelope: AssetTransitionEnvelope;
  tokenAttr: string;
  charCounterLabel: string;
  spokenWords: ReadonlyArray<{
    cue: ScriptCue;
    displayText: string;
    isCurrent: boolean;
  }>;
  cursorBlinkOn: boolean;
  fontSize: number;
  allowWrap?: boolean;
  textOpacity?: number;
  foregroundShakeX?: number;
  frameOverride?: number;
  style?: React.CSSProperties;
}> = ({
  variant,
  sceneFrom,
  envelope,
  tokenAttr,
  charCounterLabel,
  spokenWords,
  cursorBlinkOn,
  fontSize,
  allowWrap = false,
  textOpacity = 1,
  foregroundShakeX = 0,
  frameOverride,
  style,
}) => {
  // Smooth horizontal terminal slide envelope (-84px -> 0 on entrance, +72px on exit)
  const slideX =
    (envelope.phase === 'entering'
      ? (1 - envelope.enterProgress) * -84
      : envelope.phase === 'exiting'
        ? (1 - envelope.exitProgress) * 72
        : 0) + foregroundShakeX;

  return (
    <div
      data-canvas-layer="hero-kinetic-text"
      data-layer-z={55}
      data-kinetic-variant={variant}
      data-typography-schema="code-typewriter"
      data-motion-family="horizontal-terminal-slide"
      data-full-token={tokenAttr}
      data-typed-chars={charCounterLabel}
      data-terminal-box-opacity={envelope.opacity}
      data-terminal-box-slide-x={slideX.toFixed(2)}
      data-terminal-typewriter-box="true"
      style={{
        position: 'absolute',
        left: '50%',
        top: 848,
        zIndex: 55,
        transform: `translate3d(calc(-50% + ${slideX.toFixed(2)}px), -50%, 0)`,
        opacity: envelope.opacity,
        padding: '18px 34px 22px',
        background: 'rgba(7, 11, 21, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 69, 0, 0.52)',
        borderLeft: `4px solid ${ORANGE}`,
        boxShadow:
          '0 36px 90px rgba(0, 0, 0, 0.92), 0 0 44px rgba(255, 69, 0, 0.14), inset 0 0 24px rgba(255, 69, 0, 0.06)',
        maxWidth: 948,
        minWidth: 440,
        boxSizing: 'border-box',
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 10,
            fontFamily: MONO_STACK,
            fontSize: 11,
            letterSpacing: 2,
            color: MUTED,
          }}
        >
          <span style={{color: ORANGE, fontWeight: 700}}>CLI_STDIN // HORIZONTAL_TERMINAL_SLIDE</span>
          <span>CHAR {charCounterLabel}</span>
        </div>

        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.12,
            whiteSpace: allowWrap ? 'normal' : 'nowrap',
            opacity: textOpacity,
            display: 'flex',
            flexWrap: allowWrap ? 'wrap' : 'nowrap',
            alignItems: 'baseline',
          }}
        >
          <span style={{color: ORANGE, opacity: 0.9, marginRight: 12}}>&gt;</span>
          <span
            data-typewriter-text="true"
            style={{
              display: 'inline-flex',
              flexWrap: allowWrap ? 'wrap' : 'nowrap',
              alignItems: 'baseline',
              gap: `6px ${Math.round(fontSize * 0.28)}px`,
            }}
          >
            {spokenWords.map(({cue, displayText, isCurrent}, idx) => {
              const hot = isEmphasis(cue.text);
              return (
                <StaggeredTextItem
                  key={cue.globalIndex}
                  text={displayText}
                  delay={cue.startFrame - sceneFrom}
                  profile="terminal-slide"
                  variantSeed={cue.globalIndex + idx}
                  frameOverride={frameOverride}
                  style={{
                    color: hot ? ORANGE : isCurrent ? WHITE : 'rgba(244, 247, 255, 0.90)',
                    textShadow: hot
                      ? '0 0 26px rgba(255,69,0,0.38)'
                      : '0 8px 24px rgba(0,0,0,0.65)',
                  }}
                />
              );
            })}
            <span
              data-typewriter-cursor={cursorBlinkOn ? 'on' : 'off'}
              style={{
                color: ORANGE,
                fontWeight: 800,
                opacity: cursorBlinkOn ? 1 : 0.14,
                textShadow: cursorBlinkOn ? '0 0 18px rgba(255,69,0,0.75)' : 'none',
              }}
            >
              _
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const KineticEngine: React.FC<{
  cue: ScriptCue;
  variant: SceneKey;
  globalFrame: number;
  phraseCues?: readonly ScriptCue[];
  fullPhraseCharCount?: number;
  useLiveRemotionHooks?: boolean;
  releaseOpacity?: number;
  releaseScale?: number;
  releaseTranslateY?: number;
  foregroundShakeX?: number;
  terminalEnvelope?: AssetTransitionEnvelope;
  style?: React.CSSProperties;
}> = ({
  cue,
  variant,
  globalFrame,
  phraseCues,
  fullPhraseCharCount,
  useLiveRemotionHooks = false,
  releaseOpacity = 1,
  releaseScale = 1,
  releaseTranslateY = 0,
  foregroundShakeX = 0,
  terminalEnvelope,
  style,
}) => {
  const owningScene = SCENE_SEQUENCES.find((s) => s.id === variant) ?? SCENE_SEQUENCES[0];
  const localFrame = globalFrame - owningScene.from;
  const frameOverride = useLiveRemotionHooks ? undefined : localFrame;
  const spokenCues = phraseCues && phraseCues.length > 0 ? phraseCues : [cue];
  const totalCharBudget =
    fullPhraseCharCount ?? spokenCues.map((c) => c.text).join(' ').length;

  const kin = computeTypographicKinematics(cue, variant, globalFrame);
  const conflictWeight = getConflictImpactWeight(cue.text);

  // ==========================================================================
  // 1. HOOKS / ERRORS: Heavy, High-Velocity Spring Pops ('hook-climax')
  // ==========================================================================
  if (kin.schema === 'hook-climax') {
    const isSingle = spokenCues.length === 1 && totalCharBudget === cue.text.length;
    const size = isSingle
      ? fitSansWordSize(cue.text, variant === 'outro' ? 162 : 156, 936)
      : fitSansPhraseSize(totalCharBudget, spokenCues.length);
    const shearPx = Number((kin.sliceIntensity * 11).toFixed(2));

    return (
      <div
        data-canvas-layer="hero-kinetic-text"
        data-layer-z={55}
        data-kinetic-variant={variant}
        data-typography-schema="hook-climax"
        data-motion-family="heavy-spring-pop"
        data-full-token={cue.text}
        data-staggered-word-count={spokenCues.length}
        style={{
          position: 'absolute',
          left: 44,
          right: 44,
          top: 848,
          zIndex: 55,
          transform: `translate3d(${foregroundShakeX.toFixed(2)}px, calc(-50% + ${releaseTranslateY.toFixed(1)}px), 0)`,
          opacity: releaseOpacity,
          textAlign: 'center',
          pointerEvents: 'none',
          ...style,
        }}
      >
        {/* Foreground Z-separation depth shadow + radial glow */}
        <div
          data-red-glow-flash={kin.redGlowFlash.toFixed(3)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 920,
            height: 290,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(6, 9, 17, 0.84) 0%, rgba(225, 29, 72, ${(
              kin.redGlowFlash * (conflictWeight >= 0.6 ? 0.56 : 0.34)
            ).toFixed(3)}) 34%, rgba(255, 69, 0, ${(kin.redGlowFlash * 0.18).toFixed(
              3,
            )}) 56%, transparent 78%)`,
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            transform: `scale(${((isSingle ? kin.scale : 0.92 + 0.08 * kin.springPop) * releaseScale).toFixed(4)})`,
            maxWidth: 948,
          }}
        >
          {spokenCues.map((wordCue, idx) => {
            const wordHot = isEmphasis(wordCue.text);
            const isCurrent = wordCue.globalIndex === cue.globalIndex;
            const glowShadow = `0 0 ${Math.round(32 + (isCurrent ? kin.redGlowFlash * 42 : 12))}px rgba(225, 29, 72, ${(
              0.20 +
              (isCurrent ? kin.redGlowFlash * 0.60 : 0.08)
            ).toFixed(3)}), 0 0 30px rgba(255, 69, 0, ${wordHot ? '0.44' : '0.16'}), 0 14px 38px rgba(0, 0, 0, 0.78)`;

            return (
              <StaggeredTextItem
                key={wordCue.globalIndex}
                text={wordCue.text}
                delay={wordCue.startFrame - owningScene.from}
                profile="hook-pop"
                variantSeed={wordCue.globalIndex + idx}
                frameOverride={frameOverride}
                dataAttrs={{'data-hero-word-index': wordCue.globalIndex}}
                style={{
                  fontSize: size,
                  fontWeight: 900,
                  letterSpacing: '-0.045em',
                  lineHeight: 1.04,
                  margin: `0 ${Math.round(size * 0.12)}px`,
                  color: wordHot ? ORANGE : WHITE,
                  textShadow: `${glowShadow}, 0 22px 48px rgba(0, 0, 0, 0.92)`,
                  whiteSpace: 'nowrap',
                }}
              />
            );
          })}

          {isSingle && kin.sliceIntensity > 0.08 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                fontSize: size,
                fontWeight: 900,
                letterSpacing: '-0.045em',
                lineHeight: 0.98,
                color: WHITE,
                whiteSpace: 'nowrap',
                clipPath: 'inset(0 0 52% 0)',
                transform: `translateX(${shearPx}px)`,
                opacity: kin.sliceIntensity * 0.85,
              }}
            >
              {cue.text}
            </div>
          )}

          <svg
            data-vector-slice="true"
            viewBox="0 0 920 36"
            style={{
              position: 'absolute',
              width: 920,
              height: 36,
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scaleX(${(
                0.35 +
                (1 - kin.sliceIntensity) * 0.72
              ).toFixed(3)})`,
              opacity: Math.max(0.14, kin.sliceIntensity),
              pointerEvents: 'none',
            }}
          >
            <line
              x1="30"
              y1="18"
              x2="890"
              y2="18"
              stroke={conflictWeight >= 0.6 ? CRIMSON : ORANGE}
              strokeWidth={(1.2 + kin.sliceIntensity * 3.4).toFixed(2)}
              strokeOpacity="0.92"
            />
            <line
              x1="140"
              y1="18"
              x2="780"
              y2="18"
              stroke={WHITE}
              strokeWidth={(0.6 + kin.sliceIntensity * 1.8).toFixed(2)}
              strokeOpacity={kin.sliceIntensity.toFixed(3)}
            />
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. CODE / PROMPTS: Smooth Horizontal Terminal Slides ('code-typewriter')
  // ==========================================================================
  if (kin.schema === 'code-typewriter') {
    const size = fitMonoPhraseSize(totalCharBudget);
    const boxEnv = terminalEnvelope ?? getTypewriterWindowEnvelope(owningScene, cue, globalFrame);

    const terminalWords = spokenCues.map((wordCue) => {
      const isCurrent = wordCue.globalIndex === cue.globalIndex;
      return {
        cue: wordCue,
        displayText: isCurrent ? kin.visibleText : wordCue.text,
        isCurrent,
      };
    });

    return (
      <TerminalTypewriterBox
        variant={variant}
        sceneFrom={owningScene.from}
        envelope={boxEnv}
        tokenAttr={cue.text}
        charCounterLabel={`${kin.visibleChars}/${kin.totalChars}`}
        spokenWords={terminalWords}
        cursorBlinkOn={kin.cursorBlinkOn}
        fontSize={size}
        allowWrap={totalCharBudget > 32}
        textOpacity={releaseOpacity}
        foregroundShakeX={foregroundShakeX}
        frameOverride={frameOverride}
        style={style}
      />
    );
  }

  // ==========================================================================
  // 3. TELEMETRY / DATA: Sharp Digital Flicker-Fades ('metric-glitch')
  // ==========================================================================
  const isSingleMetric = spokenCues.length === 1 && totalCharBudget === cue.text.length;
  const metricSize = isSingleMetric
    ? fitSansWordSize(cue.text, 146, 916)
    : fitSansPhraseSize(totalCharBudget, spokenCues.length);
  const firstPhraseDelay = spokenCues[0].startFrame - owningScene.from;

  return (
    <div
      data-canvas-layer="hero-kinetic-text"
      data-layer-z={55}
      data-kinetic-variant={variant}
      data-typography-schema="metric-glitch"
      data-motion-family="digital-flicker-fade"
      data-full-token={cue.text}
      data-chromatic-aberration={kin.chromaticOffsetPx}
      data-opacity-flicker={kin.flickerOpacity}
      data-staggered-word-count={spokenCues.length}
      style={{
        position: 'absolute',
        left: 44,
        right: 44,
        top: 848,
        zIndex: 55,
        transform: `translate3d(${foregroundShakeX.toFixed(2)}px, -50%, 0) scale(${releaseScale.toFixed(4)})`,
        opacity: releaseOpacity,
        textAlign: 'center',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Foreground Z-separation depth shadow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 900,
          height: 260,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(6, 9, 17, 0.82) 0%, rgba(6, 9, 17, 0.40) 52%, transparent 78%)',
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{position: 'relative', display: 'inline-block', maxWidth: 948}}>
        <div>
          <StaggeredTextItem
            text={`TELEMETRY_DATA // IDX_${String(cue.globalIndex).padStart(2, '0')}`}
            delay={firstPhraseDelay}
            profile="telemetry-flicker"
            variantSeed={cue.globalIndex}
            frameOverride={frameOverride}
            style={{
              fontFamily: MONO_STACK,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2.4,
              color: '#38bdf8',
              marginBottom: 12,
              padding: '3px 12px',
              border: '1px solid rgba(56, 189, 248, 0.42)',
              background: 'rgba(8, 18, 32, 0.92)',
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.72)',
            }}
          />
        </div>

        <div style={{position: 'relative'}}>
          {spokenCues.map((wordCue, idx) => {
            const wordHot = isEmphasis(wordCue.text);
            const isCurrent = wordCue.globalIndex === cue.globalIndex;
            const chromaShadow =
              isCurrent && kin.chromaticOffsetPx > 0.2
                ? `-${kin.chromaticOffsetPx}px 0 0 rgba(255, 42, 75, 0.86), ${kin.chromaticOffsetPx}px 0 0 rgba(0, 229, 255, 0.86), 0 12px 34px rgba(0, 0, 0, 0.72)`
                : wordHot
                  ? '0 0 34px rgba(255, 69, 0, 0.38), 0 12px 34px rgba(0, 0, 0, 0.72)'
                  : '0 12px 34px rgba(0, 0, 0, 0.72)';

            return (
              <StaggeredTextItem
                key={wordCue.globalIndex}
                text={wordCue.text}
                delay={wordCue.startFrame - owningScene.from}
                profile="telemetry-flicker"
                variantSeed={wordCue.globalIndex + idx}
                frameOverride={frameOverride}
                dataAttrs={{'data-hero-word-index': wordCue.globalIndex}}
                style={{
                  fontSize: metricSize,
                  fontWeight: 800,
                  letterSpacing: '-0.036em',
                  lineHeight: 1.04,
                  margin: `0 ${Math.round(metricSize * 0.12)}px`,
                  color: wordHot ? ORANGE : WHITE,
                  textShadow: `${chromaShadow}, 0 22px 48px rgba(0, 0, 0, 0.90)`,
                  whiteSpace: 'nowrap',
                }}
              />
            );
          })}

          {kin.chromaticOffsetPx > 2.2 && (
            <div
              data-glitch-scanline="true"
              style={{
                position: 'absolute',
                left: -24,
                right: -24,
                top: '46%',
                height: 3,
                background:
                  'linear-gradient(90deg, transparent, rgba(0,229,255,0.88), rgba(255,42,75,0.88), transparent)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Connected Kinetic Typography Stage (`useCurrentFrame()`):
 * Enforces non-repeating motion variety across all 29 Hero Phrases and 6 scenes:
 *  - Hooks / Errors  -> Heavy, high-velocity spring pops
 *  - Code / Prompts  -> Smooth horizontal terminal slides
 *  - Telemetry / Data -> Sharp digital flicker-fades
 */
export const SceneKineticStage: React.FC<{
  scene: SceneSpec;
  activeCue: ScriptCue | null;
  foregroundShakeX?: number;
}> = ({scene, activeCue, foregroundShakeX = 0}) => {
  const localFrame = useCurrentFrame();
  if (isSceneCleared(scene, localFrame)) return null;
  const globalFrame = scene.from + localFrame;
  const activeEnd =
    scene.id === 'outro' ? OUTRO_CUT_FRAME : scene.endFrame - scene.clearFrames;

  const phrase = SCENE_HERO_PHRASES[scene.id].find(
    (p) => globalFrame >= p.renderStartFrame && globalFrame < p.renderEndFrame,
  );
  if (!phrase) return null;

  // Pre-warm awaiting CLI cursor shell via smooth horizontal terminal slide (zero future-word preview)
  if (phrase.schema === 'code-typewriter' && globalFrame < phrase.firstWordStartFrame) {
    const env = computeAssetTransition(
      globalFrame - phrase.renderStartFrame,
      phrase.renderEndFrame - phrase.renderStartFrame,
      {
        enterFrames: TYPEWRITER_ENTER_FRAMES,
        exitFrames: TYPEWRITER_EXIT_FRAMES,
        slidePx: 18,
      },
    );
    const blink = Math.floor(globalFrame / 4) % 2 === 0;
    return (
      <TerminalTypewriterBox
        variant={scene.id}
        sceneFrom={scene.from}
        envelope={env}
        tokenAttr=""
        charCounterLabel="0/0"
        spokenWords={[]}
        cursorBlinkOn={blink}
        fontSize={fitMonoPhraseSize(phrase.fullCharCount)}
        allowWrap={phrase.fullCharCount > 32}
        foregroundShakeX={foregroundShakeX}
      />
    );
  }

  // Strictly include ONLY words that have begun speaking at or before globalFrame
  const spokenPhraseCues: ScriptCue[] = [];
  for (let i = phrase.firstWordIndex; i <= phrase.lastWordIndex; i += 1) {
    const c = SCRIPT_CUES[i];
    if (c.startFrame <= globalFrame) {
      spokenPhraseCues.push(c);
    }
  }
  if (spokenPhraseCues.length === 0) return null;

  const leadCue =
    activeCue &&
    activeCue.globalIndex >= phrase.firstWordIndex &&
    activeCue.globalIndex <= phrase.lastWordIndex
      ? activeCue
      : spokenPhraseCues[spokenPhraseCues.length - 1];

  const isPostPhraseRelease = globalFrame >= phrase.lastWordEndFrame;
  const postSpan = Math.max(1, phrase.renderEndFrame - phrase.lastWordEndFrame);

  // Distinct exit profile per schema: digital shutter out for telemetry, cubic slide for terminal, crisp spring settle for hook
  const postProgress = isPostPhraseRelease
    ? phrase.schema === 'metric-glitch'
      ? (() => {
          const t = (globalFrame - phrase.lastWordEndFrame) / postSpan;
          if (t < 0.25) return 0.74;
          if (t < 0.45) return 0.92;
          if (t < 0.70) return 0.32;
          if (t < 0.88) return 0.12;
          return 0;
        })()
      : interpolate(globalFrame - phrase.lastWordEndFrame, [0, postSpan], [1, 0], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
    : 1;

  const remainingToClear = activeEnd - globalFrame;
  const clearTail =
    remainingToClear <= 6
      ? interpolate(remainingToClear, [0, 6], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  const releaseOpacity = Number(Math.min(postProgress, clearTail).toFixed(4));
  const releaseScale = Number((0.95 + 0.05 * releaseOpacity).toFixed(4));
  const releaseTranslateY = Number(((1 - releaseOpacity) * 14).toFixed(2));

  const phraseTwEnv =
    phrase.schema === 'code-typewriter'
      ? computeAssetTransition(
          globalFrame - phrase.renderStartFrame,
          Math.max(12, phrase.renderEndFrame - phrase.renderStartFrame),
          {
            enterFrames: TYPEWRITER_ENTER_FRAMES,
            exitFrames: TYPEWRITER_EXIT_FRAMES,
            slidePx: 18,
          },
        )
      : undefined;

  return (
    <KineticEngine
      cue={leadCue}
      variant={scene.id}
      globalFrame={isPostPhraseRelease ? phrase.lastWordEndFrame - 1 : globalFrame}
      phraseCues={spokenPhraseCues}
      fullPhraseCharCount={phrase.fullCharCount}
      useLiveRemotionHooks
      releaseOpacity={releaseOpacity}
      releaseScale={releaseScale}
      releaseTranslateY={releaseTranslateY}
      foregroundShakeX={foregroundShakeX}
      terminalEnvelope={phraseTwEnv}
    />
  );
};

export const SceneSemanticGraph: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  energy: number;
  style?: React.CSSProperties;
}> = ({scene, localFrame, activeCue, style}) => {
  const spoken = sceneSpokenCues(scene, localFrame);
  return (
    <svg
      data-scene-semantic={scene.id}
      viewBox="0 0 968 24"
      style={{width: 968, height: 24, pointerEvents: 'none', ...style}}
    >
      {spoken.map((cue, idx) => (
        <circle
          key={cue.globalIndex}
          cx={24 + idx * 18}
          cy={12}
          r={cue.globalIndex === activeCue?.globalIndex ? 4 : 2}
          fill={cue.globalIndex === activeCue?.globalIndex ? ORANGE : WHITE}
        />
      ))}
    </svg>
  );
};

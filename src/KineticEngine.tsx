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
  'templates',
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
  'boilerplate',
  'demos',
  'clean',
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
  'config',
]);

export const classifyTokenTypographicSchema = (rawWord: string): TypographicSchemaKind => {
  const token = normalize(rawWord);
  if (CODE_PROMPT_TOKENS.has(token)) return 'code-typewriter';
  if (METRIC_DATA_TOKENS.has(token)) return 'metric-glitch';
  return 'hook-climax';
};

export const resolveCueTypographicSchema = (
  cue: ScriptCue,
  _variant?: SceneKey,
): TypographicSchemaKind => {
  const idx = cue.globalIndex;
  if (idx >= 0 && idx <= 5) return 'hook-climax';
  if (idx >= 6 && idx <= 9) return 'code-typewriter';
  if (idx >= 10 && idx <= 15) return 'hook-climax';
  if (idx >= 16 && idx <= 18) return 'metric-glitch';
  if (idx >= 19 && idx <= 20) return 'code-typewriter';
  if (idx === 21) return 'hook-climax';
  if (idx >= 22 && idx <= 23) return 'code-typewriter';
  if (idx >= 24 && idx <= 27) return 'hook-climax';
  if (idx >= 28 && idx <= 30) return 'code-typewriter';
  if (idx >= 31 && idx <= 37) return 'metric-glitch';
  if (idx >= 38 && idx <= 41) return 'code-typewriter';
  if (idx >= 42 && idx <= 44) return 'hook-climax';
  if (idx >= 45 && idx <= 50) return 'metric-glitch';
  if (idx >= 51 && idx <= 52) return 'code-typewriter';
  if (idx === 53) return 'hook-climax';
  if (idx >= 54 && idx <= 55) return 'code-typewriter';
  if (idx >= 56 && idx <= 57) return 'metric-glitch';
  if (idx >= 58 && idx <= 60) return 'hook-climax';
  if (idx >= 61 && idx <= 62) return 'code-typewriter';
  if (idx >= 63 && idx <= 65) return 'hook-climax';
  if (idx >= 66 && idx <= 73) return 'code-typewriter';
  if (idx >= 74 && idx <= 76) return 'metric-glitch';
  if (idx === 77) return 'hook-climax';
  if (idx >= 78 && idx <= 80) return 'metric-glitch';
  if (idx >= 81 && idx <= 83) return 'hook-climax';
  if (idx === 84) return 'code-typewriter';
  if (idx >= 85 && idx <= 90) return 'hook-climax';
  return classifyTokenTypographicSchema(cue.text);
};

// ============================================================================
// Beat-Coherent Staggered Hero Phrases across all 91 SCRIPT_CUES & 6 Scenes
// ============================================================================
export type HeroPhraseSpec = {
  id: string;
  sceneId: SceneKey;
  schema: TypographicSchemaKind;
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
    [0, 2], // "Your AI agent"
    [3, 5], // "didn’t build anything."
    [6, 9], // "It pasted a template."
  ],
  twist: [
    [10, 12], // "It looks finished."
    [13, 15], // "That’s the trick."
    [16, 18], // "Boilerplate demos clean."
    [19, 20], // "Real codebases"
    [21, 21], // "break."
  ],
  shift: [
    [22, 23], // "Prompt harder?"
    [24, 24], // "No."
    [25, 27], // "It still can’t"
    [28, 30], // "infer your codebase’s"
    [31, 34], // "timing model, render graph,"
    [35, 37], // "or hard constraints"
    [38, 41], // "from a pretty prompt."
  ],
  mechanism: [
    [42, 44], // "Engine- first means"
    [45, 47], // "physics, isolation, timing,"
    [48, 50], // "positions, easing, transitions—"
    [51, 52], // "defined as"
    [53, 53], // "math."
    [54, 55], // "Same inputs."
    [56, 57], // "Same frames."
    [58, 60], // "No template roulette."
  ],
  payoff: [
    [61, 62], // "Feed intent"
    [63, 65], // "into the engine."
    [66, 71], // "It compiles the prompt to code,"
    [72, 73], // "code to"
    [74, 76], // "frames, frames to"
    [77, 77], // "MP4."
    [78, 80], // "Fast. Inspectable. Repeatable."
  ],
  outro: [
    [81, 83], // "Stop playing with"
    [84, 84], // "templates."
    [85, 87], // "Build the engine—"
    [88, 90], // "or ship toys."
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

      byScene[scene.id].push({
        id: `${scene.id}-phrase-${startIdx}-${endIdx}`,
        sceneId: scene.id,
        schema,
        firstWordIndex: startIdx,
        lastWordIndex: endIdx,
        firstWordStartFrame,
        lastWordEndFrame,
        renderStartFrame,
        renderEndFrame,
        fullCharCount,
      });
    });
  }

  return byScene;
})();

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
      const activeEnd =
        scene.id === 'outro' ? OUTRO_CUT_FRAME : scene.endFrame - scene.clearFrames;
      let idx = scene.firstWordIndex;
      while (idx <= scene.lastWordIndex) {
        if (resolveCueTypographicSchema(SCRIPT_CUES[idx], scene.id) !== 'code-typewriter') {
          idx += 1;
          continue;
        }
        let endIdx = idx;
        while (
          endIdx + 1 <= scene.lastWordIndex &&
          resolveCueTypographicSchema(SCRIPT_CUES[endIdx + 1], scene.id) === 'code-typewriter' &&
          SCRIPT_CUES[endIdx + 1].startFrame - SCRIPT_CUES[endIdx].endFrame <= 18
        ) {
          endIdx += 1;
        }

        const firstWordStartFrame = SCRIPT_CUES[idx].startFrame;
        const lastWordEndFrame = SCRIPT_CUES[endIdx].endFrame;
        const prevWordEnd = idx > scene.firstWordIndex ? SCRIPT_CUES[idx - 1].endFrame : scene.from;
        const nextWordStart =
          endIdx + 1 <= scene.lastWordIndex ? SCRIPT_CUES[endIdx + 1].startFrame : activeEnd;

        const renderStartFrame = Math.max(
          scene.from,
          Math.max(prevWordEnd, firstWordStartFrame - 8),
        );
        const renderEndFrame = Math.min(
          activeEnd,
          nextWordStart,
          lastWordEndFrame + TYPEWRITER_EXIT_FRAMES,
        );

        byScene[scene.id].push({
          id: `${scene.id}-tw-${idx}-${endIdx}`,
          sceneId: scene.id,
          firstWordIndex: idx,
          lastWordIndex: endIdx,
          firstWordStartFrame,
          lastWordEndFrame,
          renderStartFrame,
          renderEndFrame,
        });

        idx = endIdx + 1;
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
  slideTranslateX: number;
  chromaticOffsetPx: number;
  flickerOpacity: number;
};

const GLITCH_FLICKER_PATTERN = [0.44, 0.96, 0.58, 1.0, 0.78, 1.0] as const;

export const computeTypographicKinematics = (
  cue: ScriptCue,
  variant: SceneKey,
  globalFrame: number,
): TypographicKinematics => {
  const schema = resolveCueTypographicSchema(cue, variant);
  const localCueFrame = Math.max(0, globalFrame - cue.startFrame);
  const cueSpan = Math.max(1, cue.endFrame - cue.startFrame);
  const totalChars = cue.text.length;

  const springPop = spring({
    frame: localCueFrame,
    fps: FPS,
    config: TENSION_SPRING_CONFIG,
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

  const typeFrames =
    totalChars <= 1 || cueSpan <= 1 ? 1 : clamp(Math.floor(cueSpan * 0.55), 1, 8);
  const visibleChars =
    totalChars <= 1 || cueSpan <= 1
      ? totalChars
      : clamp(1 + Math.floor((localCueFrame / typeFrames) * (totalChars - 1)), 1, totalChars);
  const visibleText = cue.text.slice(0, visibleChars);
  const cursorBlinkOn =
    localCueFrame < typeFrames ? true : Math.floor(globalFrame / 4) % 2 === 0;

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
  const flickerOpacity =
    localCueFrame < GLITCH_FLICKER_PATTERN.length
      ? GLITCH_FLICKER_PATTERN[localCueFrame]
      : 1.0;

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
    slideTranslateX,
    chromaticOffsetPx,
    flickerOpacity,
  };
};

const fitSansWordSize = (text: string, maxPx: number, innerWidthPx: number): number =>
  Math.min(maxPx, Math.floor(innerWidthPx / Math.max(4.0, text.length * 0.58)));

const fitSansPhraseSize = (fullCharCount: number, wordCount: number): number => {
  if (wordCount <= 1) return fitSansWordSize('x'.repeat(fullCharCount), 154, 936);
  if (fullCharCount <= 15) return 90;
  if (fullCharCount <= 22) return 72;
  return 62;
};

const fitMonoPhraseSize = (fullCharCount: number): number =>
  clamp(Math.floor(852 / Math.max(5.5, (fullCharCount + 3.2) * 0.62)), 40, 102);

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
  textOpacity?: number;
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
  textOpacity = 1,
  frameOverride,
  style,
}) => (
  <div
    data-kinetic-variant={variant}
    data-typography-schema="code-typewriter"
    data-full-token={tokenAttr}
    data-typed-chars={charCounterLabel}
    data-terminal-box-opacity={envelope.opacity}
    data-terminal-box-scale={envelope.scale}
    style={{
      position: 'absolute',
      left: 60,
      right: 60,
      top: 852,
      transform: `translateY(calc(-50% + ${envelope.translateY.toFixed(2)}px)) scale(${envelope.scale})`,
      opacity: envelope.opacity,
      display: 'grid',
      placeItems: 'center',
      pointerEvents: 'none',
      ...style,
    }}
  >
    <div
      data-terminal-typewriter-box="true"
      style={{
        padding: '16px 32px 20px',
        background: 'rgba(8, 13, 24, 0.92)',
        border: '1px solid rgba(255, 69, 0, 0.42)',
        borderLeft: `4px solid ${ORANGE}`,
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.74), inset 0 0 24px rgba(255, 69, 0, 0.06)',
        maxWidth: 948,
        minWidth: 420,
        boxSizing: 'border-box',
      }}
    >
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
        <span style={{color: ORANGE, fontWeight: 700}}>CLI_STDIN // LIVE_TYPEWRITER</span>
        <span>CHAR {charCounterLabel}</span>
      </div>

      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.08,
          whiteSpace: 'nowrap',
          opacity: textOpacity,
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <span style={{color: ORANGE, opacity: 0.88, marginRight: 12}}>&gt;</span>
        <span data-typewriter-text="true" style={{display: 'inline-flex', gap: Math.round(fontSize * 0.28)}}>
          {spokenWords.map(({cue, displayText, isCurrent}) => {
            const hot = isEmphasis(cue.text);
            return (
              <StaggeredTextItem
                key={cue.globalIndex}
                text={displayText}
                delay={cue.startFrame - sceneFrom}
                frameOverride={frameOverride}
                style={{
                  color: hot ? ORANGE : isCurrent ? WHITE : 'rgba(244, 247, 255, 0.88)',
                  textShadow: hot
                    ? '0 0 26px rgba(255,69,0,0.38)'
                    : '0 8px 24px rgba(0,0,0,0.65)',
                }}
              />
            );
          })}
        </span>
        <span
          data-typewriter-cursor={cursorBlinkOn ? 'on' : 'off'}
          style={{
            color: ORANGE,
            fontWeight: 800,
            marginLeft: 2,
            opacity: cursorBlinkOn ? 1 : 0.14,
            textShadow: cursorBlinkOn ? '0 0 18px rgba(255,69,0,0.75)' : 'none',
          }}
        >
          _
        </span>
      </div>
    </div>
  </div>
);

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
  // 1. HOOK / CLIMAX ANIMATION (Staggered Multi-Word Spring + Climax Pop/Slice)
  // ==========================================================================
  if (kin.schema === 'hook-climax') {
    const isSingle = spokenCues.length === 1 && totalCharBudget === cue.text.length;
    const size = isSingle
      ? fitSansWordSize(cue.text, variant === 'outro' ? 162 : 156, 936)
      : fitSansPhraseSize(totalCharBudget, spokenCues.length);
    const shearPx = Number((kin.sliceIntensity * 10).toFixed(2));

    return (
      <div
        data-kinetic-variant={variant}
        data-typography-schema="hook-climax"
        data-full-token={cue.text}
        data-staggered-word-count={spokenCues.length}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 852,
          transform: `translateY(calc(-50% + ${releaseTranslateY.toFixed(1)}px))`,
          opacity: releaseOpacity,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div
          data-red-glow-flash={kin.redGlowFlash.toFixed(3)}
          style={{
            position: 'absolute',
            width: 820,
            height: 230,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(225, 29, 72, ${(
              kin.redGlowFlash * (conflictWeight >= 0.6 ? 0.56 : 0.34)
            ).toFixed(3)}) 0%, rgba(255, 69, 0, ${(kin.redGlowFlash * 0.16).toFixed(
              3,
            )}) 46%, transparent 74%)`,
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            transform: `scale(${((isSingle ? kin.scale : 0.94 + 0.06 * kin.springPop) * releaseScale).toFixed(4)})`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: `${Math.round(size * 0.14)}px ${Math.round(size * 0.24)}px`,
            maxWidth: 948,
          }}
        >
          {spokenCues.map((wordCue) => {
            const wordHot = isEmphasis(wordCue.text);
            const isCurrent = wordCue.globalIndex === cue.globalIndex;
            const glowShadow = `0 0 ${Math.round(32 + (isCurrent ? kin.redGlowFlash * 40 : 12))}px rgba(225, 29, 72, ${(
              0.18 +
              (isCurrent ? kin.redGlowFlash * 0.58 : 0.08)
            ).toFixed(3)}), 0 0 30px rgba(255, 69, 0, ${wordHot ? '0.42' : '0.16'}), 0 14px 38px rgba(0, 0, 0, 0.78)`;

            return (
              <StaggeredTextItem
                key={wordCue.globalIndex}
                text={wordCue.text}
                delay={wordCue.startFrame - owningScene.from}
                frameOverride={frameOverride}
                dataAttrs={{'data-hero-word-index': wordCue.globalIndex}}
                style={{
                  fontSize: size,
                  fontWeight: 900,
                  letterSpacing: '-0.045em',
                  lineHeight: 0.98,
                  color: wordHot ? ORANGE : WHITE,
                  textShadow: glowShadow,
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
  // 2. CODE / PROMPT ANIMATION (Staggered Multi-Word CLI Typewriter)
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
        textOpacity={releaseOpacity}
        frameOverride={frameOverride}
        style={style}
      />
    );
  }

  // ==========================================================================
  // 3. METRIC / DATA ANIMATION (Staggered Multi-Word Metric Tokens + Glitch)
  // ==========================================================================
  const isSingleMetric = spokenCues.length === 1 && totalCharBudget === cue.text.length;
  const metricSize = isSingleMetric
    ? fitSansWordSize(cue.text, 146, 916)
    : fitSansPhraseSize(totalCharBudget, spokenCues.length);
  const skewDeg = Number((kin.slideTranslateX * -0.06).toFixed(2));
  const firstPhraseDelay = spokenCues[0].startFrame - owningScene.from;

  return (
    <div
      data-kinetic-variant={variant}
      data-typography-schema="metric-glitch"
      data-full-token={cue.text}
      data-chromatic-aberration={kin.chromaticOffsetPx}
      data-opacity-flicker={kin.flickerOpacity}
      data-staggered-word-count={spokenCues.length}
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        top: 852,
        transform: `translateY(calc(-50% + ${releaseTranslateY.toFixed(1)}px)) scale(${releaseScale.toFixed(4)})`,
        opacity: releaseOpacity,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 948,
        }}
      >
        <StaggeredTextItem
          text={`DATA_METRIC // IDX_${String(cue.globalIndex).padStart(2, '0')}`}
          delay={firstPhraseDelay}
          frameOverride={frameOverride}
          style={{
            fontFamily: MONO_STACK,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2.4,
            color: '#38bdf8',
            marginBottom: 10,
            padding: '3px 12px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            background: 'rgba(8, 18, 32, 0.84)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: `${Math.round(metricSize * 0.14)}px ${Math.round(metricSize * 0.24)}px`,
          }}
        >
          {spokenCues.map((wordCue) => {
            const wordHot = isEmphasis(wordCue.text);
            const isCurrent = wordCue.globalIndex === cue.globalIndex;
            const chromaShadow =
              isCurrent && kin.chromaticOffsetPx > 0.2
                ? `-${kin.chromaticOffsetPx}px 0 0 rgba(255, 42, 75, 0.86), ${kin.chromaticOffsetPx}px 0 0 rgba(0, 229, 255, 0.86), 0 12px 34px rgba(0, 0, 0, 0.72)`
                : wordHot
                  ? '0 0 34px rgba(255, 69, 0, 0.38), 0 12px 34px rgba(0, 0, 0, 0.72)'
                  : '0 12px 34px rgba(0, 0, 0, 0.72)';

            return (
              <span
                key={wordCue.globalIndex}
                style={{
                  display: 'inline-block',
                  opacity: isCurrent ? kin.flickerOpacity : 1,
                  transform: isCurrent
                    ? `translateX(${(kin.slideTranslateX * (isSingleMetric ? 1 : 0.38)).toFixed(1)}px) skewX(${skewDeg}deg)`
                    : undefined,
                }}
              >
                <StaggeredTextItem
                  text={wordCue.text}
                  delay={wordCue.startFrame - owningScene.from}
                  frameOverride={frameOverride}
                  dataAttrs={{'data-hero-word-index': wordCue.globalIndex}}
                  style={{
                    fontSize: metricSize,
                    fontWeight: 800,
                    letterSpacing: '-0.036em',
                    lineHeight: 0.98,
                    color: wordHot ? ORANGE : WHITE,
                    textShadow: chromaShadow,
                    whiteSpace: 'nowrap',
                  }}
                />
              </span>
            );
          })}

          {kin.chromaticOffsetPx > 2.2 && (
            <div
              data-glitch-scanline="true"
              style={{
                position: 'absolute',
                left: -24,
                right: -24,
                top: '44%',
                height: 4,
                background:
                  'linear-gradient(90deg, transparent, rgba(0,229,255,0.85), rgba(255,42,75,0.85), transparent)',
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
 * Accumulates spoken words inside each beat's HeroPhraseSpec using `StaggeredTextItem`
 * (`damping: 12, stiffness: 200`, `translateY: 20 -> 0`, `opacity: 0 -> 1`, `delay = word.startFrame - scene.from`),
 * with zero future-word previews and smooth reverse-eased phrase exits.
 */
export const SceneKineticStage: React.FC<{
  scene: SceneSpec;
  activeCue: ScriptCue | null;
}> = ({scene, activeCue}) => {
  const localFrame = useCurrentFrame();
  if (isSceneCleared(scene, localFrame)) return null;
  const globalFrame = scene.from + localFrame;
  const activeEnd =
    scene.id === 'outro' ? OUTRO_CUT_FRAME : scene.endFrame - scene.clearFrames;

  const phrase = SCENE_HERO_PHRASES[scene.id].find(
    (p) => globalFrame >= p.renderStartFrame && globalFrame < p.renderEndFrame,
  );
  if (!phrase) return null;

  // Pre-warm awaiting CLI cursor shell for code-typewriter phrases (zero future-word preview)
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
  const postProgress = isPostPhraseRelease
    ? interpolate(globalFrame - phrase.lastWordEndFrame, [0, postSpan], [1, 0], {
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

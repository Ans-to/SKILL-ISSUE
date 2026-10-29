import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {computeAssetTransition, type AssetTransitionEnvelope} from './ContextualUiSimulation';
import {CRIMSON, TENSION_SPRING_CONFIG, getConflictImpactWeight} from './EmotionalPacing';
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

export const TYPEWRITER_ENTER_FRAMES = 12;
export const TYPEWRITER_EXIT_FRAMES = 10;

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

        // Pre-warm empty terminal prompt (`> _`) during silence lead-in if available; otherwise start cleanly at phrase start
        const renderStartFrame = Math.max(
          scene.from,
          Math.max(prevWordEnd, firstWordStartFrame - 8),
        );
        // Reverse-ease out cleanly into any post-phrase silence gap, completing before the next non-typewriter hero word hits
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

const fitMonoWordSize = (text: string, maxPx: number, innerWidthPx: number): number =>
  Math.min(maxPx, Math.floor(innerWidthPx / Math.max(5.0, (text.length + 3.2) * 0.63)));

const MONO_STACK =
  '"JetBrains Mono", "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace';

const TerminalTypewriterBox: React.FC<{
  variant: SceneKey;
  envelope: AssetTransitionEnvelope;
  tokenAttr: string;
  charCounterLabel: string;
  placeholderText: string;
  visibleText: string;
  primaryColor: string;
  hot: boolean;
  cursorBlinkOn: boolean;
  fontSize: number;
  textOpacity?: number;
  extraTranslateY?: number;
  style?: React.CSSProperties;
}> = ({
  variant,
  envelope,
  tokenAttr,
  charCounterLabel,
  placeholderText,
  visibleText,
  primaryColor,
  hot,
  cursorBlinkOn,
  fontSize,
  textOpacity = 1,
  extraTranslateY = 0,
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
      transform: `translateY(calc(-50% + ${(envelope.translateY + extraTranslateY).toFixed(2)}px)) scale(${envelope.scale})`,
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
        background: 'rgba(8, 13, 24, 0.88)',
        border: '1px solid rgba(255, 69, 0, 0.38)',
        borderLeft: `4px solid ${ORANGE}`,
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.72), inset 0 0 24px rgba(255, 69, 0, 0.06)',
        maxWidth: 948,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 8,
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
          position: 'relative',
          fontFamily: MONO_STACK,
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.02,
          whiteSpace: 'nowrap',
        }}
      >
        <div aria-hidden="true" style={{visibility: 'hidden', pointerEvents: 'none'}}>
          <span style={{marginRight: 10}}>&gt;</span>
          <span>{placeholderText}</span>
          <span>_</span>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            color: primaryColor,
            opacity: textOpacity,
            textShadow: hot ? '0 0 28px rgba(255,69,0,0.35)' : '0 8px 24px rgba(0,0,0,0.65)',
          }}
        >
          <span style={{color: ORANGE, opacity: 0.86, marginRight: 10}}>&gt;</span>
          <span data-typewriter-text="true">{visibleText}</span>
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
        </div>
      </div>
    </div>
  </div>
);

export const KineticEngine: React.FC<{
  cue: ScriptCue;
  variant: SceneKey;
  globalFrame: number;
  releaseOpacity?: number;
  releaseScale?: number;
  releaseTranslateY?: number;
  terminalEnvelope?: AssetTransitionEnvelope;
  style?: React.CSSProperties;
}> = ({
  cue,
  variant,
  globalFrame,
  releaseOpacity = 1,
  releaseScale = 1,
  releaseTranslateY = 0,
  terminalEnvelope,
  style,
}) => {
  const kin = computeTypographicKinematics(cue, variant, globalFrame);
  const hot = isEmphasis(cue.text);
  const conflictWeight = getConflictImpactWeight(cue.text);
  const primaryColor = hot ? ORANGE : WHITE;

  if (kin.schema === 'hook-climax') {
    const maxFont = variant === 'outro' ? 162 : variant === 'hook' ? 160 : 156;
    const size = fitSansWordSize(cue.text, maxFont, 936);
    const glowShadow = `0 0 ${Math.round(36 + kin.redGlowFlash * 42)}px rgba(225, 29, 72, ${(
      0.24 +
      kin.redGlowFlash * 0.62
    ).toFixed(3)}), 0 0 34px rgba(255, 69, 0, ${hot ? '0.44' : '0.20'}), 0 16px 42px rgba(0, 0, 0, 0.78)`;
    const shearPx = Number((kin.sliceIntensity * 12).toFixed(2));

    return (
      <div
        data-kinetic-variant={variant}
        data-typography-schema="hook-climax"
        data-full-token={cue.text}
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
            width: 760,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(225, 29, 72, ${(
              kin.redGlowFlash * (conflictWeight >= 0.6 ? 0.56 : 0.36)
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
            transform: `scale(${(kin.scale * releaseScale).toFixed(4)})`,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: size,
              fontWeight: 900,
              letterSpacing: '-0.048em',
              lineHeight: 0.94,
              color: primaryColor,
              textShadow: glowShadow,
              whiteSpace: 'nowrap',
              transform: shearPx > 0.4 ? `translateX(${(shearPx * -0.25).toFixed(1)}px)` : undefined,
            }}
          >
            {cue.text}
          </div>

          {kin.sliceIntensity > 0.08 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                fontSize: size,
                fontWeight: 900,
                letterSpacing: '-0.048em',
                lineHeight: 0.94,
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

  if (kin.schema === 'code-typewriter') {
    const size = fitMonoWordSize(cue.text, 112, 868);
    const owningScene = SCENE_SEQUENCES.find((s) => s.id === variant) ?? SCENE_SEQUENCES[0];
    const boxEnv = terminalEnvelope ?? getTypewriterWindowEnvelope(owningScene, cue, globalFrame);

    return (
      <TerminalTypewriterBox
        variant={variant}
        envelope={boxEnv}
        tokenAttr={cue.text}
        charCounterLabel={`${kin.visibleChars}/${kin.totalChars}`}
        placeholderText={cue.text}
        visibleText={kin.visibleText}
        primaryColor={primaryColor}
        hot={hot}
        cursorBlinkOn={kin.cursorBlinkOn}
        fontSize={size}
        textOpacity={releaseOpacity}
        style={style}
      />
    );
  }

  const metricSize = fitSansWordSize(cue.text, 146, 916);
  const skewDeg = Number((kin.slideTranslateX * -0.09).toFixed(2));
  const chromaShadow =
    kin.chromaticOffsetPx > 0.2
      ? `-${kin.chromaticOffsetPx}px 0 0 rgba(255, 42, 75, 0.86), ${kin.chromaticOffsetPx}px 0 0 rgba(0, 229, 255, 0.86), 0 12px 34px rgba(0, 0, 0, 0.72)`
      : hot
        ? '0 0 38px rgba(255, 69, 0, 0.40), 0 12px 34px rgba(0, 0, 0, 0.72)'
        : '0 12px 34px rgba(0, 0, 0, 0.72)';

  const badgeEnter = clamp(
    spring({
      frame: kin.localCueFrame,
      fps: FPS,
      config: {damping: 20, stiffness: 150, overshootClamping: true},
    }),
    0,
    1,
  );

  return (
    <div
      data-kinetic-variant={variant}
      data-typography-schema="metric-glitch"
      data-full-token={cue.text}
      data-chromatic-aberration={kin.chromaticOffsetPx}
      data-opacity-flicker={kin.flickerOpacity}
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
          opacity: kin.flickerOpacity,
          transform: `translateX(${kin.slideTranslateX}px) skewX(${skewDeg}deg)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2.4,
            color: '#38bdf8',
            marginBottom: 8,
            padding: '3px 12px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            background: 'rgba(8, 18, 32, 0.78)',
            opacity: badgeEnter,
            transform: `translateY(${((1 - badgeEnter) * 8).toFixed(1)}px) scale(${(0.95 + 0.05 * badgeEnter).toFixed(3)})`,
          }}
        >
          DATA_METRIC // IDX_{String(cue.globalIndex).padStart(2, '0')}
        </div>

        <div style={{position: 'relative'}}>
          <div
            style={{
              fontSize: metricSize,
              fontWeight: 800,
              letterSpacing: '-0.036em',
              lineHeight: 0.96,
              color: primaryColor,
              textShadow: chromaShadow,
              whiteSpace: 'nowrap',
            }}
          >
            {cue.text}
          </div>

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
 * - Smoothly scales (`0.95 -> 1.0`), slides (`translateY`), and fades (`0 -> 1`)
 *   `CLI_STDIN // LIVE_TYPEWRITER` terminal boxes in over 12 frames (with zero future-word preview)
 *   and reverses easing (`1.0 -> 0.95`, `translateY`, `1 -> 0`) out over up to 10 frames.
 * - Smoothly reverse-eases outgoing `'hook-climax'` and `'metric-glitch'` words during breath gaps
 *   and into scene clears so nothing vanishes on an abrupt binary frame cut.
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

  const activeTwWin = SCENE_TYPEWRITER_WINDOWS[scene.id].find(
    (w) => globalFrame >= w.renderStartFrame && globalFrame < w.renderEndFrame,
  );

  // Render outgoing/pre-warm terminal box if activeCue is absent or belongs to a non-typewriter schema
  const activeIsTypewriter =
    activeCue !== null && resolveCueTypographicSchema(activeCue, scene.id) === 'code-typewriter';

  const backgroundTerminalNode =
    activeTwWin && !activeIsTypewriter
      ? (() => {
          const env = computeAssetTransition(
            globalFrame - activeTwWin.renderStartFrame,
            activeTwWin.renderEndFrame - activeTwWin.renderStartFrame,
            {
              enterFrames: TYPEWRITER_ENTER_FRAMES,
              exitFrames: TYPEWRITER_EXIT_FRAMES,
              slidePx: 18,
            },
          );
          const isPreWarm = globalFrame < activeTwWin.firstWordStartFrame;
          const blink = Math.floor(globalFrame / 4) % 2 === 0;

          if (isPreWarm) {
            return (
              <TerminalTypewriterBox
                variant={scene.id}
                envelope={env}
                tokenAttr=""
                charCounterLabel="0/0"
                placeholderText="      "
                visibleText=""
                primaryColor={WHITE}
                hot={false}
                cursorBlinkOn={blink}
                fontSize={96}
              />
            );
          }

          const lastTwCue = SCRIPT_CUES[activeTwWin.lastWordIndex];
          const size = fitMonoWordSize(lastTwCue.text, 112, 868);
          const hot = isEmphasis(lastTwCue.text);
          // If another non-typewriter word is simultaneously speaking right at phrase end, slide the receding terminal shell slightly further down so they never collide
          const extraDown = activeCue ? (1 - env.exitProgress) * 34 : 0;

          return (
            <TerminalTypewriterBox
              variant={scene.id}
              envelope={env}
              tokenAttr={lastTwCue.text}
              charCounterLabel={`${lastTwCue.text.length}/${lastTwCue.text.length}`}
              placeholderText={lastTwCue.text}
              visibleText={activeCue ? '' : lastTwCue.text}
              primaryColor={hot ? ORANGE : WHITE}
              hot={hot}
              cursorBlinkOn={blink}
              fontSize={size}
              textOpacity={env.exitProgress}
              extraTranslateY={extraDown}
            />
          );
        })()
      : null;

  if (activeCue) {
    // If this is the final word before scene clear, gently reverse-ease its final frames if cue reaches activeEnd
    const remainingToClear = activeEnd - globalFrame;
    const clearTail =
      remainingToClear <= 6
        ? interpolate(remainingToClear, [0, 6], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        : 1;
    return (
      <>
        {backgroundTerminalNode}
        <KineticEngine
          cue={activeCue}
          variant={scene.id}
          globalFrame={globalFrame}
          releaseOpacity={clearTail}
          releaseScale={0.95 + 0.05 * clearTail}
          releaseTranslateY={(1 - clearTail) * 14}
        />
      </>
    );
  }

  if (backgroundTerminalNode) {
    return backgroundTerminalNode;
  }

  // Smooth post-word reverse-eased release for non-typewriter words during breath pauses
  let prevCue: ScriptCue | null = null;
  for (let i = scene.firstWordIndex; i <= scene.lastWordIndex; i += 1) {
    if (SCRIPT_CUES[i].endFrame <= globalFrame) {
      prevCue = SCRIPT_CUES[i];
    }
  }
  if (!prevCue || resolveCueTypographicSchema(prevCue, scene.id) === 'code-typewriter') {
    return null;
  }

  const nextCue =
    prevCue.globalIndex + 1 <= scene.lastWordIndex
      ? SCRIPT_CUES[prevCue.globalIndex + 1]
      : null;
  const maxTailEnd = Math.min(activeEnd, nextCue ? nextCue.startFrame : activeEnd);
  const gapLen = maxTailEnd - prevCue.endFrame;
  const tailDuration = Math.min(9, gapLen);
  const postElapsed = globalFrame - prevCue.endFrame;

  if (tailDuration < 2 || postElapsed < 0 || postElapsed >= tailDuration) {
    return null;
  }

  const releaseProgress = interpolate(postElapsed, [0, tailDuration], [1, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const releaseScale = 0.95 + 0.05 * releaseProgress;
  const releaseTranslateY = (1 - releaseProgress) * 14;

  return (
    <KineticEngine
      cue={prevCue}
      variant={scene.id}
      globalFrame={prevCue.endFrame - 1}
      releaseOpacity={Number(releaseProgress.toFixed(4))}
      releaseScale={Number(releaseScale.toFixed(4))}
      releaseTranslateY={Number(releaseTranslateY.toFixed(2))}
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

import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {CRIMSON, TENSION_SPRING_CONFIG, getConflictImpactWeight} from './EmotionalPacing';
import {
  FPS,
  MUTED,
  ORANGE,
  WHITE,
  clamp,
  normalize,
  sceneSpokenCues,
  type SceneKey,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

/**
 * Dynamic Typographic Variation Schema:
 * 1. 'hook-climax':     High-velocity spring ({damping: 8, stiffness: 300}), scale-up pop
 *                       (0.8 -> 1.0), sharp horizontal vector slice + red glow flash.
 * 2. 'code-typewriter': Character-by-character monospaced terminal typewriter with a live
 *                       blinking underscore cursor (`_`) simulating a command line.
 * 3. 'metric-glitch':   Rapid horizontal slide (`translateX`) combined with digital
 *                       chromatic aberration and deterministic HUD opacity flicker.
 */
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

/**
 * Standalone semantic token -> typographic animation classifier.
 */
export const classifyTokenTypographicSchema = (rawWord: string): TypographicSchemaKind => {
  const token = normalize(rawWord);
  if (CODE_PROMPT_TOKENS.has(token)) return 'code-typewriter';
  if (METRIC_DATA_TOKENS.has(token)) return 'metric-glitch';
  return 'hook-climax';
};

/**
 * Context-aware + token-aware classifier across all 91 script cues (and fallback for arbitrary cues).
 * Ensures multi-word technical/prompt phrases and metric sequences maintain cohesive typographic identity
 * while dynamically switching entrance physics across clauses and scenes.
 */
export const resolveCueTypographicSchema = (
  cue: ScriptCue,
  _variant?: SceneKey,
): TypographicSchemaKind => {
  const idx = cue.globalIndex;

  // Scene 1 (Hook): #00..#05 Hook punch -> #06..#09 Terminal Typewriter ("It pasted a template.")
  if (idx >= 0 && idx <= 5) return 'hook-climax';
  if (idx >= 6 && idx <= 9) return 'code-typewriter';

  // Scene 2 (Twist): #10..#15 Hook/Twist punch -> #16..#18 Metric Glitch -> #19..#20 Code Typewriter -> #21 Climax "break."
  if (idx >= 10 && idx <= 15) return 'hook-climax';
  if (idx >= 16 && idx <= 18) return 'metric-glitch';
  if (idx >= 19 && idx <= 20) return 'code-typewriter';
  if (idx === 21) return 'hook-climax';

  // Scene 3 (Shift): #22..#23 Prompt Typewriter -> #24..#27 Climax refutation -> #28..#30 Codebase Typewriter -> #31..#37 Metric/Architecture Glitch -> #38..#41 Pretty Prompt Typewriter
  if (idx >= 22 && idx <= 23) return 'code-typewriter';
  if (idx >= 24 && idx <= 27) return 'hook-climax';
  if (idx >= 28 && idx <= 30) return 'code-typewriter';
  if (idx >= 31 && idx <= 37) return 'metric-glitch';
  if (idx >= 38 && idx <= 41) return 'code-typewriter';

  // Scene 4 (Mechanism): #42..#44 Thesis punch -> #45..#50 Config/Math Data Glitch -> #51..#52 Code Typewriter -> #53 Climax "math." -> #54..#55 Inputs Typewriter -> #56..#57 Frames Metric Glitch -> #58..#60 Climax "No template roulette."
  if (idx >= 42 && idx <= 44) return 'hook-climax';
  if (idx >= 45 && idx <= 50) return 'metric-glitch';
  if (idx >= 51 && idx <= 52) return 'code-typewriter';
  if (idx === 53) return 'hook-climax';
  if (idx >= 54 && idx <= 55) return 'code-typewriter';
  if (idx >= 56 && idx <= 57) return 'metric-glitch';
  if (idx >= 58 && idx <= 60) return 'hook-climax';

  // Scene 5 (Payoff): #61..#62 Intent Typewriter -> #63..#65 Engine Climax -> #66..#73 Compiler/Prompt/Code Typewriter -> #74..#76 Frames Metric Glitch -> #77 "MP4." Climax -> #78..#80 Fast/Inspectable/Repeatable Metric Glitch
  if (idx >= 61 && idx <= 62) return 'code-typewriter';
  if (idx >= 63 && idx <= 65) return 'hook-climax';
  if (idx >= 66 && idx <= 73) return 'code-typewriter';
  if (idx >= 74 && idx <= 76) return 'metric-glitch';
  if (idx === 77) return 'hook-climax';
  if (idx >= 78 && idx <= 80) return 'metric-glitch';

  // Scene 6 (Outro): #81..#83 Climax "Stop playing with" -> #84 "templates." Typewriter -> #85..#90 Final Climax "Build the engine— or ship toys."
  if (idx >= 81 && idx <= 83) return 'hook-climax';
  if (idx === 84) return 'code-typewriter';
  if (idx >= 85 && idx <= 90) return 'hook-climax';

  return classifyTokenTypographicSchema(cue.text);
};

export type TypographicKinematics = {
  schema: TypographicSchemaKind;
  localCueFrame: number;
  // 1. Hook / Climax kinematics
  springPop: number;
  scale: number;
  sliceIntensity: number;
  redGlowFlash: number;
  // 2. Code / Prompt Typewriter kinematics
  visibleText: string;
  visibleChars: number;
  totalChars: number;
  cursorBlinkOn: boolean;
  // 3. Metric / Data Glitch Slide-In kinematics
  slideTranslateX: number;
  chromaticOffsetPx: number;
  flickerOpacity: number;
};

const GLITCH_FLICKER_PATTERN = [0.44, 0.96, 0.58, 1.0, 0.78, 1.0] as const;

/**
 * Pure deterministic evaluator for all 3 typographic entrance schemas at any globalFrame.
 */
export const computeTypographicKinematics = (
  cue: ScriptCue,
  variant: SceneKey,
  globalFrame: number,
): TypographicKinematics => {
  const schema = resolveCueTypographicSchema(cue, variant);
  const localCueFrame = Math.max(0, globalFrame - cue.startFrame);
  const cueSpan = Math.max(1, cue.endFrame - cue.startFrame);
  const totalChars = cue.text.length;

  // 1. Hook / Climax: high-velocity spring {damping: 8, stiffness: 300} + scale 0.8 -> 1.0 + slice + red glow
  const springPop = spring({
    frame: localCueFrame,
    fps: FPS,
    config: TENSION_SPRING_CONFIG, // {damping: 8, stiffness: 300}
  });
  const scale = 0.8 + 0.2 * springPop;
  const sliceIntensity = interpolate(localCueFrame, [0, 1, 7], [1, 0.92, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const conflictBoost = getConflictImpactWeight(cue.text);
  const baseGlowPeak = conflictBoost >= 0.6 ? 0.95 : isEmphasis(cue.text) ? 0.72 : 0.48;
  const redGlowFlash =
    interpolate(localCueFrame, [0, 1.5, 9], [baseGlowPeak * 0.9, baseGlowPeak, 0.08], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // 2. Code / Prompt Terminal Typewriter: character-by-character + blinking `_` cursor
  const typeFrames =
    totalChars <= 1 || cueSpan <= 1
      ? 1
      : clamp(Math.floor(cueSpan * 0.55), 1, 8);
  const visibleChars =
    totalChars <= 1 || cueSpan <= 1
      ? totalChars
      : clamp(
          1 + Math.floor((localCueFrame / typeFrames) * (totalChars - 1)),
          1,
          totalChars,
        );
  const visibleText = cue.text.slice(0, visibleChars);
  // Solid cursor while actively typing characters, then crisp 30fps terminal blink (4 frames ON, 4 frames OFF)
  const cursorBlinkOn =
    localCueFrame < typeFrames ? true : Math.floor(globalFrame / 4) % 2 === 0;

  // 3. Metric / Data Glitch Slide-In: rapid horizontal translateX + chromatic aberration + subtle opacity flicker
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

/**
 * Hero Kinetic Typography Stage (y = 852px) dynamically switching between:
 * - 'hook-climax'     (Punchy & Aggressive scale-pop + horizontal vector slice + red glow flash)
 * - 'code-typewriter' (Monospaced character-by-character terminal line + blinking `_` cursor)
 * - 'metric-glitch'   (Rapid horizontal `translateX` slide + RGB chromatic aberration + opacity flicker)
 */
export const KineticEngine: React.FC<{
  cue: ScriptCue;
  variant: SceneKey;
  globalFrame: number;
  style?: React.CSSProperties;
}> = ({cue, variant, globalFrame, style}) => {
  const kin = computeTypographicKinematics(cue, variant, globalFrame);
  const hot = isEmphasis(cue.text);
  const conflictWeight = getConflictImpactWeight(cue.text);
  const primaryColor = hot ? ORANGE : WHITE;

  // ==========================================================================
  // 1. HOOK / CLIMAX ANIMATION (Punchy & Aggressive)
  // ==========================================================================
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
          transform: 'translateY(-50%)',
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          ...style,
        }}
      >
        {/* Radial Red / Crimson Glow Flash */}
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

        {/* High-Velocity Spring Scale-Up Pop (0.8 -> 1.0) */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${kin.scale.toFixed(4)})`,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {/* Main crisp glyph layer */}
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

          {/* Upper bisected slice displacement during first frames of impact */}
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

          {/* Sharp Horizontal Vector Slice */}
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
  // 2. CODE / PROMPT ANIMATION (Terminal Typewriter + Blinking `_` Cursor)
  // ==========================================================================
  if (kin.schema === 'code-typewriter') {
    const size = fitMonoWordSize(cue.text, 112, 868);

    return (
      <div
        data-kinetic-variant={variant}
        data-typography-schema="code-typewriter"
        data-full-token={cue.text}
        data-typed-chars={`${kin.visibleChars}/${kin.totalChars}`}
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 852,
          transform: 'translateY(-50%)',
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div
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
            <span>
              CHAR {kin.visibleChars}/{kin.totalChars}
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              fontFamily: MONO_STACK,
              fontSize: size,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.02,
              whiteSpace: 'nowrap',
            }}
          >
            {/* Invisible full-token sizer so the command-line box stays steady while characters type left-to-right */}
            <div aria-hidden="true" style={{visibility: 'hidden', pointerEvents: 'none'}}>
              <span style={{marginRight: 10}}>&gt;</span>
              <span>{cue.text}</span>
              <span>_</span>
            </div>

            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: primaryColor,
                textShadow: hot ? '0 0 28px rgba(255,69,0,0.35)' : '0 8px 24px rgba(0,0,0,0.65)',
              }}
            >
              <span style={{color: ORANGE, opacity: 0.86, marginRight: 10}}>&gt;</span>
              <span data-typewriter-text="true">{kin.visibleText}</span>
              <span
                data-typewriter-cursor={kin.cursorBlinkOn ? 'on' : 'off'}
                style={{
                  color: ORANGE,
                  fontWeight: 800,
                  opacity: kin.cursorBlinkOn ? 1 : 0.14,
                  textShadow: kin.cursorBlinkOn ? '0 0 18px rgba(255,69,0,0.75)' : 'none',
                }}
              >
                _
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 3. METRIC / DATA ANIMATION (Glitch / Rapid Horizontal Slide-In)
  // ==========================================================================
  const metricSize = fitSansWordSize(cue.text, 146, 916);
  const skewDeg = Number((kin.slideTranslateX * -0.09).toFixed(2));
  const chromaShadow =
    kin.chromaticOffsetPx > 0.2
      ? `-${kin.chromaticOffsetPx}px 0 0 rgba(255, 42, 75, 0.86), ${kin.chromaticOffsetPx}px 0 0 rgba(0, 229, 255, 0.86), 0 12px 34px rgba(0, 0, 0, 0.72)`
      : hot
        ? '0 0 38px rgba(255, 69, 0, 0.40), 0 12px 34px rgba(0, 0, 0, 0.72)'
        : '0 12px 34px rgba(0, 0, 0, 0.72)';

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
        transform: 'translateY(-50%)',
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

          {/* Digital Glitch Scanline Slice on Entry */}
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

import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {
  FPS,
  SCRIPT_CUES,
  clamp,
  energyAt,
  isSceneCleared,
  normalize,
  type SceneKey,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

export type PacingMode = 'tension' | 'precision';

/** Aggressive, violent slam spring config for Hook / Conflict / Climax scenes. */
export const TENSION_SPRING_CONFIG = {
  damping: 8,
  stiffness: 300,
} as const;

export const CRIMSON = '#e11d48';

// ShiftScene pivots from conflict ("Prompt harder? No. It still can't infer...")
// into technical architecture breakdown at "timing model, render graph..." (F0496).
const SHIFT_PRECISION_PIVOT_FRAME = 496;

/**
 * Maps every frame of the composition to its narrative emotional pacing mode:
 * - 'tension': Hook, Twist, Shift's conflict refutation, and Outro climax
 * - 'precision': Shift's runtime architecture breakdown, Mechanism math, and Payoff compiler
 */
export const getEmotionalPacingMode = (
  sceneId: SceneKey,
  globalFrame: number,
): PacingMode => {
  if (sceneId === 'hook' || sceneId === 'twist' || sceneId === 'outro') {
    return 'tension';
  }
  if (sceneId === 'shift') {
    return globalFrame < SHIFT_PRECISION_PIVOT_FRAME ? 'tension' : 'precision';
  }
  return 'precision';
};

/**
 * Conflict / error / failure impact weights.
 * Explicit full-weight triggers on "break", "fail", "error" (1.0), plus calibrated
 * conflict refutations ("pasted", "No.", "can't", "Stop", "toys.").
 */
export const getConflictImpactWeight = (rawWord: string): number => {
  const token = normalize(rawWord);
  if (token === 'break' || token === 'breaks' || token === 'broken' || token === 'fail' || token === 'fails' || token === 'failed' || token === 'error' || token === 'errors' || token === 'err') {
    return 1.0;
  }
  if (token === 'toys') return 0.86;
  if (token === 'pasted' || token === 'no') return 0.78;
  if (token === 'stop') return 0.72;
  if (token === 'cant' || token === 'anything') return 0.62;
  if (token === 'didnt') return 0.5;
  return 0;
};

export type WordMotionState = {
  mode: PacingMode;
  progress: number;
  opacity: number;
};

/**
 * Computes word-entry kinematics according to emotional pacing rules:
 * - 'tension': violent spring slam ({damping: 8, stiffness: 300})
 * - 'precision': smooth fluid easeInOutCubic glide + deliberate text fade
 */
export const computeWordMotion = (
  cue: ScriptCue,
  variant: SceneKey,
  globalFrame: number,
): WordMotionState => {
  const mode = getEmotionalPacingMode(variant, globalFrame);
  const localCueFrame = Math.max(0, globalFrame - cue.startFrame);

  if (mode === 'tension') {
    const slam = spring({
      frame: localCueFrame,
      fps: FPS,
      config: TENSION_SPRING_CONFIG,
    });
    return {
      mode,
      progress: slam,
      opacity: 1,
    };
  }

  // 'precision': fluid easeInOutCubic motion & deliberate text fade
  const cueSpan = Math.max(4, cue.endFrame - cue.startFrame);
  const fadeInSpan = clamp(Math.round(cueSpan * 0.58), 4, 10);
  const eased = interpolate(localCueFrame, [0, fadeInSpan], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(localCueFrame, [0, fadeInSpan], [0.16, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    mode,
    progress: eased,
    opacity,
  };
};

export type CinematographyState = {
  mode: PacingMode;
  shakeX: number;
  crimsonFlash: number;
  brightness: number;
  contrast: number;
  ambientGridOpacity: number;
  conflictWord: string | null;
};

/**
 * Evaluates frame-exact dynamic cinematography overrides:
 * - Subtle screen shake (`translateX` jitter) on conflict/error hits
 * - Crimson/red flash overlays decaying smoothly after impact
 * - Dynamic scene brightness & contrast modulation (no constant linear brightness)
 * - Subtle ambient pulsing grid envelope for technical precision scenes
 */
export const getCinematographyState = (
  scene: SceneSpec,
  localFrame: number,
): CinematographyState => {
  const globalFrame = scene.from + localFrame;
  const mode = getEmotionalPacingMode(scene.id, globalFrame);

  if (isSceneCleared(scene, localFrame)) {
    return {
      mode,
      shakeX: 0,
      crimsonFlash: 0,
      brightness: 1,
      contrast: 1,
      ambientGridOpacity: 0,
      conflictWord: null,
    };
  }

  const energy = energyAt(globalFrame);
  let shakeX = 0;
  let crimsonFlash = 0;
  let conflictWord: string | null = null;

  // Scan words strictly inside the current scene for active conflict impact windows (14 frames)
  for (let idx = scene.firstWordIndex; idx <= scene.lastWordIndex; idx += 1) {
    const cue = SCRIPT_CUES[idx];
    const weight = getConflictImpactWeight(cue.text);
    if (weight <= 0) continue;
    const dt = globalFrame - cue.startFrame;
    if (dt < 0 || dt > 15) continue;

    // Deterministic damped high-frequency horizontal jitter (`translateX`)
    const decay = Math.exp(-dt * 0.23);
    const dir = idx % 2 === 0 ? 1 : -1;
    const jitter = Math.sin((dt + 0.6) * 2.65) * decay * 11.5 * weight * dir;
    if (Math.abs(jitter) > Math.abs(shakeX)) {
      shakeX = jitter;
    }

    const flash =
      interpolate(dt, [0, 1.5, 15], [0, 1, 0], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) *
      0.38 *
      weight;

    if (flash > crimsonFlash) {
      crimsonFlash = flash;
      conflictWord = cue.text;
    }
  }

  // Dynamic brightness & contrast curve per emotional mode (never flat/constant)
  const baseBrightness =
    mode === 'tension'
      ? 1.0 + energy * 0.09 + crimsonFlash * 0.24
      : 0.94 + 0.05 * Math.sin(localFrame * 0.075) + energy * 0.04;
  const baseContrast = mode === 'tension' ? 1.05 + crimsonFlash * 0.14 : 1.01;

  // Subtle ambient pulsing grid for Calm & Precision technical scenes
  const ambientGridOpacity =
    mode === 'precision'
      ? 0.075 + 0.065 * (0.5 + 0.5 * Math.sin(localFrame * 0.095))
      : 0.03 + energy * 0.04;

  return {
    mode,
    shakeX: Number(shakeX.toFixed(3)),
    crimsonFlash: clamp(crimsonFlash, 0, 0.45),
    brightness: clamp(baseBrightness, 0.88, 1.22),
    contrast: clamp(baseContrast, 0.98, 1.2),
    ambientGridOpacity: clamp(ambientGridOpacity, 0, 0.22),
    conflictWord,
  };
};

/**
 * Ambient pulsing precision coordinate grid (active during technical breakdown scenes)
 * + Crimson/Red conflict flash overlay (active when "break", "fail", "error", etc. hit).
 */
export const AmbientPrecisionGrid: React.FC<{opacity: number; mode: PacingMode}> = ({
  opacity,
  mode,
}) => {
  if (mode !== 'precision' || opacity <= 0.01) return null;
  return (
    <div
      data-ambient-precision-grid="true"
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(244,247,255,.32) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.32) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  );
};

export const CrimsonConflictFlashOverlay: React.FC<{
  flash: number;
  conflictWord: string | null;
}> = ({flash, conflictWord}) => {
  if (flash <= 0.005) return null;
  return (
    <div
      data-crimson-flash={conflictWord ?? 'active'}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 48%, rgba(225,29,72,${(flash * 0.58).toFixed(3)}), rgba(190,18,60,${(flash * 0.92).toFixed(3)}) 92%)`,
        boxShadow: `inset 0 0 140px rgba(225,29,72,${Math.min(0.85, flash * 1.65).toFixed(3)})`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

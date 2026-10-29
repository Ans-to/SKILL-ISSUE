import React from 'react';
import {computeWordMotion, getConflictImpactWeight} from './EmotionalPacing';
import {
  ORANGE,
  WHITE,
  normalize,
  sceneSpokenCues,
  type SceneKey,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

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

const fitWordSize = (text: string, maxPx: number, innerWidthPx: number): number =>
  Math.min(maxPx, Math.floor(innerWidthPx / Math.max(4.0, text.length * 0.58)));

/**
 * Hero Kinetic Typography Stage locked cleanly into the central focal channel (y = 852px),
 * framed seamlessly between the Upper Focal Simulation Card (y: 120..672) and the
 * Spoken Clause Telemetry Strip + Lower-Third UI Simulation Dock (y: 1030..1776).
 */
export const KineticEngine: React.FC<{
  cue: ScriptCue;
  variant: SceneKey;
  globalFrame: number;
  style?: React.CSSProperties;
}> = ({cue, variant, globalFrame, style}) => {
  const motion = computeWordMotion(cue, variant, globalFrame);
  const p = motion.progress;
  const hot = isEmphasis(cue.text);
  const conflictWeight = getConflictImpactWeight(cue.text);
  const color = hot ? ORANGE : WHITE;
  const glow =
    conflictWeight >= 0.9
      ? '0 0 58px rgba(225,29,72,.56), 0 0 32px rgba(255,69,0,.48)'
      : hot
        ? '0 0 46px rgba(255,69,0,.44)'
        : '0 16px 42px rgba(0,0,0,.76)';

  const maxFont =
    variant === 'outro'
      ? 162
      : variant === 'hook'
        ? 160
        : variant === 'twist'
          ? 158
          : 152;
  const size = fitWordSize(cue.text, maxFont, 936);

  const transformByVariant = (() => {
    if (variant === 'twist') {
      return `translateX(${(1 - p) * -42}px) scale(${0.82 + p * 0.18})`;
    }
    if (variant === 'payoff') {
      return `translateX(${(1 - p) * 18}px) scale(${0.96 + p * 0.04})`;
    }
    if (motion.mode === 'precision') {
      return `translateY(${(1 - p) * 16}px) scale(${0.96 + p * 0.04})`;
    }
    return `translateY(${(1 - p) * 42}px) scale(${0.78 + p * 0.22})`;
  })();

  return (
    <div
      data-kinetic-variant={variant}
      data-kinetic-pacing={motion.mode}
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
          fontSize: size,
          fontWeight: 900,
          letterSpacing: '-0.048em',
          lineHeight: 0.94,
          color,
          textShadow: glow,
          whiteSpace: 'nowrap',
          opacity: motion.opacity,
          transform: transformByVariant,
        }}
      >
        {cue.text}
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

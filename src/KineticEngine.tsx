import React from 'react';
import {CRIMSON, computeWordMotion, getConflictImpactWeight} from './EmotionalPacing';
import {Micro} from './TelemetryHud';
import {
  MUTED,
  ORANGE,
  WHITE,
  sceneSpokenCues,
  type SceneKey,
  type SceneSpec,
  type ScriptCue,
  normalize,
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
 * Full-canvas 1080x1920 word-by-word timestamp-snapping kinetic engine.
 * Centered cleanly at the optical focal plane (y ~ 970) so the upper semantic bay
 * (y: 338..678) and lower coordinate field remain 100% unobstructed and clutter-free.
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
      ? '0 0 62px rgba(225,29,72,.58), 0 0 36px rgba(255,69,0,.55)'
      : hot
        ? '0 0 54px rgba(255,69,0,.48)'
        : '0 18px 48px rgba(0,0,0,.72)';

  if (variant === 'hook') {
    const size = fitWordSize(cue.text, 168, 940);
    return (
      <div
        data-kinetic-variant="hook"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 970,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22}}>
          <span style={{width: 44, height: 2, background: conflictWeight > 0 ? CRIMSON : ORANGE}} />
          <Micro accent>
            CUE {String(cue.globalIndex + 1).padStart(2, '0')} // F{String(cue.startFrame).padStart(4, '0')}
          </Micro>
          <span style={{width: 44, height: 2, background: conflictWeight > 0 ? CRIMSON : ORANGE}} />
        </div>
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
            transform: `translateY(${(1 - p) * 52}px) scale(${0.78 + p * 0.22})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'twist') {
    const size = fitWordSize(cue.text, 162, 920);
    return (
      <div
        data-kinetic-variant="twist"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 970,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>AUDIT // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <span
            style={{
              flex: 1,
              height: 1,
              margin: '0 20px',
              background:
                conflictWeight >= 0.9
                  ? CRIMSON
                  : hot
                    ? 'rgba(255,69,0,.45)'
                    : 'rgba(244,247,255,.16)',
            }}
          />
          <Micro>
            {conflictWeight >= 0.9
              ? 'CRITICAL ERROR // FRACTURE'
              : hot
                ? 'STRESS CHECK'
                : `F${String(cue.startFrame).padStart(4, '0')}`}
          </Micro>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.046em',
            lineHeight: 0.94,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            opacity: motion.opacity,
            transform: `translateX(${(1 - p) * -46}px) scale(${0.8 + p * 0.2})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'shift') {
    const size = fitWordSize(cue.text, 154, 900);
    const isTension = motion.mode === 'tension';
    return (
      <div
        data-kinetic-variant="shift"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 970,
          transform: 'translateY(-50%)',
          padding: '24px 0',
          borderTop: `1px solid ${conflictWeight > 0 ? CRIMSON : hot ? ORANGE : 'rgba(244,247,255,.18)'}`,
          borderBottom: `1px solid ${conflictWeight > 0 ? CRIMSON : hot ? ORANGE : 'rgba(244,247,255,.18)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>SCHEMA BRIDGE // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <Micro>{isTension ? 'CONFLICT // SLAM' : 'PRECISION // CUBIC'}</Micro>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.046em',
            lineHeight: 0.94,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            opacity: motion.opacity,
            transform: isTension
              ? `translateY(${(1 - p) * 34}px) scale(${0.82 + p * 0.18})`
              : `translateY(${(1 - p) * 14}px) scale(${0.96 + p * 0.04})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'mechanism') {
    const size = fitWordSize(cue.text, 158, 920);
    return (
      <div
        data-kinetic-variant="mechanism"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 970,
          transform: 'translateY(-50%)',
          padding: '22px 0',
          borderBottom: `1px solid ${hot ? 'rgba(255,69,0,.5)' : 'rgba(244,247,255,.16)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>
            f({cue.startFrame}) // PRIMITIVE {String(cue.globalIndex + 1).padStart(2, '0')}
          </Micro>
          <span style={{fontFamily: 'monospace', fontSize: 12, color: MUTED, letterSpacing: 1.8}}>
            EASE // CUBIC_IN_OUT
          </span>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.046em',
            lineHeight: 0.94,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            opacity: motion.opacity,
            transform: `translateY(${(1 - p) * 16}px) scale(${0.96 + p * 0.04})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'payoff') {
    const size = fitWordSize(cue.text, 158, 920);
    return (
      <div
        data-kinetic-variant="payoff"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 970,
          transform: 'translateY(-50%)',
          padding: '22px 0',
          borderBottom: `1px solid ${hot ? 'rgba(255,69,0,.5)' : 'rgba(244,247,255,.16)'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>COMPILER STREAM // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <Micro>EASE // CUBIC · F{String(cue.startFrame).padStart(4, '0')}</Micro>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.046em',
            lineHeight: 0.94,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            opacity: motion.opacity,
            transform: `translateX(${(1 - p) * 18}px) scale(${0.96 + p * 0.04})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  // Outro monolith lock across full 1080x1920 canvas ('tension' slam)
  const outroSize = fitWordSize(cue.text, 170, 940);
  return (
    <div
      data-kinetic-variant="outro"
      data-kinetic-pacing={motion.mode}
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        top: 970,
        transform: 'translateY(-50%)',
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: outroSize,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          lineHeight: 0.94,
          color,
          textShadow: glow,
          whiteSpace: 'nowrap',
          opacity: motion.opacity,
          transform: `translateY(${(1 - p) * 44}px) scale(${0.78 + p * 0.22})`,
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

/**
 * Deterministic token progression diagnostic helper (not mounted as continuous background).
 */
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

import React from 'react';
import {CRIMSON, computeWordMotion, getConflictImpactWeight} from './EmotionalPacing';
import {Micro} from './TelemetryHud';
import {
  MUTED,
  ORANGE,
  WHITE,
  hashText,
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
 * Full-canvas 1080x1920 word-by-word timestamp-snapping kinetic engine.
 * Dynamically adapts kinematics to narrative emotional tone:
 * - Tension & Urgency ('tension'): violent spring slam ({damping: 8, stiffness: 300})
 * - Calm & Precision ('precision'): fluid easeInOutCubic glide & deliberate text fade
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
      ? `0 0 62px rgba(225,29,72,.58), 0 0 36px rgba(255,69,0,.55)`
      : hot
        ? '0 0 54px rgba(255,69,0,.48)'
        : '0 18px 48px rgba(0,0,0,.72)';

  if (variant === 'hook') {
    const size = fitWordSize(cue.text, 166, 940);
    return (
      <div
        data-kinetic-variant="hook"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 900,
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
    const size = fitWordSize(cue.text, 152, 920);
    return (
      <div
        data-kinetic-variant="twist"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 1475,
          transform: 'translateY(-50%)',
          padding: '28px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
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
          <Micro>{conflictWeight >= 0.9 ? 'CRITICAL ERROR // FRACTURE' : hot ? 'CRITICAL FRACTURE' : `F${String(cue.startFrame).padStart(4, '0')}`}</Micro>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.045em',
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
    const size = fitWordSize(cue.text, 138, 880);
    const isTension = motion.mode === 'tension';
    return (
      <div
        data-kinetic-variant="shift"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 716,
          transform: 'translateY(-50%)',
          padding: '20px 30px',
          boxSizing: 'border-box',
          background: 'rgba(11,15,25,.66)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${conflictWeight > 0 ? CRIMSON : hot ? ORANGE : 'rgba(244,247,255,.22)'}`,
          borderBottom: `1px solid ${conflictWeight > 0 ? CRIMSON : hot ? ORANGE : 'rgba(244,247,255,.22)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>SCHEMA BRIDGE // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <Micro>{isTension ? 'CONFLICT // SLAM' : 'PRECISION // CUBIC'}</Micro>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div
            style={{
              width: 8,
              height: 108,
              flexShrink: 0,
              background: conflictWeight > 0 ? CRIMSON : hot ? ORANGE : WHITE,
              boxShadow: hot ? `0 0 22px ${ORANGE}` : 'none',
            }}
          />
          <div
            style={{
              fontSize: size,
              fontWeight: 900,
              letterSpacing: '-0.044em',
              lineHeight: 0.94,
              color,
              textShadow: glow,
              whiteSpace: 'nowrap',
              opacity: motion.opacity,
              transform: isTension
                ? `translateY(${(1 - p) * 34}px) scale(${0.82 + p * 0.18})`
                : `translateY(${(1 - p) * 14}px) scale(${0.96 + p * 0.04})`,
              transformOrigin: 'left center',
            }}
          >
            {cue.text}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'mechanism') {
    const size = fitWordSize(cue.text, 138, 920);
    return (
      <div
        data-kinetic-variant="mechanism"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 164,
          height: 236,
          boxSizing: 'border-box',
          padding: '16px 6px',
          borderBottom: `1px solid ${hot ? 'rgba(255,69,0,.55)' : 'rgba(244,247,255,.16)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>
            f({cue.startFrame}) // PRIMITIVE {String(cue.globalIndex + 1).padStart(2, '0')}
          </Micro>
          <span style={{fontFamily: 'monospace', fontSize: 13, color: MUTED, letterSpacing: 1.5}}>
            EASE // CUBIC_IN_OUT
          </span>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.044em',
            lineHeight: 0.94,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            opacity: motion.opacity,
            transform: `translateY(${(1 - p) * 16}px) scale(${0.96 + p * 0.04})`,
            transformOrigin: 'left center',
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'payoff') {
    const size = fitWordSize(cue.text, 142, 920);
    return (
      <div
        data-kinetic-variant="payoff"
        data-kinetic-pacing={motion.mode}
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 164,
          height: 236,
          boxSizing: 'border-box',
          padding: '16px 6px',
          borderBottom: `1px solid ${hot ? 'rgba(255,69,0,.55)' : 'rgba(244,247,255,.16)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>COMPILER STREAM // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <Micro>EASE // CUBIC · F{String(cue.startFrame).padStart(4, '0')}</Micro>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.045em',
            lineHeight: 0.94,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            opacity: motion.opacity,
            transform: `translateX(${(1 - p) * 18}px) scale(${0.96 + p * 0.04})`,
            transformOrigin: 'left center',
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
        top: 920,
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
 * Full-width 1080x1920 floating semantic vector node path.
 */
export const SceneSemanticGraph: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  energy: number;
  style?: React.CSSProperties;
}> = ({scene, localFrame, activeCue, energy, style}) => {
  const spoken = sceneSpokenCues(scene, localFrame);
  const count = Math.max(1, scene.lastWordIndex - scene.firstWordIndex + 1);
  const points = spoken.map((cue) => {
    const relIdx = cue.globalIndex - scene.firstWordIndex;
    const seed = hashText(`${scene.id}:${cue.globalIndex}`);
    const x = 36 + (relIdx / Math.max(1, count - 1)) * 896;
    const y =
      36 +
      ((seed % 150) / 150) * 168 +
      Math.sin(localFrame * 0.05 + cue.globalIndex) * 4.5;
    return {cue, x, y};
  });

  return (
    <svg
      data-scene-semantic={scene.id}
      viewBox="0 0 968 240"
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        top: 190,
        width: 968,
        height: 240,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {points.map((point, index) => {
        const prev = points[index - 1];
        if (!prev) return null;
        const active = point.cue.globalIndex === activeCue?.globalIndex;
        return (
          <line
            key={point.cue.globalIndex}
            x1={prev.x}
            y1={prev.y}
            x2={point.x}
            y2={point.y}
            stroke={active ? ORANGE : WHITE}
            strokeOpacity={active ? 0.9 : 0.26}
            strokeWidth={active ? 2.5 : 1.4}
          />
        );
      })}
      {points.map(({cue, x, y}) => {
        const active = cue.globalIndex === activeCue?.globalIndex;
        const hot = isEmphasis(cue.text);
        return (
          <g key={cue.globalIndex} transform={`translate(${x} ${y})`}>
            {active && (
              <circle
                r={17 + energy * 8}
                fill="none"
                stroke={ORANGE}
                strokeOpacity={0.64}
                strokeWidth={1.7}
              />
            )}
            <circle
              r={active ? 7 : 3.6}
              fill={active ? ORANGE : hot ? 'rgba(255,69,0,.78)' : WHITE}
              fillOpacity={active ? 1 : 0.65}
            />
          </g>
        );
      })}
    </svg>
  );
};

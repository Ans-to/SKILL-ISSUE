import React from 'react';
import {spring} from 'remotion';
import {
  FPS,
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

const ACCENT_WORDS = new Set([
  'didnt',
  'anything',
  'template',
  'trick',
  'break',
  'harder',
  'no',
  'cant',
  'timing',
  'graph',
  'constraints',
  'engine',
  'physics',
  'isolation',
  'math',
  'same',
  'roulette',
  'compiles',
  'mp4',
  'fast',
  'inspectable',
  'repeatable',
  'stop',
  'templates',
  'build',
  'toys',
]);

export const isAccentCue = (cue: ScriptCue): boolean =>
  ACCENT_WORDS.has(normalize(cue.text));

/**
 * Word-by-word timestamp-snapping kinetic engine.
 * Mounted strictly inside [cue.startFrame, cue.endFrame) using spring {damping: 10, stiffness: 180}.
 * Each scene Sequence selects its own right-stage kinetic geometry with zero card collisions.
 */
export const KineticEngine: React.FC<{
  cue: ScriptCue;
  variant: SceneKey;
  globalFrame: number;
}> = ({cue, variant, globalFrame}) => {
  const elapsed = Math.max(0, globalFrame - cue.startFrame);
  const reveal = spring({frame: elapsed, fps: FPS, config: {damping: 10, stiffness: 180}});
  const accent = isAccentCue(cue);
  const color = accent ? ORANGE : WHITE;
  const wordOrder = String(cue.globalIndex + 1).padStart(2, '0');

  if (variant === 'hook') {
    return (
      <div
        data-kinetic-variant="hook"
        style={{
          position: 'absolute',
          zIndex: 14,
          left: 488,
          right: 56,
          top: '48%',
          transform: `translateY(-50%) scale(${0.86 + reveal * 0.14})`,
          transformOrigin: 'left center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            fontFamily: 'monospace',
            fontSize: 12,
            letterSpacing: 3,
            color: accent ? ORANGE : MUTED,
          }}
        >
          <span style={{width: 24, height: 2, background: ORANGE, display: 'inline-block'}} />
          <span>CUE {wordOrder} // F{String(cue.startFrame).padStart(4, '0')}</span>
        </div>
        <div
          style={{
            fontSize: 146,
            fontWeight: 950,
            letterSpacing: -4.5,
            lineHeight: 0.88,
            whiteSpace: 'nowrap',
            color,
            textShadow: accent
              ? '0 0 42px rgba(255,69,0,.42), 8px 0 0 rgba(244,247,255,.16)'
              : '0 0 28px rgba(255,69,0,.22), 6px 0 0 rgba(255,69,0,.28)',
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'twist') {
    return (
      <div
        data-kinetic-variant="twist"
        style={{
          position: 'absolute',
          zIndex: 14,
          left: 468,
          right: 48,
          bottom: 40,
          height: 218,
          borderTop: `2px solid ${accent ? ORANGE : 'rgba(244,247,255,.24)'}`,
          borderBottom: '1px solid rgba(244,247,255,.12)',
          background: 'linear-gradient(90deg, rgba(11,15,25,.95), rgba(16,22,36,.88) 55%, rgba(11,15,25,.95))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontFamily: 'monospace', fontSize: 11, letterSpacing: 2.4, color: MUTED}}>
          <div style={{color: ORANGE, fontWeight: 900, marginBottom: 6}}>AUDIT // TOKEN {wordOrder}</div>
          <div>F{String(cue.startFrame).padStart(4, '0')}–F{String(cue.endFrame).padStart(4, '0')}</div>
        </div>
        <div
          style={{
            transform: `scale(${0.86 + reveal * 0.14}) translateY(${(1 - reveal) * 14}px)`,
            transformOrigin: 'center center',
            fontSize: 112,
            fontWeight: 950,
            letterSpacing: -3.5,
            lineHeight: 0.9,
            whiteSpace: 'nowrap',
            color,
            textShadow: '0 0 32px rgba(255,69,0,.32)',
          }}
        >
          {cue.text}
        </div>
        <div style={{fontFamily: 'monospace', fontSize: 11, letterSpacing: 2.2, color: accent ? ORANGE : MUTED, textAlign: 'right'}}>
          <div>{accent ? 'CRITICAL HIT' : 'WORD LOCKED'}</div>
          <div style={{marginTop: 6}}>SEQUENCE 02</div>
        </div>
      </div>
    );
  }

  if (variant === 'shift') {
    return (
      <div
        data-kinetic-variant="shift"
        style={{
          position: 'absolute',
          zIndex: 14,
          left: 468,
          right: 48,
          top: 40,
          height: 196,
          border: `1px solid ${accent ? ORANGE : 'rgba(244,247,255,.16)'}`,
          background: 'linear-gradient(135deg, rgba(14,20,33,.94), rgba(8,11,19,.88))',
          padding: '0 34px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div
            style={{
              width: 6,
              height: 112,
              background: accent ? ORANGE : WHITE,
              boxShadow: accent ? `0 0 20px ${ORANGE}` : 'none',
            }}
          />
          <div
            style={{
              transform: `scale(${0.88 + reveal * 0.12}) translateX(${(1 - reveal) * -16}px)`,
              transformOrigin: 'left center',
              fontSize: 108,
              fontWeight: 950,
              letterSpacing: -3.5,
              lineHeight: 0.9,
              whiteSpace: 'nowrap',
              color,
              textShadow: '0 0 26px rgba(255,69,0,.28)',
            }}
          >
            {cue.text}
          </div>
        </div>
        <div style={{fontFamily: 'monospace', fontSize: 11, letterSpacing: 2.2, color: MUTED, textAlign: 'right'}}>
          <div style={{color: ORANGE, fontWeight: 900}}>SPLIT WIREFRAME</div>
          <div style={{marginTop: 6}}>TOKEN {wordOrder} · F{String(cue.startFrame).padStart(4, '0')}</div>
        </div>
      </div>
    );
  }

  if (variant === 'mechanism') {
    return (
      <div
        data-kinetic-variant="mechanism"
        style={{
          position: 'absolute',
          zIndex: 14,
          left: 468,
          right: 48,
          top: 40,
          height: 204,
          border: `1px solid ${accent ? ORANGE : 'rgba(244,247,255,.2)'}`,
          background: 'linear-gradient(135deg, rgba(14,20,33,.94), rgba(8,11,19,.88))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            transform: `scale(${0.88 + reveal * 0.12})`,
            transformOrigin: 'left center',
            fontSize: 108,
            fontWeight: 950,
            letterSpacing: -3.5,
            lineHeight: 0.9,
            whiteSpace: 'nowrap',
            color,
            textShadow: '0 0 28px rgba(255,69,0,.3)',
          }}
        >
          {cue.text}
        </div>
        <div style={{fontFamily: 'monospace', textAlign: 'right', color: MUTED, fontSize: 12, letterSpacing: 2}}>
          <div style={{color: ORANGE, fontWeight: 900}}>f({cue.startFrame}) → WORD[{wordOrder}]</div>
          <div style={{marginTop: 8}}>SPRING(d=10, k=180)</div>
        </div>
      </div>
    );
  }

  if (variant === 'payoff') {
    return (
      <div
        data-kinetic-variant="payoff"
        style={{
          position: 'absolute',
          zIndex: 14,
          left: 468,
          right: 48,
          top: 40,
          height: 214,
          border: `1px solid ${accent ? ORANGE : 'rgba(244,247,255,.18)'}`,
          background: 'linear-gradient(145deg, rgba(14,20,33,.95), rgba(8,11,19,.9))',
          padding: '0 36px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{fontFamily: 'monospace', fontSize: 11, letterSpacing: 2.6, color: ORANGE, marginBottom: 8}}>
            COMPILER STREAM // TOKEN {wordOrder}
          </div>
          <div
            style={{
              transform: `scale(${0.88 + reveal * 0.12})`,
              transformOrigin: 'left center',
              fontSize: 110,
              fontWeight: 950,
              letterSpacing: -3.5,
              lineHeight: 0.9,
              whiteSpace: 'nowrap',
              color,
              textShadow: '0 0 28px rgba(255,69,0,.3)',
            }}
          >
            {cue.text}
          </div>
        </div>
        <div style={{fontFamily: 'monospace', textAlign: 'right', fontSize: 12, letterSpacing: 2, color: MUTED}}>
          <div style={{color: WHITE, fontWeight: 900}}>SEQUENCE 05 // PIPELINE</div>
          <div style={{marginTop: 8, color: ORANGE}}>FRAME {String(cue.startFrame).padStart(4, '0')}</div>
        </div>
      </div>
    );
  }

  // Outro monolith centered inside right stage
  return (
    <div
      data-kinetic-variant="outro"
      style={{
        position: 'absolute',
        zIndex: 14,
        left: 468,
        right: 48,
        top: '48%',
        transform: `translateY(-50%) scale(${0.84 + reveal * 0.16})`,
        transformOrigin: 'center center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 152,
          fontWeight: 950,
          letterSpacing: -4.5,
          lineHeight: 0.88,
          whiteSpace: 'nowrap',
          color,
          textShadow: accent
            ? '0 0 48px rgba(255,69,0,.48), 0 0 12px rgba(255,69,0,.35)'
            : '0 0 30px rgba(255,69,0,.22)',
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

export const KineticText = KineticEngine;

export const SceneSemanticGraph: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCue: ScriptCue | null;
  energy: number;
  style?: React.CSSProperties;
}> = ({scene, localFrame, activeCue, energy, style}) => {
  const spoken = sceneSpokenCues(scene, localFrame).slice(-12);
  const points = spoken.map((cue, index) => {
    const seed = hashText(`${scene.id}:${cue.text}:${cue.globalIndex}`);
    return {
      cue,
      x: 36 + (index / Math.max(1, spoken.length - 1)) * 560,
      y: 110 + ((seed % 140) - 70) * 0.65 + Math.sin(localFrame * 0.04 + index) * energy * 7,
    };
  });

  return (
    <svg
      data-scene-semantic={scene.id}
      aria-hidden="true"
      viewBox="0 0 640 220"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        width: 580,
        height: 200,
        opacity: 0.36 + energy * 0.3,
        overflow: 'visible',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <path d="M20 110H620" stroke={WHITE} strokeOpacity=".12" strokeDasharray="3 10" />
      {points.slice(1).map((point, index) => (
        <line
          key={`edge-${point.cue.globalIndex}`}
          x1={points[index].x}
          y1={points[index].y}
          x2={point.x}
          y2={point.y}
          stroke={index % 2 === 0 ? ORANGE : WHITE}
          strokeOpacity={0.22 + energy * 0.28}
          strokeWidth={index % 2 === 0 ? 1.8 : 1.1}
        />
      ))}
      {points.map((point) => {
        const active = point.cue.globalIndex === activeCue?.globalIndex;
        return (
          <g key={`node-${point.cue.globalIndex}`}>
            {active && (
              <circle
                cx={point.x}
                cy={point.y}
                r={14 + energy * 5}
                fill="none"
                stroke={ORANGE}
                strokeOpacity={0.55}
              />
            )}
            <circle
              cx={point.x}
              cy={point.y}
              r={active ? 7 + energy * 3 : 3.4}
              fill={active ? ORANGE : WHITE}
            />
          </g>
        );
      })}
    </svg>
  );
};

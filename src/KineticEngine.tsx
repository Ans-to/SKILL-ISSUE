import React from 'react';
import {spring} from 'remotion';
import {Micro} from './TelemetryHud';
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
 * Uses 100% of the horizontal canvas with floating reticle accents and
 * strict {damping: 10, stiffness: 180} spring physics.
 */
export const KineticEngine: React.FC<{
  cue: ScriptCue;
  variant: SceneKey;
  globalFrame: number;
  style?: React.CSSProperties;
}> = ({cue, variant, globalFrame, style}) => {
  const localCueFrame = Math.max(0, globalFrame - cue.startFrame);
  const slam = spring({
    frame: localCueFrame,
    fps: FPS,
    config: {damping: 10, stiffness: 180},
  });
  const hot = isEmphasis(cue.text);
  const color = hot ? ORANGE : WHITE;
  const glow = hot ? '0 0 54px rgba(255,69,0,.48)' : '0 18px 48px rgba(0,0,0,.72)';

  if (variant === 'hook') {
    const size = fitWordSize(cue.text, 166, 940);
    return (
      <div
        data-kinetic-variant="hook"
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
          <span style={{width: 44, height: 2, background: ORANGE}} />
          <Micro accent>
            CUE {String(cue.globalIndex + 1).padStart(2, '0')} // F{String(cue.startFrame).padStart(4, '0')}
          </Micro>
          <span style={{width: 44, height: 2, background: ORANGE}} />
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
            transform: `translateY(${(1 - slam) * 38}px) scale(${0.84 + slam * 0.16})`,
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
          <span style={{flex: 1, height: 1, margin: '0 20px', background: hot ? 'rgba(255,69,0,.45)' : 'rgba(244,247,255,.16)'}} />
          <Micro>{hot ? 'CRITICAL FRACTURE' : `F${String(cue.startFrame).padStart(4, '0')}`}</Micro>
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
            transform: `translateX(${(1 - slam) * -34}px) scale(${0.86 + slam * 0.14})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'shift') {
    const size = fitWordSize(cue.text, 138, 880);
    return (
      <div
        data-kinetic-variant="shift"
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 860,
          transform: 'translateY(-50%)',
          padding: '24px 32px',
          boxSizing: 'border-box',
          background: 'rgba(11,15,25,.66)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${hot ? ORANGE : 'rgba(244,247,255,.22)'}`,
          borderBottom: `1px solid ${hot ? ORANGE : 'rgba(244,247,255,.22)'}`,
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
          <Micro>F{String(cue.startFrame).padStart(4, '0')}</Micro>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div
            style={{
              width: 8,
              height: 108,
              flexShrink: 0,
              background: hot ? ORANGE : WHITE,
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
              transform: `translateY(${(1 - slam) * 24}px) scale(${0.88 + slam * 0.12})`,
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
            SPRING d=10 · k=180
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
            transform: `scale(${0.86 + slam * 0.14})`,
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
          <Micro>SEQ 05 · F{String(cue.startFrame).padStart(4, '0')}</Micro>
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
            transform: `translateX(${(1 - slam) * 32}px) scale(${0.88 + slam * 0.12})`,
            transformOrigin: 'left center',
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  // Outro monolith lock across full 1080x1920 canvas
  const outroSize = fitWordSize(cue.text, 170, 940);
  return (
    <div
      data-kinetic-variant="outro"
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
          transform: `translateY(${(1 - slam) * 30}px) scale(${0.84 + slam * 0.16})`,
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

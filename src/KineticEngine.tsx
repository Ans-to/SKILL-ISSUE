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
  Math.min(maxPx, Math.floor(innerWidthPx / Math.max(4.0, text.length * 0.6)));

/**
 * Right-column (760x1920) word-by-word timestamp-snapping kinetic engine.
 * Spring physics strictly use {damping: 10, stiffness: 180}.
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
  const glow = hot ? '0 0 42px rgba(255,69,0,.44)' : '0 14px 40px rgba(0,0,0,.62)';

  if (variant === 'hook') {
    const size = fitWordSize(cue.text, 120, 650);
    return (
      <div
        data-kinetic-variant="hook"
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          top: 930,
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          ...style,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18}}>
          <span style={{width: 28, height: 2, background: ORANGE}} />
          <Micro accent>
            CUE {String(cue.globalIndex + 1).padStart(2, '0')} // F{String(cue.startFrame).padStart(4, '0')}
          </Micro>
          <span style={{width: 28, height: 2, background: ORANGE}} />
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.045em',
            lineHeight: 0.96,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            transform: `translateY(${(1 - slam) * 32}px) scale(${0.86 + slam * 0.14})`,
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'twist') {
    const size = fitWordSize(cue.text, 108, 624);
    return (
      <div
        data-kinetic-variant="twist"
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          bottom: 48,
          height: 336,
          boxSizing: 'border-box',
          border: '1px solid rgba(244,247,255,.16)',
          borderTop: `3px solid ${hot ? ORANGE : WHITE}`,
          background: 'linear-gradient(180deg, rgba(14,20,34,.95), rgba(8,11,19,.97))',
          padding: '22px 30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>AUDIT // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <Micro>
            F{String(cue.startFrame).padStart(4, '0')}–F{String(cue.endFrame).padStart(4, '0')}
          </Micro>
        </div>
        <div style={{display: 'grid', placeItems: 'center', flex: 1}}>
          <div
            style={{
              fontSize: size,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.96,
              color,
              textShadow: glow,
              whiteSpace: 'nowrap',
              transform: `translateX(${(1 - slam) * -28}px) scale(${0.88 + slam * 0.12})`,
            }}
          >
            {cue.text}
          </div>
        </div>
        <div style={{textAlign: 'center'}}>
          <Micro accent={hot}>{hot ? 'CRITICAL FRACTURE HIT' : '30 FPS QUANTIZED LOCK'}</Micro>
        </div>
      </div>
    );
  }

  if (variant === 'shift') {
    const size = fitWordSize(cue.text, 98, 596);
    return (
      <div
        data-kinetic-variant="shift"
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          top: 48,
          height: 248,
          boxSizing: 'border-box',
          border: `1px solid ${hot ? ORANGE : 'rgba(244,247,255,.2)'}`,
          background: 'rgba(9,13,23,.93)',
          padding: '20px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>SCHEMA AUDIT // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}</Micro>
          <Micro>F{String(cue.startFrame).padStart(4, '0')}</Micro>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div
            style={{
              width: 6,
              height: 92,
              flexShrink: 0,
              background: hot ? ORANGE : WHITE,
              boxShadow: hot ? `0 0 18px ${ORANGE}` : 'none',
            }}
          />
          <div
            style={{
              fontSize: size,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.96,
              color,
              textShadow: glow,
              whiteSpace: 'nowrap',
              transform: `translateY(${(1 - slam) * 20}px) scale(${0.9 + slam * 0.1})`,
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
    const size = fitWordSize(cue.text, 96, 624);
    return (
      <div
        data-kinetic-variant="mechanism"
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          top: 48,
          height: 248,
          boxSizing: 'border-box',
          border: `1px solid ${hot ? ORANGE : 'rgba(244,247,255,.2)'}`,
          background: 'rgba(9,13,23,.93)',
          padding: '20px 28px',
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
            f({cue.startFrame}) // TOKEN {String(cue.globalIndex + 1).padStart(2, '0')}
          </Micro>
          <span style={{fontFamily: 'monospace', fontSize: 12, color: MUTED}}>d=10 · k=180</span>
        </div>
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 0.96,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            transform: `scale(${0.88 + slam * 0.12})`,
            transformOrigin: 'left center',
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  if (variant === 'payoff') {
    const size = fitWordSize(cue.text, 98, 624);
    return (
      <div
        data-kinetic-variant="payoff"
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          top: 48,
          height: 248,
          boxSizing: 'border-box',
          border: `1px solid ${hot ? ORANGE : 'rgba(244,247,255,.2)'}`,
          background: 'rgba(9,13,23,.93)',
          padding: '20px 28px',
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
            letterSpacing: '-0.042em',
            lineHeight: 0.96,
            color,
            textShadow: glow,
            whiteSpace: 'nowrap',
            transform: `translateX(${(1 - slam) * 26}px) scale(${0.9 + slam * 0.1})`,
            transformOrigin: 'left center',
          }}
        >
          {cue.text}
        </div>
      </div>
    );
  }

  // Outro monolith lock centered in 760x1920 right column
  const outroSize = fitWordSize(cue.text, 122, 650);
  return (
    <div
      data-kinetic-variant="outro"
      style={{
        position: 'absolute',
        left: 36,
        right: 36,
        top: 960,
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
          letterSpacing: '-0.048em',
          lineHeight: 0.95,
          color,
          textShadow: glow,
          whiteSpace: 'nowrap',
          transform: `translateY(${(1 - slam) * 24}px) scale(${0.86 + slam * 0.14})`,
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

/**
 * Scene-isolated semantic vector node graph sized for the 760x1920 right column.
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
    const x = 32 + (relIdx / Math.max(1, count - 1)) * 624;
    const y =
      36 +
      ((seed % 150) / 150) * 168 +
      Math.sin(localFrame * 0.05 + cue.globalIndex) * 4;
    return {cue, x, y};
  });

  return (
    <svg
      data-scene-semantic={scene.id}
      viewBox="0 0 688 240"
      style={{
        position: 'absolute',
        left: 36,
        right: 36,
        top: 56,
        width: 688,
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
            strokeOpacity={active ? 0.88 : 0.25}
            strokeWidth={active ? 2.4 : 1.3}
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
                r={15 + energy * 7}
                fill="none"
                stroke={ORANGE}
                strokeOpacity={0.62}
                strokeWidth={1.6}
              />
            )}
            <circle
              r={active ? 6.5 : 3.2}
              fill={active ? ORANGE : hot ? 'rgba(255,69,0,.78)' : WHITE}
              fillOpacity={active ? 1 : 0.65}
            />
          </g>
        );
      })}
    </svg>
  );
};

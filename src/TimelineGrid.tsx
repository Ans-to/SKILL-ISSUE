import React from 'react';
import {MUTED, ORANGE, WHITE, clamp} from './engine/agentEngineModel';

export type LinearKeyframeGridProps = {
  progress: number;
  opacity: number;
  scale: number;
  triggerText: string;
  startFrame: number;
};

/**
 * Frameless, clean Linear Keyframe Grid rendered ONLY when semantic "Timing"
 * tokens are spoken ("timing model,", "timing,").
 * Progresses once across quantized 30fps keyframe ticks and dissolves cleanly
 * back to the subtle coordinate grid.
 */
export const TimelineGrid: React.FC<LinearKeyframeGridProps> = ({
  progress,
  opacity,
  scale,
  triggerText,
  startFrame,
}) => {
  const p = clamp(progress, 0, 1);
  const playheadX = 64 + p * 760;
  const tickCount = 13;

  return (
    <svg
      data-broll-kind="math"
      data-broll-subkind="timing"
      viewBox="0 0 888 260"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        left: 96,
        width: 888,
        top: 356,
        height: 260,
        opacity: opacity * 0.92,
        transform: `scale(${scale})`,
        transformOrigin: '444px 130px',
        pointerEvents: 'none',
      }}
    >
      <text
        x="64"
        y="26"
        fill={ORANGE}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        letterSpacing="2.2"
      >
        LINEAR_KEYFRAME_GRID // 30FPS_QUANTIZED [{triggerText.toUpperCase()}]
      </text>
      <text
        x="824"
        y="26"
        textAnchor="end"
        fill={MUTED}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        letterSpacing="1.8"
      >
        F{String(startFrame).padStart(4, '0')}
      </text>

      {/* Orthogonal horizontal reference rails */}
      <line x1="64" y1="66" x2="824" y2="66" stroke={WHITE} strokeOpacity="0.14" strokeWidth="1" />
      <line x1="64" y1="138" x2="824" y2="138" stroke={WHITE} strokeOpacity="0.1" strokeDasharray="4 6" strokeWidth="1" />
      <line x1="64" y1="210" x2="824" y2="210" stroke={WHITE} strokeOpacity="0.38" strokeWidth="1.5" />
      <line x1="64" y1="48" x2="64" y2="210" stroke={WHITE} strokeOpacity="0.38" strokeWidth="1.5" />

      {/* Linear quantized keyframe divisions & diamond markers */}
      {Array.from({length: tickCount}, (_, kf) => {
        const x = 64 + (kf * 760) / (tickCount - 1);
        const isMajor = kf % 3 === 0;
        const reached = x <= playheadX + 1;
        return (
          <g key={kf}>
            <line
              x1={x}
              y1={isMajor ? 80 : 114}
              x2={x}
              y2={210}
              stroke={reached ? ORANGE : WHITE}
              strokeOpacity={reached ? 0.9 : 0.22}
              strokeWidth={isMajor ? 2.2 : 1.2}
            />
            {isMajor && (
              <>
                <rect
                  x={x - 5.5}
                  y={60.5}
                  width="11"
                  height="11"
                  transform={`rotate(45 ${x} 66)`}
                  fill={reached ? ORANGE : '#0b0f19'}
                  stroke={reached ? ORANGE : WHITE}
                  strokeOpacity={reached ? 0.95 : 0.45}
                  strokeWidth="1.4"
                />
                <text
                  x={x}
                  y="234"
                  textAnchor="middle"
                  fill={reached ? WHITE : MUTED}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="10"
                >
                  +{kf * 2}f
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Single-pass linear keyframe playhead */}
      <line
        x1={playheadX}
        y1="48"
        x2={playheadX}
        y2="210"
        stroke={ORANGE}
        strokeWidth="2.2"
        strokeOpacity="0.96"
      />
      <circle cx={playheadX} cy="66" r="4" fill={WHITE} />
    </svg>
  );
};

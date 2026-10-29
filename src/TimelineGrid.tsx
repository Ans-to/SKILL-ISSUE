import React from 'react';
import {MUTED, ORANGE, WHITE, clamp} from './engine/agentEngineModel';

export type LinearKeyframeGridProps = {
  progress: number;
  opacity: number;
  scale: number;
  triggerText: string;
  startFrame: number;
  embedded?: boolean;
};

/**
 * Clean 30fps Linear Keyframe Grid rendered inside the Engine Focal Simulation Card
 * when timing-model / keyframe invariants are inspected.
 */
export const TimelineGrid: React.FC<LinearKeyframeGridProps> = ({
  progress,
  opacity,
  scale,
  triggerText,
  startFrame,
  embedded = false,
}) => {
  const p = clamp(progress, 0, 1);
  const playheadX = 48 + p * 792;
  const tickCount = 13;

  return (
    <svg
      data-broll-kind="math"
      data-broll-subkind="timing"
      viewBox="0 0 888 220"
      preserveAspectRatio="none"
      style={
        embedded
          ? {
              width: '100%',
              height: '100%',
              display: 'block',
              opacity,
              pointerEvents: 'none',
            }
          : {
              position: 'absolute',
              left: 96,
              width: 888,
              top: 356,
              height: 220,
              opacity: opacity * 0.94,
              transform: `scale(${scale})`,
              transformOrigin: '444px 110px',
              pointerEvents: 'none',
            }
      }
    >
      <text
        x="48"
        y="22"
        fill={ORANGE}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11.5"
        letterSpacing="2"
      >
        LINEAR_KEYFRAME_GRID // 30FPS_QUANTIZED [{triggerText.toUpperCase()}]
      </text>
      <text
        x="840"
        y="22"
        textAnchor="end"
        fill={MUTED}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        letterSpacing="1.8"
      >
        F{String(startFrame).padStart(4, '0')}
      </text>

      {/* Orthogonal horizontal reference rails */}
      <line x1="48" y1="54" x2="840" y2="54" stroke={WHITE} strokeOpacity="0.16" strokeWidth="1" />
      <line x1="48" y1="118" x2="840" y2="118" stroke={WHITE} strokeOpacity="0.12" strokeDasharray="4 6" strokeWidth="1" />
      <line x1="48" y1="184" x2="840" y2="184" stroke={WHITE} strokeOpacity="0.38" strokeWidth="1.5" />
      <line x1="48" y1="40" x2="48" y2="184" stroke={WHITE} strokeOpacity="0.38" strokeWidth="1.5" />

      {/* Linear quantized keyframe divisions & diamond markers */}
      {Array.from({length: tickCount}, (_, kf) => {
        const x = 48 + (kf * 792) / (tickCount - 1);
        const isMajor = kf % 3 === 0;
        const reached = x <= playheadX + 1;
        return (
          <g key={kf}>
            <line
              x1={x}
              y1={isMajor ? 66 : 98}
              x2={x}
              y2={184}
              stroke={reached ? ORANGE : WHITE}
              strokeOpacity={reached ? 0.92 : 0.24}
              strokeWidth={isMajor ? 2.2 : 1.2}
            />
            {isMajor && (
              <>
                <rect
                  x={x - 5}
                  y={49}
                  width="10"
                  height="10"
                  transform={`rotate(45 ${x} 54)`}
                  fill={reached ? ORANGE : '#0b0f19'}
                  stroke={reached ? ORANGE : WHITE}
                  strokeOpacity={reached ? 0.95 : 0.45}
                  strokeWidth="1.4"
                />
                <text
                  x={x}
                  y="206"
                  textAnchor="middle"
                  fill={reached ? WHITE : MUTED}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="10.5"
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
        y1="40"
        x2={playheadX}
        y2="184"
        stroke={ORANGE}
        strokeWidth="2.2"
        strokeOpacity="0.96"
      />
      <circle cx={playheadX} cy="54" r="4" fill={WHITE} />
    </svg>
  );
};

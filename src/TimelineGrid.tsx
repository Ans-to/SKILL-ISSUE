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
 * Clean, narrative-triggered Linear Keyframe Grid rendered ONLY when semantic
 * "Timing" tokens are spoken ("timing model,", "timing,").
 * Zero continuous unscripted loops — progresses once across quantized 30fps
 * keyframe ticks and dissolves cleanly back to the subtle coordinate grid.
 */
export const TimelineGrid: React.FC<LinearKeyframeGridProps> = ({
  progress,
  opacity,
  scale,
  triggerText,
  startFrame,
}) => {
  const p = clamp(progress, 0, 1);
  const playheadX = 76 + p * 744;
  const tickCount = 13;

  return (
    <svg
      data-broll-kind="math"
      data-broll-subkind="timing"
      viewBox="0 0 888 264"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        left: 96,
        width: 888,
        top: 356,
        height: 264,
        opacity: opacity * 0.9,
        transform: `scale(${scale})`,
        transformOrigin: '444px 132px',
        pointerEvents: 'none',
      }}
    >
      <rect
        x="0"
        y="0"
        width="888"
        height="264"
        rx="8"
        fill="rgba(8,12,21,.76)"
        stroke="rgba(244,247,255,.15)"
        strokeWidth="1.2"
      />

      <text
        x="32"
        y="32"
        fill={ORANGE}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        letterSpacing="2.2"
      >
        LINEAR_KEYFRAME_GRID // 30FPS_QUANTIZED [{triggerText.toUpperCase()}]
      </text>
      <text
        x="856"
        y="32"
        textAnchor="end"
        fill={MUTED}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        letterSpacing="1.8"
      >
        F{String(startFrame).padStart(4, '0')}
      </text>

      {/* Orthogonal horizontal reference rails */}
      <line x1="56" y1="68" x2="836" y2="68" stroke={WHITE} strokeOpacity="0.12" strokeWidth="1" />
      <line x1="56" y1="142" x2="836" y2="142" stroke={WHITE} strokeOpacity="0.1" strokeDasharray="4 6" strokeWidth="1" />
      <line x1="56" y1="216" x2="836" y2="216" stroke={WHITE} strokeOpacity="0.34" strokeWidth="1.4" />
      <line x1="56" y1="54" x2="56" y2="216" stroke={WHITE} strokeOpacity="0.34" strokeWidth="1.4" />

      {/* Linear quantized keyframe divisions & diamond markers */}
      {Array.from({length: tickCount}, (_, kf) => {
        const x = 76 + kf * 62;
        const isMajor = kf % 3 === 0;
        const reached = x <= playheadX + 1;
        return (
          <g key={kf}>
            <line
              x1={x}
              y1={isMajor ? 82 : 118}
              x2={x}
              y2={216}
              stroke={reached ? ORANGE : WHITE}
              strokeOpacity={reached ? 0.86 : 0.2}
              strokeWidth={isMajor ? 2.1 : 1.2}
            />
            {isMajor && (
              <>
                <rect
                  x={x - 5.5}
                  y={62.5}
                  width="11"
                  height="11"
                  transform={`rotate(45 ${x} 68)`}
                  fill={reached ? ORANGE : 'rgba(11,15,25,.9)'}
                  stroke={reached ? ORANGE : WHITE}
                  strokeOpacity={reached ? 0.95 : 0.45}
                  strokeWidth="1.4"
                />
                <text
                  x={x}
                  y="238"
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
        y1="52"
        x2={playheadX}
        y2="216"
        stroke={ORANGE}
        strokeWidth="2.2"
        strokeOpacity="0.95"
      />
      <circle cx={playheadX} cy="68" r="3.8" fill={WHITE} />
    </svg>
  );
};

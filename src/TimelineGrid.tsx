import React from 'react';
import {Micro, Panel} from './TelemetryHud';
import {
  MUTED,
  ORANGE,
  SCENE_MAP,
  SCRIPT_CUES,
  WHITE,
  cueAfter,
} from './engine/agentEngineModel';

/**
 * Isolated Payoff timeline grid inside the 760x1920 right column of <SceneContainer>.
 */
export const TimelineGrid: React.FC<{
  localFrame: number;
  globalFrame: number;
  energy: number;
}> = ({localFrame, globalFrame, energy}) => {
  const scene = SCENE_MAP.payoff;
  const activeCue =
    SCRIPT_CUES.find(
      (cue) =>
        cue.globalIndex >= scene.firstWordIndex &&
        cue.globalIndex <= scene.lastWordIndex &&
        globalFrame >= cue.startFrame &&
        globalFrame < cue.endFrame,
    ) ?? null;

  const promptCue = cueAfter('prompt', scene.firstWordIndex);
  const codeCue = cueAfter('code,', promptCue.globalIndex);
  const framesCue = cueAfter('frames,', codeCue.globalIndex);
  const mp4Cue = cueAfter('MP4.', framesCue.globalIndex);
  const stages = [
    {code: 'STAGE 01', cue: promptCue},
    {code: 'STAGE 02', cue: codeCue},
    {code: 'STAGE 03', cue: framesCue},
    {code: 'STAGE 04', cue: mp4Cue},
  ];
  const scroll = (localFrame * 9) % 210;

  return (
    <Panel
      style={{
        position: 'absolute',
        left: 36,
        right: 36,
        top: 328,
        bottom: 48,
        borderRadius: 14,
        padding: '22px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Micro accent>SEQUENCE TIMELINE // RENDER GRAPH</Micro>
        <Micro>L{String(localFrame).padStart(3, '0')} · F{String(globalFrame).padStart(4, '0')}</Micro>
      </div>

      {/* Multi-track scrolling Sequence lanes */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid rgba(244,247,255,.13)',
          background: 'rgba(5,8,15,.84)',
          position: 'relative',
          overflow: 'hidden',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {[0, 1, 2, 3, 4, 5].map((lane) => (
          <div
            key={lane}
            style={{
              height: 62,
              position: 'relative',
              borderTop: '1px solid rgba(244,247,255,.07)',
              borderBottom: '1px solid rgba(244,247,255,.07)',
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((clip) => {
              const hot = (lane + clip) % 3 === 0;
              return (
                <i
                  key={clip}
                  style={{
                    position: 'absolute',
                    left: clip * 210 - scroll + (lane % 2) * 52,
                    top: 9,
                    width: 132 + ((lane + clip) % 3) * 34,
                    height: 42,
                    border: `1px solid ${hot ? ORANGE : 'rgba(244,247,255,.2)'}`,
                    background: hot ? 'rgba(255,69,0,.22)' : 'rgba(244,247,255,.075)',
                  }}
                />
              );
            })}
          </div>
        ))}
        <i
          style={{
            position: 'absolute',
            left: '58%',
            top: 0,
            bottom: 0,
            width: 3,
            background: ORANGE,
            boxShadow: `0 0 22px ${ORANGE}`,
          }}
        />
      </div>

      {/* AST + 2x2 Quantized Frame Strip */}
      <div
        style={{
          border: `1px solid ${globalFrame >= codeCue.startFrame ? ORANGE : 'rgba(244,247,255,.15)'}`,
          background: 'rgba(8,12,21,.9)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>AST // SEQUENCE COMPILER</Micro>
          <span style={{fontFamily: 'monospace', fontSize: 11, color: MUTED}}>1080×1920 · 320PX | 1FR</span>
        </div>

        <div style={{fontFamily: 'monospace', fontSize: 14, lineHeight: 1.55}}>
          <div style={{color: ORANGE}}>{'<Sequence from={1053} durationInFrames={347}>'}</div>
          <div style={{paddingLeft: 18, color: WHITE}}>{'<PayoffScene />'}</div>
          <div style={{color: ORANGE}}>{'</Sequence>'}</div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              style={{
                height: 82,
                border: `1px solid ${globalFrame >= framesCue.startFrame ? ORANGE : 'rgba(244,247,255,.18)'}`,
                background:
                  globalFrame >= mp4Cue.startFrame
                    ? `linear-gradient(135deg, rgba(255,69,0,${0.18 + energy * 0.24}), rgba(244,247,255,.04))`
                    : 'rgba(244,247,255,.025)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'monospace',
                fontSize: 12,
                color: WHITE,
              }}
            >
              F{String(Math.max(0, globalFrame - 3 + slot)).padStart(4, '0')}
            </div>
          ))}
        </div>
      </div>

      {/* 2x2 Compiler Stage Lock Grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
        {stages.map((stage) => {
          const isCurrent = activeCue?.globalIndex === stage.cue.globalIndex;
          const isPast = globalFrame >= stage.cue.endFrame;
          return (
            <div
              key={stage.code}
              style={{
                height: 62,
                border: `1px solid ${isCurrent ? ORANGE : isPast ? 'rgba(244,247,255,.32)' : 'rgba(244,247,255,.14)'}`,
                background: isCurrent
                  ? 'rgba(255,69,0,.15)'
                  : isPast
                    ? 'rgba(244,247,255,.04)'
                    : 'rgba(8,11,19,.8)',
                padding: '0 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
              }}
            >
              <Micro accent={isCurrent || isPast}>{stage.code}</Micro>
              <span style={{fontSize: 17, fontWeight: 900, color: isCurrent || isPast ? WHITE : MUTED}}>
                {isCurrent ? stage.cue.text : isPast ? 'LOCKED' : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

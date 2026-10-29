import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Micro, Panel} from './TelemetryHud';
import {
  DURATION_FRAMES,
  MUTED,
  ORANGE,
  SCENE_MAP,
  SCENE_SEQUENCES,
  SCRIPT_CUES,
  WHITE,
  clamp,
  cueAfter,
} from './engine/agentEngineModel';

/**
 * Full-canvas (1080x1920) floating translucent Payoff compiler & linear keyframe timeline.
 * Zero unscripted repeating loops: renders the actual 6 <Sequence> spans of the composition
 * with a deterministic playhead locked to globalFrame.
 */
export const TimelineGrid: React.FC<{
  localFrame: number;
  globalFrame: number;
  energy: number;
}> = ({localFrame, globalFrame, energy}) => {
  const scene = SCENE_MAP.payoff;
  const enter = interpolate(localFrame, [0, 18], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
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
    {code: '01 // PROMPT', cue: promptCue},
    {code: '02 // CODE', cue: codeCue},
    {code: '03 // FRAMES', cue: framesCue},
    {code: '04 // MP4', cue: mp4Cue},
  ];
  const playheadPct = clamp((globalFrame / DURATION_FRAMES) * 100, 0, 100);

  return (
    <Panel
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        top: 668,
        bottom: 204,
        borderRadius: 16,
        padding: '20px 26px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transform: `translateY(${(1 - enter) * 28}px) scale(${0.97 + enter * 0.03})`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Micro accent>DETERMINISTIC SEQUENCE TIMELINE // 1547 FRAMES</Micro>
        <Micro>PLAYHEAD F{String(globalFrame).padStart(4, '0')}</Micro>
      </div>

      {/* Exact 6-Sequence Composition Track Map (zero unscripted loop) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid rgba(244,247,255,.13)',
          background: 'rgba(6,9,17,.66)',
          position: 'relative',
          overflow: 'hidden',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {SCENE_SEQUENCES.map((seq) => {
          const leftPct = (seq.from / DURATION_FRAMES) * 100;
          const widthPct = Math.max(3, (seq.durationInFrames / DURATION_FRAMES) * 100);
          const isCurrentSeq = seq.id === 'payoff';
          return (
            <div
              key={seq.id}
              style={{
                height: 46,
                position: 'relative',
                borderTop: '1px solid rgba(244,247,255,.06)',
                borderBottom: '1px solid rgba(244,247,255,.06)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: 6,
                  width: `${widthPct}%`,
                  height: 32,
                  border: `1px solid ${isCurrentSeq ? ORANGE : 'rgba(244,247,255,.24)'}`,
                  background: isCurrentSeq ? 'rgba(255,69,0,.2)' : 'rgba(244,247,255,.06)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  boxSizing: 'border-box',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  color: isCurrentSeq ? ORANGE : MUTED,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {seq.name}
              </div>
            </div>
          );
        })}
        <i
          style={{
            position: 'absolute',
            left: `${playheadPct}%`,
            top: 0,
            bottom: 0,
            width: 2.5,
            background: ORANGE,
            boxShadow: `0 0 18px ${ORANGE}`,
          }}
        />
      </div>

      {/* Floating AST + 4 Quantized Frame Strip */}
      <div
        style={{
          border: `1px solid ${globalFrame >= codeCue.startFrame ? ORANGE : 'rgba(244,247,255,.15)'}`,
          background: 'rgba(8,12,21,.68)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>AST // SEQUENCE COMPILER</Micro>
          <span style={{fontFamily: 'monospace', fontSize: 12, color: MUTED}}>1080 × 1920 · 30 FPS</span>
        </div>

        <div style={{fontFamily: 'monospace', fontSize: 15, lineHeight: 1.45}}>
          <div style={{color: ORANGE}}>{'<Sequence from={1053} durationInFrames={347}>'}</div>
          <div style={{paddingLeft: 22, color: WHITE}}>{'<PayoffScene canvas="1080x1920" />'}</div>
          <div style={{color: ORANGE}}>{'</Sequence>'}</div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12}}>
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              style={{
                height: 70,
                border: `1px solid ${globalFrame >= framesCue.startFrame ? ORANGE : 'rgba(244,247,255,.18)'}`,
                background:
                  globalFrame >= mp4Cue.startFrame
                    ? `linear-gradient(135deg, rgba(255,69,0,${0.18 + energy * 0.24}), rgba(244,247,255,.04))`
                    : 'rgba(244,247,255,.025)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'monospace',
                fontSize: 14,
                color: WHITE,
              }}
            >
              F{String(Math.max(0, globalFrame - 3 + slot)).padStart(4, '0')}
            </div>
          ))}
        </div>
      </div>

      {/* 4-Stage Pipeline Lock Strip */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12}}>
        {stages.map((stage) => {
          const isCurrent = activeCue?.globalIndex === stage.cue.globalIndex;
          const isPast = globalFrame >= stage.cue.endFrame;
          return (
            <div
              key={stage.code}
              style={{
                height: 76,
                border: `1px solid ${isCurrent ? ORANGE : isPast ? 'rgba(244,247,255,.32)' : 'rgba(244,247,255,.14)'}`,
                background: isCurrent
                  ? 'rgba(255,69,0,.16)'
                  : isPast
                    ? 'rgba(244,247,255,.045)'
                    : 'rgba(8,11,19,.55)',
                padding: '10px 14px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
              }}
            >
              <Micro accent={isCurrent || isPast} style={{fontSize: 10, letterSpacing: 1.6}}>
                {stage.code}
              </Micro>
              <span style={{fontSize: 18, fontWeight: 900, color: isCurrent || isPast ? WHITE : MUTED}}>
                {isCurrent ? stage.cue.text : isPast ? 'LOCKED' : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

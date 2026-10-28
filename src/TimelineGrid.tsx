import React from 'react';
import {spring} from 'remotion';
import {Micro, Panel} from './TelemetryHud';
import {
  FPS,
  MUTED,
  ORANGE,
  SCENE_MAP,
  SCRIPT_CUES,
  WHITE,
  clamp,
  cueIndexFor,
} from './engine/agentEngineModel';

export const TimelineGrid: React.FC<{localFrame: number; globalFrame: number; energy: number}> = ({
  localFrame,
  globalFrame,
  energy,
}) => {
  const payoffScene = SCENE_MAP.payoff;
  const promptIndex = cueIndexFor('prompt', payoffScene.firstWordIndex);
  const codeCommaIndex = cueIndexFor('code,', promptIndex);
  const codeSecondIndex = cueIndexFor('code', codeCommaIndex + 1);
  const framesCommaIndex = cueIndexFor('frames,', codeSecondIndex);
  const framesSecondIndex = cueIndexFor('frames', framesCommaIndex + 1);
  const mp4Index = cueIndexFor('MP4.', framesSecondIndex);

  const progress = clamp(localFrame / Math.max(1, payoffScene.durationInFrames - 1), 0, 1);
  const codeReached = globalFrame >= SCRIPT_CUES[codeCommaIndex].startFrame;
  const framesReached = globalFrame >= SCRIPT_CUES[framesCommaIndex].startFrame;
  const mp4Active =
    globalFrame >= SCRIPT_CUES[mp4Index].startFrame && globalFrame < SCRIPT_CUES[mp4Index].endFrame;

  const stages = [
    {id: '01', indices: [promptIndex]},
    {id: '02', indices: [codeCommaIndex, codeSecondIndex]},
    {id: '03', indices: [framesCommaIndex, framesSecondIndex]},
    {id: '04', indices: [mp4Index]},
  ];

  const scroll = localFrame * 14;

  return (
    <div style={{position: 'absolute', left: 44, right: 44, top: 590, bottom: 48, overflow: 'hidden'}}>
      <Panel
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          padding: '24px 28px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>SEQUENCE TIMELINE // DETERMINISTIC RENDER GRAPH</Micro>
          <Micro>PLAYHEAD L{String(localFrame).padStart(3, '0')} · F{String(globalFrame).padStart(4, '0')}</Micro>
        </div>

        {/* Multi-track Sequence timeline */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 440,
            overflow: 'hidden',
            border: '1px solid rgba(244,247,255,.12)',
            background: 'rgba(6,9,16,.72)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 14,
              transform: `translateX(${-scroll % 480}px)`,
              display: 'grid',
              gridTemplateRows: 'repeat(6, 1fr)',
              gap: 10,
              width: 2100,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                style={{
                  position: 'relative',
                  border: '1px solid rgba(244,247,255,.08)',
                  background: 'rgba(244,247,255,.016)',
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((slot) => {
                  const highlight = (row + slot) % 3 === 0;
                  return (
                    <i
                      key={slot}
                      style={{
                        position: 'absolute',
                        left: `${slot * 14 + row * 2}%`,
                        top: 6,
                        bottom: 6,
                        width: `${7 + (slot % 3) * 3}%`,
                        background: highlight ? 'rgba(255,69,0,.36)' : 'rgba(244,247,255,.14)',
                        borderLeft: highlight ? `2px solid ${ORANGE}` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${14 + progress * 72}%`,
              width: 2.5,
              background: ORANGE,
              boxShadow: `0 0 ${16 + energy * 18}px ${ORANGE}`,
            }}
          />
        </div>

        {/* AST Compiler & Quantized 9:16 Vertical Frame Previews */}
        <div
          style={{
            height: 360,
            border: `1px solid ${codeReached ? ORANGE : 'rgba(244,247,255,.14)'}`,
            background: codeReached ? 'rgba(6,9,15,.96)' : 'rgba(6,9,15,.45)',
            boxShadow: codeReached ? `0 0 ${24 + energy * 24}px rgba(255,69,0,.2)` : 'none',
            padding: 22,
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{color: ORANGE, fontSize: 12, letterSpacing: 2.2, fontWeight: 900}}>
              {codeReached ? 'AST // VERTICAL SEQUENCE COMPILER' : 'COMPILER // WAITING FOR CODE CUE'}
            </span>
            <span style={{color: MUTED, fontSize: 12}}>1080 × 1920 · 30 FPS</span>
          </div>

          {codeReached ? (
            <div style={{fontSize: 17, lineHeight: 1.65}}>
              <div style={{color: ORANGE}}>{'<Sequence from={f0} durationInFrames={df}>'}</div>
              <div style={{paddingLeft: 22, color: WHITE}}>{'<PayoffScene format="1080x1920" />'}</div>
              <div style={{color: ORANGE}}>{'</Sequence>'}</div>
            </div>
          ) : (
            <div style={{height: 84, border: '1px dashed rgba(244,247,255,.14)'}} />
          )}

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, height: 150}}>
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${mp4Active ? ORANGE : framesReached ? 'rgba(244,247,255,.32)' : 'rgba(244,247,255,.08)'}`,
                  background: framesReached
                    ? `linear-gradient(${135 + idx * 14}deg, rgba(255,69,0,${0.16 + idx * 0.08}), rgba(244,247,255,.06))`
                    : 'rgba(244,247,255,.015)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  color: framesReached ? WHITE : MUTED,
                }}
              >
                {framesReached ? `F${String(globalFrame - 3 + idx).padStart(4, '0')}` : '—'}
              </div>
            ))}
          </div>
        </div>

        {/* 2x2 Pipeline Stage Lock Grid */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, height: 152}}>
          {stages.map((stage) => {
            const matchedIdx = stage.indices.find(
              (idx) => globalFrame >= SCRIPT_CUES[idx].startFrame && globalFrame < SCRIPT_CUES[idx].endFrame,
            );
            const activeCue = matchedIdx !== undefined ? SCRIPT_CUES[matchedIdx] : null;
            const passed = globalFrame >= SCRIPT_CUES[stage.indices[0]].startFrame;
            const pop = activeCue
              ? spring({
                  frame: Math.max(0, globalFrame - activeCue.startFrame),
                  fps: FPS,
                  config: {damping: 10, stiffness: 180},
                })
              : 1;
            return (
              <div
                key={stage.id}
                style={{
                  border: `1px solid ${activeCue ? ORANGE : passed ? 'rgba(244,247,255,.3)' : 'rgba(244,247,255,.12)'}`,
                  background: activeCue ? 'rgba(255,69,0,.15)' : 'rgba(244,247,255,.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 22px',
                  transform: `scale(${activeCue ? 0.94 + pop * 0.06 : 1})`,
                }}
              >
                <span style={{fontFamily: 'monospace', fontSize: 12, color: passed ? ORANGE : MUTED, letterSpacing: 2}}>
                  STAGE {stage.id}
                </span>
                <span style={{fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: WHITE}}>
                  {activeCue ? activeCue.text : passed ? 'LOCKED' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

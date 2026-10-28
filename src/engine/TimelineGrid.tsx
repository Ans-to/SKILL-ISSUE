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
} from './agentEngineModel';

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

  const scroll = localFrame * 16;

  return (
    <div style={{position: 'absolute', left: 56, right: 56, top: 320, bottom: 48, overflow: 'hidden'}}>
      <Panel style={{position: 'absolute', inset: 0, borderRadius: 16, padding: '22px 28px', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Micro accent>SEQUENCE TIMELINE // DETERMINISTIC RENDER GRAPH</Micro>
          <Micro>PLAYHEAD L{String(localFrame).padStart(3, '0')} · F{String(globalFrame).padStart(4, '0')}</Micro>
        </div>

        {/* Scrolling 6-track <Sequence> block timeline */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            right: codeReached ? 490 : 28,
            top: 66,
            bottom: 92,
            overflow: 'hidden',
            border: '1px solid rgba(244,247,255,.1)',
            background: 'rgba(6,9,16,.65)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 12,
              transform: `translateX(${-scroll % 540}px)`,
              display: 'grid',
              gridTemplateRows: 'repeat(6, 1fr)',
              gap: 9,
              width: 2400,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                style={{
                  position: 'relative',
                  border: '1px solid rgba(244,247,255,.08)',
                  background: 'rgba(244,247,255,.015)',
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
                        top: 5,
                        bottom: 5,
                        width: `${7 + (slot % 3) * 3}%`,
                        background: highlight ? 'rgba(255,69,0,.34)' : 'rgba(244,247,255,.13)',
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
              left: `${18 + progress * 64}%`,
              width: 2,
              background: ORANGE,
              boxShadow: `0 0 ${14 + energy * 18}px ${ORANGE}`,
            }}
          />
        </div>

        {/* Deterministic compiler block — snaps in on "code," without unspoken script previews */}
        {codeReached && (
          <div
            style={{
              position: 'absolute',
              right: 28,
              top: 66,
              width: 440,
              bottom: 92,
              border: `1px solid ${ORANGE}`,
              background: 'rgba(6,9,15,.96)',
              boxShadow: `0 0 ${24 + energy * 24}px rgba(255,69,0,.2)`,
              padding: 20,
              boxSizing: 'border-box',
              fontFamily: 'monospace',
              fontSize: 15,
              lineHeight: 1.65,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
                <span style={{color: ORANGE, fontSize: 11, letterSpacing: 2}}>AST // SEQUENCE COMPILER</span>
                <span style={{color: MUTED, fontSize: 11}}>30 FPS</span>
              </div>
              <div style={{color: ORANGE}}>{'<Sequence from={f0} durationInFrames={df}>'}</div>
              <div style={{paddingLeft: 18, color: WHITE}}>{'<SceneFrame tick={frame} />'}</div>
              <div style={{color: ORANGE}}>{'</Sequence>'}</div>
            </div>

            {framesReached && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      height: 52,
                      border: `1px solid ${mp4Active ? ORANGE : 'rgba(244,247,255,.26)'}`,
                      background: `linear-gradient(${130 + idx * 14}deg, rgba(255,69,0,${0.14 + idx * 0.08}), rgba(244,247,255,.05))`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 10,
                      color: WHITE,
                    }}
                  >
                    F{String(globalFrame - 3 + idx).padStart(4, '0')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom 4-step pipeline bar: spoken tokens light up ONLY during their active cue interval */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            right: 28,
            bottom: 20,
            height: 54,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
          }}
        >
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
                  border: `1px solid ${activeCue ? ORANGE : passed ? 'rgba(244,247,255,.28)' : 'rgba(244,247,255,.1)'}`,
                  background: activeCue ? 'rgba(255,69,0,.14)' : 'rgba(244,247,255,.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  transform: `scale(${activeCue ? 0.94 + pop * 0.06 : 1})`,
                }}
              >
                <span style={{fontFamily: 'monospace', fontSize: 11, color: passed ? ORANGE : MUTED, letterSpacing: 2}}>
                  STAGE {stage.id}
                </span>
                <span style={{fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: WHITE}}>
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

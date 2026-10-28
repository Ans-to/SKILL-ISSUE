import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {AtmosphericOverlays, Micro, Panel, TelemetryHud} from '../TelemetryHud';
import {
  FPS,
  OBSIDIAN,
  ORANGE,
  SCENE_MAP,
  WHITE,
  cueAfter,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {SceneStage, SceneThreeCanvas} from './SceneStage';

const TwistBackground: React.FC<{broken: boolean; energy: number}> = ({broken, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: broken
          ? `radial-gradient(circle at 64% 42%, rgba(255,69,0,${0.12 + energy * 0.14}), transparent 54%)`
          : 'radial-gradient(ellipse at 64% 36%, rgba(244,247,255,.045), transparent 56%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.16,
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(244,247,255,.12) 0, rgba(244,247,255,.12) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(-45deg, rgba(255,69,0,.1) 0, rgba(255,69,0,.1) 1px, transparent 1px, transparent 48px)',
      }}
    />
  </div>
);

const TwistThreeLayer: React.FC<{localFrame: number; broken: boolean; slash: number; energy: number}> = ({
  localFrame,
  broken,
  slash,
  energy,
}) => {
  const split = broken ? slash * 1.1 : 0;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={12.6} opacity={0.38}>
      <group position={[1.9, 0.25, 0]} rotation={[0.08, Math.sin(localFrame * 0.018) * 0.14, broken ? -0.14 * slash : 0]}>
        {[-1, 0, 1].map((idx) => (
          <mesh
            key={idx}
            position={[idx * (1.55 + split * 0.65), idx * split * 0.4, -Math.abs(idx) * 0.75]}
            rotation={[0, idx * 0.12, broken ? idx * 0.22 * slash : 0]}
          >
            <boxGeometry args={[2.05, 1.35, 0.04]} />
            <meshBasicMaterial
              color={broken ? ORANGE : WHITE}
              wireframe
              transparent
              opacity={broken ? 0.34 : 0.16 + energy * 0.12}
            />
          </mesh>
        ))}
      </group>
    </SceneThreeCanvas>
  );
};

export const TwistScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.twist}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const realCue = cueAfter('Real', scene.firstWordIndex);
  const breakCue = cueAfter('break.', scene.firstWordIndex);
  const stressed = globalFrame >= realCue.startFrame;
  const broken = globalFrame >= breakCue.startFrame;
  const slash = spring({
    frame: Math.max(0, globalFrame - breakCue.startFrame),
    fps: FPS,
    config: {damping: 10, stiffness: 180},
  });
  const reveal = spring({
    frame: localFrame,
    fps: FPS,
    config: {damping: 14, stiffness: 190},
  });

  return (
    <SceneStage
      scene={scene}
      localFrame={localFrame}
      activeCue={activeCue}
      background={<TwistBackground broken={broken} energy={energy} />}
      threeD={<TwistThreeLayer localFrame={localFrame} broken={broken} slash={slash} energy={energy} />}
      typography={
        <>
          <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <TelemetryHud scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />

          {/* Upper-Right Stage: Isolated SaaS Boilerplate Surface */}
          <div
            style={{
              position: 'absolute',
              left: 468,
              right: 48,
              top: 40,
              height: 738,
              transform: `translateY(${(1 - reveal) * 20}px) scale(${0.97 + reveal * 0.03})`,
            }}
          >
            <Panel
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 14,
                padding: '24px 28px',
                boxSizing: 'border-box',
                borderColor: broken ? ORANGE : stressed ? 'rgba(255,69,0,.45)' : 'rgba(244,247,255,.16)',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>DEMO SURFACE // SAAS BOILERPLATE</Micro>
                <Micro>{broken ? 'STATE: FRACTURED' : stressed ? 'STATE: STRESS LOAD' : 'STATE: POLISHED MOCK'}</Micro>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.95fr',
                  gap: 20,
                  marginTop: 20,
                  height: 640,
                }}
              >
                <div style={{display: 'grid', gridTemplateRows: '1.15fr 0.85fr', gap: 18}}>
                  <div
                    style={{
                      border: '1px solid rgba(244,247,255,.12)',
                      background: 'rgba(244,247,255,.02)',
                      borderRadius: 10,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Micro>WEEKLY THROUGHPUT</Micro>
                    <div style={{height: 240, display: 'flex', alignItems: 'flex-end', gap: 12}}>
                      {[42, 74, 52, 91, 61, 96, 68, 82, 46, 78, 58, 92].map((height, index) => (
                        <i
                          key={index}
                          style={{
                            flex: 1,
                            height: broken ? `${Math.max(12, (height * 0.35) % 40)}%` : `${height}%`,
                            background: index % 4 === 1 ? 'rgba(255,69,0,.5)' : 'rgba(244,247,255,.2)',
                            borderRadius: '3px 3px 0 0',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      border: '1px solid rgba(244,247,255,.12)',
                      background: 'rgba(244,247,255,.02)',
                      borderRadius: 10,
                      padding: 20,
                    }}
                  >
                    <Micro>STATIC COMPONENT SLOTS</Micro>
                    {[0, 1, 2, 3].map((row) => (
                      <div key={row} style={{height: 30, marginTop: 14, display: 'flex', alignItems: 'center', gap: 12}}>
                        <i style={{width: 18, height: 18, borderRadius: 4, background: 'rgba(255,69,0,.34)'}} />
                        <i style={{width: `${44 + row * 11}%`, height: 7, background: 'rgba(244,247,255,.18)', borderRadius: 6}} />
                        <i style={{marginLeft: 'auto', width: 54, height: 7, background: 'rgba(244,247,255,.1)', borderRadius: 6}} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18}}>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
                    {[0, 1].map((idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid rgba(244,247,255,.12)',
                          background: 'rgba(244,247,255,.02)',
                          borderRadius: 10,
                          padding: 20,
                        }}
                      >
                        <Micro>{idx === 0 ? 'MOCK METRIC' : 'UPTIME'}</Micro>
                        <div style={{fontSize: 40, fontWeight: 900, marginTop: 12, color: broken ? ORANGE : WHITE}}>
                          {broken ? (idx === 0 ? 'ERR' : '0.0%') : idx === 0 ? '2,408' : '99.4%'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      border: '1px solid rgba(244,247,255,.12)',
                      background: 'rgba(244,247,255,.02)',
                      borderRadius: 10,
                      padding: 20,
                    }}
                  >
                    <Micro>SYNTHETIC CURVE</Micro>
                    <svg viewBox="0 0 500 280" style={{width: '100%', height: 340, marginTop: 12}}>
                      <path
                        d={
                          broken
                            ? 'M0 205 L110 195 L165 55 L230 245 L310 95 L400 240 L500 225'
                            : 'M0 205 C75 190 90 92 155 140 S245 224 305 110 S400 172 500 44'
                        }
                        fill="none"
                        stroke={broken ? ORANGE : 'rgba(244,247,255,.55)'}
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <svg
                viewBox="0 0 1404 738"
                preserveAspectRatio="none"
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
              >
                <path
                  d="M38 692L1366 46"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth={5 + energy * 2.5}
                  strokeLinecap="round"
                  strokeDasharray="1700"
                  strokeDashoffset={broken ? (1 - slash) * 1700 : 1700}
                  style={{filter: `drop-shadow(0 0 16px ${ORANGE})`}}
                />
              </svg>
              {broken && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 220,
                    color: 'rgba(255,69,0,.82)',
                    fontWeight: 300,
                    transform: `rotate(-14deg) scale(${0.8 + slash * 0.2})`,
                    textShadow: '0 0 42px rgba(255,69,0,.45)',
                  }}
                >
                  ×
                </div>
              )}
            </Panel>
          </div>

          {activeCue && (
            <KineticEngine key={activeCue.globalIndex} cue={activeCue} variant="twist" globalFrame={globalFrame} />
          )}
        </>
      }
    />
  );
};

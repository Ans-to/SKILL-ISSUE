import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticText} from './KineticEngine';
import {SceneStage, SceneThreeCanvas} from './SceneStage';
import {AtmosphericOverlays, Micro, Panel, TelemetryRail} from './TelemetryHud';
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
} from './agentEngineModel';

const TwistBackground: React.FC<{broken: boolean; energy: number}> = ({broken, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: broken
          ? `radial-gradient(circle at 50% 42%, rgba(255,69,0,${0.12 + energy * 0.14}), transparent 56%)`
          : 'radial-gradient(ellipse at 50% 35%, rgba(244,247,255,.045), transparent 58%)',
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
  const split = broken ? slash * 1.15 : 0;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={12.6} opacity={0.38}>
      <group rotation={[0.08, Math.sin(localFrame * 0.018) * 0.14, broken ? -0.14 * slash : 0]}>
        {[-1, 0, 1].map((idx) => (
          <mesh
            key={idx}
            position={[idx * (1.8 + split * 0.7), idx * split * 0.45, -Math.abs(idx) * 0.8]}
            rotation={[0, idx * 0.12, broken ? idx * 0.22 * slash : 0]}
          >
            <boxGeometry args={[2.3, 1.45, 0.04]} />
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

export const SceneTwistView: React.FC<{scene: SceneSpec; localFrame: number}> = ({scene, localFrame}) => {
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
          <TelemetryRail scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />

          {/* Upper Stage: Isolated SaaS Template Wireframe */}
          <div
            style={{
              position: 'absolute',
              left: 88,
              right: 88,
              top: 112,
              height: 598,
              transform: `translateY(${(1 - reveal) * 20}px) scale(${0.97 + reveal * 0.03})`,
            }}
          >
            <Panel
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                padding: '24px 30px',
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
                  gridTemplateColumns: '1.25fr 0.95fr',
                  gap: 22,
                  marginTop: 20,
                  height: 500,
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
                    <div style={{height: 175, display: 'flex', alignItems: 'flex-end', gap: 14}}>
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
                    {[0, 1, 2].map((row) => (
                      <div key={row} style={{height: 30, marginTop: 14, display: 'flex', alignItems: 'center', gap: 14}}>
                        <i style={{width: 18, height: 18, borderRadius: 4, background: 'rgba(255,69,0,.34)'}} />
                        <i style={{width: `${46 + row * 13}%`, height: 7, background: 'rgba(244,247,255,.18)', borderRadius: 6}} />
                        <i style={{marginLeft: 'auto', width: 64, height: 7, background: 'rgba(244,247,255,.1)', borderRadius: 6}} />
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
                        <div style={{fontSize: 44, fontWeight: 900, marginTop: 12, color: broken ? ORANGE : WHITE}}>
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
                    <svg viewBox="0 0 520 220" style={{width: '100%', height: 225, marginTop: 10}}>
                      <path
                        d={
                          broken
                            ? 'M0 165 L120 155 L175 45 L240 195 L320 75 L410 190 L520 180'
                            : 'M0 165 C75 150 90 72 155 110 S245 174 305 90 S410 142 520 34'
                        }
                        fill="none"
                        stroke={broken ? ORANGE : 'rgba(244,247,255,.55)'}
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Fracture slash locked to "break." */}
              <svg
                viewBox="0 0 1744 598"
                preserveAspectRatio="none"
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
              >
                <path
                  d="M44 556L1700 42"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth={5 + energy * 2.5}
                  strokeLinecap="round"
                  strokeDasharray="1950"
                  strokeDashoffset={broken ? (1 - slash) * 1950 : 1950}
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

          {/* Lower Stage: Fresh Non-Overlapping Kinetic Typography Deck */}
          {activeCue && <KineticText key={activeCue.globalIndex} cue={activeCue} variant="twist" globalFrame={globalFrame} />}
        </>
      }
    />
  );
};

export const SceneTwist: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.twist}) => {
  const localFrame = useCurrentFrame();
  return <SceneTwistView scene={scene} localFrame={localFrame} />;
};

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
          ? `radial-gradient(circle at 50% 48%, rgba(255,69,0,${0.13 + energy * 0.14}), transparent 56%)`
          : 'radial-gradient(ellipse at 50% 45%, rgba(244,247,255,.045), transparent 58%)',
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.6} opacity={0.38}>
      <group position={[0, 0.1, 0]} rotation={[0.08, Math.sin(localFrame * 0.018) * 0.14, broken ? -0.14 * slash : 0]}>
        {[-1, 0, 1].map((idx) => (
          <mesh
            key={idx}
            position={[idx * (0.4 + split * 0.45), idx * (1.35 + split * 0.55), -Math.abs(idx) * 0.7]}
            rotation={[0, idx * 0.12, broken ? idx * 0.22 * slash : 0]}
          >
            <boxGeometry args={[2.6, 1.3, 0.04]} />
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

          {/* Vertical-native SaaS Boilerplate Dashboard */}
          <div
            style={{
              position: 'absolute',
              left: 44,
              right: 44,
              top: 336,
              height: 1190,
              transform: `translateY(${(1 - reveal) * 20}px) scale(${0.97 + reveal * 0.03})`,
            }}
          >
            <Panel
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                padding: '26px 30px',
                boxSizing: 'border-box',
                borderColor: broken ? ORANGE : stressed ? 'rgba(255,69,0,.45)' : 'rgba(244,247,255,.16)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>DEMO SURFACE // SAAS BOILERPLATE</Micro>
                <Micro>{broken ? 'STATE: FRACTURED' : stressed ? 'STATE: STRESS LOAD' : 'STATE: POLISHED MOCK'}</Micro>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
                {[0, 1].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid rgba(244,247,255,.12)',
                      background: 'rgba(244,247,255,.025)',
                      borderRadius: 12,
                      padding: 22,
                    }}
                  >
                    <Micro>{idx === 0 ? 'MOCK METRIC' : 'UPTIME'}</Micro>
                    <div style={{fontSize: 52, fontWeight: 900, marginTop: 10, color: broken ? ORANGE : WHITE}}>
                      {broken ? (idx === 0 ? 'ERR' : '0.0%') : idx === 0 ? '2,408' : '99.4%'}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  border: '1px solid rgba(244,247,255,.12)',
                  background: 'rgba(244,247,255,.02)',
                  borderRadius: 12,
                  padding: 24,
                  height: 340,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Micro>WEEKLY THROUGHPUT</Micro>
                <div style={{height: 260, display: 'flex', alignItems: 'flex-end', gap: 12}}>
                  {[42, 74, 52, 91, 61, 96, 68, 82, 46, 78, 58, 92].map((height, index) => (
                    <i
                      key={index}
                      style={{
                        flex: 1,
                        height: broken ? `${Math.max(12, (height * 0.35) % 40)}%` : `${height}%`,
                        background: index % 4 === 1 ? 'rgba(255,69,0,.5)' : 'rgba(244,247,255,.2)',
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  border: '1px solid rgba(244,247,255,.12)',
                  background: 'rgba(244,247,255,.02)',
                  borderRadius: 12,
                  padding: 24,
                  height: 310,
                }}
              >
                <Micro>SYNTHETIC CURVE</Micro>
                <svg viewBox="0 0 880 230" style={{width: '100%', height: 250, marginTop: 12}}>
                  <path
                    d={
                      broken
                        ? 'M0 175 L180 165 L275 40 L390 210 L540 70 L700 205 L880 190'
                        : 'M0 175 C120 160 150 65 260 115 S420 190 520 85 S700 140 880 34'
                    }
                    fill="none"
                    stroke={broken ? ORANGE : 'rgba(244,247,255,.55)'}
                    strokeWidth="4"
                  />
                </svg>
              </div>

              <div
                style={{
                  border: '1px solid rgba(244,247,255,.12)',
                  background: 'rgba(244,247,255,.02)',
                  borderRadius: 12,
                  padding: 22,
                  flex: 1,
                }}
              >
                <Micro>STATIC COMPONENT SLOTS</Micro>
                {[0, 1, 2].map((row) => (
                  <div key={row} style={{height: 28, marginTop: 14, display: 'flex', alignItems: 'center', gap: 14}}>
                    <i style={{width: 18, height: 18, borderRadius: 4, background: 'rgba(255,69,0,.36)'}} />
                    <i style={{width: `${46 + row * 12}%`, height: 8, background: 'rgba(244,247,255,.18)', borderRadius: 6}} />
                    <i style={{marginLeft: 'auto', width: 64, height: 8, background: 'rgba(244,247,255,.1)', borderRadius: 6}} />
                  </div>
                ))}
              </div>

              <svg
                viewBox="0 0 992 1190"
                preserveAspectRatio="none"
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
              >
                <path
                  d="M36 1140L956 50"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth={6 + energy * 3}
                  strokeLinecap="round"
                  strokeDasharray="1560"
                  strokeDashoffset={broken ? (1 - slash) * 1560 : 1560}
                  style={{filter: `drop-shadow(0 0 18px ${ORANGE})`}}
                />
              </svg>
              {broken && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 250,
                    color: 'rgba(255,69,0,.84)',
                    fontWeight: 300,
                    transform: `rotate(-14deg) scale(${0.8 + slash * 0.2})`,
                    textShadow: '0 0 46px rgba(255,69,0,.48)',
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

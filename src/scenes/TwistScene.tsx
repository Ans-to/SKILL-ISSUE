import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {CRIMSON, TENSION_SPRING_CONFIG} from '../EmotionalPacing';
import {KineticEngine} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro, Panel} from '../TelemetryHud';
import {
  FPS,
  OBSIDIAN,
  ORANGE,
  SCENE_MAP,
  WHITE,
  WORD_START_FRAMES,
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
          ? `radial-gradient(circle at 50% 42%, rgba(255,69,0,${0.14 + energy * 0.14}), transparent 56%)`
          : 'radial-gradient(ellipse at 50% 40%, rgba(244,247,255,.045), transparent 58%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.14,
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(244,247,255,.12) 0, rgba(244,247,255,.12) 1px, transparent 1px, transparent 54px), repeating-linear-gradient(-45deg, rgba(255,69,0,.1) 0, rgba(255,69,0,.1) 1px, transparent 1px, transparent 54px)',
      }}
    />
  </div>
);

const TwistThreeLayer: React.FC<{scene: SceneSpec; localFrame: number; broken: boolean; slash: number; energy: number}> = ({
  scene,
  localFrame,
  broken,
  slash,
  energy,
}) => {
  const split = broken ? slash * 1.15 : 0;
  return (
    <SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.5} opacity={0.42}>
      <group position={[0, 0.5, 0]} rotation={[0.08, Math.sin(localFrame * 0.018) * 0.14, broken ? -0.14 * slash : 0]}>
        {[-1, 0, 1].map((idx) => (
          <mesh
            key={idx}
            position={[idx * (0.45 + split * 0.5), idx * (1.2 + split * 0.5), -Math.abs(idx) * 0.7]}
            rotation={[0, idx * 0.12, broken ? idx * 0.22 * slash : 0]}
          >
            <boxGeometry args={[2.85, 1.35, 0.04]} />
            <meshBasicMaterial
              color={broken ? ORANGE : WHITE}
              wireframe
              transparent
              opacity={broken ? 0.36 : 0.18 + energy * 0.12}
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
    config: TENSION_SPRING_CONFIG,
  });
  const reveal = spring({
    frame: localFrame,
    fps: FPS,
    config: TENSION_SPRING_CONFIG,
  });
  const realLocalFrame = WORD_START_FRAMES[realCue.globalIndex] - scene.from;
  const breakLocalFrame = WORD_START_FRAMES[breakCue.globalIndex] - scene.from;

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence from={realLocalFrame} durationInFrames={8} layout="none" name="twist-stress-sfx">
        <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.28} />
      </Sequence>
      <Sequence from={breakLocalFrame} durationInFrames={16} layout="none" name="twist-fracture-slash-sfx">
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.44} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<TwistBackground broken={broken} energy={energy} />}
        threeD={<TwistThreeLayer scene={scene} localFrame={localFrame} broken={broken} slash={slash} energy={energy} />}
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />

            {/* Full-Canvas Floating Translucent SaaS Wireframe */}
            <div
              style={{
                position: 'absolute',
                left: 56,
                right: 56,
                top: 172,
                height: 1080,
                transform: `translateY(${(1 - reveal) * 24}px) scale(${0.97 + reveal * 0.03})`,
              }}
            >
              <Panel
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 18,
                  padding: '28px 32px',
                  boxSizing: 'border-box',
                  borderColor: broken ? CRIMSON : stressed ? 'rgba(255,69,0,.45)' : 'rgba(244,247,255,.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>DEMO SURFACE // SAAS BOILERPLATE</Micro>
                  <Micro>{broken ? 'STATE: CRITICAL ERROR // FRACTURED' : stressed ? 'STATE: STRESS LOAD' : 'STATE: POLISHED MOCK'}</Micro>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18}}>
                  {[
                    {label: 'MOCK METRIC', ok: '2,408', err: 'ERR'},
                    {label: 'UPTIME', ok: '99.4%', err: '0.0%'},
                    {label: 'SCHEMA LOCK', ok: 'FAKE', err: 'NULL'},
                  ].map((card) => (
                    <div
                      key={card.label}
                      style={{
                        border: '1px solid rgba(244,247,255,.12)',
                        background: 'rgba(244,247,255,.025)',
                        borderRadius: 12,
                        padding: '18px 22px',
                      }}
                    >
                      <Micro style={{fontSize: 10}}>{card.label}</Micro>
                      <div style={{fontSize: 48, fontWeight: 900, marginTop: 8, color: broken ? ORANGE : WHITE}}>
                        {broken ? card.err : card.ok}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    border: '1px solid rgba(244,247,255,.12)',
                    background: 'rgba(244,247,255,.02)',
                    borderRadius: 12,
                    padding: '22px 24px',
                    height: 330,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Micro>WEEKLY THROUGHPUT</Micro>
                  <div style={{height: 255, display: 'flex', alignItems: 'flex-end', gap: 14}}>
                    {[42, 74, 52, 91, 61, 96, 68, 82, 46, 78, 58, 92, 66, 84].map((height, index) => (
                      <i
                        key={index}
                        style={{
                          flex: 1,
                          height: broken ? `${Math.max(12, (height * 0.35) % 40)}%` : `${height}%`,
                          background: index % 4 === 1 ? 'rgba(255,69,0,.52)' : 'rgba(244,247,255,.2)',
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
                    padding: '22px 24px',
                    flex: 1,
                  }}
                >
                  <Micro>SYNTHETIC CURVE</Micro>
                  <svg viewBox="0 0 880 240" style={{width: '100%', height: 265, marginTop: 12}}>
                    <path
                      d={
                        broken
                          ? 'M0 190 L180 175 L275 38 L390 222 L540 68 L700 214 L880 198'
                          : 'M0 190 C120 170 150 68 260 120 S420 205 520 88 S700 150 880 34'
                      }
                      fill="none"
                      stroke={broken ? ORANGE : 'rgba(244,247,255,.55)'}
                      strokeWidth="4"
                    />
                  </svg>
                </div>

                <svg
                  viewBox="0 0 968 1080"
                  preserveAspectRatio="none"
                  style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
                >
                  <path
                    d="M36 1044L932 36"
                    fill="none"
                    stroke={ORANGE}
                    strokeWidth={7 + energy * 3}
                    strokeLinecap="round"
                    strokeDasharray="1520"
                    strokeDashoffset={broken ? (1 - slash) * 1520 : 1520}
                    style={{filter: `drop-shadow(0 0 22px ${ORANGE})`}}
                  />
                </svg>
                {broken && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 260,
                      color: 'rgba(255,69,0,.86)',
                      fontWeight: 300,
                      transform: `rotate(-14deg) scale(${0.8 + slash * 0.2})`,
                      textShadow: '0 0 52px rgba(255,69,0,.5)',
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
    </SceneContainer>
  );
};

import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
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
          ? `radial-gradient(circle at 50% 42%, rgba(255,69,0,${0.13 + energy * 0.14}), transparent 56%)`
          : 'radial-gradient(ellipse at 50% 40%, rgba(244,247,255,.045), transparent 58%)',
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
  const split = broken ? slash * 0.85 : 0;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={14.5} opacity={0.38}>
      <group position={[0, 0.35, 0]} rotation={[0.08, Math.sin(localFrame * 0.018) * 0.14, broken ? -0.14 * slash : 0]}>
        {[-1, 0, 1].map((idx) => (
          <mesh
            key={idx}
            position={[idx * (0.28 + split * 0.32), idx * (1.25 + split * 0.5), -Math.abs(idx) * 0.7]}
            rotation={[0, idx * 0.12, broken ? idx * 0.22 * slash : 0]}
          >
            <boxGeometry args={[1.95, 1.15, 0.04]} />
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
        threeD={<TwistThreeLayer localFrame={localFrame} broken={broken} slash={slash} energy={energy} />}
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />

            {/* Right-Column SaaS Boilerplate Dashboard */}
            <div
              style={{
                position: 'absolute',
                left: 36,
                right: 36,
                top: 48,
                height: 1448,
                transform: `translateY(${(1 - reveal) * 20}px) scale(${0.97 + reveal * 0.03})`,
              }}
            >
              <Panel
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 16,
                  padding: '24px 26px',
                  boxSizing: 'border-box',
                  borderColor: broken ? ORANGE : stressed ? 'rgba(255,69,0,.45)' : 'rgba(244,247,255,.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>DEMO SURFACE // BOILERPLATE</Micro>
                  <Micro>{broken ? 'STATE: FRACTURED' : stressed ? 'STATE: STRESS' : 'STATE: MOCK'}</Micro>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                  {[0, 1].map((idx) => (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid rgba(244,247,255,.12)',
                        background: 'rgba(244,247,255,.025)',
                        borderRadius: 12,
                        padding: 20,
                      }}
                    >
                      <Micro>{idx === 0 ? 'MOCK METRIC' : 'UPTIME'}</Micro>
                      <div style={{fontSize: 46, fontWeight: 900, marginTop: 10, color: broken ? ORANGE : WHITE}}>
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
                    padding: 22,
                    height: 410,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Micro>WEEKLY THROUGHPUT</Micro>
                  <div style={{height: 325, display: 'flex', alignItems: 'flex-end', gap: 10}}>
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
                    padding: 22,
                    height: 380,
                  }}
                >
                  <Micro>SYNTHETIC CURVE</Micro>
                  <svg viewBox="0 0 620 290" style={{width: '100%', height: 315, marginTop: 12}}>
                    <path
                      d={
                        broken
                          ? 'M0 220 L126 205 L196 48 L280 264 L390 88 L502 256 L620 238'
                          : 'M0 220 C90 200 110 80 190 144 S300 236 376 108 S500 176 620 42'
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
                  {[0, 1, 2, 3].map((row) => (
                    <div key={row} style={{height: 30, marginTop: 16, display: 'flex', alignItems: 'center', gap: 12}}>
                      <i style={{width: 18, height: 18, borderRadius: 4, background: 'rgba(255,69,0,.36)'}} />
                      <i style={{width: `${42 + row * 11}%`, height: 8, background: 'rgba(244,247,255,.18)', borderRadius: 6}} />
                      <i style={{marginLeft: 'auto', width: 54, height: 8, background: 'rgba(244,247,255,.1)', borderRadius: 6}} />
                    </div>
                  ))}
                </div>

                <svg
                  viewBox="0 0 688 1448"
                  preserveAspectRatio="none"
                  style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
                >
                  <path
                    d="M32 1400L656 48"
                    fill="none"
                    stroke={ORANGE}
                    strokeWidth={6 + energy * 3}
                    strokeLinecap="round"
                    strokeDasharray="1620"
                    strokeDashoffset={broken ? (1 - slash) * 1620 : 1620}
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
                      fontSize: 220,
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
    </SceneContainer>
  );
};

import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {KineticEngine, SceneSemanticGraph} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro} from '../TelemetryHud';
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
  hashText,
  sceneSpokenCues,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {SceneStage, SceneThreeCanvas} from './SceneStage';

const HookBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => {
  const sweepX = ((localFrame * 30) % 1420) - 200;
  return (
    <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 47%, rgba(255,69,0,${0.07 + energy * 0.14}), transparent 50%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.13 + energy * 0.08,
          backgroundImage:
            'linear-gradient(rgba(244,247,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.28) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
        }}
      />
      <svg
        viewBox="0 0 1080 1920"
        preserveAspectRatio="none"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 + energy * 0.35}}
      >
        <circle cx="540" cy="900" r="410" fill="none" stroke={WHITE} strokeOpacity=".1" strokeDasharray="4 12" />
        <circle cx="540" cy="900" r="280" fill="none" stroke={ORANGE} strokeOpacity=".22" />
        <path d={`M${sweepX - 300} 900H${sweepX + 240}`} stroke={ORANGE} strokeWidth={2.6 + energy * 2.5} />
        <circle cx={sweepX + 240} cy="900" r={6.5 + energy * 5} fill={ORANGE} />
      </svg>
    </div>
  );
};

const HookThreeLayer: React.FC<{
  scene: SceneSpec;
  localFrame: number;
  activeCueId: number;
  energy: number;
}> = ({scene, localFrame, activeCueId, energy}) => {
  const spoken = sceneSpokenCues(scene, localFrame);
  const rot = localFrame * 0.012;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.5}>
      <group position={[0, 0.25, 0]} rotation={[0.16, rot, -0.05]}>
        <mesh rotation={[0.5, 0.2, rot]}>
          <torusGeometry args={[2.65, 0.014, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.32 + energy * 0.25} />
        </mesh>
        <mesh rotation={[-0.35, rot * 0.8, 0.3]}>
          <torusGeometry args={[1.82, 0.01, 8, 72]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.2 + energy * 0.18} />
        </mesh>
        {spoken.map((cue, idx) => {
          const seed = hashText(`hook:${cue.globalIndex}`);
          const angle = idx * 0.72 + (seed % 100) * 0.01;
          const radius = 1.1 + (idx % 3) * 0.52;
          const active = cue.globalIndex === activeCueId;
          return (
            <mesh
              key={cue.globalIndex}
              position={[Math.cos(angle) * radius, Math.sin(angle * 1.3) * 1.15, Math.sin(angle) * 0.85]}
            >
              <sphereGeometry args={[active ? 0.105 : 0.05, 12, 10]} />
              <meshBasicMaterial color={active ? ORANGE : WHITE} transparent opacity={active ? 0.95 : 0.34} />
            </mesh>
          );
        })}
      </group>
    </SceneThreeCanvas>
  );
};

export const HookScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.hook}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const pastedCue = cueAfter('pasted', scene.firstWordIndex);
  const templateStamp = globalFrame >= pastedCue.startFrame;
  const stampPop = spring({
    frame: Math.max(0, globalFrame - pastedCue.startFrame),
    fps: FPS,
    config: {damping: 10, stiffness: 180},
  });
  const pastedLocalFrame = WORD_START_FRAMES[pastedCue.globalIndex] - scene.from;

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence from={pastedLocalFrame} durationInFrames={14} layout="none" name="hook-clone-stamp-sfx">
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.32} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<HookBackground localFrame={localFrame} energy={energy} />}
        threeD={
          <HookThreeLayer
            scene={scene}
            localFrame={localFrame}
            activeCueId={activeCue?.globalIndex ?? -1}
            energy={energy}
          />
        }
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
            <SceneSemanticGraph
              scene={scene}
              localFrame={localFrame}
              activeCue={activeCue}
              energy={energy}
              style={{top: 190}}
            />
            {templateStamp && (
              <div
                style={{
                  position: 'absolute',
                  left: 72,
                  right: 72,
                  top: 1320,
                  height: 232,
                  border: `1.5px dashed ${ORANGE}`,
                  background: 'rgba(255,69,0,.065)',
                  backdropFilter: 'blur(8px)',
                  padding: '24px 32px',
                  boxSizing: 'border-box',
                  transform: `scale(${0.88 + stampPop * 0.12})`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>CLONE DETECTED // ZERO ENGINE</Micro>
                  <Micro>BOILERPLATE SHELL</Micro>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18}}>
                  {[0, 1, 2].map((slot) => (
                    <div
                      key={slot}
                      style={{
                        height: 118,
                        border: '1px solid rgba(244,247,255,.22)',
                        background: 'rgba(244,247,255,.035)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {activeCue && (
              <KineticEngine key={activeCue.globalIndex} cue={activeCue} variant="hook" globalFrame={globalFrame} />
            )}
          </>
        }
      />
    </SceneContainer>
  );
};

import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays} from '../TelemetryHud';
import {TimelineGrid} from '../TimelineGrid';
import {
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

const PayoffBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 58%, rgba(255,69,0,${0.06 + energy * 0.11}), transparent 54%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.13,
        backgroundImage: 'linear-gradient(90deg, rgba(244,247,255,.26) 1px, transparent 1px)',
        backgroundSize: '54px 100%',
        transform: `translateX(${-(localFrame * 3) % 54}px)`,
      }}
    />
  </div>
);

const PayoffThreeLayer: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => {
  const travel = (localFrame * 0.06) % 1.8;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.3} opacity={0.38}>
      <group position={[0, -0.35, 0]}>
        {[0, 1, 2, 3, 4].map((idx) => {
          const z = -idx * 1.8 + travel;
          const accent = idx % 2 === 0;
          return (
            <mesh key={idx} position={[0, 0, z]}>
              <boxGeometry args={[2.75, 4.5, 0.02]} />
              <meshBasicMaterial
                color={accent ? ORANGE : WHITE}
                wireframe
                transparent
                opacity={0.14 + energy * 0.16}
              />
            </mesh>
          );
        })}
      </group>
    </SceneThreeCanvas>
  );
};

export const PayoffScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.payoff}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);

  const promptCue = cueAfter('prompt', scene.firstWordIndex);
  const codeCue = cueAfter('code,', promptCue.globalIndex);
  const framesCue = cueAfter('frames,', codeCue.globalIndex);
  const mp4Cue = cueAfter('MP4.', framesCue.globalIndex);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      {[promptCue, codeCue, framesCue].map((stageCue) => (
        <Sequence
          key={stageCue.globalIndex}
          from={WORD_START_FRAMES[stageCue.globalIndex] - scene.from}
          durationInFrames={8}
          layout="none"
          name={`payoff-stage-${stageCue.globalIndex}`}
        >
          <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.28} />
        </Sequence>
      ))}
      <Sequence
        from={WORD_START_FRAMES[mp4Cue.globalIndex] - scene.from}
        durationInFrames={16}
        layout="none"
        name="payoff-mp4-lock-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.38} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<PayoffBackground localFrame={localFrame} energy={energy} />}
        threeD={<PayoffThreeLayer localFrame={localFrame} energy={energy} />}
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
            <TimelineGrid localFrame={localFrame} globalFrame={globalFrame} energy={energy} />
            {activeCue && (
              <KineticEngine
                key={activeCue.globalIndex}
                cue={activeCue}
                variant="payoff"
                globalFrame={globalFrame}
              />
            )}
          </>
        }
      />
    </SceneContainer>
  );
};

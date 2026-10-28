import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays} from '../TelemetryHud';
import {
  OBSIDIAN,
  ORANGE,
  OUTRO_BUILD_INDEX,
  SCENE_MAP,
  SCRIPT_CUES,
  WHITE,
  WORD_START_FRAMES,
  cueAfter,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {SceneStage, SceneThreeCanvas} from './SceneStage';

const OutroBackground: React.FC<{buildPhase: boolean; energy: number}> = ({buildPhase, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, rgba(255,69,0,${(buildPhase ? 0.11 : 0.055) + energy * 0.1}), transparent 44%), radial-gradient(ellipse at 50% 50%, transparent 26%, rgba(0,0,0,.92) 92%)`,
      }}
    />
    <svg
      viewBox="0 0 760 1920"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line x1="48" y1="960" x2="180" y2="960" stroke={WHITE} strokeOpacity=".16" />
      <line x1="580" y1="960" x2="712" y2="960" stroke={WHITE} strokeOpacity=".16" />
      <circle
        cx="380"
        cy="960"
        r={buildPhase ? 268 : 224}
        fill="none"
        stroke={buildPhase ? ORANGE : WHITE}
        strokeOpacity={buildPhase ? 0.3 : 0.13}
      />
    </svg>
  </div>
);

const OutroThreeLayer: React.FC<{localFrame: number; buildPhase: boolean; energy: number}> = ({
  localFrame,
  buildPhase,
  energy,
}) => {
  const spin = localFrame * 0.016;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={14.2} opacity={0.42}>
      <group position={[0, 0, 0]} rotation={[0.2, spin, 0.06]}>
        <mesh>
          <octahedronGeometry args={[buildPhase ? 1.55 : 1.28, 0]} />
          <meshBasicMaterial
            color={buildPhase ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={0.32 + energy * 0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, -spin]}>
          <torusGeometry args={[1.82, 0.012, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.28 + energy * 0.2} />
        </mesh>
      </group>
    </SceneThreeCanvas>
  );
};

export const OutroScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.outro}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const buildPhase = globalFrame >= SCRIPT_CUES[OUTRO_BUILD_INDEX].startFrame;

  const toysCue = cueAfter('toys.', scene.firstWordIndex);

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence
        from={WORD_START_FRAMES[OUTRO_BUILD_INDEX] - scene.from}
        durationInFrames={14}
        layout="none"
        name="outro-build-lock-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.36} />
      </Sequence>
      <Sequence
        from={WORD_START_FRAMES[toysCue.globalIndex] - scene.from}
        durationInFrames={14}
        layout="none"
        name="outro-toys-final-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.38} />
      </Sequence>
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<OutroBackground buildPhase={buildPhase} energy={energy} />}
        threeD={<OutroThreeLayer localFrame={localFrame} buildPhase={buildPhase} energy={energy} />}
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
            {activeCue && (
              <KineticEngine
                key={activeCue.globalIndex}
                cue={activeCue}
                variant="outro"
                globalFrame={globalFrame}
              />
            )}
          </>
        }
      />
    </SceneContainer>
  );
};

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
        background: `radial-gradient(circle at 50% 48%, rgba(255,69,0,${(buildPhase ? 0.12 : 0.06) + energy * 0.1}), transparent 44%), radial-gradient(ellipse at 50% 48%, transparent 28%, rgba(0,0,0,.92) 92%)`,
      }}
    />
    <svg
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line x1="64" y1="920" x2="260" y2="920" stroke={WHITE} strokeOpacity=".16" />
      <line x1="820" y1="920" x2="1016" y2="920" stroke={WHITE} strokeOpacity=".16" />
      <circle
        cx="540"
        cy="920"
        r={buildPhase ? 375 : 315}
        fill="none"
        stroke={buildPhase ? ORANGE : WHITE}
        strokeOpacity={buildPhase ? 0.32 : 0.14}
      />
    </svg>
  </div>
);

const OutroThreeLayer: React.FC<{scene: SceneSpec; localFrame: number; buildPhase: boolean; energy: number}> = ({
  scene,
  localFrame,
  buildPhase,
  energy,
}) => {
  const spin = localFrame * 0.018;
  return (
    <SceneThreeCanvas scene={scene} localFrame={localFrame} energy={energy} baseZ={13.2} opacity={0.44}>
      <group position={[0, 0.15, 0]} rotation={[0.2, spin, 0.06]}>
        <mesh>
          <octahedronGeometry args={[buildPhase ? 2.1 : 1.72, 0]} />
          <meshBasicMaterial
            color={buildPhase ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={0.34 + energy * 0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, -spin]}>
          <torusGeometry args={[2.72, 0.013, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.3 + energy * 0.2} />
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
        threeD={<OutroThreeLayer scene={scene} localFrame={localFrame} buildPhase={buildPhase} energy={energy} />}
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

import React from 'react';
import {useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {AtmosphericOverlays, TelemetryHud} from '../TelemetryHud';
import {
  OBSIDIAN,
  ORANGE,
  OUTRO_BUILD_INDEX,
  SCENE_MAP,
  SCRIPT_CUES,
  WHITE,
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
        background: `radial-gradient(circle at 50% 56%, rgba(255,69,0,${(buildPhase ? 0.11 : 0.055) + energy * 0.1}), transparent 42%), radial-gradient(ellipse at 50% 56%, transparent 28%, rgba(0,0,0,.92) 92%)`,
      }}
    />
    <svg
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line x1="64" y1="1090" x2="260" y2="1090" stroke={WHITE} strokeOpacity=".16" />
      <line x1="820" y1="1090" x2="1016" y2="1090" stroke={WHITE} strokeOpacity=".16" />
      <circle
        cx="540"
        cy="1090"
        r={buildPhase ? 360 : 305}
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.2} opacity={0.42}>
      <group position={[0, -0.55, 0]} rotation={[0.2, spin, 0.06]}>
        <mesh>
          <octahedronGeometry args={[buildPhase ? 2.0 : 1.65, 0]} />
          <meshBasicMaterial
            color={buildPhase ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={0.32 + energy * 0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, -spin]}>
          <torusGeometry args={[2.55, 0.013, 8, 96]} />
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

  return (
    <SceneStage
      scene={scene}
      localFrame={localFrame}
      activeCue={activeCue}
      background={<OutroBackground buildPhase={buildPhase} energy={energy} />}
      threeD={<OutroThreeLayer localFrame={localFrame} buildPhase={buildPhase} energy={energy} />}
      typography={
        <>
          <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <TelemetryHud scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
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
  );
};

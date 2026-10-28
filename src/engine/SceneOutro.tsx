import React from 'react';
import {useCurrentFrame} from 'remotion';
import {KineticText} from './KineticEngine';
import {SceneStage, SceneThreeCanvas} from './SceneStage';
import {AtmosphericOverlays, TelemetryRail} from './TelemetryHud';
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
} from './agentEngineModel';

const OutroBackground: React.FC<{buildPhase: boolean; energy: number}> = ({buildPhase, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 48%, rgba(255,69,0,${(buildPhase ? 0.1 : 0.05) + energy * 0.1}), transparent 38%), radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(0,0,0,.92) 92%)`,
      }}
    />
    <svg
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line x1="84" y1="540" x2="540" y2="540" stroke={WHITE} strokeOpacity=".15" />
      <line x1="1380" y1="540" x2="1836" y2="540" stroke={WHITE} strokeOpacity=".15" />
      <circle
        cx="960"
        cy="520"
        r={buildPhase ? 330 : 280}
        fill="none"
        stroke={buildPhase ? ORANGE : WHITE}
        strokeOpacity={buildPhase ? 0.28 : 0.12}
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={12.2} opacity={0.4}>
      <group rotation={[0.2, spin, 0.06]}>
        <mesh>
          <octahedronGeometry args={[buildPhase ? 2.05 : 1.65, 0]} />
          <meshBasicMaterial
            color={buildPhase ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={0.3 + energy * 0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, -spin]}>
          <torusGeometry args={[2.65, 0.012, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.26 + energy * 0.2} />
        </mesh>
      </group>
    </SceneThreeCanvas>
  );
};

export const SceneOutroView: React.FC<{scene: SceneSpec; localFrame: number}> = ({
  scene,
  localFrame,
}) => {
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
          <TelemetryRail scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          {activeCue && (
            <KineticText
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

export const SceneOutro: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.outro}) => {
  const localFrame = useCurrentFrame();
  return <SceneOutroView scene={scene} localFrame={localFrame} />;
};

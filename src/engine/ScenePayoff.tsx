import React from 'react';
import {useCurrentFrame} from 'remotion';
import {KineticText} from './KineticEngine';
import {SceneStage, SceneThreeCanvas} from './SceneStage';
import {AtmosphericOverlays, TelemetryRail} from './TelemetryHud';
import {TimelineGrid} from './TimelineGrid';
import {
  OBSIDIAN,
  ORANGE,
  SCENE_MAP,
  WHITE,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from './agentEngineModel';

const PayoffBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 68%, rgba(255,69,0,${0.06 + energy * 0.1}), transparent 52%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.14,
        backgroundImage: 'linear-gradient(90deg, rgba(244,247,255,.26) 1px, transparent 1px)',
        backgroundSize: '60px 100%',
        transform: `translateX(${-(localFrame * 3) % 60}px)`,
      }}
    />
  </div>
);

const PayoffThreeLayer: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => {
  const travel = (localFrame * 0.06) % 1.8;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={12.4} opacity={0.36}>
      <group position={[0, -0.45, 0]}>
        {[0, 1, 2, 3, 4].map((idx) => {
          const z = -idx * 1.8 + travel;
          const accent = idx % 2 === 0;
          return (
            <mesh key={idx} position={[0, 0, z]}>
              <boxGeometry args={[4.4, 2.45, 0.02]} />
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

export const ScenePayoffView: React.FC<{scene: SceneSpec; localFrame: number}> = ({
  scene,
  localFrame,
}) => {
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);

  return (
    <SceneStage
      scene={scene}
      localFrame={localFrame}
      activeCue={activeCue}
      background={<PayoffBackground localFrame={localFrame} energy={energy} />}
      threeD={<PayoffThreeLayer localFrame={localFrame} energy={energy} />}
      typography={
        <>
          <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <TelemetryRail scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <TimelineGrid localFrame={localFrame} globalFrame={globalFrame} energy={energy} />
          {activeCue && (
            <KineticText
              key={activeCue.globalIndex}
              cue={activeCue}
              variant="payoff"
              globalFrame={globalFrame}
            />
          )}
        </>
      }
    />
  );
};

export const ScenePayoff: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.payoff}) => {
  const localFrame = useCurrentFrame();
  return <ScenePayoffView scene={scene} localFrame={localFrame} />;
};

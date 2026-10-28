import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticEngine, SceneSemanticGraph} from '../KineticEngine';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro} from '../TelemetryHud';
import {
  FPS,
  OBSIDIAN,
  ORANGE,
  SCENE_MAP,
  WHITE,
  cueAfter,
  energyAt,
  findSceneCue,
  hashText,
  sceneSpokenCues,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {SceneStage, SceneThreeCanvas} from './SceneStage';

const HookBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => {
  const sweepX = ((localFrame * 24) % 1020) - 140;
  return (
    <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 48%, rgba(255,69,0,${0.06 + energy * 0.14}), transparent 50%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.14 + energy * 0.08,
          backgroundImage:
            'linear-gradient(rgba(244,247,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.28) 1px, transparent 1px)',
          backgroundSize: '76px 76px',
        }}
      />
      <svg
        viewBox="0 0 760 1920"
        preserveAspectRatio="none"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.48 + energy * 0.35}}
      >
        <circle cx="380" cy="930" r="290" fill="none" stroke={WHITE} strokeOpacity=".1" strokeDasharray="4 12" />
        <circle cx="380" cy="930" r="196" fill="none" stroke={ORANGE} strokeOpacity=".22" />
        <path d={`M${sweepX - 220} 930H${sweepX + 180}`} stroke={ORANGE} strokeWidth={2.5 + energy * 2.5} />
        <circle cx={sweepX + 180} cy="930" r={6 + energy * 5} fill={ORANGE} />
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={14.6}>
      <group position={[0, 0.1, 0]} rotation={[0.16, rot, -0.05]}>
        <mesh rotation={[0.5, 0.2, rot]}>
          <torusGeometry args={[1.72, 0.013, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.3 + energy * 0.25} />
        </mesh>
        <mesh rotation={[-0.35, rot * 0.8, 0.3]}>
          <torusGeometry args={[1.18, 0.01, 8, 72]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.18 + energy * 0.18} />
        </mesh>
        {spoken.map((cue, idx) => {
          const seed = hashText(`hook:${cue.globalIndex}`);
          const angle = idx * 0.72 + (seed % 100) * 0.01;
          const radius = 0.78 + (idx % 3) * 0.36;
          const active = cue.globalIndex === activeCueId;
          return (
            <mesh
              key={cue.globalIndex}
              position={[Math.cos(angle) * radius, Math.sin(angle * 1.3) * 0.9, Math.sin(angle) * 0.65]}
            >
              <sphereGeometry args={[active ? 0.088 : 0.042, 12, 10]} />
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

  return (
    <SceneContainer>
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
              style={{top: 56}}
            />
            {templateStamp && (
              <div
                style={{
                  position: 'absolute',
                  left: 36,
                  right: 36,
                  bottom: 56,
                  height: 236,
                  border: `1.5px dashed ${ORANGE}`,
                  background: 'rgba(255,69,0,.075)',
                  padding: '22px 26px',
                  boxSizing: 'border-box',
                  transform: `scale(${0.88 + stampPop * 0.12})`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>CLONE DETECTED // ZERO ENGINE</Micro>
                  <Micro>SHELL</Micro>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
                  {[0, 1, 2].map((slot) => (
                    <div
                      key={slot}
                      style={{
                        height: 120,
                        border: '1px solid rgba(244,247,255,.24)',
                        background: 'rgba(244,247,255,.04)',
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

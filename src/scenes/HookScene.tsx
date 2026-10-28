import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticEngine, SceneSemanticGraph} from '../KineticEngine';
import {AtmosphericOverlays, Micro, TelemetryHud} from '../TelemetryHud';
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
  const sweepX = ((localFrame * 28) % 1360) - 180;
  return (
    <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 54%, rgba(255,69,0,${0.06 + energy * 0.14}), transparent 48%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.14 + energy * 0.08,
          backgroundImage:
            'linear-gradient(rgba(244,247,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.28) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
        }}
      />
      <svg
        viewBox="0 0 1080 1920"
        preserveAspectRatio="none"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.48 + energy * 0.35}}
      >
        <circle cx="540" cy="1020" r="390" fill="none" stroke={WHITE} strokeOpacity=".1" strokeDasharray="4 12" />
        <circle cx="540" cy="1020" r="265" fill="none" stroke={ORANGE} strokeOpacity=".2" />
        <path d={`M${sweepX - 280} 1020H${sweepX + 220}`} stroke={ORANGE} strokeWidth={2.5 + energy * 2.5} />
        <circle cx={sweepX + 220} cy="1020" r={6 + energy * 5} fill={ORANGE} />
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.8}>
      <group position={[0, -0.35, 0]} rotation={[0.16, rot, -0.05]}>
        <mesh rotation={[0.5, 0.2, rot]}>
          <torusGeometry args={[2.55, 0.014, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.3 + energy * 0.25} />
        </mesh>
        <mesh rotation={[-0.35, rot * 0.8, 0.3]}>
          <torusGeometry args={[1.75, 0.01, 8, 72]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.18 + energy * 0.18} />
        </mesh>
        {spoken.map((cue, idx) => {
          const seed = hashText(`hook:${cue.globalIndex}`);
          const angle = idx * 0.72 + (seed % 100) * 0.01;
          const radius = 1.05 + (idx % 3) * 0.5;
          const active = cue.globalIndex === activeCueId;
          return (
            <mesh
              key={cue.globalIndex}
              position={[Math.cos(angle) * radius, Math.sin(angle * 1.3) * 1.1, Math.sin(angle) * 0.85]}
            >
              <sphereGeometry args={[active ? 0.1 : 0.048, 12, 10]} />
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
          <TelemetryHud scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <SceneSemanticGraph
            scene={scene}
            localFrame={localFrame}
            activeCue={activeCue}
            energy={energy}
            style={{top: 360}}
          />
          {templateStamp && (
            <div
              style={{
                position: 'absolute',
                left: 64,
                right: 64,
                bottom: 64,
                height: 224,
                border: `1.5px dashed ${ORANGE}`,
                background: 'rgba(255,69,0,.075)',
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
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16}}>
                {[0, 1, 2].map((slot) => (
                  <div
                    key={slot}
                    style={{
                      height: 112,
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
  );
};

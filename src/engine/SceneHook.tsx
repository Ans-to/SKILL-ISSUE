import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticText, SceneSemanticGraph} from './KineticEngine';
import {SceneStage, SceneThreeCanvas} from './SceneStage';
import {AtmosphericOverlays, Micro, TelemetryRail} from './TelemetryHud';
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
} from './agentEngineModel';

const HookBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => {
  const sweepX = ((localFrame * 42) % 2400) - 240;
  return (
    <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 68% 48%, rgba(255,69,0,${0.05 + energy * 0.12}), transparent 44%), radial-gradient(circle at 20% 50%, rgba(244,247,255,.04), transparent 50%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.14 + energy * 0.08,
          backgroundImage:
            'linear-gradient(rgba(244,247,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.28) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
        }}
      />
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 + energy * 0.35}}
      >
        <circle cx="1320" cy="520" r="290" fill="none" stroke={WHITE} strokeOpacity=".1" strokeDasharray="4 12" />
        <circle cx="1320" cy="520" r="190" fill="none" stroke={ORANGE} strokeOpacity=".18" />
        <path d={`M${sweepX - 420} 520H${sweepX + 260}`} stroke={ORANGE} strokeWidth={2.2 + energy * 2.4} />
        <circle cx={sweepX + 260} cy="520" r={5 + energy * 5} fill={ORANGE} />
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.2} offsetX={-0.6}>
      <group position={[2.2, 0.1, 0]} rotation={[0.16, rot, -0.05]}>
        <mesh rotation={[0.5, 0.2, rot]}>
          <torusGeometry args={[2.8, 0.012, 8, 96]} />
          <meshBasicMaterial color={ORANGE} transparent opacity={0.28 + energy * 0.25} />
        </mesh>
        <mesh rotation={[-0.35, rot * 0.8, 0.3]}>
          <torusGeometry args={[1.95, 0.009, 8, 72]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.18 + energy * 0.18} />
        </mesh>
        {spoken.map((cue, idx) => {
          const seed = hashText(`hook:${cue.globalIndex}`);
          const angle = idx * 0.72 + (seed % 100) * 0.01;
          const radius = 1.15 + (idx % 3) * 0.55;
          const active = cue.globalIndex === activeCueId;
          return (
            <mesh
              key={cue.globalIndex}
              position={[Math.cos(angle) * radius, Math.sin(angle * 1.3) * 0.9, Math.sin(angle) * 0.9]}
            >
              <sphereGeometry args={[active ? 0.095 : 0.045, 12, 10]} />
              <meshBasicMaterial color={active ? ORANGE : WHITE} transparent opacity={active ? 0.95 : 0.32} />
            </mesh>
          );
        })}
      </group>
    </SceneThreeCanvas>
  );
};

export const SceneHookView: React.FC<{scene: SceneSpec; localFrame: number}> = ({scene, localFrame}) => {
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
          <TelemetryRail scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <SceneSemanticGraph
            scene={scene}
            localFrame={localFrame}
            activeCue={activeCue}
            energy={energy}
            style={{right: 104, top: 118}}
          />
          {templateStamp && (
            <div
              style={{
                position: 'absolute',
                right: 104,
                bottom: 52,
                width: 440,
                height: 150,
                border: `1px dashed ${ORANGE}`,
                background: 'rgba(255,69,0,.07)',
                padding: 20,
                boxSizing: 'border-box',
                transform: `scale(${0.88 + stampPop * 0.12})`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Micro accent>CLONE DETECTED // ZERO ENGINE</Micro>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
                {[0, 1, 2].map((slot) => (
                  <div
                    key={slot}
                    style={{
                      height: 54,
                      border: '1px solid rgba(244,247,255,.22)',
                      background: 'rgba(244,247,255,.04)',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {activeCue && <KineticText key={activeCue.globalIndex} cue={activeCue} variant="hook" globalFrame={globalFrame} />}
        </>
      }
    />
  );
};

export const SceneHook: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.hook}) => {
  const localFrame = useCurrentFrame();
  return <SceneHookView scene={scene} localFrame={localFrame} />;
};

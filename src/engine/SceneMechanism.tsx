import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticText} from './KineticEngine';
import {SceneStage, SceneThreeCanvas} from './SceneStage';
import {AtmosphericOverlays, Micro, TelemetryRail} from './TelemetryHud';
import {
  FPS,
  MUTED,
  OBSIDIAN,
  ORANGE,
  SCENE_MAP,
  SCRIPT_CUES,
  WHITE,
  cueIndexFor,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from './agentEngineModel';

const MechanismBackground: React.FC<{energy: number}> = ({energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 66% 56%, rgba(255,69,0,${0.06 + energy * 0.1}), transparent 50%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.14,
        backgroundImage:
          'linear-gradient(rgba(244,247,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.35) 1px, transparent 1px), linear-gradient(rgba(244,247,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.12) 1px, transparent 1px)',
        backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
      }}
    />
  </div>
);

const MechanismThreeLayer: React.FC<{localFrame: number; activeIdx: number; energy: number}> = ({
  localFrame,
  activeIdx,
  energy,
}) => {
  const rot = localFrame * 0.01;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={12.8} opacity={0.4}>
      <group position={[2.0, -0.35, 0]} rotation={[0.25, rot, 0.08]}>
        <mesh>
          <dodecahedronGeometry args={[1.95, 0]} />
          <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.24 + energy * 0.22} />
        </mesh>
        <mesh rotation={[-rot * 1.2, 0.4, 0.2]}>
          <torusGeometry args={[2.75, 0.01, 8, 96]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.2} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((node) => {
          const angle = (node / 6) * Math.PI * 2 + rot * 0.5;
          const hot = activeIdx >= 0 && activeIdx % 6 === node;
          return (
            <mesh key={node} position={[Math.cos(angle) * 2.75, Math.sin(angle) * 1.1, Math.sin(angle) * 1.4]}>
              <octahedronGeometry args={[hot ? 0.16 : 0.08, 0]} />
              <meshBasicMaterial color={hot ? ORANGE : WHITE} wireframe={!hot} transparent opacity={hot ? 0.95 : 0.45} />
            </mesh>
          );
        })}
      </group>
    </SceneThreeCanvas>
  );
};

const PRIMITIVE_SVGS: ReadonlyArray<string> = [
  'M16 74 C52 10, 84 96, 122 38 S184 62, 232 46',
  'M24 20 H224 V76 H24 Z M64 34 H184 V62 H64 Z',
  'M20 48 H228 M52 24 V72 M100 32 V64 M148 24 V72 M196 32 V64',
  'M24 72 L124 24 L224 62 M124 14 V82 M64 48 H184',
  'M20 76 C88 76, 108 20, 228 20',
  'M20 70 H116 V26 H228',
];

export const SceneMechanismView: React.FC<{scene: SceneSpec; localFrame: number}> = ({
  scene,
  localFrame,
}) => {
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);

  const primitiveWords = [
    'physics,',
    'isolation,',
    'timing,',
    'positions,',
    'easing,',
    'transitions—',
  ];
  const primitiveIndices = primitiveWords.map((word) => cueIndexFor(word, scene.firstWordIndex));
  const definedIdx = cueIndexFor('defined', scene.firstWordIndex);
  const mathIdx = cueIndexFor('math.', definedIdx);
  const sameInputsIdx = cueIndexFor('Same inputs.', mathIdx);
  const sameFramesIdx = cueIndexFor('Same frames.', sameInputsIdx + 1);
  const noTemplateIdx = cueIndexFor('No template roulette.', sameFramesIdx + 1);

  const mathLocked = globalFrame >= SCRIPT_CUES[definedIdx].startFrame;
  const inputsLocked = globalFrame >= SCRIPT_CUES[sameInputsIdx].startFrame;
  const framesLocked = globalFrame >= SCRIPT_CUES[sameFramesIdx].startFrame;
  const noRouletteLocked = globalFrame >= SCRIPT_CUES[noTemplateIdx].startFrame;

  return (
    <SceneStage
      scene={scene}
      localFrame={localFrame}
      activeCue={activeCue}
      background={<MechanismBackground energy={energy} />}
      threeD={
        <MechanismThreeLayer
          localFrame={localFrame}
          activeIdx={activeCue?.globalIndex ?? -1}
          energy={energy}
        />
      }
      typography={
        <>
          <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          <TelemetryRail scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          {activeCue && (
            <KineticText
              key={activeCue.globalIndex}
              cue={activeCue}
              variant="mechanism"
              globalFrame={globalFrame}
            />
          )}

          {/* 6-Cell Deterministic Mathematical Primitive Matrix */}
          <div
            style={{
              position: 'absolute',
              left: 476,
              right: 56,
              top: 276,
              bottom: 132,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 18,
            }}
          >
            {primitiveIndices.map((cueIdx, cellIdx) => {
              const cue = SCRIPT_CUES[cueIdx];
              const isCurrent = globalFrame >= cue.startFrame && globalFrame < cue.endFrame;
              const isPast = globalFrame >= cue.endFrame;
              const pop = isCurrent
                ? spring({
                    frame: Math.max(0, globalFrame - cue.startFrame),
                    fps: FPS,
                    config: {damping: 10, stiffness: 180},
                  })
                : 1;
              return (
                <div
                  key={cellIdx}
                  style={{
                    border: `1px solid ${isCurrent ? ORANGE : isPast ? 'rgba(244,247,255,.3)' : 'rgba(244,247,255,.12)'}`,
                    background: isCurrent
                      ? 'rgba(255,69,0,.13)'
                      : isPast
                        ? 'rgba(14,20,33,.84)'
                        : 'rgba(8,11,19,.68)',
                    padding: '18px 22px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transform: `scale(${isCurrent ? 0.94 + pop * 0.06 : 1})`,
                    boxShadow: isCurrent ? `0 0 32px rgba(255,69,0,.22)` : 'none',
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Micro accent={isCurrent || isPast}>AXIS 0{cellIdx + 1}</Micro>
                    <span style={{fontFamily: 'monospace', fontSize: 11, color: isCurrent ? ORANGE : MUTED}}>
                      {isCurrent ? 'ACTIVE' : isPast ? 'f(t) LOCKED' : 'STANDBY'}
                    </span>
                  </div>

                  <svg viewBox="0 0 248 96" style={{width: '100%', height: 110}}>
                    <path
                      d={PRIMITIVE_SVGS[cellIdx]}
                      fill="none"
                      stroke={isCurrent ? ORANGE : isPast ? WHITE : 'rgba(244,247,255,.26)'}
                      strokeWidth={isCurrent ? 3 : 1.8}
                    />
                  </svg>

                  {/* Strictly no future-word preview and no lingering word after cue.endFrame */}
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: 1,
                      color: isCurrent ? ORANGE : isPast ? WHITE : MUTED,
                    }}
                  >
                    {isCurrent ? cue.text : isPast ? `INVARIANT_0${cellIdx + 1}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deterministic Proof Strip */}
          <div
            style={{
              position: 'absolute',
              left: 476,
              right: 56,
              bottom: 44,
              height: 68,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
            }}
          >
            {[
              {code: 'EQ // 01', active: mathLocked},
              {code: 'HASH // INPUT', active: inputsLocked},
              {code: 'HASH // FRAME', active: framesLocked},
              {code: 'ZERO ROULETTE', active: noRouletteLocked},
            ].map((badge) => (
              <div
                key={badge.code}
                style={{
                  border: `1px solid ${badge.active ? ORANGE : 'rgba(244,247,255,.14)'}`,
                  background: badge.active ? 'rgba(255,69,0,.1)' : 'rgba(8,11,19,.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 18px',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                <span style={{color: badge.active ? ORANGE : MUTED, fontWeight: 900}}>{badge.code}</span>
                <span style={{color: WHITE}}>{badge.active ? 'VERIFIED' : '—'}</span>
              </div>
            ))}
          </div>
        </>
      }
    />
  );
};

export const SceneMechanism: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.mechanism}) => {
  const localFrame = useCurrentFrame();
  return <SceneMechanismView scene={scene} localFrame={localFrame} />;
};

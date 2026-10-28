import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro} from '../TelemetryHud';
import {
  FPS,
  MUTED,
  OBSIDIAN,
  ORANGE,
  SCENE_MAP,
  SCRIPT_CUES,
  WHITE,
  WORD_START_FRAMES,
  cueIndexFor,
  energyAt,
  findSceneCue,
  type SceneSpec,
} from '../engine/agentEngineModel';
import {SceneStage, SceneThreeCanvas} from './SceneStage';

const MechanismBackground: React.FC<{energy: number}> = ({energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 54%, rgba(255,69,0,${0.06 + energy * 0.12}), transparent 52%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.14,
        backgroundImage:
          'linear-gradient(rgba(244,247,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.35) 1px, transparent 1px), linear-gradient(rgba(244,247,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.12) 1px, transparent 1px)',
        backgroundSize: '96px 96px, 96px 96px, 24px 24px, 24px 24px',
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={14.6} opacity={0.4}>
      <group position={[0, -0.35, 0]} rotation={[0.25, rot, 0.08]}>
        <mesh>
          <dodecahedronGeometry args={[1.45, 0]} />
          <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.24 + energy * 0.22} />
        </mesh>
        <mesh rotation={[-rot * 1.2, 0.4, 0.2]}>
          <torusGeometry args={[1.86, 0.011, 8, 96]} />
          <meshBasicMaterial color={WHITE} transparent opacity={0.22} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((node) => {
          const angle = (node / 6) * Math.PI * 2 + rot * 0.5;
          const hot = activeIdx >= 0 && activeIdx % 6 === node;
          return (
            <mesh key={node} position={[Math.cos(angle) * 1.75, Math.sin(angle) * 1.25, Math.sin(angle) * 1.0]}>
              <octahedronGeometry args={[hot ? 0.14 : 0.075, 0]} />
              <meshBasicMaterial color={hot ? ORANGE : WHITE} wireframe={!hot} transparent opacity={hot ? 0.95 : 0.45} />
            </mesh>
          );
        })}
      </group>
    </SceneThreeCanvas>
  );
};

const PRIMITIVE_SVGS: ReadonlyArray<string> = [
  'M16 92 C68 12, 112 118, 168 44 S256 76, 324 52',
  'M28 22 H312 V98 H28 Z M84 42 H256 V78 H84 Z',
  'M24 60 H316 M68 28 V92 M134 38 V82 M200 28 V92 M266 38 V82',
  'M28 92 L170 28 L312 78 M170 16 V104 M84 60 H256',
  'M24 96 C124 96, 152 24, 316 24',
  'M24 88 H164 V30 H316',
];

export const MechanismScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.mechanism}) => {
  const localFrame = useCurrentFrame();
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
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      <Sequence
        from={WORD_START_FRAMES[definedIdx] - scene.from}
        durationInFrames={14}
        layout="none"
        name="mechanism-math-lock-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.32} />
      </Sequence>
      <Sequence
        from={WORD_START_FRAMES[noTemplateIdx] - scene.from}
        durationInFrames={14}
        layout="none"
        name="mechanism-zero-roulette-sfx"
      >
        <Audio src={staticFile(SFX_PATHS.slashImpact)} volume={0.34} />
      </Sequence>
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
            {activeCue && (
              <KineticEngine
                key={activeCue.globalIndex}
                cue={activeCue}
                variant="mechanism"
                globalFrame={globalFrame}
              />
            )}

            {/* 2-Column x 3-Row Mathematical Primitive Matrix inside 760x1920 Right Column */}
            <div
              style={{
                position: 'absolute',
                left: 36,
                right: 36,
                top: 328,
                bottom: 204,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
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
                      border: `1px solid ${isCurrent ? ORANGE : isPast ? 'rgba(244,247,255,.32)' : 'rgba(244,247,255,.14)'}`,
                      background: isCurrent
                        ? 'rgba(255,69,0,.14)'
                        : isPast
                          ? 'rgba(14,20,33,.86)'
                          : 'rgba(8,11,19,.72)',
                      padding: '20px 20px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      transform: `scale(${isCurrent ? 0.94 + pop * 0.06 : 1})`,
                      boxShadow: isCurrent ? '0 0 34px rgba(255,69,0,.24)' : 'none',
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Micro accent={isCurrent || isPast}>AXIS 0{cellIdx + 1}</Micro>
                      <span style={{fontFamily: 'monospace', fontSize: 11, color: isCurrent ? ORANGE : MUTED}}>
                        {isCurrent ? 'ACTIVE' : isPast ? 'f(t) LOCK' : 'IDLE'}
                      </span>
                    </div>

                    <svg viewBox="0 0 340 120" style={{width: '100%', height: 150}}>
                      <path
                        d={PRIMITIVE_SVGS[cellIdx]}
                        fill="none"
                        stroke={isCurrent ? ORANGE : isPast ? WHITE : 'rgba(244,247,255,.28)'}
                        strokeWidth={isCurrent ? 3.4 : 2}
                      />
                    </svg>

                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: 0.4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        color: isCurrent ? ORANGE : isPast ? WHITE : MUTED,
                      }}
                    >
                      {isCurrent ? cue.text : isPast ? `INVARIANT_0${cellIdx + 1}` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2x2 Deterministic Proof Grid */}
            <div
              style={{
                position: 'absolute',
                left: 36,
                right: 36,
                bottom: 48,
                height: 132,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {[
                {code: 'EQ // 01', active: mathLocked},
                {code: 'HASH // IN', active: inputsLocked},
                {code: 'HASH // FRM', active: framesLocked},
                {code: 'NO ROULETTE', active: noRouletteLocked},
              ].map((badge) => (
                <div
                  key={badge.code}
                  style={{
                    border: `1px solid ${badge.active ? ORANGE : 'rgba(244,247,255,.15)'}`,
                    background: badge.active ? 'rgba(255,69,0,.11)' : 'rgba(8,11,19,.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 18px',
                    fontFamily: 'monospace',
                    fontSize: 13,
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
    </SceneContainer>
  );
};

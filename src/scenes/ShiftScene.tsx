import React from 'react';
import {Audio, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {SceneAudioBed, SFX_PATHS} from '../SceneAudio';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro} from '../TelemetryHud';
import {
  FPS,
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

const ShiftBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.18,
        backgroundImage: 'radial-gradient(rgba(244,247,255,.38) 1.3px, transparent 1.3px)',
        backgroundSize: '38px 38px',
      }}
    />
    <svg
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line
        x1="56"
        y1="860"
        x2="1024"
        y2="860"
        stroke={ORANGE}
        strokeOpacity={0.45 + energy * 0.35}
        strokeDasharray="8 10"
        strokeWidth="2.2"
      />
      <circle
        cx={96 + ((localFrame * 7) % 888)}
        cy="860"
        r={6 + energy * 4}
        fill={ORANGE}
      />
    </svg>
  </div>
);

const ShiftThreeLayer: React.FC<{localFrame: number; rightActive: boolean; energy: number}> = ({
  localFrame,
  rightActive,
  energy,
}) => {
  const spin = localFrame * 0.014;
  return (
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.6} opacity={0.42}>
      <group position={[0, 2.25, 0]} rotation={[spin * 0.7, spin, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.45, 1]} />
          <meshBasicMaterial color={WHITE} wireframe transparent opacity={0.18 + energy * 0.14} />
        </mesh>
      </group>
      <group position={[0, -2.05, 0]} rotation={[0.22, -spin * 0.9, 0.08]}>
        <mesh>
          <boxGeometry args={[2.35, 2.35, 2.35]} />
          <meshBasicMaterial
            color={rightActive ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={rightActive ? 0.44 : 0.2}
          />
        </mesh>
        <mesh rotation={[0.5, 0.5, 0]}>
          <octahedronGeometry args={[1.35, 0]} />
          <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.28 + energy * 0.22} />
        </mesh>
      </group>
    </SceneThreeCanvas>
  );
};

export const ShiftScene: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.shift}) => {
  const localFrame = useCurrentFrame();
  const globalFrame = scene.from + localFrame;
  const activeCue = findSceneCue(scene, localFrame);
  const energy = energyAt(globalFrame);
  const reveal = spring({frame: localFrame, fps: FPS, config: {damping: 14, stiffness: 200}});

  const timingIdx = cueIndexFor('timing', scene.firstWordIndex);
  const modelIdx = cueIndexFor('model,', timingIdx);
  const renderIdx = cueIndexFor('render', modelIdx);
  const graphIdx = cueIndexFor('graph,', renderIdx);
  const hardIdx = cueIndexFor('hard', graphIdx);
  const constraintsIdx = cueIndexFor('constraints', hardIdx);
  const prettyIdx = cueIndexFor('pretty', constraintsIdx);

  const inSpan = (a: number, b: number) =>
    globalFrame >= SCRIPT_CUES[a].startFrame && globalFrame < SCRIPT_CUES[b].endFrame;

  const timingHot = inSpan(timingIdx, modelIdx);
  const graphHot = inSpan(renderIdx, graphIdx);
  const constraintsHot = inSpan(hardIdx, constraintsIdx);
  const promptHot =
    globalFrame < SCRIPT_CUES[scene.firstWordIndex + 3].startFrame ||
    globalFrame >= SCRIPT_CUES[prettyIdx].startFrame;

  return (
    <SceneContainer>
      <SceneAudioBed scene={scene} />
      {[timingIdx, renderIdx, hardIdx].map((idx) => (
        <Sequence
          key={idx}
          from={WORD_START_FRAMES[idx] - scene.from}
          durationInFrames={8}
          layout="none"
          name={`shift-sys-lock-${idx}`}
        >
          <Audio src={staticFile(SFX_PATHS.clickAccent)} volume={0.28} />
        </Sequence>
      ))}
      <SceneStage
        scene={scene}
        localFrame={localFrame}
        activeCue={activeCue}
        background={<ShiftBackground localFrame={localFrame} energy={energy} />}
        threeD={
          <ShiftThreeLayer
            localFrame={localFrame}
            rightActive={timingHot || graphHot || constraintsHot}
            energy={energy}
          />
        }
        typography={
          <>
            <AtmosphericOverlays scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />

            {/* Upper Floating Wireframe: Pretty Prompt */}
            <div
              style={{
                position: 'absolute',
                left: 56,
                right: 56,
                top: 170,
                height: 528,
                border: `1px solid ${promptHot ? ORANGE : 'rgba(244,247,255,.2)'}`,
                background: 'rgba(11,15,25,.56)',
                backdropFilter: 'blur(8px)',
                padding: '24px 30px',
                boxSizing: 'border-box',
                transform: `translateY(${(1 - reveal) * -26}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT A // PRETTY PROMPT WIREFRAME</Micro>
                <Micro>UNSTRUCTURED TEXT</Micro>
              </div>

              <svg viewBox="0 0 908 380" style={{width: '100%', height: 380}}>
                <rect
                  x="16"
                  y="24"
                  width="876"
                  height="164"
                  fill="none"
                  stroke={promptHot ? ORANGE : WHITE}
                  strokeOpacity={promptHot ? 0.85 : 0.3}
                  strokeDasharray="8 6"
                  strokeWidth="1.8"
                />
                <line x1="48" y1="78" x2="660" y2="78" stroke={WHITE} strokeOpacity=".26" strokeWidth="10" />
                <line x1="48" y1="130" x2="490" y2="130" stroke={ORANGE} strokeOpacity=".44" strokeWidth="10" />
                <rect
                  x="508"
                  y="118"
                  width="12"
                  height="24"
                  fill={ORANGE}
                  opacity={Math.sin(localFrame * 0.35) > 0 ? 1 : 0.2}
                />
                <path
                  d="M454 206 V290 L770 290"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="2.2"
                  strokeDasharray="6 10"
                />
                <g transform="translate(770 290)">
                  <circle r="21" fill="none" stroke={ORANGE} strokeWidth="2.2" />
                  <path d="M-9 -9L9 9M9 -9L-9 9" stroke={ORANGE} strokeWidth="2.4" />
                </g>
                <text x="24" y="346" fill={ORANGE} fontFamily="monospace" fontSize="16" letterSpacing="3">
                  BRIDGE UNRESOLVED // {activeCue && promptHot ? activeCue.text : 'NO INFERENCE'}
                </text>
              </svg>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 12}}>
                <Micro>SURFACE SYNTAX ONLY</Micro>
                <Micro accent>NO GRAPH ACCESS</Micro>
              </div>
            </div>

            {/* Lower Floating Wireframe: Runtime Architecture */}
            <div
              style={{
                position: 'absolute',
                left: 56,
                right: 56,
                top: 1022,
                height: 676,
                border: `1px solid ${timingHot || graphHot || constraintsHot ? ORANGE : 'rgba(244,247,255,.2)'}`,
                background: 'rgba(11,15,25,.56)',
                backdropFilter: 'blur(8px)',
                padding: '24px 30px',
                boxSizing: 'border-box',
                transform: `translateY(${(1 - reveal) * 26}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT B // RUNTIME ARCHITECTURE WIREFRAME</Micro>
                <Micro>EXPLICIT CODE INVARIANTS</Micro>
              </div>

              <div style={{display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 16, flex: 1, margin: '18px 0'}}>
                <div
                  style={{
                    border: `1px solid ${timingHot ? ORANGE : 'rgba(244,247,255,.16)'}`,
                    background: timingHot ? 'rgba(255,69,0,.13)' : 'rgba(244,247,255,.02)',
                    padding: '16px 26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={timingHot}>SYS-01 // CLOCK QUANTIZER</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 30, fontWeight: 900, marginTop: 8, color: timingHot ? ORANGE : WHITE}}>
                      {timingHot && activeCue ? activeCue.text : '30.00 FPS GRID'}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 96" style={{width: 310, height: 90}}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tick) => (
                      <line
                        key={tick}
                        x1={24 + tick * 34}
                        y1={tick % 2 === 0 ? 12 : 26}
                        x2={24 + tick * 34}
                        y2={84}
                        stroke={timingHot && tick % 2 === 0 ? ORANGE : WHITE}
                        strokeOpacity={timingHot ? 0.9 : 0.3}
                        strokeWidth="2.4"
                      />
                    ))}
                    <line x1="12" y1="48" x2="308" y2="48" stroke={ORANGE} strokeOpacity=".48" />
                  </svg>
                </div>

                <div
                  style={{
                    border: `1px solid ${graphHot ? ORANGE : 'rgba(244,247,255,.16)'}`,
                    background: graphHot ? 'rgba(255,69,0,.13)' : 'rgba(244,247,255,.02)',
                    padding: '16px 26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={graphHot}>SYS-02 // DIRECTED DAG</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 30, fontWeight: 900, marginTop: 8, color: graphHot ? ORANGE : WHITE}}>
                      {graphHot && activeCue ? activeCue.text : 'NODE TOPOLOGY'}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 96" style={{width: 310, height: 90}}>
                    <path
                      d="M36 48 L124 18 L216 48 L286 20 M124 18 L124 78 L216 48 L286 76"
                      fill="none"
                      stroke={graphHot ? ORANGE : WHITE}
                      strokeOpacity={graphHot ? 0.9 : 0.32}
                      strokeWidth="2.2"
                    />
                    {[
                      [36, 48], [124, 18], [124, 78], [216, 48], [286, 20], [286, 76],
                    ].map(([cx, cy], idx) => (
                      <circle key={idx} cx={cx} cy={cy} r="6.5" fill={graphHot ? ORANGE : WHITE} />
                    ))}
                  </svg>
                </div>

                <div
                  style={{
                    border: `1px solid ${constraintsHot ? ORANGE : 'rgba(244,247,255,.16)'}`,
                    background: constraintsHot ? 'rgba(255,69,0,.13)' : 'rgba(244,247,255,.02)',
                    padding: '16px 26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={constraintsHot}>SYS-03 // INVARIANT CAGE</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 30, fontWeight: 900, marginTop: 8, color: constraintsHot ? ORANGE : WHITE}}>
                      {constraintsHot && activeCue ? activeCue.text : 'STRICT BOUNDS'}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 96" style={{width: 310, height: 90}}>
                    <rect
                      x="28"
                      y="12"
                      width="264"
                      height="72"
                      fill="none"
                      stroke={constraintsHot ? ORANGE : WHITE}
                      strokeOpacity={constraintsHot ? 0.9 : 0.32}
                      strokeWidth="2.4"
                    />
                    <rect
                      x="62"
                      y="26"
                      width="196"
                      height="44"
                      fill="none"
                      stroke={ORANGE}
                      strokeDasharray="6 6"
                      strokeOpacity={constraintsHot ? 0.88 : 0.38}
                    />
                  </svg>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 12}}>
                <Micro>EXACT ENGINE STATE</Micro>
                <Micro accent>DETERMINISTIC</Micro>
              </div>
            </div>

            {/* Full-Width Center Seam Kinetic Command Overlay */}
            {activeCue && (
              <KineticEngine key={activeCue.globalIndex} cue={activeCue} variant="shift" globalFrame={globalFrame} />
            )}
          </>
        }
      />
    </SceneContainer>
  );
};

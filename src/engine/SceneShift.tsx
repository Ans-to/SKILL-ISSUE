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

const ShiftBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(244,247,255,.025) 0%, rgba(11,15,25,.98) 49.6%, rgba(255,69,0,.18) 50%, rgba(11,15,25,.98) 50.4%, rgba(255,69,0,.03) 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.2,
        backgroundImage: 'radial-gradient(rgba(244,247,255,.38) 1.2px, transparent 1.2px)',
        backgroundSize: '36px 36px',
      }}
    />
    <svg
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line
        x1="960"
        y1="228"
        x2="960"
        y2="1032"
        stroke={ORANGE}
        strokeOpacity={0.45 + energy * 0.35}
        strokeDasharray="6 10"
        strokeWidth="2"
      />
      <circle
        cx="960"
        cy={320 + ((localFrame * 5) % 620)}
        r={5 + energy * 4}
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.0} opacity={0.44}>
      {/* Left Hemisphere: Unstructured Prompt Wireframe Sphere */}
      <group position={[-3.3, -0.55, 0]} rotation={[spin * 0.7, spin, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.45, 1]} />
          <meshBasicMaterial color={WHITE} wireframe transparent opacity={0.18 + energy * 0.14} />
        </mesh>
      </group>
      {/* Right Hemisphere: Structured Architectural Constraint Cage */}
      <group position={[3.3, -0.55, 0]} rotation={[0.22, -spin * 0.9, 0.08]}>
        <mesh>
          <boxGeometry args={[2.15, 2.15, 2.15]} />
          <meshBasicMaterial
            color={rightActive ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={rightActive ? 0.42 : 0.2}
          />
        </mesh>
        <mesh rotation={[0.5, 0.5, 0]}>
          <octahedronGeometry args={[1.25, 0]} />
          <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.28 + energy * 0.22} />
        </mesh>
      </group>
    </SceneThreeCanvas>
  );
};

export const SceneShiftView: React.FC<{scene: SceneSpec; localFrame: number}> = ({scene, localFrame}) => {
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
          <TelemetryRail scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          {activeCue && (
            <KineticText key={activeCue.globalIndex} cue={activeCue} variant="shift" globalFrame={globalFrame} />
          )}

          {/* True 50/50 Split Wireframe View */}
          <div
            style={{
              position: 'absolute',
              left: 64,
              right: 64,
              top: 236,
              bottom: 48,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 36,
            }}
          >
            {/* Left Viewport: Pretty Prompt Wireframe */}
            <div
              style={{
                border: `1px solid ${promptHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                background: 'rgba(8,12,21,.76)',
                padding: 28,
                boxSizing: 'border-box',
                transform: `translateX(${(1 - reveal) * -36}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT L // PROMPT INPUT WIREFRAME</Micro>
                <Micro>UNSTRUCTURED TEXT</Micro>
              </div>

              <svg viewBox="0 0 780 520" style={{width: '100%', height: 520}}>
                <rect
                  x="18"
                  y="24"
                  width="744"
                  height="168"
                  fill="none"
                  stroke={promptHot ? ORANGE : WHITE}
                  strokeOpacity={promptHot ? 0.8 : 0.28}
                  strokeDasharray="8 6"
                  strokeWidth="1.6"
                />
                <line x1="48" y1="74" x2="540" y2="74" stroke={WHITE} strokeOpacity=".26" strokeWidth="8" />
                <line x1="48" y1="112" x2="410" y2="112" stroke={ORANGE} strokeOpacity=".42" strokeWidth="8" />
                <rect
                  x="426"
                  y="102"
                  width="10"
                  height="22"
                  fill={ORANGE}
                  opacity={Math.sin(localFrame * 0.35) > 0 ? 1 : 0.2}
                />

                {/* Disconnected inference vector */}
                <path
                  d="M390 218 V330 L680 330"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="2"
                  strokeDasharray="6 10"
                />
                <g transform="translate(680 330)">
                  <circle r="18" fill="none" stroke={ORANGE} strokeWidth="2" />
                  <path d="M-8 -8L8 8M8 -8L-8 8" stroke={ORANGE} strokeWidth="2.2" />
                </g>

                <rect
                  x="18"
                  y="390"
                  width="744"
                  height="104"
                  fill="none"
                  stroke={WHITE}
                  strokeOpacity=".18"
                />
                <text x="42" y="435" fill={ORANGE} fontFamily="monospace" fontSize="14" letterSpacing="3">
                  SCHEMA BRIDGE // UNRESOLVED
                </text>
                <text x="42" y="466" fill={MUTED} fontFamily="monospace" fontSize="13" letterSpacing="2">
                  ACTIVE INPUT: {activeCue && promptHot ? activeCue.text : 'IDLE'}
                </text>
              </svg>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 14}}>
                <Micro>SURFACE SYNTAX ONLY</Micro>
                <Micro accent>NO GRAPH ACCESS</Micro>
              </div>
            </div>

            {/* Right Viewport: Codebase Constraints Wireframe */}
            <div
              style={{
                border: `1px solid ${timingHot || graphHot || constraintsHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                background: 'rgba(8,12,21,.76)',
                padding: 28,
                boxSizing: 'border-box',
                transform: `translateX(${(1 - reveal) * 36}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT R // RUNTIME WIREFRAME</Micro>
                <Micro>CODEBASE INVARIANTS</Micro>
              </div>

              <div style={{display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 16, height: 520, margin: '12px 0'}}>
                {/* Module 01: Timing Model Wireframe */}
                <div
                  style={{
                    border: `1px solid ${timingHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: timingHot ? 'rgba(255,69,0,.11)' : 'rgba(244,247,255,.015)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={timingHot}>SYS-01 // CLOCK QUANTIZER</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 22, fontWeight: 900, marginTop: 8, color: timingHot ? ORANGE : WHITE}}>
                      {timingHot && activeCue ? activeCue.text : '30.00 FPS GRID'}
                    </div>
                  </div>
                  <svg viewBox="0 0 280 90" style={{width: 280, height: 84}}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tick) => (
                      <line
                        key={tick}
                        x1={20 + tick * 30}
                        y1={tick % 2 === 0 ? 14 : 28}
                        x2={20 + tick * 30}
                        y2={76}
                        stroke={timingHot && tick % 2 === 0 ? ORANGE : WHITE}
                        strokeOpacity={timingHot ? 0.85 : 0.28}
                        strokeWidth="2"
                      />
                    ))}
                    <line x1="12" y1="45" x2="268" y2="45" stroke={ORANGE} strokeOpacity=".45" />
                  </svg>
                </div>

                {/* Module 02: Render Graph Wireframe */}
                <div
                  style={{
                    border: `1px solid ${graphHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: graphHot ? 'rgba(255,69,0,.11)' : 'rgba(244,247,255,.015)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={graphHot}>SYS-02 // DIRECTED DAG</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 22, fontWeight: 900, marginTop: 8, color: graphHot ? ORANGE : WHITE}}>
                      {graphHot && activeCue ? activeCue.text : 'NODE TOPOLOGY'}
                    </div>
                  </div>
                  <svg viewBox="0 0 280 90" style={{width: 280, height: 84}}>
                    <path
                      d="M32 45 L110 20 L190 45 L252 22 M110 20 L110 70 L190 45 L252 68"
                      fill="none"
                      stroke={graphHot ? ORANGE : WHITE}
                      strokeOpacity={graphHot ? 0.9 : 0.3}
                      strokeWidth="1.8"
                    />
                    {[
                      [32, 45], [110, 20], [110, 70], [190, 45], [252, 22], [252, 68],
                    ].map(([cx, cy], idx) => (
                      <circle key={idx} cx={cx} cy={cy} r="5.5" fill={graphHot ? ORANGE : WHITE} />
                    ))}
                  </svg>
                </div>

                {/* Module 03: Hard Constraints Bounding Wireframe */}
                <div
                  style={{
                    border: `1px solid ${constraintsHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: constraintsHot ? 'rgba(255,69,0,.11)' : 'rgba(244,247,255,.015)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={constraintsHot}>SYS-03 // INVARIANT CAGE</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 22, fontWeight: 900, marginTop: 8, color: constraintsHot ? ORANGE : WHITE}}>
                      {constraintsHot && activeCue ? activeCue.text : 'STRICT BOUNDS'}
                    </div>
                  </div>
                  <svg viewBox="0 0 280 90" style={{width: 280, height: 84}}>
                    <rect
                      x="30"
                      y="14"
                      width="220"
                      height="62"
                      fill="none"
                      stroke={constraintsHot ? ORANGE : WHITE}
                      strokeOpacity={constraintsHot ? 0.9 : 0.3}
                      strokeWidth="2"
                    />
                    <rect
                      x="58"
                      y="26"
                      width="164"
                      height="38"
                      fill="none"
                      stroke={ORANGE}
                      strokeDasharray="5 5"
                      strokeOpacity={constraintsHot ? 0.85 : 0.35}
                    />
                  </svg>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 14}}>
                <Micro>EXACT ENGINE STATE</Micro>
                <Micro accent>REQUIRES EXPLICIT CODE</Micro>
              </div>
            </div>
          </div>
        </>
      }
    />
  );
};

export const SceneShift: React.FC<{scene?: SceneSpec}> = ({scene = SCENE_MAP.shift}) => {
  const localFrame = useCurrentFrame();
  return <SceneShiftView scene={scene} localFrame={localFrame} />;
};

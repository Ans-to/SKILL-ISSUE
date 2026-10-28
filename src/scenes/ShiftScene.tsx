import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {AtmosphericOverlays, Micro, TelemetryHud} from '../TelemetryHud';
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
} from '../engine/agentEngineModel';
import {SceneStage, SceneThreeCanvas} from './SceneStage';

const ShiftBackground: React.FC<{localFrame: number; energy: number}> = ({localFrame, energy}) => (
  <div style={{position: 'absolute', inset: 0, background: OBSIDIAN, overflow: 'hidden'}}>
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
        x1="1170"
        y1="254"
        x2="1170"
        y2="1040"
        stroke={ORANGE}
        strokeOpacity={0.45 + energy * 0.35}
        strokeDasharray="6 10"
        strokeWidth="2"
      />
      <circle
        cx="1170"
        cy={300 + ((localFrame * 5) % 680)}
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.0} opacity={0.42}>
      <group position={[-0.5, -0.55, 0]} rotation={[spin * 0.7, spin, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.35, 1]} />
          <meshBasicMaterial color={WHITE} wireframe transparent opacity={0.18 + energy * 0.14} />
        </mesh>
      </group>
      <group position={[3.8, -0.55, 0]} rotation={[0.22, -spin * 0.9, 0.08]}>
        <mesh>
          <boxGeometry args={[2.0, 2.0, 2.0]} />
          <meshBasicMaterial
            color={rightActive ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={rightActive ? 0.42 : 0.2}
          />
        </mesh>
        <mesh rotation={[0.5, 0.5, 0]}>
          <octahedronGeometry args={[1.15, 0]} />
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
          <TelemetryHud scene={scene} localFrame={localFrame} energy={energy} activeCue={activeCue} />
          {activeCue && (
            <KineticEngine key={activeCue.globalIndex} cue={activeCue} variant="shift" globalFrame={globalFrame} />
          )}

          {/* Split Wireframe View inside Right Stage */}
          <div
            style={{
              position: 'absolute',
              left: 468,
              right: 48,
              top: 258,
              bottom: 40,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
            }}
          >
            <div
              style={{
                border: `1px solid ${promptHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                background: 'rgba(8,12,21,.78)',
                padding: 24,
                boxSizing: 'border-box',
                transform: `translateX(${(1 - reveal) * -28}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT L // PROMPT WIREFRAME</Micro>
                <Micro>UNSTRUCTURED</Micro>
              </div>

              <svg viewBox="0 0 640 500" style={{width: '100%', height: 500}}>
                <rect
                  x="16"
                  y="24"
                  width="608"
                  height="156"
                  fill="none"
                  stroke={promptHot ? ORANGE : WHITE}
                  strokeOpacity={promptHot ? 0.8 : 0.28}
                  strokeDasharray="8 6"
                  strokeWidth="1.6"
                />
                <line x1="42" y1="74" x2="460" y2="74" stroke={WHITE} strokeOpacity=".26" strokeWidth="8" />
                <line x1="42" y1="112" x2="340" y2="112" stroke={ORANGE} strokeOpacity=".42" strokeWidth="8" />
                <rect
                  x="356"
                  y="102"
                  width="10"
                  height="22"
                  fill={ORANGE}
                  opacity={Math.sin(localFrame * 0.35) > 0 ? 1 : 0.2}
                />
                <path
                  d="M320 206 V320 L560 320"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="2"
                  strokeDasharray="6 10"
                />
                <g transform="translate(560 320)">
                  <circle r="18" fill="none" stroke={ORANGE} strokeWidth="2" />
                  <path d="M-8 -8L8 8M8 -8L-8 8" stroke={ORANGE} strokeWidth="2.2" />
                </g>
                <rect x="16" y="378" width="608" height="96" fill="none" stroke={WHITE} strokeOpacity=".18" />
                <text x="38" y="420" fill={ORANGE} fontFamily="monospace" fontSize="14" letterSpacing="2.5">
                  SCHEMA BRIDGE // UNRESOLVED
                </text>
                <text x="38" y="450" fill={MUTED} fontFamily="monospace" fontSize="13" letterSpacing="2">
                  PROMPT STATE: {activeCue && promptHot ? activeCue.text : 'IDLE'}
                </text>
              </svg>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 12}}>
                <Micro>SURFACE SYNTAX</Micro>
                <Micro accent>NO GRAPH ACCESS</Micro>
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${timingHot || graphHot || constraintsHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                background: 'rgba(8,12,21,.78)',
                padding: 24,
                boxSizing: 'border-box',
                transform: `translateX(${(1 - reveal) * 28}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT R // RUNTIME WIREFRAME</Micro>
                <Micro>INVARIANTS</Micro>
              </div>

              <div style={{display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 16, height: 500, margin: '12px 0'}}>
                <div
                  style={{
                    border: `1px solid ${timingHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: timingHot ? 'rgba(255,69,0,.11)' : 'rgba(244,247,255,.015)',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={timingHot}>SYS-01 // CLOCK QUANTIZER</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 20, fontWeight: 900, marginTop: 8, color: timingHot ? ORANGE : WHITE}}>
                      {timingHot && activeCue ? activeCue.text : '30.00 FPS GRID'}
                    </div>
                  </div>
                  <svg viewBox="0 0 220 84" style={{width: 210, height: 78}}>
                    {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
                      <line
                        key={tick}
                        x1={20 + tick * 30}
                        y1={tick % 2 === 0 ? 14 : 26}
                        x2={20 + tick * 30}
                        y2={70}
                        stroke={timingHot && tick % 2 === 0 ? ORANGE : WHITE}
                        strokeOpacity={timingHot ? 0.85 : 0.28}
                        strokeWidth="2"
                      />
                    ))}
                    <line x1="10" y1="42" x2="210" y2="42" stroke={ORANGE} strokeOpacity=".45" />
                  </svg>
                </div>

                <div
                  style={{
                    border: `1px solid ${graphHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: graphHot ? 'rgba(255,69,0,.11)' : 'rgba(244,247,255,.015)',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={graphHot}>SYS-02 // DIRECTED DAG</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 20, fontWeight: 900, marginTop: 8, color: graphHot ? ORANGE : WHITE}}>
                      {graphHot && activeCue ? activeCue.text : 'NODE TOPOLOGY'}
                    </div>
                  </div>
                  <svg viewBox="0 0 220 84" style={{width: 210, height: 78}}>
                    <path
                      d="M24 42 L86 18 L150 42 L200 20 M86 18 L86 66 L150 42 L200 64"
                      fill="none"
                      stroke={graphHot ? ORANGE : WHITE}
                      strokeOpacity={graphHot ? 0.9 : 0.3}
                      strokeWidth="1.8"
                    />
                    {[
                      [24, 42], [86, 18], [86, 66], [150, 42], [200, 20], [200, 64],
                    ].map(([cx, cy], idx) => (
                      <circle key={idx} cx={cx} cy={cy} r="5" fill={graphHot ? ORANGE : WHITE} />
                    ))}
                  </svg>
                </div>

                <div
                  style={{
                    border: `1px solid ${constraintsHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: constraintsHot ? 'rgba(255,69,0,.11)' : 'rgba(244,247,255,.015)',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={constraintsHot}>SYS-03 // INVARIANT CAGE</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 20, fontWeight: 900, marginTop: 8, color: constraintsHot ? ORANGE : WHITE}}>
                      {constraintsHot && activeCue ? activeCue.text : 'STRICT BOUNDS'}
                    </div>
                  </div>
                  <svg viewBox="0 0 220 84" style={{width: 210, height: 78}}>
                    <rect
                      x="22"
                      y="14"
                      width="176"
                      height="56"
                      fill="none"
                      stroke={constraintsHot ? ORANGE : WHITE}
                      strokeOpacity={constraintsHot ? 0.9 : 0.3}
                      strokeWidth="2"
                    />
                    <rect
                      x="46"
                      y="25"
                      width="128"
                      height="34"
                      fill="none"
                      stroke={ORANGE}
                      strokeDasharray="5 5"
                      strokeOpacity={constraintsHot ? 0.85 : 0.35}
                    />
                  </svg>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 12}}>
                <Micro>EXACT ENGINE STATE</Micro>
                <Micro accent>EXPLICIT CODE ONLY</Micro>
              </div>
            </div>
          </div>
        </>
      }
    />
  );
};

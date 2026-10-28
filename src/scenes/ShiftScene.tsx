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
        backgroundImage: 'radial-gradient(rgba(244,247,255,.38) 1.3px, transparent 1.3px)',
        backgroundSize: '36px 36px',
      }}
    />
    <svg
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line
        x1="44"
        y1="1136"
        x2="1036"
        y2="1136"
        stroke={ORANGE}
        strokeOpacity={0.5 + energy * 0.35}
        strokeDasharray="8 10"
        strokeWidth="2.2"
      />
      <circle
        cx={90 + ((localFrame * 6) % 900)}
        cy="1136"
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={13.8} opacity={0.42}>
      <group position={[0, 1.3, 0]} rotation={[spin * 0.7, spin, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.35, 1]} />
          <meshBasicMaterial color={WHITE} wireframe transparent opacity={0.18 + energy * 0.14} />
        </mesh>
      </group>
      <group position={[0, -2.55, 0]} rotation={[0.22, -spin * 0.9, 0.08]}>
        <mesh>
          <boxGeometry args={[2.25, 2.25, 2.25]} />
          <meshBasicMaterial
            color={rightActive ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={rightActive ? 0.44 : 0.2}
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

          {/* Stacked 9:16 Split Wireframe Viewports */}
          <div
            style={{
              position: 'absolute',
              left: 44,
              right: 44,
              top: 582,
              bottom: 48,
              display: 'grid',
              gridTemplateRows: '0.82fr 1.18fr',
              gap: 32,
            }}
          >
            {/* Top Viewport: Pretty Prompt Wireframe */}
            <div
              style={{
                border: `1px solid ${promptHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                background: 'rgba(8,12,21,.78)',
                padding: '22px 28px',
                boxSizing: 'border-box',
                transform: `translateY(${(1 - reveal) * -24}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT A // PRETTY PROMPT WIREFRAME</Micro>
                <Micro>UNSTRUCTURED TEXT</Micro>
              </div>

              <svg viewBox="0 0 920 360" style={{width: '100%', height: 360}}>
                <rect
                  x="16"
                  y="20"
                  width="888"
                  height="148"
                  fill="none"
                  stroke={promptHot ? ORANGE : WHITE}
                  strokeOpacity={promptHot ? 0.85 : 0.3}
                  strokeDasharray="8 6"
                  strokeWidth="1.8"
                />
                <line x1="46" y1="68" x2="640" y2="68" stroke={WHITE} strokeOpacity=".26" strokeWidth="10" />
                <line x1="46" y1="112" x2="480" y2="112" stroke={ORANGE} strokeOpacity=".44" strokeWidth="10" />
                <rect
                  x="498"
                  y="100"
                  width="12"
                  height="24"
                  fill={ORANGE}
                  opacity={Math.sin(localFrame * 0.35) > 0 ? 1 : 0.2}
                />
                <path
                  d="M460 184 V264 L780 264"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="2.2"
                  strokeDasharray="6 10"
                />
                <g transform="translate(780 264)">
                  <circle r="20" fill="none" stroke={ORANGE} strokeWidth="2.2" />
                  <path d="M-9 -9L9 9M9 -9L-9 9" stroke={ORANGE} strokeWidth="2.4" />
                </g>
                <text x="24" y="324" fill={ORANGE} fontFamily="monospace" fontSize="16" letterSpacing="3">
                  SCHEMA BRIDGE // UNRESOLVED · {activeCue && promptHot ? activeCue.text : 'NO INFERENCE'}
                </text>
              </svg>

              <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 12}}>
                <Micro>SURFACE SYNTAX ONLY</Micro>
                <Micro accent>NO GRAPH ACCESS</Micro>
              </div>
            </div>

            {/* Bottom Viewport: Codebase Constraints Wireframe */}
            <div
              style={{
                border: `1px solid ${timingHot || graphHot || constraintsHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                background: 'rgba(8,12,21,.78)',
                padding: '22px 28px',
                boxSizing: 'border-box',
                transform: `translateY(${(1 - reveal) * 24}px)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Micro accent>VIEWPORT B // RUNTIME ARCHITECTURE WIREFRAME</Micro>
                <Micro>INVARIANTS</Micro>
              </div>

              <div style={{display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 18, flex: 1, margin: '18px 0'}}>
                <div
                  style={{
                    border: `1px solid ${timingHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: timingHot ? 'rgba(255,69,0,.12)' : 'rgba(244,247,255,.018)',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={timingHot}>SYS-01 // CLOCK QUANTIZER</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 28, fontWeight: 900, marginTop: 10, color: timingHot ? ORANGE : WHITE}}>
                      {timingHot && activeCue ? activeCue.text : '30.00 FPS GRID'}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 100" style={{width: 310, height: 96}}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tick) => (
                      <line
                        key={tick}
                        x1={24 + tick * 34}
                        y1={tick % 2 === 0 ? 14 : 28}
                        x2={24 + tick * 34}
                        y2={86}
                        stroke={timingHot && tick % 2 === 0 ? ORANGE : WHITE}
                        strokeOpacity={timingHot ? 0.9 : 0.3}
                        strokeWidth="2.4"
                      />
                    ))}
                    <line x1="12" y1="50" x2="308" y2="50" stroke={ORANGE} strokeOpacity=".48" />
                  </svg>
                </div>

                <div
                  style={{
                    border: `1px solid ${graphHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: graphHot ? 'rgba(255,69,0,.12)' : 'rgba(244,247,255,.018)',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={graphHot}>SYS-02 // DIRECTED DAG</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 28, fontWeight: 900, marginTop: 10, color: graphHot ? ORANGE : WHITE}}>
                      {graphHot && activeCue ? activeCue.text : 'NODE TOPOLOGY'}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 100" style={{width: 310, height: 96}}>
                    <path
                      d="M36 50 L124 20 L216 50 L286 22 M124 20 L124 80 L216 50 L286 78"
                      fill="none"
                      stroke={graphHot ? ORANGE : WHITE}
                      strokeOpacity={graphHot ? 0.9 : 0.32}
                      strokeWidth="2.2"
                    />
                    {[
                      [36, 50], [124, 20], [124, 80], [216, 50], [286, 22], [286, 78],
                    ].map(([cx, cy], idx) => (
                      <circle key={idx} cx={cx} cy={cy} r="6.5" fill={graphHot ? ORANGE : WHITE} />
                    ))}
                  </svg>
                </div>

                <div
                  style={{
                    border: `1px solid ${constraintsHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                    background: constraintsHot ? 'rgba(255,69,0,.12)' : 'rgba(244,247,255,.018)',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Micro accent={constraintsHot}>SYS-03 // INVARIANT CAGE</Micro>
                    <div style={{fontFamily: 'monospace', fontSize: 28, fontWeight: 900, marginTop: 10, color: constraintsHot ? ORANGE : WHITE}}>
                      {constraintsHot && activeCue ? activeCue.text : 'STRICT BOUNDS'}
                    </div>
                  </div>
                  <svg viewBox="0 0 320 100" style={{width: 310, height: 96}}>
                    <rect
                      x="28"
                      y="14"
                      width="264"
                      height="72"
                      fill="none"
                      stroke={constraintsHot ? ORANGE : WHITE}
                      strokeOpacity={constraintsHot ? 0.9 : 0.32}
                      strokeWidth="2.4"
                    />
                    <rect
                      x="62"
                      y="28"
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
                <Micro accent>EXPLICIT CODE ONLY</Micro>
              </div>
            </div>
          </div>
        </>
      }
    />
  );
};

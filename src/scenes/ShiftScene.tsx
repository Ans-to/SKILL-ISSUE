import React from 'react';
import {spring, useCurrentFrame} from 'remotion';
import {KineticEngine} from '../KineticEngine';
import {SceneContainer} from '../SceneContainer';
import {AtmosphericOverlays, Micro} from '../TelemetryHud';
import {
  FPS,
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
      viewBox="0 0 760 1920"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
    >
      <line
        x1="36"
        y1="978"
        x2="724"
        y2="978"
        stroke={ORANGE}
        strokeOpacity={0.5 + energy * 0.35}
        strokeDasharray="8 10"
        strokeWidth="2.2"
      />
      <circle
        cx={64 + ((localFrame * 5) % 632)}
        cy="978"
        r={5.5 + energy * 3.5}
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
    <SceneThreeCanvas localFrame={localFrame} energy={energy} baseZ={14.6} opacity={0.4}>
      <group position={[0, 1.55, 0]} rotation={[spin * 0.7, spin, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.15, 1]} />
          <meshBasicMaterial color={WHITE} wireframe transparent opacity={0.18 + energy * 0.14} />
        </mesh>
      </group>
      <group position={[0, -2.15, 0]} rotation={[0.22, -spin * 0.9, 0.08]}>
        <mesh>
          <boxGeometry args={[1.75, 1.75, 1.75]} />
          <meshBasicMaterial
            color={rightActive ? ORANGE : WHITE}
            wireframe
            transparent
            opacity={rightActive ? 0.44 : 0.2}
          />
        </mesh>
        <mesh rotation={[0.5, 0.5, 0]}>
          <octahedronGeometry args={[1.05, 0]} />
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
            {activeCue && (
              <KineticEngine key={activeCue.globalIndex} cue={activeCue} variant="shift" globalFrame={globalFrame} />
            )}

            {/* Stacked Split Wireframe Viewports in 760x1920 Right Column */}
            <div
              style={{
                position: 'absolute',
                left: 36,
                right: 36,
                top: 328,
                bottom: 48,
                display: 'grid',
                gridTemplateRows: '0.78fr 1.22fr',
                gap: 32,
              }}
            >
              {/* Top Viewport: Pretty Prompt Wireframe */}
              <div
                style={{
                  border: `1px solid ${promptHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                  background: 'rgba(8,12,21,.8)',
                  padding: '22px 24px',
                  boxSizing: 'border-box',
                  transform: `translateY(${(1 - reveal) * -22}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>VIEWPORT A // PRETTY PROMPT</Micro>
                  <Micro>TEXT ONLY</Micro>
                </div>

                <svg viewBox="0 0 640 420" style={{width: '100%', height: 420}}>
                  <rect
                    x="14"
                    y="24"
                    width="612"
                    height="172"
                    fill="none"
                    stroke={promptHot ? ORANGE : WHITE}
                    strokeOpacity={promptHot ? 0.85 : 0.3}
                    strokeDasharray="8 6"
                    strokeWidth="1.8"
                  />
                  <line x1="40" y1="78" x2="460" y2="78" stroke={WHITE} strokeOpacity=".26" strokeWidth="10" />
                  <line x1="40" y1="130" x2="340" y2="130" stroke={ORANGE} strokeOpacity=".44" strokeWidth="10" />
                  <rect
                    x="358"
                    y="118"
                    width="12"
                    height="24"
                    fill={ORANGE}
                    opacity={Math.sin(localFrame * 0.35) > 0 ? 1 : 0.2}
                  />
                  <path
                    d="M320 212 V302 L540 302"
                    fill="none"
                    stroke={ORANGE}
                    strokeWidth="2.2"
                    strokeDasharray="6 10"
                  />
                  <g transform="translate(540 302)">
                    <circle r="20" fill="none" stroke={ORANGE} strokeWidth="2.2" />
                    <path d="M-9 -9L9 9M9 -9L-9 9" stroke={ORANGE} strokeWidth="2.4" />
                  </g>
                  <text x="18" y="376" fill={ORANGE} fontFamily="monospace" fontSize="14" letterSpacing="2.4">
                    SCHEMA BRIDGE // {activeCue && promptHot ? activeCue.text : 'NO INFERENCE'}
                  </text>
                </svg>

                <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(244,247,255,.12)', paddingTop: 12}}>
                  <Micro>SURFACE SYNTAX</Micro>
                  <Micro accent>NO GRAPH ACCESS</Micro>
                </div>
              </div>

              {/* Bottom Viewport: Codebase Constraints Wireframe */}
              <div
                style={{
                  border: `1px solid ${timingHot || graphHot || constraintsHot ? ORANGE : 'rgba(244,247,255,.24)'}`,
                  background: 'rgba(8,12,21,.8)',
                  padding: '22px 24px',
                  boxSizing: 'border-box',
                  transform: `translateY(${(1 - reveal) * 22}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Micro accent>VIEWPORT B // ENGINE ARCHITECTURE</Micro>
                  <Micro>INVARIANTS</Micro>
                </div>

                <div style={{display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 18, flex: 1, margin: '18px 0'}}>
                  <div
                    style={{
                      border: `1px solid ${timingHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                      background: timingHot ? 'rgba(255,69,0,.12)' : 'rgba(244,247,255,.018)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div>
                      <Micro accent={timingHot}>SYS-01 // CLOCK QUANTIZER</Micro>
                      <div style={{fontFamily: 'monospace', fontSize: 25, fontWeight: 900, marginTop: 10, color: timingHot ? ORANGE : WHITE}}>
                        {timingHot && activeCue ? activeCue.text : '30.00 FPS GRID'}
                      </div>
                    </div>
                    <svg viewBox="0 0 240 100" style={{width: 220, height: 96, flexShrink: 0}}>
                      {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
                        <line
                          key={tick}
                          x1={22 + tick * 32}
                          y1={tick % 2 === 0 ? 14 : 28}
                          x2={22 + tick * 32}
                          y2={86}
                          stroke={timingHot && tick % 2 === 0 ? ORANGE : WHITE}
                          strokeOpacity={timingHot ? 0.9 : 0.3}
                          strokeWidth="2.4"
                        />
                      ))}
                      <line x1="10" y1="50" x2="230" y2="50" stroke={ORANGE} strokeOpacity=".48" />
                    </svg>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${graphHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                      background: graphHot ? 'rgba(255,69,0,.12)' : 'rgba(244,247,255,.018)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div>
                      <Micro accent={graphHot}>SYS-02 // DIRECTED DAG</Micro>
                      <div style={{fontFamily: 'monospace', fontSize: 25, fontWeight: 900, marginTop: 10, color: graphHot ? ORANGE : WHITE}}>
                        {graphHot && activeCue ? activeCue.text : 'NODE TOPOLOGY'}
                      </div>
                    </div>
                    <svg viewBox="0 0 240 100" style={{width: 220, height: 96, flexShrink: 0}}>
                      <path
                        d="M28 50 L96 20 L166 50 L216 22 M96 20 L96 80 L166 50 L216 78"
                        fill="none"
                        stroke={graphHot ? ORANGE : WHITE}
                        strokeOpacity={graphHot ? 0.9 : 0.32}
                        strokeWidth="2.2"
                      />
                      {[
                        [28, 50], [96, 20], [96, 80], [166, 50], [216, 22], [216, 78],
                      ].map(([cx, cy], idx) => (
                        <circle key={idx} cx={cx} cy={cy} r="6" fill={graphHot ? ORANGE : WHITE} />
                      ))}
                    </svg>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${constraintsHot ? ORANGE : 'rgba(244,247,255,.18)'}`,
                      background: constraintsHot ? 'rgba(255,69,0,.12)' : 'rgba(244,247,255,.018)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div>
                      <Micro accent={constraintsHot}>SYS-03 // INVARIANT CAGE</Micro>
                      <div style={{fontFamily: 'monospace', fontSize: 25, fontWeight: 900, marginTop: 10, color: constraintsHot ? ORANGE : WHITE}}>
                        {constraintsHot && activeCue ? activeCue.text : 'STRICT BOUNDS'}
                      </div>
                    </div>
                    <svg viewBox="0 0 240 100" style={{width: 220, height: 96, flexShrink: 0}}>
                      <rect
                        x="22"
                        y="14"
                        width="196"
                        height="72"
                        fill="none"
                        stroke={constraintsHot ? ORANGE : WHITE}
                        strokeOpacity={constraintsHot ? 0.9 : 0.32}
                        strokeWidth="2.4"
                      />
                      <rect
                        x="48"
                        y="28"
                        width="144"
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
    </SceneContainer>
  );
};

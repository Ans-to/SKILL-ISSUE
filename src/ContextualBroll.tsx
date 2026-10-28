import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {
  FPS,
  ORANGE,
  OUTRO_CUT_FRAME,
  SCENE_SEQUENCES,
  SCRIPT_CUES,
  WHITE,
  clamp,
  isSceneCleared,
  normalize,
  type SceneKey,
  type SceneSpec,
} from './engine/agentEngineModel';

export type BrollKind = 'neural' | 'syntax' | 'orbital';

export type BrollBurstSpec = {
  id: string;
  sceneId: SceneKey;
  kind: BrollKind;
  triggerWordIndex: number;
  secondaryWordIndex: number | null;
  triggerText: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
};

export type ActiveBrollBurst = BrollBurstSpec & {
  elapsedFrames: number;
  progress: number;
  opacity: number;
  scale: number;
  pulseBoost: number;
};

/**
 * Classifies narration keywords into contextual holographic B-roll archetypes:
 * - "AI" / "Agent" -> 'neural' (Holographic neural net / pulsing brain wireframe)
 * - "Codebase" / "Prompt" / "Code" -> 'syntax' (Matrix terminal cascade / syntax tree flash)
 * - "Servers" / "Engine" -> 'orbital' (Rotating orbital server nodes / data rings)
 */
export const classifyBrollKeyword = (rawWord: string): BrollKind | null => {
  const token = normalize(rawWord);
  if (token === 'ai' || token === 'agent' || token === 'agents') {
    return 'neural';
  }
  if (
    token === 'codebase' ||
    token === 'codebases' ||
    token === 'prompt' ||
    token === 'prompts' ||
    token === 'code'
  ) {
    return 'syntax';
  }
  if (
    token === 'server' ||
    token === 'servers' ||
    token === 'engine' ||
    token === 'enginefirst'
  ) {
    return 'orbital';
  }
  return null;
};

const DEFAULT_BURST_FRAMES = 46; // ~1.53s (strictly within 1-to-2s window)

/**
 * Precomputed, scene-isolated 1-to-2 second keyword bursts across all 6 scenes.
 * Adjacent keywords of the same archetype within 24 frames coalesce into one
 * clean 1.5s-1.85s burst with a secondary pulse hit so visuals never overcrowd.
 */
export const SCENE_BROLL_BURSTS: Readonly<Record<SceneKey, readonly BrollBurstSpec[]>> = (() => {
  const byScene: Record<SceneKey, BrollBurstSpec[]> = {
    hook: [],
    twist: [],
    shift: [],
    mechanism: [],
    payoff: [],
    outro: [],
  };

  for (const scene of SCENE_SEQUENCES) {
    const maxEndFrame =
      scene.id === 'outro' ? OUTRO_CUT_FRAME - 2 : scene.endFrame - scene.clearFrames - 2;
    const list: BrollBurstSpec[] = [];

    for (let idx = scene.firstWordIndex; idx <= scene.lastWordIndex; idx += 1) {
      const cue = SCRIPT_CUES[idx];
      const kind = classifyBrollKeyword(cue.text);
      if (!kind) continue;

      const prev = list[list.length - 1];
      if (prev && prev.kind === kind && cue.startFrame - prev.startFrame <= 24) {
        const extendedEnd = Math.min(maxEndFrame, Math.max(prev.endFrame, cue.startFrame + 36));
        const cappedEnd = Math.min(extendedEnd, prev.startFrame + 56); // <= 1.87s max
        prev.secondaryWordIndex = idx;
        prev.endFrame = cappedEnd;
        prev.durationFrames = cappedEnd - prev.startFrame;
        continue;
      }

      const startFrame = cue.startFrame;
      const endFrame = Math.min(maxEndFrame, startFrame + DEFAULT_BURST_FRAMES);
      if (endFrame - startFrame < 16) continue;

      list.push({
        id: `${scene.id}-${kind}-${idx}`,
        sceneId: scene.id,
        kind,
        triggerWordIndex: idx,
        secondaryWordIndex: null,
        triggerText: cue.text,
        startFrame,
        endFrame,
        durationFrames: endFrame - startFrame,
      });
    }

    byScene[scene.id] = list;
  }

  return byScene;
})();

/**
 * Evaluates active holographic B-roll bursts for a scene frame using Remotion's
 * `spring` and `interpolate` so assets flash/scale in instantly on keyword onset
 * and dissolve smoothly back to obsidian.
 */
export const getActiveBrollBursts = (
  scene: SceneSpec,
  localFrame: number,
): ActiveBrollBurst[] => {
  if (isSceneCleared(scene, localFrame)) return [];
  const globalFrame = scene.from + localFrame;
  const specs = SCENE_BROLL_BURSTS[scene.id];
  const active: ActiveBrollBurst[] = [];

  for (const spec of specs) {
    if (globalFrame < spec.startFrame || globalFrame >= spec.endFrame) continue;
    const elapsed = globalFrame - spec.startFrame;
    const dur = spec.durationFrames;
    const fadeOutStart = Math.max(6, dur - 15);

    const enterSpring = spring({
      frame: elapsed,
      fps: FPS,
      config: {damping: 11, stiffness: 240},
    });

    const flashFade = interpolate(
      elapsed,
      [0, 3, fadeOutStart, dur],
      [0, 1, 0.86, 0],
      {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );

    let pulseBoost = interpolate(elapsed, [0, 4, 14], [0.45, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    if (spec.secondaryWordIndex !== null) {
      const secStart = SCRIPT_CUES[spec.secondaryWordIndex].startFrame;
      if (globalFrame >= secStart) {
        const secDt = globalFrame - secStart;
        const secPulse = interpolate(secDt, [0, 3, 14], [0.35, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        pulseBoost = Math.max(pulseBoost, secPulse);
      }
    }

    active.push({
      ...spec,
      elapsedFrames: elapsed,
      progress: clamp(elapsed / Math.max(1, dur), 0, 1),
      opacity: clamp(flashFade, 0, 1),
      scale: 0.84 + enterSpring * 0.16 + pulseBoost * 0.04,
      pulseBoost,
    });
  }

  return active;
};

const NEURAL_NODES: ReadonlyArray<readonly [number, number]> = [
  // Left cortex hemisphere
  [370, 560], [305, 635], [275, 745], [315, 860], [395, 920], [465, 815], [455, 670], [375, 735],
  // Right cortex hemisphere
  [710, 560], [775, 635], [805, 745], [765, 860], [685, 920], [615, 815], [625, 670], [705, 735],
  // Corpus callosum bridge
  [540, 625], [540, 740], [540, 855],
];

const NEURAL_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
  [0, 7], [2, 7], [4, 7], [5, 7], [6, 7],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 8],
  [8, 15], [10, 15], [12, 15], [13, 15], [14, 15],
  [6, 16], [16, 14], [7, 17], [17, 15], [5, 18], [18, 13], [16, 17], [17, 18],
];

const MATRIX_COLUMNS: ReadonlyArray<{x: number; speed: number; tokens: readonly string[]}> = [
  {x: 84, speed: 15, tokens: ['AST_01', '0x4F9A', 'PARSE()', 'NODE_7', 'F(t)', '0x91C0', 'TOKEN']},
  {x: 156, speed: 19, tokens: ['LEX_04', 'TREE=>', '0x1B8E', 'SCHEMA', 'DAG_2', 'CONST', '0x77A1']},
  {x: 228, speed: 13, tokens: ['PROMPT', 'INFER?', '0x00E4', 'BRANCH', 'LEAF_9', '0x5D3F', 'BIND']},
  {x: 852, speed: 17, tokens: ['CODE_8', '0xC412', 'GRAPH', 'COMPILE', '0x88F0', 'STRICT', 'TYPE']},
  {x: 924, speed: 21, tokens: ['0x3A7B', 'SYNTAX', 'FRAME', 'EMIT()', '0xE209', 'LOCK_1', 'HASH']},
  {x: 996, speed: 14, tokens: ['ROOT_0', '0x6B11', 'VERIFY', 'EDGE_3', 'PURE', '0xF4D2', 'SYNC']},
];

const AST_NODES: ReadonlyArray<{x: number; y: number; label: string}> = [
  {x: 540, y: 760, label: 'PROGRAM_ROOT'},
  {x: 340, y: 900, label: 'PROMPT_AST'},
  {x: 740, y: 900, label: 'ENGINE_SCHEMA'},
  {x: 235, y: 1050, label: 'TOKEN_STREAM'},
  {x: 445, y: 1050, label: 'TIMING_DAG'},
  {x: 635, y: 1050, label: 'FRAME_GRAPH'},
  {x: 845, y: 1050, label: 'INVARIANT_LOCK'},
];

const AST_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6],
];

/**
 * 2D Holographic Vector B-Roll Layer (rendered strictly inside the background layer,
 * behind foreground wireframes, HUD, and kinetic typography).
 */
export const ContextualVectorBroll: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => {
  const bursts = getActiveBrollBursts(scene, localFrame);
  if (bursts.length === 0) return null;

  return (
    <div
      data-contextual-broll-scene={scene.id}
      data-broll-count={bursts.length}
      style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'}}
    >
      {bursts.map((burst) => {
        if (burst.kind === 'neural') {
          const waveR = 130 + ((burst.elapsedFrames * 13) % 310);
          const wave2R = 90 + (((burst.elapsedFrames + 16) * 13) % 310);
          return (
            <svg
              key={burst.id}
              data-broll-kind="neural"
              data-broll-trigger={burst.triggerWordIndex}
              viewBox="0 0 1080 1920"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: burst.opacity * 0.82,
                transform: `scale(${burst.scale})`,
                transformOrigin: '540px 740px',
              }}
            >
              {/* Synaptic pulse shockwaves */}
              <circle
                cx="540"
                cy="740"
                r={waveR}
                fill="none"
                stroke={ORANGE}
                strokeWidth="2.2"
                strokeOpacity={clamp(1 - waveR / 440, 0.08, 0.72)}
                strokeDasharray="10 8"
              />
              <circle
                cx="540"
                cy="740"
                r={wave2R}
                fill="none"
                stroke={WHITE}
                strokeWidth="1.4"
                strokeOpacity={clamp(0.75 - wave2R / 440, 0.05, 0.48)}
              />
              {/* Dual-hemisphere holographic cortex aura */}
              <ellipse
                cx="385"
                cy="740"
                rx="155"
                ry="215"
                fill="rgba(255,69,0,.045)"
                stroke={ORANGE}
                strokeOpacity={0.35 + burst.pulseBoost * 0.35}
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
              <ellipse
                cx="695"
                cy="740"
                rx="155"
                ry="215"
                fill="rgba(255,69,0,.045)"
                stroke={ORANGE}
                strokeOpacity={0.35 + burst.pulseBoost * 0.35}
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
              {/* Firing neural edges */}
              {NEURAL_EDGES.map(([a, b], idx) => {
                const [x1, y1] = NEURAL_NODES[a];
                const [x2, y2] = NEURAL_NODES[b];
                const firing = (burst.elapsedFrames + idx) % 4 === 0;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={firing ? ORANGE : WHITE}
                    strokeOpacity={firing ? 0.82 : 0.26}
                    strokeWidth={firing ? 2.6 : 1.2}
                  />
                );
              })}
              {/* Synaptic nodes */}
              {NEURAL_NODES.map(([cx, cy], idx) => {
                const hot = (burst.elapsedFrames + idx) % 5 === 0;
                return (
                  <g key={idx}>
                    {hot && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={15 + burst.pulseBoost * 8}
                        fill="none"
                        stroke={ORANGE}
                        strokeOpacity="0.65"
                        strokeWidth="1.6"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={hot ? 6.5 : 4}
                      fill={hot ? ORANGE : WHITE}
                      fillOpacity={hot ? 0.95 : 0.55}
                    />
                  </g>
                );
              })}
              <text
                x="540"
                y="498"
                textAnchor="middle"
                fill={ORANGE}
                fontFamily="monospace"
                fontSize="13"
                letterSpacing="4"
                opacity="0.85"
              >
                HOLO_BROLL // NEURAL_CORTEX_PULSE [{burst.triggerText.toUpperCase()}]
              </text>
            </svg>
          );
        }

        if (burst.kind === 'syntax') {
          return (
            <svg
              key={burst.id}
              data-broll-kind="syntax"
              data-broll-trigger={burst.triggerWordIndex}
              viewBox="0 0 1080 1920"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: burst.opacity * 0.76,
                transform: `scale(${0.92 + (burst.scale - 0.84) * 0.5})`,
                transformOrigin: '540px 640px',
              }}
            >
              {/* Matrix-style terminal cascade columns */}
              {MATRIX_COLUMNS.map((col, colIdx) => {
                const baseY = ((burst.elapsedFrames * col.speed + colIdx * 130) % 1380) + 140;
                return (
                  <g key={col.x}>
                    <line
                      x1={col.x}
                      y1={140}
                      x2={col.x}
                      y2={1660}
                      stroke={colIdx % 2 === 0 ? ORANGE : WHITE}
                      strokeOpacity="0.1"
                      strokeDasharray="3 9"
                    />
                    {col.tokens.map((tok, tIdx) => {
                      const y = 160 + ((baseY + tIdx * 155) % 1460);
                      const head = tIdx === 0;
                      return (
                        <text
                          key={tok}
                          x={col.x}
                          y={y}
                          textAnchor="middle"
                          fill={head ? ORANGE : WHITE}
                          fillOpacity={head ? 0.88 : Math.max(0.14, 0.52 - tIdx * 0.06)}
                          fontFamily="monospace"
                          fontSize={head ? '14' : '12'}
                          fontWeight={head ? '700' : '400'}
                        >
                          {tok}
                        </text>
                      );
                    })}
                  </g>
                );
              })}

              {/* Holographic Syntax Tree (AST) flash */}
              {AST_EDGES.map(([a, b], idx) => {
                const na = AST_NODES[a];
                const nb = AST_NODES[b];
                const activeBranch = (burst.elapsedFrames + idx) % 3 === 0;
                return (
                  <path
                    key={idx}
                    d={`M${na.x} ${na.y + 18} V${(na.y + nb.y) / 2} H${nb.x} V${nb.y - 18}`}
                    fill="none"
                    stroke={activeBranch ? ORANGE : WHITE}
                    strokeOpacity={activeBranch ? 0.78 : 0.3}
                    strokeWidth={activeBranch ? 2.4 : 1.4}
                  />
                );
              })}
              {AST_NODES.map((node, idx) => {
                const hot = idx === 0 || (burst.elapsedFrames + idx) % 4 === 0;
                return (
                  <g key={node.label} transform={`translate(${node.x} ${node.y})`}>
                    <rect
                      x="-78"
                      y="-18"
                      width="156"
                      height="36"
                      rx="4"
                      fill="rgba(11,15,25,.78)"
                      stroke={hot ? ORANGE : WHITE}
                      strokeOpacity={hot ? 0.85 : 0.32}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill={hot ? ORANGE : WHITE}
                      fontFamily="monospace"
                      fontSize="11"
                      letterSpacing="1.4"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          );
        }

        // 'orbital' -> Rotating orbital server nodes & concentric data rings
        const deg = burst.elapsedFrames * 3.6;
        return (
          <svg
            key={burst.id}
            data-broll-kind="orbital"
            data-broll-trigger={burst.triggerWordIndex}
            viewBox="0 0 1080 1920"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: burst.opacity * 0.82,
              transform: `scale(${burst.scale})`,
              transformOrigin: '540px 920px',
            }}
          >
            <g transform={`translate(540 920) rotate(${deg})`}>
              <circle
                r="430"
                fill="none"
                stroke={ORANGE}
                strokeOpacity="0.42"
                strokeWidth="2"
                strokeDasharray="22 14 6 14"
              />
              <circle
                r="325"
                fill="none"
                stroke={WHITE}
                strokeOpacity="0.24"
                strokeWidth="1.4"
                strokeDasharray="6 10"
              />
            </g>
            <g transform={`translate(540 920) rotate(${-deg * 1.35})`}>
              <ellipse
                rx="455"
                ry="190"
                fill="none"
                stroke={ORANGE}
                strokeOpacity="0.5"
                strokeWidth="1.8"
              />
              {[0, 1, 2, 3, 4, 5].map((srv) => {
                const a = (srv / 6) * Math.PI * 2;
                const sx = Math.cos(a) * 455;
                const sy = Math.sin(a) * 190;
                const hot = srv % 2 === 0;
                return (
                  <g key={srv} transform={`translate(${sx} ${sy}) rotate(${deg * 1.35})`}>
                    <rect
                      x="-26"
                      y="-18"
                      width="52"
                      height="36"
                      rx="4"
                      fill="rgba(11,15,25,.86)"
                      stroke={hot ? ORANGE : WHITE}
                      strokeWidth="1.8"
                    />
                    <line x1="-16" y1="-6" x2="16" y2="-6" stroke={ORANGE} strokeWidth="2" />
                    <line x1="-16" y1="4" x2="10" y2="4" stroke={WHITE} strokeOpacity="0.65" strokeWidth="1.6" />
                    <circle cx="15" cy="4" r="2.5" fill={ORANGE} />
                  </g>
                );
              })}
            </g>
            <text
              x="540"
              y="445"
              textAnchor="middle"
              fill={ORANGE}
              fontFamily="monospace"
              fontSize="13"
              letterSpacing="4"
              opacity="0.86"
            >
              HOLO_BROLL // ORBITAL_ENGINE_NODES [{burst.triggerText.toUpperCase()}]
            </text>
          </svg>
        );
      })}
    </div>
  );
};

/**
 * 3D WebGL Wireframe B-Roll Sub-Components (mounted strictly inside <SceneThreeCanvas>,
 * completely separated from 2D titles, captions, and HUD).
 */
export const ContextualThreeBroll: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => {
  const bursts = getActiveBrollBursts(scene, localFrame);
  if (bursts.length === 0) return null;

  return (
    <group>
      {bursts.map((burst) => {
        const s = burst.scale;
        if (burst.kind === 'neural') {
          const pulse = 1 + burst.pulseBoost * 0.14;
          const spin = burst.elapsedFrames * 0.032;
          return (
            <group key={burst.id} position={[0, 0.85, -0.8]} scale={[s * pulse, s * pulse, s * pulse]}>
              <mesh position={[-0.78, 0, 0]} rotation={[spin * 0.6, spin, 0]}>
                <icosahedronGeometry args={[1.05, 1]} />
                <meshBasicMaterial color={ORANGE} wireframe transparent opacity={burst.opacity * 0.52} />
              </mesh>
              <mesh position={[0.78, 0, 0]} rotation={[-spin * 0.6, -spin, 0]}>
                <icosahedronGeometry args={[1.05, 1]} />
                <meshBasicMaterial color={ORANGE} wireframe transparent opacity={burst.opacity * 0.52} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, spin * 1.5]}>
                <torusGeometry args={[2.15, 0.016, 8, 72]} />
                <meshBasicMaterial color={WHITE} transparent opacity={burst.opacity * 0.36} />
              </mesh>
            </group>
          );
        }

        if (burst.kind === 'syntax') {
          const drop = (burst.elapsedFrames * 0.09) % 1.6;
          return (
            <group key={burst.id} position={[0, 0.3, -1.1]} scale={[s, s, s]}>
              {[-2.1, -1.05, 1.05, 2.1].map((x, idx) => (
                <mesh
                  key={idx}
                  position={[x, 1.2 - drop + (idx % 2) * 0.45, -0.3 * idx]}
                  rotation={[0.12, burst.elapsedFrames * 0.02, 0]}
                >
                  <boxGeometry args={[0.58, 2.3, 0.24]} />
                  <meshBasicMaterial
                    color={idx % 2 === 0 ? ORANGE : WHITE}
                    wireframe
                    transparent
                    opacity={burst.opacity * 0.4}
                  />
                </mesh>
              ))}
            </group>
          );
        }

        // 'orbital' -> Rotating 3D orbital server nodes & gyroscopic data rings
        const orbit = burst.elapsedFrames * 0.055;
        return (
          <group key={burst.id} position={[0, 0.1, -0.7]} scale={[s, s, s]}>
            <mesh rotation={[0.92, orbit, 0.28]}>
              <torusGeometry args={[2.95, 0.02, 10, 96]} />
              <meshBasicMaterial color={ORANGE} transparent opacity={burst.opacity * 0.58} />
            </mesh>
            <mesh rotation={[-0.78, -orbit * 1.25, -0.22]}>
              <torusGeometry args={[2.35, 0.014, 10, 84]} />
              <meshBasicMaterial color={WHITE} transparent opacity={burst.opacity * 0.42} />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((nodeIdx) => {
              const angle = (nodeIdx / 6) * Math.PI * 2 + orbit * 1.4;
              return (
                <mesh
                  key={nodeIdx}
                  position={[
                    Math.cos(angle) * 2.95,
                    Math.sin(angle) * 1.15,
                    Math.sin(angle) * 1.65,
                  ]}
                  rotation={[orbit, angle, 0]}
                >
                  <boxGeometry args={[0.28, 0.28, 0.28]} />
                  <meshBasicMaterial
                    color={nodeIdx % 2 === 0 ? ORANGE : WHITE}
                    wireframe
                    transparent
                    opacity={burst.opacity * 0.85}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

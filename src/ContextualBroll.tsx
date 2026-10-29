import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {
  FPS,
  MUTED,
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

/**
 * Strictly narrative-driven semantic B-roll categories:
 * - 'neural': "AI" / "Agent" -> localized neural node lattice / synaptic graph (pulses once & dissolves)
 * - 'syntax': "Code" / "Prompt" / "Template" -> localized scrolling terminal syntax block / text-parsing matrix
 * - 'math':   "Physics" / "Timing" / "Easing" -> clean mathematical curve graph / linear keyframe grid
 */
export type BrollKind = 'neural' | 'syntax' | 'math';

export type MathSubkind = 'physics' | 'timing' | 'easing';

export type BrollBurstSpec = {
  id: string;
  sceneId: SceneKey;
  kind: BrollKind;
  mathSubkind: MathSubkind | null;
  triggerWordIndex: number;
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
  pulseProgress: number;
};

export const classifyBrollKeyword = (rawWord: string): BrollKind | null => {
  const token = normalize(rawWord);
  if (token === 'ai' || token === 'agent' || token === 'agents') {
    return 'neural';
  }
  if (
    token === 'code' ||
    token === 'codebase' ||
    token === 'codebases' ||
    token === 'prompt' ||
    token === 'prompts' ||
    token === 'template' ||
    token === 'templates' ||
    token === 'boilerplate'
  ) {
    return 'syntax';
  }
  if (token === 'physics' || token === 'timing' || token === 'easing') {
    return 'math';
  }
  return null;
};

const getMathSubkind = (rawWord: string): MathSubkind | null => {
  const token = normalize(rawWord);
  if (token === 'physics') return 'physics';
  if (token === 'timing') return 'timing';
  if (token === 'easing') return 'easing';
  return null;
};

const DEFAULT_BURST_FRAMES = 42; // 1.40s localized single-pulse / scroll burst

/**
 * Precomputed, strictly non-overlapping semantic B-roll bursts per scene.
 * Adjacent tokens of the same semantic family coalesce into a single localized burst,
 * and any burst is truncated before the next distinct semantic token or scene cut so
 * two background assets NEVER overlap.
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
    const rawList: BrollBurstSpec[] = [];

    for (let idx = scene.firstWordIndex; idx <= scene.lastWordIndex; idx += 1) {
      const cue = SCRIPT_CUES[idx];
      const kind = classifyBrollKeyword(cue.text);
      if (!kind) continue;
      const mathSubkind = getMathSubkind(cue.text);

      const prev = rawList[rawList.length - 1];
      if (
        prev &&
        prev.kind === kind &&
        prev.mathSubkind === mathSubkind &&
        cue.startFrame - prev.startFrame <= 32
      ) {
        const extendedEnd = Math.min(maxEndFrame, Math.max(prev.endFrame, cue.startFrame + 32));
        const cappedEnd = Math.min(extendedEnd, prev.startFrame + 58); // <= 1.93s max
        prev.endFrame = cappedEnd;
        prev.durationFrames = cappedEnd - prev.startFrame;
        continue;
      }

      const startFrame = cue.startFrame;
      const endFrame = Math.min(maxEndFrame, startFrame + DEFAULT_BURST_FRAMES);
      if (endFrame - startFrame < 14) continue;

      rawList.push({
        id: `${scene.id}-${kind}-${idx}`,
        sceneId: scene.id,
        kind,
        mathSubkind,
        triggerWordIndex: idx,
        triggerText: cue.text,
        startFrame,
        endFrame,
        durationFrames: endFrame - startFrame,
      });
    }

    // Enforce zero overlap between sequential semantic bursts in the same scene
    for (let i = 0; i < rawList.length - 1; i += 1) {
      const curr = rawList[i];
      const next = rawList[i + 1];
      if (curr.endFrame > next.startFrame) {
        curr.endFrame = next.startFrame;
        curr.durationFrames = curr.endFrame - curr.startFrame;
      }
    }

    byScene[scene.id] = rawList.filter((b) => b.durationFrames >= 12);
  }

  return byScene;
})();

/**
 * Evaluates active semantic B-roll bursts for a scene frame.
 * Returns an empty array whenever no semantic keyword burst owns the current frame,
 * keeping the background completely clean over the subtle coordinate grid.
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
    const fadeOutStart = Math.max(5, dur - 14);

    const enterSpring = spring({
      frame: elapsed,
      fps: FPS,
      config: {damping: 14, stiffness: 210},
    });

    const opacity = interpolate(
      elapsed,
      [0, 4, fadeOutStart, dur],
      [0, 1, 0.85, 0],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );

    // Single monotonic 0 -> 1 pulse/scroll progression across the burst (pulses once & dissolves)
    const pulseProgress = interpolate(elapsed, [0, dur], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    active.push({
      ...spec,
      elapsedFrames: elapsed,
      progress: clamp(elapsed / Math.max(1, dur), 0, 1),
      opacity: clamp(opacity, 0, 1),
      scale: 0.94 + enterSpring * 0.06,
      pulseProgress,
    });
  }

  return active;
};

// Localized 4-layer feed-forward synaptic node lattice inside Hook upper bay (x: 270..810, y: 398..650)
const SYNAPTIC_NODES: ReadonlyArray<{x: number; y: number; layer: number}> = [
  {x: 270, y: 432, layer: 0},
  {x: 270, y: 522, layer: 0},
  {x: 270, y: 612, layer: 0},
  {x: 450, y: 398, layer: 1},
  {x: 450, y: 482, layer: 1},
  {x: 450, y: 566, layer: 1},
  {x: 450, y: 650, layer: 1},
  {x: 630, y: 428, layer: 2},
  {x: 630, y: 522, layer: 2},
  {x: 630, y: 616, layer: 2},
  {x: 810, y: 478, layer: 3},
  {x: 810, y: 568, layer: 3},
];

const SYNAPTIC_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6],
  [3, 7], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9],
  [7, 10], [8, 10], [8, 11], [9, 11],
];

const TERMINAL_LINES: ReadonlyArray<{indent: number; cmd: string; status: string}> = [
  {indent: 0, cmd: '$ parse_tokens --strict --ast', status: '[OK]'},
  {indent: 1, cmd: 'lex.scan(input_stream) -> 91_cues', status: '0.4ms'},
  {indent: 1, cmd: 'schema.bind(frame_clock, fps=30)', status: 'LOCKED'},
  {indent: 2, cmd: 'verify(invariants, zero_drift)', status: 'PASS'},
  {indent: 1, cmd: 'emit_render_graph(1080x1920)', status: 'READY'},
  {indent: 0, cmd: '> deterministic_pipeline_engaged', status: 'DONE'},
];

const getBurstBay = (sceneId: SceneKey, kind: BrollKind): {top: number; height: number} => {
  if (sceneId === 'hook') {
    return kind === 'neural' ? {top: 334, height: 356} : {top: 1190, height: 232};
  }
  if (sceneId === 'twist') {
    return {top: 1090, height: 232};
  }
  if (sceneId === 'shift') {
    return {top: 854, height: 240};
  }
  if (sceneId === 'mechanism' || sceneId === 'payoff') {
    return {top: 420, height: 228};
  }
  // outro
  return {top: 1220, height: 232};
};

/**
 * Localized, clutter-free 2D semantic B-roll graphics rendered strictly inside the
 * background layer ONLY when a semantic keyword ('neural' | 'syntax' | 'math') is spoken.
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
        const bay = getBurstBay(scene.id, burst.kind);

        if (burst.kind === 'neural') {
          // Single synaptic wave traveling left -> right across layers 0..3 once, then dissolving
          const waveLayer = burst.pulseProgress * 3.4;
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
                opacity: burst.opacity * 0.88,
                transform: `scale(${burst.scale})`,
                transformOrigin: '540px 512px',
              }}
            >
              <rect
                x="216"
                y={bay.top}
                width="648"
                height={bay.height}
                rx="10"
                fill="rgba(11,15,25,.74)"
                stroke="rgba(244,247,255,.16)"
                strokeWidth="1.2"
              />
              <text
                x="244"
                y={bay.top + 30}
                fill={ORANGE}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="11"
                letterSpacing="2.4"
              >
                SYNAPTIC_LATTICE // SINGLE_PULSE [{burst.triggerText.toUpperCase()}]
              </text>

              {SYNAPTIC_EDGES.map(([a, b], idx) => {
                const na = SYNAPTIC_NODES[a];
                const nb = SYNAPTIC_NODES[b];
                const edgeMidLayer = (na.layer + nb.layer) * 0.5;
                const dist = Math.abs(waveLayer - edgeMidLayer);
                const pulse = clamp(1 - dist / 0.85, 0, 1);
                return (
                  <line
                    key={idx}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    stroke={pulse > 0.35 ? ORANGE : WHITE}
                    strokeOpacity={0.16 + pulse * 0.74}
                    strokeWidth={1.2 + pulse * 1.8}
                  />
                );
              })}

              {SYNAPTIC_NODES.map((node, idx) => {
                const dist = Math.abs(waveLayer - node.layer);
                const pulse = clamp(1 - dist / 0.75, 0, 1);
                return (
                  <g key={idx} transform={`translate(${node.x} ${node.y})`}>
                    {pulse > 0.2 && (
                      <circle
                        r={8 + pulse * 13}
                        fill="none"
                        stroke={ORANGE}
                        strokeOpacity={pulse * 0.65}
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      r={4.2 + pulse * 3}
                      fill={pulse > 0.3 ? ORANGE : WHITE}
                      fillOpacity={0.42 + pulse * 0.58}
                    />
                  </g>
                );
              })}
            </svg>
          );
        }

        if (burst.kind === 'syntax') {
          // Clean localized scrolling terminal syntax block / text-parsing matrix
          const revealedRows = Math.max(2, Math.ceil(burst.pulseProgress * TERMINAL_LINES.length));
          const scrollOffset =
            revealedRows > 5
              ? interpolate(burst.pulseProgress, [0.78, 1], [0, 26], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })
              : 0;

          return (
            <div
              key={burst.id}
              data-broll-kind="syntax"
              data-broll-trigger={burst.triggerWordIndex}
              style={{
                position: 'absolute',
                left: 84,
                right: 84,
                top: bay.top,
                height: bay.height,
                border: '1px solid rgba(244,247,255,.16)',
                borderLeft: `3px solid ${ORANGE}`,
                background: 'rgba(8,12,21,.78)',
                borderRadius: 8,
                padding: '15px 24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                opacity: burst.opacity * 0.88,
                transform: `scale(${burst.scale})`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  borderBottom: '1px solid rgba(244,247,255,.09)',
                  paddingBottom: 8,
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  letterSpacing: 2,
                  color: ORANGE,
                }}
              >
                <span>TEXT_PARSER // SYNTAX_MATRIX [{burst.triggerText.toUpperCase()}]</span>
                <span style={{color: MUTED}}>UTF-8 · AST</span>
              </div>

              <div style={{flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative'}}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                    paddingTop: 4,
                    transform: `translateY(${-scrollOffset}px)`,
                  }}
                >
                  {TERMINAL_LINES.slice(0, revealedRows).map((row, idx) => {
                    const isActiveRow = idx === revealedRows - 1;
                    return (
                      <div
                        key={row.cmd}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingLeft: row.indent * 20,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontSize: 14,
                          color: isActiveRow ? WHITE : 'rgba(244,247,255,.58)',
                        }}
                      >
                        <span>{row.cmd}</span>
                        <span style={{color: isActiveRow ? ORANGE : MUTED}}>{row.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // 'math' -> Clean mathematical curve graph or linear keyframe grid ("Physics / Timing / Easing")
        const sub = burst.mathSubkind ?? 'easing';
        const drawDashOffset = (1 - burst.pulseProgress) * 680;

        return (
          <svg
            key={burst.id}
            data-broll-kind="math"
            data-broll-subkind={sub}
            viewBox="0 0 912 240"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 84,
              width: 912,
              top: bay.top,
              height: bay.height,
              opacity: burst.opacity * 0.88,
              transform: `scale(${burst.scale})`,
            }}
          >
            <rect
              x="0"
              y="0"
              width="912"
              height="240"
              rx="8"
              fill="rgba(8,12,21,.76)"
              stroke="rgba(244,247,255,.16)"
              strokeWidth="1.2"
            />
            {/* Orthogonal coordinate axes */}
            <line x1="56" y1="42" x2="56" y2="206" stroke={WHITE} strokeOpacity="0.34" strokeWidth="1.4" />
            <line x1="56" y1="206" x2="860" y2="206" stroke={WHITE} strokeOpacity="0.34" strokeWidth="1.4" />
            <line x1="56" y1="124" x2="860" y2="124" stroke={WHITE} strokeOpacity="0.1" strokeDasharray="4 6" />

            <text
              x="72"
              y="28"
              fill={ORANGE}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="11"
              letterSpacing="2.2"
            >
              {sub === 'timing'
                ? 'LINEAR_KEYFRAME_GRID // QUANTIZED_30FPS'
                : sub === 'physics'
                  ? 'HARMONIC_SPRING_CURVE // x(t) = 1 - exp(-zeta*w*t)cos(wd*t)'
                  : 'CUBIC_BEZIER_CURVE // EASE_IN_OUT_CUBIC'}
            </text>

            {sub === 'timing' && (
              <g>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((kf) => {
                  const x = 88 + kf * 62;
                  const lit = kf / 12 <= burst.pulseProgress;
                  return (
                    <g key={kf}>
                      <line
                        x1={x}
                        y1={kf % 3 === 0 ? 64 : 94}
                        x2={x}
                        y2={206}
                        stroke={lit ? ORANGE : WHITE}
                        strokeOpacity={lit ? 0.88 : 0.22}
                        strokeWidth={kf % 3 === 0 ? 2.2 : 1.2}
                      />
                      {kf % 3 === 0 && (
                        <rect
                          x={x - 5}
                          y={56}
                          width="10"
                          height="10"
                          transform={`rotate(45 ${x} 61)`}
                          fill={lit ? ORANGE : 'none'}
                          stroke={lit ? ORANGE : WHITE}
                          strokeOpacity="0.78"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {sub === 'physics' && (
              <path
                d="M56 196 C134 44, 210 176, 294 92 C372 140, 456 110, 550 126 C648 120, 748 124, 856 124"
                fill="none"
                stroke={ORANGE}
                strokeWidth="3.2"
                strokeDasharray="680"
                strokeDashoffset={drawDashOffset}
              />
            )}

            {sub === 'easing' && (
              <g>
                <line x1="56" y1="198" x2="380" y2="198" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
                <line x1="536" y1="54" x2="856" y2="54" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
                <circle cx="380" cy="198" r="4.5" fill={WHITE} fillOpacity="0.68" />
                <circle cx="536" cy="54" r="4.5" fill={WHITE} fillOpacity="0.68" />
                <path
                  d="M56 198 C380 198, 536 54, 856 54"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="3.2"
                  strokeDasharray="680"
                  strokeDashoffset={drawDashOffset}
                />
              </g>
            )}
          </svg>
        );
      })}
    </div>
  );
};

/**
 * Localized, semantic-only 3D WebGL depth backplane inside <SceneThreeCanvas>.
 * Registered directly behind each active semantic card bay — zero duplicate ghost dots,
 * zero orbital rings, zero continuous unscripted geometric loops.
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
        const bay = getBurstBay(scene.id, burst.kind);
        const bayCenterY = bay.top + bay.height * 0.5;
        const worldY = ((960 - bayCenterY) / 960) * 5.25;
        const planeW = burst.kind === 'neural' ? 3.55 : 4.95;
        const planeH = (bay.height / 1920) * 10.5;
        const s = burst.scale;

        return (
          <group key={burst.id} position={[0, worldY, -1.25]} scale={[s, s, s]}>
            <mesh>
              <planeGeometry args={[planeW, planeH]} />
              <meshBasicMaterial
                color={ORANGE}
                transparent
                opacity={burst.opacity * 0.055}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

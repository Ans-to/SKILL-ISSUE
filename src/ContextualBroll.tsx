import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {TimelineGrid} from './TimelineGrid';
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
 * - 'syntax': "Code" / "Prompt" / "Template" -> scrolling terminal syntax block / clean text-parsing matrix
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
    token === 'templates'
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

const isImmediateSemanticCompletion = (triggerToken: string, nextToken: string): boolean =>
  (triggerToken === 'prompt' && nextToken === 'harder') ||
  (triggerToken === 'timing' && nextToken === 'model');

const isShortBridgeConnector = (token: string, durFrames: number): boolean =>
  durFrames <= 6 && (token === 'to' || token === 'and' || token === 'or');

/**
 * Precomputed, strictly non-overlapping semantic B-roll bursts per scene.
 * Every burst starts on its spoken semantic token and dissolves cleanly during its
 * own breath pause BEFORE any unrelated spoken word begins — keeping non-semantic
 * frames 100% pure coordinate grid with zero visual clutter.
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

    let idx = scene.firstWordIndex;
    while (idx <= scene.lastWordIndex) {
      const cue = SCRIPT_CUES[idx];
      const kind = classifyBrollKeyword(cue.text);
      if (!kind) {
        idx += 1;
        continue;
      }

      const mathSubkind = getMathSubkind(cue.text);
      const startFrame = cue.startFrame;
      let lastIncludedIdx = idx;

      // Coalesce immediately adjacent tokens of the same semantic family
      // (e.g. "AI agent" or "prompt to code, code")
      while (lastIncludedIdx + 1 <= scene.lastWordIndex) {
        const nextCue = SCRIPT_CUES[lastIncludedIdx + 1];
        const nextKind = classifyBrollKeyword(nextCue.text);
        const nextSub = getMathSubkind(nextCue.text);
        const nextTok = normalize(nextCue.text);

        if (
          nextKind === kind &&
          nextSub === mathSubkind &&
          nextCue.startFrame - SCRIPT_CUES[lastIncludedIdx].endFrame <= 14
        ) {
          lastIncludedIdx += 1;
          continue;
        }

        // Allow tiny bridge connector ("prompt to code,") when followed by same semantic kind
        if (
          isShortBridgeConnector(nextTok, nextCue.endFrame - nextCue.startFrame) &&
          lastIncludedIdx + 2 <= scene.lastWordIndex
        ) {
          const afterBridge = SCRIPT_CUES[lastIncludedIdx + 2];
          if (
            classifyBrollKeyword(afterBridge.text) === kind &&
            getMathSubkind(afterBridge.text) === mathSubkind
          ) {
            lastIncludedIdx += 2;
            continue;
          }
        }

        // Include immediate 2-word semantic phrase completion ("Prompt harder?", "timing model,")
        if (
          lastIncludedIdx === idx &&
          isImmediateSemanticCompletion(normalize(cue.text), nextTok)
        ) {
          lastIncludedIdx += 1;
        }
        break;
      }

      const phraseEndFrame = SCRIPT_CUES[lastIncludedIdx].endFrame;
      const followingCue =
        lastIncludedIdx + 1 <= scene.lastWordIndex ? SCRIPT_CUES[lastIncludedIdx + 1] : null;
      const hardStopBeforeNextWord = followingCue ? followingCue.startFrame : maxEndFrame;

      // Dissolve inside the natural breath pause after the semantic word/phrase,
      // strictly clamped before the next spoken word and <= 56 frames total.
      const desiredEnd = Math.min(maxEndFrame, hardStopBeforeNextWord, phraseEndFrame + 12);
      const endFrame = Math.min(desiredEnd, startFrame + 56);

      if (endFrame - startFrame >= 12) {
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

      idx = lastIncludedIdx + 1;
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
    const fadeOutStart = Math.max(4, dur - Math.min(9, Math.floor(dur * 0.35)));

    const enterSpring = spring({
      frame: elapsed,
      fps: FPS,
      config: {damping: 15, stiffness: 220},
    });

    const opacity = interpolate(
      elapsed,
      [0, 3, fadeOutStart, dur],
      [0, 1, 0.9, 0],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );

    // Single monotonic 0 -> 1 pulse/scroll/plot progression across the burst (pulses once & dissolves)
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
      scale: 0.95 + enterSpring * 0.05,
      pulseProgress,
    });
  }

  return active;
};

// Localized 4-layer feed-forward synaptic node lattice inside upper focal bay (x: 270..810, y: 396..636)
const SYNAPTIC_NODES: ReadonlyArray<{x: number; y: number; layer: number}> = [
  {x: 270, y: 428, layer: 0},
  {x: 270, y: 516, layer: 0},
  {x: 270, y: 604, layer: 0},
  {x: 450, y: 396, layer: 1},
  {x: 450, y: 476, layer: 1},
  {x: 450, y: 556, layer: 1},
  {x: 450, y: 636, layer: 1},
  {x: 630, y: 428, layer: 2},
  {x: 630, y: 516, layer: 2},
  {x: 630, y: 604, layer: 2},
  {x: 810, y: 472, layer: 3},
  {x: 810, y: 560, layer: 3},
];

const SYNAPTIC_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6],
  [3, 7], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9],
  [7, 10], [8, 10], [8, 11], [9, 11],
];

// Precomputed 64-sample analytical damped harmonic spring curve: x(t) = 1 - e^(-3.4t) * cos(14.5t)
const HARMONIC_SPRING_PATH: string = (() => {
  const samples = 64;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = 60 + t * 772;
    const response = 1 - Math.exp(-3.4 * t) * Math.cos(14.5 * t);
    // Equilibrium response=1 maps to y=132; t=0 response=0 maps to y=212; overshoot ~1.36 maps to y~103
    const y = 212 - response * 80;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

const getSyntaxLines = (
  triggerWord: string,
): ReadonlyArray<{indent: number; cmd: string; status: string}> => {
  const tok = normalize(triggerWord);
  if (tok.startsWith('template')) {
    return [
      {indent: 0, cmd: '$ inspect_ast --target=template.tsx', status: 'SCAN'},
      {indent: 1, cmd: 'ast.parse(preset_layout, props={})', status: 'STATIC'},
      {indent: 1, cmd: 'bind_timing_model(frame_clock)', status: 'MISSING'},
      {indent: 2, cmd: 'diff(invariants, hardcoded_slots)', status: '0_CONSTRAINTS'},
      {indent: 0, cmd: '> parser_verdict: surface_shell_only', status: 'DONE'},
    ];
  }
  if (tok.startsWith('prompt')) {
    return [
      {indent: 0, cmd: '$ tokenize_prompt --stream --utf8', status: '[OK]'},
      {indent: 1, cmd: 'lexer.read(natural_language_tokens)', status: '0.3ms'},
      {indent: 1, cmd: 'compile_intent -> explicit_ast_nodes', status: 'TYPED'},
      {indent: 2, cmd: 'schema.lock(fps=30, canvas=1080x1920)', status: 'BOUND'},
      {indent: 0, cmd: '> text_matrix_parsed: zero_ambiguity', status: 'PASS'},
    ];
  }
  return [
    {indent: 0, cmd: '$ parse_codebase --strict --graph', status: '[OK]'},
    {indent: 1, cmd: 'module.resolve(src/Root.tsx, sequences=6)', status: 'LOCKED'},
    {indent: 1, cmd: 'verify_cues(words=91, frames=1547)', status: 'EXACT'},
    {indent: 2, cmd: 'typecheck(invariants, zero_drift)', status: '0_ERR'},
    {indent: 0, cmd: '> deterministic_code_graph_ready', status: 'PASS'},
  ];
};

/**
 * Localized, clutter-free 2D semantic B-roll graphics rendered strictly inside the
 * upper focal bay (y: 344..648) ONLY when a semantic keyword ('neural' | 'syntax' | 'math')
 * is spoken. Zero background clutter on all other frames.
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
                opacity: burst.opacity * 0.9,
                transform: `scale(${burst.scale})`,
                transformOrigin: '540px 516px',
              }}
            >
              <rect
                x="204"
                y="338"
                width="672"
                height="340"
                rx="10"
                fill="rgba(8,12,21,.74)"
                stroke="rgba(244,247,255,.15)"
                strokeWidth="1.2"
              />
              <text
                x="236"
                y="368"
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
                    strokeOpacity={0.16 + pulse * 0.76}
                    strokeWidth={1.2 + pulse * 1.9}
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
                        strokeOpacity={pulse * 0.68}
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      r={4.2 + pulse * 3}
                      fill={pulse > 0.3 ? ORANGE : WHITE}
                      fillOpacity={0.44 + pulse * 0.56}
                    />
                  </g>
                );
              })}
            </svg>
          );
        }

        if (burst.kind === 'syntax') {
          const lines = getSyntaxLines(burst.triggerText);
          const revealedRows = Math.max(2, Math.ceil(burst.pulseProgress * lines.length));
          const upwardSlide = (1 - burst.pulseProgress) * 14;

          return (
            <div
              key={burst.id}
              data-broll-kind="syntax"
              data-broll-trigger={burst.triggerWordIndex}
              style={{
                position: 'absolute',
                left: 96,
                right: 96,
                top: 350,
                height: 268,
                border: '1px solid rgba(244,247,255,.15)',
                borderLeft: `3px solid ${ORANGE}`,
                background: 'rgba(8,12,21,.78)',
                borderRadius: 8,
                padding: '16px 26px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                opacity: burst.opacity * 0.9,
                transform: `scale(${burst.scale})`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  borderBottom: '1px solid rgba(244,247,255,.09)',
                  paddingBottom: 9,
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  letterSpacing: 2.2,
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
                    gap: 11,
                    paddingTop: 2,
                    transform: `translateY(${upwardSlide.toFixed(1)}px)`,
                  }}
                >
                  {lines.slice(0, revealedRows).map((row, idx) => {
                    const isActiveRow = idx === revealedRows - 1;
                    return (
                      <div
                        key={row.cmd}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingLeft: row.indent * 20,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontSize: 14.5,
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

        // 'math' -> Clean mathematical curve graph ("Physics / Easing") or Linear Keyframe Grid ("Timing")
        const sub = burst.mathSubkind ?? 'easing';
        if (sub === 'timing') {
          return (
            <TimelineGrid
              key={burst.id}
              progress={burst.pulseProgress}
              opacity={burst.opacity}
              scale={burst.scale}
              triggerText={burst.triggerText}
              startFrame={burst.startFrame}
            />
          );
        }

        const drawDashOffset = (1 - burst.pulseProgress) * 720;

        return (
          <svg
            key={burst.id}
            data-broll-kind="math"
            data-broll-subkind={sub}
            viewBox="0 0 888 264"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 96,
              width: 888,
              top: 356,
              height: 264,
              opacity: burst.opacity * 0.9,
              transform: `scale(${burst.scale})`,
              transformOrigin: '444px 132px',
            }}
          >
            <rect
              x="0"
              y="0"
              width="888"
              height="264"
              rx="8"
              fill="rgba(8,12,21,.76)"
              stroke="rgba(244,247,255,.15)"
              strokeWidth="1.2"
            />
            <text
              x="32"
              y="32"
              fill={ORANGE}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="11"
              letterSpacing="2.2"
            >
              {sub === 'physics'
                ? 'HARMONIC_SPRING_CURVE // x(t) = 1 - exp(-zeta*w*t)cos(wd*t)'
                : 'CUBIC_BEZIER_CURVE // C(t) = cubic-bezier(0.65, 0, 0.35, 1)'}
            </text>

            {/* Orthogonal coordinate axes */}
            <line x1="60" y1="54" x2="60" y2="222" stroke={WHITE} strokeOpacity="0.34" strokeWidth="1.4" />
            <line x1="60" y1="222" x2="836" y2="222" stroke={WHITE} strokeOpacity="0.34" strokeWidth="1.4" />
            <line x1="60" y1="132" x2="836" y2="132" stroke={WHITE} strokeOpacity="0.1" strokeDasharray="4 6" />

            {sub === 'physics' && (
              <path
                d={HARMONIC_SPRING_PATH}
                fill="none"
                stroke={ORANGE}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="920"
                strokeDashoffset={(1 - burst.pulseProgress) * 920}
              />
            )}

            {sub === 'easing' && (
              <g>
                <line x1="60" y1="214" x2="376" y2="214" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
                <line x1="520" y1="62" x2="832" y2="62" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
                <circle cx="376" cy="214" r="4.5" fill={WHITE} fillOpacity="0.7" />
                <circle cx="520" cy="62" r="4.5" fill={WHITE} fillOpacity="0.7" />
                <path
                  d="M60 214 C376 214, 520 62, 832 62"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="3.2"
                  strokeDasharray="720"
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
 * Registered directly behind the upper semantic bay — zero orbital rings,
 * zero random spheres, zero continuous unscripted geometric loops.
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
        const bayCenterY = burst.kind === 'neural' ? 508 : 488;
        const worldY = ((960 - bayCenterY) / 960) * 5.25;
        const planeW = burst.kind === 'neural' ? 3.65 : 4.8;
        const planeH = burst.kind === 'neural' ? 1.85 : 1.44;
        const s = burst.scale;

        return (
          <group key={burst.id} position={[0, worldY, -1.25]} scale={[s, s, s]}>
            <mesh>
              <planeGeometry args={[planeW, planeH]} />
              <meshBasicMaterial
                color={ORANGE}
                transparent
                opacity={burst.opacity * 0.05}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

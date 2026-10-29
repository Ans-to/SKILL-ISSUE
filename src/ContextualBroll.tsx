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
    const fadeOutStart = Math.max(4, dur - Math.min(8, Math.floor(dur * 0.32)));

    const enterSpring = spring({
      frame: elapsed,
      fps: FPS,
      config: {damping: 15, stiffness: 220},
    });

    const opacity = interpolate(
      elapsed,
      [0, 3, fadeOutStart, dur],
      [0, 1, 0.92, 0],
      {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      },
    );

    // Complete primary wave/plot across first 74% of burst so the complete curve/lattice
    // reads clearly before dissolving cleanly to zero.
    const pulseProgress = interpolate(elapsed, [0, Math.max(6, dur * 0.74)], [0, 1], {
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

// Frameless localized 4-layer 14-node synaptic lattice (x: 240..840, y: 368..642)
const SYNAPTIC_NODES: ReadonlyArray<{x: number; y: number; layer: number}> = [
  {x: 248, y: 416, layer: 0},
  {x: 248, y: 506, layer: 0},
  {x: 248, y: 596, layer: 0},
  {x: 438, y: 376, layer: 1},
  {x: 438, y: 462, layer: 1},
  {x: 438, y: 548, layer: 1},
  {x: 438, y: 634, layer: 1},
  {x: 634, y: 396, layer: 2},
  {x: 634, y: 472, layer: 2},
  {x: 634, y: 548, layer: 2},
  {x: 634, y: 624, layer: 2},
  {x: 828, y: 432, layer: 3},
  {x: 828, y: 510, layer: 3},
  {x: 828, y: 588, layer: 3},
];

const SYNAPTIC_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6],
  [3, 7], [3, 8], [4, 8], [5, 9], [6, 9], [6, 10],
  [7, 11], [8, 11], [8, 12], [9, 12], [9, 13], [10, 13],
];

// Analytical 64-sample damped harmonic spring curve: x(t) = 1 - e^(-3.4t) * cos(14.5t)
const HARMONIC_SPRING_PATH: string = (() => {
  const samples = 64;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = 64 + t * 760;
    const response = 1 - Math.exp(-3.4 * t) * Math.cos(14.5 * t);
    const y = 208 - response * 78;
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
      {indent: 2, cmd: 'diff(invariants, hardcoded_slots)', status: '0_RULES'},
      {indent: 2, cmd: 'check_render_graph(deterministic)', status: 'UNBOUND'},
      {indent: 1, cmd: 'audit.summary(template_shell)', status: 'FRAGILE'},
      {indent: 0, cmd: '> verdict: static_boilerplate_only', status: 'DONE'},
    ];
  }
  if (tok.startsWith('prompt')) {
    return [
      {indent: 0, cmd: '$ tokenize_prompt --stream --utf8', status: '[OK]'},
      {indent: 1, cmd: 'lexer.read(natural_language_tokens)', status: '0.3ms'},
      {indent: 1, cmd: 'parse_matrix -> typed_ast_nodes', status: 'TYPED'},
      {indent: 2, cmd: 'schema.lock(fps=30, canvas=1080x1920)', status: 'BOUND'},
      {indent: 2, cmd: 'quantize_cues(words=91, drift=0)', status: 'LOCKED'},
      {indent: 1, cmd: 'emit_sequence_graph(isolated=true)', status: 'READY'},
      {indent: 0, cmd: '> text_matrix_parsed: zero_ambiguity', status: 'PASS'},
    ];
  }
  return [
    {indent: 0, cmd: '$ parse_codebase --strict --graph', status: '[OK]'},
    {indent: 1, cmd: 'module.resolve(src/Root.tsx, seq=6)', status: 'LOCKED'},
    {indent: 1, cmd: 'verify_cues(words=91, frames=1547)', status: 'EXACT'},
    {indent: 2, cmd: 'typecheck(invariants, zero_drift)', status: '0_ERR'},
    {indent: 2, cmd: 'compile_frames(codec=h264, crf=18)', status: '30FPS'},
    {indent: 1, cmd: 'hash.verify(sha256=fdd626ed8a3b)', status: 'MATCH'},
    {indent: 0, cmd: '> deterministic_code_graph_ready', status: 'PASS'},
  ];
};

/**
 * Frameless, localized 2D semantic B-roll graphics rendered strictly inside the
 * upper focal bay (y: 340..650) ONLY when a semantic keyword ('neural' | 'syntax' | 'math')
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
          const waveLayer = -0.25 + burst.pulseProgress * 3.55;
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
                opacity: burst.opacity * 0.92,
                transform: `scale(${burst.scale})`,
                transformOrigin: '540px 506px',
              }}
            >
              <text
                x="248"
                y="344"
                fill={ORANGE}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="11"
                letterSpacing="2.4"
              >
                SYNAPTIC_NODE_LATTICE // SINGLE_PULSE [{burst.triggerText.toUpperCase()}]
              </text>

              {SYNAPTIC_EDGES.map(([a, b], idx) => {
                const na = SYNAPTIC_NODES[a];
                const nb = SYNAPTIC_NODES[b];
                const edgeMidLayer = (na.layer + nb.layer) * 0.5;
                const dist = Math.abs(waveLayer - edgeMidLayer);
                const pulse = clamp(1 - dist / 1.05, 0, 1);
                const activated = waveLayer >= edgeMidLayer;
                return (
                  <line
                    key={idx}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    stroke={pulse > 0.28 ? ORANGE : WHITE}
                    strokeOpacity={(activated ? 0.24 : 0.14) + pulse * 0.72}
                    strokeWidth={1.2 + pulse * 1.9}
                  />
                );
              })}

              {SYNAPTIC_NODES.map((node, idx) => {
                const dist = Math.abs(waveLayer - node.layer);
                const pulse = clamp(1 - dist / 0.95, 0, 1);
                const activated = waveLayer >= node.layer;
                return (
                  <g key={idx} transform={`translate(${node.x} ${node.y})`}>
                    {pulse > 0.15 && (
                      <circle
                        r={8 + pulse * 14}
                        fill="none"
                        stroke={ORANGE}
                        strokeOpacity={pulse * 0.68}
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      r={4.2 + pulse * 3.2}
                      fill={pulse > 0.25 ? ORANGE : WHITE}
                      fillOpacity={(activated ? 0.56 : 0.34) + pulse * 0.44}
                    />
                  </g>
                );
              })}
            </svg>
          );
        }

        if (burst.kind === 'syntax') {
          const lines = getSyntaxLines(burst.triggerText);
          const scrollTravel = burst.progress * 54;

          return (
            <div
              key={burst.id}
              data-broll-kind="syntax"
              data-broll-trigger={burst.triggerWordIndex}
              style={{
                position: 'absolute',
                left: 120,
                right: 120,
                top: 356,
                height: 248,
                borderLeft: `2px solid ${ORANGE}`,
                padding: '6px 0 6px 24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                opacity: burst.opacity * 0.92,
                transform: `scale(${burst.scale})`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: '1px solid rgba(244,247,255,.12)',
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  letterSpacing: 2.2,
                  color: ORANGE,
                }}
              >
                <span>TERMINAL_SYNTAX // PARSER_MATRIX [{burst.triggerText.toUpperCase()}]</span>
                <span style={{color: MUTED}}>AST · UTF-8</span>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%)',
                  maskImage:
                    'linear-gradient(to bottom, transparent 0%, black 14%, black 84%, transparent 100%)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 11,
                    paddingTop: 14,
                    transform: `translateY(${(18 - scrollTravel).toFixed(1)}px)`,
                  }}
                >
                  {lines.map((row, idx) => {
                    const activeIdx = Math.min(
                      lines.length - 1,
                      Math.floor(burst.pulseProgress * lines.length),
                    );
                    const isActiveRow = idx === activeIdx;
                    const isReached = idx <= activeIdx + 1;
                    return (
                      <div
                        key={row.cmd}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingLeft: row.indent * 20,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontSize: 14.5,
                          opacity: isReached ? 1 : 0.28,
                          color: isActiveRow ? WHITE : 'rgba(244,247,255,.62)',
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

        return (
          <svg
            key={burst.id}
            data-broll-kind="math"
            data-broll-subkind={sub}
            viewBox="0 0 888 260"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 96,
              width: 888,
              top: 356,
              height: 260,
              opacity: burst.opacity * 0.92,
              transform: `scale(${burst.scale})`,
              transformOrigin: '444px 130px',
            }}
          >
            <text
              x="64"
              y="26"
              fill={ORANGE}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="11"
              letterSpacing="2.2"
            >
              {sub === 'physics'
                ? 'HARMONIC_SPRING_CURVE // x(t) = 1 - exp(-zeta*w*t)cos(wd*t)'
                : 'CUBIC_BEZIER_CURVE // C(t) = cubic-bezier(0.65, 0, 0.35, 1)'}
            </text>

            {/* Frameless orthogonal coordinate axes */}
            <line x1="64" y1="48" x2="64" y2="214" stroke={WHITE} strokeOpacity="0.38" strokeWidth="1.5" />
            <line x1="64" y1="214" x2="824" y2="214" stroke={WHITE} strokeOpacity="0.38" strokeWidth="1.5" />
            <line x1="64" y1="130" x2="824" y2="130" stroke={WHITE} strokeOpacity="0.12" strokeDasharray="4 6" />

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
                <line x1="64" y1="208" x2="380" y2="208" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
                <line x1="516" y1="58" x2="824" y2="58" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
                <circle cx="380" cy="208" r="4.5" fill={WHITE} fillOpacity="0.72" />
                <circle cx="516" cy="58" r="4.5" fill={WHITE} fillOpacity="0.72" />
                <path
                  d="M64 208 C380 208, 516 58, 824 58"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray="820"
                  strokeDashoffset={(1 - burst.pulseProgress) * 820}
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
 * Minimal semantic-only 3D WebGL depth baseline inside <SceneThreeCanvas>.
 * Zero tint boxes, zero orbital rings, zero random spheres, zero continuous loops.
 */
export const ContextualThreeBroll: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => {
  const bursts = getActiveBrollBursts(scene, localFrame).filter((b) => b.kind !== 'neural');
  if (bursts.length === 0) return null;

  return (
    <group>
      {bursts.map((burst) => {
        const baselinePx = burst.kind === 'syntax' ? 378 : 568;
        const worldY = ((960 - baselinePx) / 960) * 5.25;
        const barW = 3.6 * burst.pulseProgress;
        return (
          <group key={burst.id} position={[0, worldY, -1.2]}>
            <mesh position={[-1.8 + barW * 0.5, 0, 0]}>
              <boxGeometry args={[Math.max(0.01, barW), 0.009, 0.01]} />
              <meshBasicMaterial
                color={ORANGE}
                transparent
                opacity={burst.opacity * 0.22}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

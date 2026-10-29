import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {CRIMSON} from './EmotionalPacing';
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
 * Contextual UI Simulation Override modes:
 * - 'prompt-cli':       Animated AI command-line / chat input box with syntax tokenization,
 *                       cursor blinking, and real-time prompt compilation.
 * - 'engine-pipeline':  Live node-graph pipeline & execution terminal showing blocks
 *                       connecting in real time.
 * - 'error-diagnostic': Red diagnostic warning overlay with stack-trace logs.
 */
export type UiSimulationKind = 'prompt-cli' | 'engine-pipeline' | 'error-diagnostic';

export type UiClauseVariant =
  | 'agent-audit'
  | 'template-paste'
  | 'surface-illusion'
  | 'codebase-break'
  | 'prompt-harder'
  | 'subsystem-graph'
  | 'pretty-prompt'
  | 'math-engine'
  | 'deterministic-inputs'
  | 'roulette-quarantine'
  | 'intent-to-engine'
  | 'compiler-dag'
  | 'verified-pillars'
  | 'template-deprecation'
  | 'monolith-engine'
  | 'toy-fatal';

export type SceneUiClauseSpec = {
  id: string;
  sceneId: SceneKey;
  kind: UiSimulationKind;
  variant: UiClauseVariant;
  startFrame: number;
  endFrame: number;
  firstWordIndex: number;
  lastWordIndex: number;
  moduleCode: string;
};

export type ActiveUiSimulationState = SceneUiClauseSpec & {
  globalFrame: number;
  clauseElapsed: number;
  clauseDuration: number;
  clauseProgress: number;
  cardReveal: number;
  cursorVisible: boolean;
  spokenClauseWords: ReadonlyArray<{index: number; text: string; isCurrent: boolean}>;
};

/**
 * Deterministic narrative keyword -> UI simulation classifier.
 */
export const classifyUiSimulationKeyword = (rawWord: string): UiSimulationKind | null => {
  const token = normalize(rawWord);
  if (
    token === 'break' ||
    token === 'breaks' ||
    token === 'broken' ||
    token === 'error' ||
    token === 'errors' ||
    token === 'fail' ||
    token === 'fails' ||
    token === 'failed' ||
    token === 'roulette' ||
    token === 'toys' ||
    token === 'stop'
  ) {
    return 'error-diagnostic';
  }
  if (
    token === 'prompt' ||
    token === 'prompts' ||
    token === 'input' ||
    token === 'inputs' ||
    token === 'intent' ||
    token === 'template' ||
    token === 'templates' ||
    token === 'pasted'
  ) {
    return 'prompt-cli';
  }
  if (
    token === 'engine' ||
    token === 'compiler' ||
    token === 'compiles' ||
    token === 'compile' ||
    token === 'code' ||
    token === 'codebase' ||
    token === 'codebases' ||
    token === 'frames' ||
    token === 'mp4' ||
    token === 'graph' ||
    token === 'timing' ||
    token === 'physics' ||
    token === 'easing' ||
    token === 'isolation' ||
    token === 'positions' ||
    token === 'transitions' ||
    token === 'math' ||
    token === 'fast' ||
    token === 'inspectable' ||
    token === 'repeatable'
  ) {
    return 'engine-pipeline';
  }
  return null;
};

/**
 * Gap-free clause schedule across all 6 isolated scenes.
 * Every active frame [scene.from .. activeEnd) resolves to an active high-tech UI
 * simulation corresponding directly to the spoken script clause — zero empty dead space.
 */
export const SCENE_UI_CLAUSES: Readonly<Record<SceneKey, readonly SceneUiClauseSpec[]>> = (() => {
  const sHook = SCENE_SEQUENCES[0];
  const sTwist = SCENE_SEQUENCES[1];
  const sShift = SCENE_SEQUENCES[2];
  const sMech = SCENE_SEQUENCES[3];
  const sPayoff = SCENE_SEQUENCES[4];
  const sOutro = SCENE_SEQUENCES[5];

  return {
    hook: [
      {
        id: 'hook-agent-audit',
        sceneId: 'hook',
        kind: 'engine-pipeline',
        variant: 'agent-audit',
        startFrame: sHook.from,
        endFrame: SCRIPT_CUES[6].startFrame, // F0000..F0105 ("Your AI agent didn't build anything.")
        firstWordIndex: 0,
        lastWordIndex: 5,
        moduleCode: 'AGENT_DAG // ZERO_BUILD_AUDIT',
      },
      {
        id: 'hook-template-paste',
        sceneId: 'hook',
        kind: 'prompt-cli',
        variant: 'template-paste',
        startFrame: SCRIPT_CUES[6].startFrame,
        endFrame: sHook.endFrame - sHook.clearFrames, // F0105..F0151 ("It pasted a template.")
        firstWordIndex: 6,
        lastWordIndex: 9,
        moduleCode: 'PROMPT_CLI // BOILERPLATE_CLONE',
      },
    ],
    twist: [
      {
        id: 'twist-surface-illusion',
        sceneId: 'twist',
        kind: 'engine-pipeline',
        variant: 'surface-illusion',
        startFrame: sTwist.from,
        endFrame: SCRIPT_CUES[19].startFrame, // F0153..F0310 ("It looks finished. That's the trick. Boilerplate demos clean.")
        firstWordIndex: 10,
        lastWordIndex: 18,
        moduleCode: 'DEMO_PIPELINE // MOCK_STRESS_TEST',
      },
      {
        id: 'twist-codebase-break',
        sceneId: 'twist',
        kind: 'error-diagnostic',
        variant: 'codebase-break',
        startFrame: SCRIPT_CUES[19].startFrame,
        endFrame: sTwist.endFrame - sTwist.clearFrames, // F0310..F0364 ("Real codebases break.")
        firstWordIndex: 19,
        lastWordIndex: 21,
        moduleCode: 'ERR_DIAGNOSTIC // CONSTRAINT_BREAK',
      },
    ],
    shift: [
      {
        id: 'shift-prompt-harder',
        sceneId: 'shift',
        kind: 'prompt-cli',
        variant: 'prompt-harder',
        startFrame: sShift.from,
        endFrame: SCRIPT_CUES[25].startFrame, // F0366..F0438 ("Prompt harder? No.")
        firstWordIndex: 22,
        lastWordIndex: 24,
        moduleCode: 'AI_PROMPT_CLI // COMPILE_REJECTED',
      },
      {
        id: 'shift-subsystem-graph',
        sceneId: 'shift',
        kind: 'engine-pipeline',
        variant: 'subsystem-graph',
        startFrame: SCRIPT_CUES[25].startFrame,
        endFrame: SCRIPT_CUES[38].startFrame, // F0438..F0594 ("It still can't infer your codebase's timing model, render graph, or hard constraints")
        firstWordIndex: 25,
        lastWordIndex: 37,
        moduleCode: 'ENGINE_GRAPH // UNBOUND_SUBSYSTEMS',
      },
      {
        id: 'shift-pretty-prompt',
        sceneId: 'shift',
        kind: 'prompt-cli',
        variant: 'pretty-prompt',
        startFrame: SCRIPT_CUES[38].startFrame,
        endFrame: sShift.endFrame - sShift.clearFrames, // F0594..F0643 ("from a pretty prompt.")
        firstWordIndex: 38,
        lastWordIndex: 41,
        moduleCode: 'AI_PROMPT_CLI // SCHEMA_GAP_AUDIT',
      },
    ],
    mechanism: [
      {
        id: 'mechanism-math-engine',
        sceneId: 'mechanism',
        kind: 'engine-pipeline',
        variant: 'math-engine',
        startFrame: sMech.from,
        endFrame: SCRIPT_CUES[54].startFrame, // F0645..F0927 ("Engine-first means physics, isolation, timing, positions, easing, transitions— defined as math.")
        firstWordIndex: 42,
        lastWordIndex: 53,
        moduleCode: 'ENGINE_CORE // PURE_MATH_PIPELINE',
      },
      {
        id: 'mechanism-deterministic-inputs',
        sceneId: 'mechanism',
        kind: 'prompt-cli',
        variant: 'deterministic-inputs',
        startFrame: SCRIPT_CUES[54].startFrame,
        endFrame: SCRIPT_CUES[58].startFrame, // F0927..F1000 ("Same inputs. Same frames.")
        firstWordIndex: 54,
        lastWordIndex: 57,
        moduleCode: 'INPUT_HASH_CLI // BIT_EXACT_FRAMES',
      },
      {
        id: 'mechanism-roulette-quarantine',
        sceneId: 'mechanism',
        kind: 'error-diagnostic',
        variant: 'roulette-quarantine',
        startFrame: SCRIPT_CUES[58].startFrame,
        endFrame: sMech.endFrame - sMech.clearFrames, // F1000..F1051 ("No template roulette.")
        firstWordIndex: 58,
        lastWordIndex: 60,
        moduleCode: 'DIAGNOSTIC_GUARD // ROULETTE_PURGED',
      },
    ],
    payoff: [
      {
        id: 'payoff-intent-to-engine',
        sceneId: 'payoff',
        kind: 'prompt-cli',
        variant: 'intent-to-engine',
        startFrame: sPayoff.from,
        endFrame: SCRIPT_CUES[66].startFrame, // F1053..F1129 ("Feed intent into the engine.")
        firstWordIndex: 61,
        lastWordIndex: 65,
        moduleCode: 'INTENT_CLI -> ENGINE_INGEST_DAG',
      },
      {
        id: 'payoff-compiler-dag',
        sceneId: 'payoff',
        kind: 'engine-pipeline',
        variant: 'compiler-dag',
        startFrame: SCRIPT_CUES[66].startFrame,
        endFrame: SCRIPT_CUES[78].startFrame, // F1129..F1297 ("It compiles the prompt to code, code to frames, frames to MP4.")
        firstWordIndex: 66,
        lastWordIndex: 77,
        moduleCode: 'ENGINE_COMPILER // PROMPT_TO_MP4',
      },
      {
        id: 'payoff-verified-pillars',
        sceneId: 'payoff',
        kind: 'engine-pipeline',
        variant: 'verified-pillars',
        startFrame: SCRIPT_CUES[78].startFrame,
        endFrame: sPayoff.endFrame - sPayoff.clearFrames, // F1297..F1398 ("Fast. Inspectable. Repeatable.")
        firstWordIndex: 78,
        lastWordIndex: 80,
        moduleCode: 'COMPILER_PROOF // VERIFIED_OUTPUT',
      },
    ],
    outro: [
      {
        id: 'outro-template-deprecation',
        sceneId: 'outro',
        kind: 'error-diagnostic',
        variant: 'template-deprecation',
        startFrame: sOutro.from,
        endFrame: SCRIPT_CUES[85].startFrame, // F1400..F1466 ("Stop playing with templates.")
        firstWordIndex: 81,
        lastWordIndex: 84,
        moduleCode: 'ERR_DEPRECATED // TEMPLATE_PURGE',
      },
      {
        id: 'outro-monolith-engine',
        sceneId: 'outro',
        kind: 'engine-pipeline',
        variant: 'monolith-engine',
        startFrame: SCRIPT_CUES[85].startFrame,
        endFrame: SCRIPT_CUES[88].startFrame, // F1466..F1509 ("Build the engine—")
        firstWordIndex: 85,
        lastWordIndex: 87,
        moduleCode: 'ENGINE_MONOLITH // PRODUCTION_DAG',
      },
      {
        id: 'outro-toy-fatal',
        sceneId: 'outro',
        kind: 'error-diagnostic',
        variant: 'toy-fatal',
        startFrame: SCRIPT_CUES[88].startFrame,
        endFrame: OUTRO_CUT_FRAME, // F1509..F1541 ("or ship toys.")
        firstWordIndex: 88,
        lastWordIndex: 90,
        moduleCode: 'FATAL_DIAGNOSTIC // TOY_BUILD_REJECT',
      },
    ],
  };
})();

/**
 * Resolves the active Contextual UI Simulation for any scene frame.
 * Returns null ONLY during the scene's pre-unmount hard-cut clear window.
 */
export const getActiveUiSimulation = (
  scene: SceneSpec,
  localFrame: number,
): ActiveUiSimulationState | null => {
  if (localFrame < 0 || localFrame >= scene.durationInFrames || isSceneCleared(scene, localFrame)) {
    return null;
  }
  const globalFrame = scene.from + localFrame;
  const clauses = SCENE_UI_CLAUSES[scene.id];
  const spec =
    clauses.find((c) => globalFrame >= c.startFrame && globalFrame < c.endFrame) ??
    clauses[clauses.length - 1];

  const clauseElapsed = Math.max(0, globalFrame - spec.startFrame);
  const clauseDuration = Math.max(1, spec.endFrame - spec.startFrame);
  const clauseProgress = clamp(clauseElapsed / clauseDuration, 0, 1);

  const activeEnd =
    scene.id === 'outro' ? OUTRO_CUT_FRAME : scene.endFrame - scene.clearFrames;
  const sceneExit = clamp((activeEnd - globalFrame) / 6, 0, 1);
  const clauseEnter = spring({
    frame: clauseElapsed,
    fps: FPS,
    config: {damping: 16, stiffness: 210},
  });

  // Deterministic 30fps terminal block cursor blink (8 frames ON, 7 frames OFF)
  const cursorVisible = globalFrame % 15 < 9;

  // Strictly spoken-so-far words in the current clause (never previews future narration!)
  const spokenClauseWords: Array<{index: number; text: string; isCurrent: boolean}> = [];
  for (let i = spec.firstWordIndex; i <= spec.lastWordIndex; i += 1) {
    const cue = SCRIPT_CUES[i];
    if (cue.startFrame > globalFrame) break;
    spokenClauseWords.push({
      index: i,
      text: cue.text,
      isCurrent: globalFrame >= cue.startFrame && globalFrame < cue.endFrame,
    });
  }

  return {
    ...spec,
    globalFrame,
    clauseElapsed,
    clauseDuration,
    clauseProgress,
    cardReveal: clamp(clauseEnter * sceneExit, 0, 1),
    cursorVisible,
    spokenClauseWords,
  };
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const HARMONIC_SPRING_CURVE_PATH: string = (() => {
  const samples = 64;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = 48 + t * 800;
    const y = 214 - (1 - Math.exp(-3.5 * t) * Math.cos(14.5 * t)) * 84;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

/**
 * Shared dark sci-fi / tech documentary card shell for Upper Focal Cards (y: 120..676)
 * and Lower-Third UI Simulation Docks (y: 1144..1780).
 */
const SciFiUiCard: React.FC<{
  slot: 'upper-focal' | 'lower-third';
  title: string;
  badge: string;
  accentColor: string;
  alertMode?: boolean;
  reveal: number;
  children: React.ReactNode;
  dataAttrs?: Record<string, string | number | boolean>;
}> = ({slot, title, badge, accentColor, alertMode = false, reveal, children, dataAttrs}) => {
  const isUpper = slot === 'upper-focal';
  const top = isUpper ? 120 : 1144;
  const height = isUpper ? 552 : 632;
  const slideY = isUpper ? (1 - reveal) * -22 : (1 - reveal) * 24;

  const borderColor = alertMode ? 'rgba(225, 29, 72, 0.66)' : 'rgba(244, 247, 255, 0.16)';
  const bgGradient = alertMode
    ? 'linear-gradient(180deg, rgba(44, 10, 22, 0.92) 0%, rgba(15, 9, 18, 0.95) 100%)'
    : 'linear-gradient(180deg, rgba(15, 22, 37, 0.90) 0%, rgba(9, 13, 23, 0.94) 100%)';

  return (
    <div
      data-ui-slot={slot}
      {...dataAttrs}
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top,
        height,
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        borderTop: `2px solid ${accentColor}`,
        boxShadow: alertMode
          ? '0 22px 60px rgba(0,0,0,0.68), 0 0 42px rgba(225,29,72,0.22), inset 0 0 28px rgba(225,29,72,0.12)'
          : '0 22px 60px rgba(0,0,0,0.62), inset 0 1px 0 rgba(244,247,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        opacity: 0.18 + reveal * 0.82,
        transform: `translate3d(0, ${slideY.toFixed(1)}px, 0) scale(${(0.982 + reveal * 0.018).toFixed(3)})`,
      }}
    >
      {/* Hazard / telemetry header chrome */}
      <div
        style={{
          height: 48,
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alertMode ? 'rgba(225,29,72,0.34)' : 'rgba(244,247,255,0.10)'}`,
          background: alertMode
            ? 'repeating-linear-gradient(-45deg, rgba(225,29,72,0.18), rgba(225,29,72,0.18) 10px, rgba(15,9,18,0.35) 10px, rgba(15,9,18,0.35) 20px)'
            : 'rgba(244,247,255,0.025)',
          flexShrink: 0,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span
            style={{
              width: 9,
              height: 9,
              background: accentColor,
              boxShadow: `0 0 12px ${accentColor}`,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2.1,
              color: WHITE,
            }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: 1.8,
            padding: '4px 10px',
            color: alertMode ? '#ffd6df' : accentColor,
            border: `1px solid ${alertMode ? 'rgba(225,29,72,0.65)' : 'rgba(255,69,0,0.45)'}`,
            background: alertMode ? 'rgba(225,29,72,0.22)' : 'rgba(255,69,0,0.10)',
          }}
        >
          {badge}
        </span>
      </div>

      {/* Body container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '22px 26px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// 1. PROMPT / INPUT SIMULATION: AI Command-Line & Chat Input Box + Tokenizer
// ============================================================================
type PromptPreset = {
  upperTitle: string;
  upperBadge: string;
  promptPrefix: string;
  rawInput: string;
  tokens: ReadonlyArray<{tag: string; val: string; hot?: boolean; err?: boolean}>;
  compileStages: ReadonlyArray<{label: string; value: string; status: 'ok' | 'warn' | 'err'}>;
  lowerTitle: string;
  lowerBadge: string;
  compilerLogs: ReadonlyArray<{line: string; state: string; alert?: boolean}>;
  rejected?: boolean;
};

const getPromptPreset = (state: ActiveUiSimulationState): PromptPreset => {
  const gf = state.globalFrame;
  switch (state.variant) {
    case 'template-paste': {
      const pastedHit = gf >= SCRIPT_CUES[7].startFrame; // "pasted"
      return {
        upperTitle: 'AI_CHAT_INPUT // TEMPLATE_CLIPBOARD_PASTE',
        upperBadge: pastedHit ? 'CLONE_STAMPED' : 'PROMPT_PARSED',
        promptPrefix: 'agent-chat >',
        rawInput: '"build me a finished motion SaaS app fast"',
        tokens: [
          {tag: 'VERB', val: 'build'},
          {tag: 'OBJ', val: 'motion_app'},
          {tag: 'SHORTCUT', val: 'paste(preset_v1.tsx)', hot: true, err: pastedHit},
          {tag: 'SCHEMA', val: 'NONE', err: pastedHit},
        ],
        compileStages: [
          {label: 'SYNTAX_TOKENIZER', value: '8 TOKENS PARSED', status: 'ok'},
          {label: 'CLIPBOARD_SOURCE', value: 'preset_template.tsx (98.4% CLONE)', status: 'warn'},
          {label: 'ENGINE_ARCHITECTURE', value: '0 CUSTOM NODES SYNTHESIZED', status: 'err'},
        ],
        lowerTitle: 'PROMPT_COMPILER_AUDIT // AST_DIFF_MATRIX',
        lowerBadge: 'SHA_COLLISION',
        compilerLogs: [
          {line: '$ agent.tokenize("build me a finished motion SaaS app")', state: '0.4ms'},
          {line: '  -> bypassing engine graph synthesis...', state: 'SKIP', alert: true},
          {line: '  -> cp templates/saas_hero_preset.tsx src/App.tsx', state: 'PASTED', alert: pastedHit},
          {line: '  -> timing_model: UNBOUND | physics_solver: NULL', state: '0_RULES', alert: pastedHit},
          {line: '  -> ast.diff(preset_v1, output) === 0 structural edits', state: 'CLONE', alert: pastedHit},
        ],
        rejected: pastedHit,
      };
    }

    case 'prompt-harder': {
      const noHit = gf >= SCRIPT_CUES[24].startFrame; // "No." at F0415
      return {
        upperTitle: 'AI_COMMAND_INPUT // PROMPT_TOKENIZER_V4',
        upperBadge: noHit ? 'COMPILE_REJECTED' : 'TYPING_PROMPT',
        promptPrefix: 'prompt://cli >',
        rawInput: 'make it production ready, fix timing, 10x cleaner, NO BUGS!!',
        tokens: [
          {tag: 'IMP', val: 'make_prod_ready'},
          {tag: 'VAGUE', val: 'fix_timing', hot: true},
          {tag: 'ADJ', val: '10x_cleaner'},
          {tag: 'CAPS', val: 'NO_BUGS!!', err: noHit},
          {tag: 'CLOCK', val: 'MISSING', err: true},
        ],
        compileStages: [
          {label: 'LEXICAL_STREAM', value: '12 NATURAL_LANG TOKENS', status: 'ok'},
          {label: 'INTENT_ENTROPY', value: '0.94 HIGH AMBIGUITY', status: 'warn'},
          {
            label: 'PROMPT_COMPILATION',
            value: noHit ? 'REJECTED // NO_RUNTIME_SPEC' : 'ATTEMPTING_INFERENCE...',
            status: noHit ? 'err' : 'warn',
          },
        ],
        lowerTitle: 'REALTIME_PROMPT_COMPILER // BINDING_STDOUT',
        lowerBadge: noHit ? 'EXIT_1 // NO_SCHEMA' : 'COMPILING...',
        compilerLogs: [
          {line: '$ promptc --compile --strict --input="Prompt harder?"', state: 'PARSE'},
          {line: '  tok[0..3]: [IMP:"make"] [ADJ:"production"] [ADV:"harder"]', state: 'TOKENIZED'},
          {line: '  resolve(codebase.timingModel) -> undefined', state: 'UNBOUND', alert: true},
          {line: '  resolve(codebase.renderGraph) -> undefined', state: 'UNBOUND', alert: true},
          {
            line: noHit
              ? '  [REJECT] Verdict: NO — adjectives cannot synthesize invariants'
              : '  waiting for deterministic engine schema...',
            state: noHit ? 'DENIED' : 'WAIT',
            alert: noHit,
          },
        ],
        rejected: noHit,
      };
    }

    case 'pretty-prompt': {
      return {
        upperTitle: 'AI_CHAT_PROMPT // PRETTY_PROMPT_COMPILER',
        upperBadge: '0/3_BOUND',
        promptPrefix: 'chat://input >',
        rawInput: '"craft a sleek cinematic video with smooth apple-style motion"',
        tokens: [
          {tag: 'STYLE', val: 'sleek_cinematic'},
          {tag: 'VIBE', val: 'smooth_motion', hot: true},
          {tag: 'TIMING', val: 'UNSPECIFIED', err: true},
          {tag: 'DAG', val: 'UNSPECIFIED', err: true},
        ],
        compileStages: [
          {label: 'PROSE_AESTHETIC_SCORE', value: '99.2% ("PRETTY_PROMPT")', status: 'ok'},
          {label: 'TIMING_MODEL_BINDING', value: 'NULL // CANNOT_INFER', status: 'err'},
          {label: 'HARD_CONSTRAINTS_LOCK', value: '0 OF 3 INVARIANTS BOUND', status: 'err'},
        ],
        lowerTitle: 'PROMPT_COMPILATION_MATRIX // INFERENCE_AUDIT',
        lowerBadge: 'SCHEMA_MISSING',
        compilerLogs: [
          {line: '$ llm.parse_prompt("sleek cinematic video with smooth motion")', state: 'OK'},
          {line: '  token_stream -> 9 descriptive adjectives extracted', state: '9_TOK'},
          {line: '  infer(frame_clock_30hz)     -> FAILED (no prose mapping)', state: 'NULL', alert: true},
          {line: '  infer(isolated_sequences)   -> FAILED (no DAG spec)', state: 'NULL', alert: true},
          {line: '  infer(hard_constraints)     -> FAILED (0 math bounds)', state: '0_LOCK', alert: true},
        ],
        rejected: false,
      };
    }

    case 'deterministic-inputs': {
      const sameFramesHit = gf >= SCRIPT_CUES[56].startFrame; // "Same frames."
      return {
        upperTitle: 'DETERMINISTIC_CLI_INPUT // REPRODUCIBLE_SEED',
        upperBadge: sameFramesHit ? 'FRAME_HASH_LOCKED' : 'INPUT_LOCKED',
        promptPrefix: 'engine://cli $',
        rawInput: 'render --input=spec.ts --wav=fdd626ed8a3b --fps=30 --crf=18',
        tokens: [
          {tag: 'CMD', val: 'render', hot: true},
          {tag: 'INPUT', val: 'spec.ts', hot: true},
          {tag: 'SHA256', val: 'fdd626ed8a3b'},
          {tag: 'FPS', val: '30_LOCKED'},
          {tag: 'FRAMES', val: '1547_EXACT', hot: sameFramesHit},
        ],
        compileStages: [
          {label: 'INPUT_VECTOR_SHA256', value: 'fdd626ed8a3bb1af... [IMMUTABLE]', status: 'ok'},
          {label: 'RUN_01_FRAME_DIGEST', value: '0x9A4F2C81E0 // 1,547 FRAMES', status: 'ok'},
          {
            label: 'RUN_02_FRAME_DIGEST',
            value: sameFramesHit ? '0x9A4F2C81E0 // 100% BIT-IDENTICAL' : 'VERIFYING_DETERMINISM...',
            status: 'ok',
          },
        ],
        lowerTitle: 'INPUT_TO_FRAME_COMPILER // BIT_EXACT_VERIFIER',
        lowerBadge: '0.00%_DRIFT',
        compilerLogs: [
          {line: '$ verify-frame-sync --inputs=locked --runs=2', state: 'LOCKED'},
          {line: '  input_hash(voiceover.wav) == fdd626ed8a3b [MATCH]', state: 'EXACT'},
          {line: '  word_cues[0..90] -> quantized 30fps integer intervals', state: '91/91'},
          {line: '  compare(runA.frame[0..1546], runB.frame[0..1546])', state: '0_DIFF'},
          {line: '  verdict: SAME_INPUTS => SAME_FRAMES [DETERMINISTIC]', state: 'PASS'},
        ],
      };
    }

    default: {
      // 'intent-to-engine': "Feed intent into the engine." (F1053..F1129)
      const engineHit = gf >= SCRIPT_CUES[65].startFrame - 4;
      return {
        upperTitle: 'STRUCTURED_INTENT_INPUT // PROMPT_COMPILER',
        upperBadge: engineHit ? 'INGESTED_BY_ENGINE' : 'TOKENIZING_INTENT',
        promptPrefix: 'intent://feed $',
        rawInput: 'engine.ingest({beat: "payoff", cues: 91, res: "1080x1920", fps: 30})',
        tokens: [
          {tag: 'API', val: 'engine.ingest', hot: true},
          {tag: 'BEAT', val: 'payoff'},
          {tag: 'CUES', val: '91_WORDS', hot: true},
          {tag: 'RES', val: '1080x1920'},
          {tag: 'PIPE', val: '-> ENGINE_DAG', hot: engineHit},
        ],
        compileStages: [
          {label: 'INTENT_TOKENIZATION', value: 'TYPED_AST_GENERATED (0.2ms)', status: 'ok'},
          {label: 'CONSTRAINT_VALIDATION', value: '6 SEQUENCES · 1,547 FRAMES', status: 'ok'},
          {
            label: 'ENGINE_INGEST_BUS',
            value: engineHit ? 'CONNECTED -> LIVE_COMPILER_DAG' : 'STREAMING_TO_ENGINE...',
            status: 'ok',
          },
        ],
        lowerTitle: 'LIVE_ENGINE_NODE_PIPELINE // INTENT_INGEST_GRAPH',
        lowerBadge: engineHit ? '4/4_NODES_ONLINE' : 'CONNECTING_DAG',
        compilerLogs: [
          {line: '$ intentc --emit=typed-ast -> pipe(EngineCore)', state: 'OK'},
          {line: '  [NODE_01] INTENT_SCHEMA   ━━▶ [NODE_02] TIMING_SOLVER', state: 'LINKED'},
          {line: '  [NODE_02] TIMING_SOLVER   ━━▶ [NODE_03] SCENE_ISOLATOR', state: 'LINKED'},
          {line: '  [NODE_03] SCENE_ISOLATOR  ━━▶ [NODE_04] MP4_COMPILER', state: engineHit ? 'LOCKED' : 'SYNC'},
          {line: '  engine_status: READY_FOR_FRAME_COMPILATION', state: 'ONLINE'},
        ],
      };
    }
  }
};

const PromptCliSimulationPair: React.FC<{state: ActiveUiSimulationState}> = ({state}) => {
  const preset = getPromptPreset(state);
  const accent = preset.rejected ? CRIMSON : ORANGE;

  // Progressive character typing across the first 58% of the clause
  const typeRatio = clamp(state.clauseElapsed / Math.max(8, state.clauseDuration * 0.56), 0.18, 1);
  const typedChars = Math.max(1, Math.round(preset.rawInput.length * typeRatio));
  const visibleInput = preset.rawInput.slice(0, typedChars);

  const visibleTokenCount = Math.max(
    1,
    Math.min(
      preset.tokens.length,
      Math.ceil(
        interpolate(state.clauseElapsed, [0, Math.max(8, state.clauseDuration * 0.62)], [1, preset.tokens.length], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      ),
    ),
  );

  return (
    <>
      <SciFiUiCard
        slot="upper-focal"
        title={preset.upperTitle}
        badge={preset.upperBadge}
        accentColor={accent}
        alertMode={Boolean(preset.rejected)}
        reveal={state.cardReveal}
        dataAttrs={{
          'data-ui-sim-kind': 'prompt-cli',
          'data-ui-variant': state.variant,
          'data-cursor-blink': state.cursorVisible ? 'on' : 'off',
          'data-token-count': visibleTokenCount,
        }}
      >
        {/* Animated AI CLI / Chat Input Box */}
        <div
          style={{
            background: 'rgba(6, 9, 17, 0.92)',
            border: `1px solid ${preset.rejected ? 'rgba(225,29,72,0.58)' : 'rgba(255,69,0,0.48)'}`,
            padding: '16px 20px',
            boxShadow: 'inset 0 0 24px rgba(0,0,0,0.65)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: 1.8,
              color: MUTED,
            }}
          >
            <span style={{color: accent}}>{preset.promptPrefix}</span>
            <span>UTF-8 · LIVE_INPUT_BUFFER</span>
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 18,
              lineHeight: 1.4,
              color: WHITE,
              minHeight: 52,
              wordBreak: 'break-word',
            }}
          >
            <span>{visibleInput}</span>
            <span
              data-blinking-cursor="true"
              style={{
                display: 'inline-block',
                width: 11,
                height: 21,
                marginLeft: 5,
                verticalAlign: 'text-bottom',
                background: accent,
                opacity: state.cursorVisible ? 1 : 0.12,
                boxShadow: state.cursorVisible ? `0 0 12px ${accent}` : 'none',
              }}
            />
          </div>
        </div>

        {/* Syntax Tokenization Stream */}
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: 2,
              color: MUTED,
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>SYNTAX_TOKENIZATION_STREAM</span>
            <span style={{color: accent}}>
              {visibleTokenCount}/{preset.tokens.length} TOKENS
            </span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
            {preset.tokens.map((tok, idx) => {
              const active = idx < visibleTokenCount;
              const borderCol = tok.err
                ? CRIMSON
                : tok.hot
                  ? ORANGE
                  : 'rgba(244,247,255,0.22)';
              return (
                <div
                  key={`${tok.tag}-${tok.val}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    border: `1px solid ${active ? borderCol : 'rgba(244,247,255,0.08)'}`,
                    background: active
                      ? tok.err
                        ? 'rgba(225,29,72,0.18)'
                        : tok.hot
                          ? 'rgba(255,69,0,0.14)'
                          : 'rgba(244,247,255,0.05)'
                      : 'rgba(244,247,255,0.015)',
                    opacity: active ? 1 : 0.28,
                    fontFamily: MONO,
                    fontSize: 13,
                  }}
                >
                  <span style={{color: tok.err ? '#ff8fa3' : ORANGE, fontWeight: 700, fontSize: 11}}>
                    [{tok.tag}]
                  </span>
                  <span style={{color: WHITE}}>{tok.val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Prompt Compilation Status Rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            borderTop: '1px solid rgba(244,247,255,0.10)',
            paddingTop: 14,
          }}
        >
          {preset.compileStages.map((st) => {
            const statusCol =
              st.status === 'err' ? CRIMSON : st.status === 'warn' ? ORANGE : '#34d399';
            return (
              <div
                key={st.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: MONO,
                  fontSize: 13,
                }}
              >
                <span style={{color: MUTED, letterSpacing: 1.4}}>{st.label}</span>
                <span style={{color: statusCol, fontWeight: 700}}>{st.value}</span>
              </div>
            );
          })}
        </div>
      </SciFiUiCard>

      {/* Lower-Third Coupled Execution / Prompt Compilation Console */}
      <SciFiUiCard
        slot="lower-third"
        title={preset.lowerTitle}
        badge={preset.lowerBadge}
        accentColor={accent}
        alertMode={Boolean(preset.rejected)}
        reveal={state.cardReveal}
        dataAttrs={{
          'data-ui-lower-kind': state.variant === 'intent-to-engine' ? 'engine-pipeline' : 'prompt-cli',
        }}
      >
        {state.variant === 'intent-to-engine' && (
          <svg
            viewBox="0 0 880 148"
            style={{width: '100%', height: 148, flexShrink: 0, marginBottom: 8}}
          >
            {[
              {x: 18, label: '01 INTENT_AST', sub: '91 CUES'},
              {x: 238, label: '02 TIMING_LOCK', sub: '30.0 FPS'},
              {x: 458, label: '03 SCENE_DAG', sub: '6 SEQ'},
              {x: 678, label: '04 ENGINE_CORE', sub: 'READY'},
            ].map((node, i) => {
              const reached = state.clauseProgress >= i * 0.22;
              return (
                <g key={node.label}>
                  {i < 3 && (
                    <line
                      x1={node.x + 184}
                      y1={74}
                      x2={node.x + 220}
                      y2={74}
                      stroke={reached ? ORANGE : WHITE}
                      strokeOpacity={reached ? 0.95 : 0.2}
                      strokeWidth="2.5"
                    />
                  )}
                  <rect
                    x={node.x}
                    y={24}
                    width={184}
                    height={100}
                    fill={reached ? 'rgba(255,69,0,0.12)' : 'rgba(244,247,255,0.03)'}
                    stroke={reached ? ORANGE : 'rgba(244,247,255,0.2)'}
                    strokeWidth="1.5"
                  />
                  <text x={node.x + 16} y={64} fill={WHITE} fontFamily={MONO} fontSize="13" fontWeight="700">
                    {node.label}
                  </text>
                  <text x={node.x + 16} y={96} fill={reached ? ORANGE : MUTED} fontFamily={MONO} fontSize="12">
                    {node.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: 15, flex: 1, justifyContent: 'center'}}>
          {preset.compilerLogs.map((row, idx) => {
            const rowVisible =
              idx <= Math.floor(state.clauseProgress * preset.compilerLogs.length) + 1;
            return (
              <div
                key={row.line}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: row.alert ? 'rgba(225,29,72,0.12)' : 'rgba(244,247,255,0.03)',
                  borderLeft: `3px solid ${row.alert ? CRIMSON : rowVisible ? ORANGE : 'rgba(244,247,255,0.15)'}`,
                  opacity: rowVisible ? 1 : 0.25,
                  fontFamily: MONO,
                  fontSize: 14,
                }}
              >
                <span style={{color: row.alert ? '#ffd6df' : WHITE}}>{row.line}</span>
                <span
                  style={{
                    color: row.alert ? CRIMSON : ORANGE,
                    fontWeight: 700,
                    fontSize: 12,
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                >
                  [{row.state}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Compilation Progress Bar */}
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <span style={{fontFamily: MONO, fontSize: 11.5, letterSpacing: 1.8, color: MUTED}}>
            PROMPT_COMPILER_BUS
          </span>
          <div style={{flex: 1, height: 6, background: 'rgba(244,247,255,0.10)', position: 'relative'}}>
            <div
              style={{
                width: `${Math.round(state.clauseProgress * 100)}%`,
                height: '100%',
                background: accent,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
          </div>
          <span style={{fontFamily: MONO, fontSize: 12, color: accent, fontWeight: 700}}>
            {Math.round(state.clauseProgress * 100)}%
          </span>
        </div>
      </SciFiUiCard>
    </>
  );
};

// ============================================================================
// 2. ENGINE / COMPILER SIMULATION: Live Node-Graph Pipeline & Execution Terminal
// ============================================================================
const EnginePipelineSimulationPair: React.FC<{state: ActiveUiSimulationState}> = ({state}) => {
  const gf = state.globalFrame;

  // Determine 4-block live node-graph configuration per scene clause
  const graphConfig = (() => {
    switch (state.variant) {
      case 'agent-audit': {
        const failed = gf >= SCRIPT_CUES[3].startFrame; // "didn't"
        return {
          upperTitle: 'AGENT_EXECUTION_PIPELINE // BUILD_VERIFIER',
          upperBadge: failed ? '0_ARTIFACTS_BUILT' : 'AGENT_DISPATCH',
          lowerTitle: 'AGENT_EXECUTION_TERMINAL // WORKSPACE_AUDIT',
          lowerBadge: failed ? 'EMPTY_BUILD' : 'SCANNING_DAG',
          alert: failed,
          nodes: [
            {id: 'N1', title: 'USER_TASK', sub: 'PROMPT_REQ', active: true},
            {id: 'N2', title: 'AI_AGENT', sub: 'SYNAPTIC_LLM', active: gf >= SCRIPT_CUES[1].startFrame},
            {id: 'N3', title: 'ENGINE_DAG', sub: failed ? '0 NODES' : 'PENDING', active: !failed, fault: failed},
            {id: 'N4', title: 'BUILD_OUT', sub: failed ? 'NULL_DIFF' : 'WAITING', active: false, fault: failed},
          ],
          logs: [
            {cmd: '$ agent.run --task="build deterministic motion engine"', status: 'START'},
            {cmd: '  synaptic_dispatch(model="agent-v4", tools=12)', status: 'ACTIVE'},
            {cmd: '  inspect(src/engine/timing_graph.ts) -> NOT_CREATED', status: failed ? '0_FILES' : 'SCAN', err: failed},
            {cmd: '  git diff --stat engine_primitives/', status: failed ? '0_INSERTIONS' : 'WAIT', err: failed},
            {cmd: '  audit_verdict: agent synthesized ZERO engine architecture', status: failed ? 'EMPTY' : 'AUDIT', err: failed},
          ],
        };
      }

      case 'surface-illusion': {
        const trickHit = gf >= SCRIPT_CUES[13].startFrame; // "That's the trick."
        const boilerplateHit = gf >= SCRIPT_CUES[16].startFrame; // "Boilerplate demos clean."
        return {
          upperTitle: 'DEMO_SURFACE_PIPELINE // XRAY_INSPECTOR',
          upperBadge: boilerplateHit ? 'MOCK_FIXTURE_ONLY' : trickHit ? 'ILLUSION_DETECTED' : 'SURFACE_200_OK',
          lowerTitle: 'EXECUTION_STRESS_TERMINAL // CONCURRENCY_RAMP',
          lowerBadge: `LOAD_${Math.round(15 + state.clauseProgress * 75)}%`,
          alert: false,
          nodes: [
            {id: 'N1', title: 'MOCK_PROPS', sub: 'STATIC_JSON', active: true},
            {id: 'N2', title: 'UI_SHELL', sub: 'LOOKS_FINISHED', active: true},
            {id: 'N3', title: 'TIMING_LOCK', sub: trickHit ? 'BYPASSED' : 'UNCHECKED', active: !trickHit, fault: trickHit},
            {id: 'N4', title: 'DEMO_RENDER', sub: 'CLEAN_ON_MOCK', active: true},
          ],
          logs: [
            {cmd: '$ preview-server --fixture=happy_path_mock.json', status: '200_OK'},
            {cmd: '  ui_surface.check() -> "looks finished" (static CSS)', status: 'PASS'},
            {cmd: '  xray.scan(state_isolation, async_race_guards)', status: trickHit ? 'MISSING' : 'SCAN', err: trickHit},
            {cmd: '  stress.inject(real_codebase_schema, 91_word_cues)', status: boilerplateHit ? 'UNSTABLE' : 'RAMP', err: boilerplateHit},
            {cmd: '  warning: boilerplate only passes zero-constraint demos', status: 'FRAGILE', err: boilerplateHit},
          ],
        };
      }

      case 'subsystem-graph': {
        const timingHit = gf >= SCRIPT_CUES[31].startFrame; // "timing" (F0496)
        const renderHit = gf >= SCRIPT_CUES[33].startFrame; // "render" (F0533)
        const hardHit = gf >= SCRIPT_CUES[36].startFrame; // "hard" (F0563)
        return {
          upperTitle: 'CODEBASE_ENGINE_GRAPH // REQUIRED_INVARIANTS',
          upperBadge: hardHit ? '3/3_UNRESOLVED_BY_PROSE' : timingHit ? 'INSPECTING_MODEL' : 'INFERENCE_GAP',
          lowerTitle: 'RUNTIME_ARCHITECTURE_TERMINAL // SUBSYSTEM_PROBE',
          lowerBadge: 'PROSE_CANNOT_INFER',
          alert: false,
          showTimingGrid: timingHit && !renderHit,
          nodes: [
            {id: 'N1', title: 'CODEBASE_AST', sub: 'PROD_REPO', active: true},
            {id: 'N2', title: 'TIMING_MODEL', sub: timingHit ? '30HZ_CLOCK' : 'LOCKED_SPEC', active: timingHit},
            {id: 'N3', title: 'RENDER_GRAPH', sub: renderHit ? '6_SEQ_DAG' : 'ISOLATED_DAG', active: renderHit},
            {id: 'N4', title: 'CONSTRAINTS', sub: hardHit ? 'HARD_BOUNDS' : 'SHA_LOCK', active: hardHit},
          ],
          logs: [
            {cmd: '$ engine-probe --verify-inference-from-prose', status: 'AUDIT'},
            {cmd: '  [01] codebase.timing_model  (30fps integer frame map)', status: timingHit ? 'REQUIRED' : 'SCAN'},
            {cmd: '  [02] codebase.render_graph  (6 isolated <Sequence> nodes)', status: renderHit ? 'REQUIRED' : 'SCAN'},
            {cmd: '  [03] codebase.constraints   (1080x1920, SHA256 sync)', status: hardHit ? 'REQUIRED' : 'SCAN'},
            {cmd: '  result: must be defined in engine code, never guessed', status: 'STRICT', err: true},
          ],
        };
      }

      case 'math-engine': {
        const physicsHit = gf >= SCRIPT_CUES[45].startFrame;
        const isolationHit = gf >= SCRIPT_CUES[46].startFrame;
        const timingHit = gf >= SCRIPT_CUES[47].startFrame;
        const positionsHit = gf >= SCRIPT_CUES[48].startFrame;
        const easingHit = gf >= SCRIPT_CUES[49].startFrame;
        const mathHit = gf >= SCRIPT_CUES[51].startFrame;

        const mathSub =
          easingHit && !mathHit
            ? 'easing'
            : timingHit && !positionsHit
              ? 'timing'
              : physicsHit && !isolationHit
                ? 'physics'
                : 'dag';

        return {
          upperTitle: 'ENGINE_FIRST_SOLVER // MATHEMATICAL_LAWS',
          upperBadge: mathHit ? 'DEFINED_AS_PURE_MATH' : `SOLVING_${mathSub.toUpperCase()}`,
          lowerTitle: 'LIVE_ENGINE_NODE_PIPELINE // PRIMITIVES_CONNECTING',
          lowerBadge: `${[physicsHit, isolationHit, timingHit, positionsHit, easingHit, mathHit].filter(Boolean).length || 1}/6_LOCKED`,
          alert: false,
          mathVisual: mathSub,
          nodes: [
            {id: 'N1', title: 'PHYSICS_LAW', sub: 'damping:8 k:300', active: true},
            {id: 'N2', title: 'ISOLATION', sub: 'SEQ_UNMOUNT', active: isolationHit || physicsHit},
            {id: 'N3', title: 'TIMING_GRID', sub: 'f -> [0..1546]', active: timingHit},
            {id: 'N4', title: 'EASING_MATH', sub: mathHit ? 'f(frame)=EXACT' : 'CUBIC_BEZIER', active: easingHit || mathHit},
          ],
          logs: [
            {cmd: '$ engine.define({mode: "engine-first", clock: "30fps"})', status: 'INIT'},
            {cmd: '  physics   := spring({frame, damping: 8, stiffness: 300})', status: physicsHit ? 'LOCKED' : 'READY'},
            {cmd: '  isolation := <Sequence from={cut} durationInFrames={dur}>', status: isolationHit ? 'LOCKED' : 'READY'},
            {cmd: '  timing    := WORD_START_FRAMES[i] | positions := R^2(1080,1920)', status: timingHit ? 'LOCKED' : 'READY'},
            {cmd: '  easing    := cubicBezier(0.65,0,0.35,1) -> PURE_MATH', status: mathHit ? 'PROVEN' : easingHit ? 'LOCKED' : 'READY'},
          ],
        };
      }

      case 'compiler-dag': {
        const promptStage = gf >= SCRIPT_CUES[67].startFrame; // "compiles" / "prompt"
        const codeStage = gf >= SCRIPT_CUES[71].startFrame; // "code,"
        const framesStage = gf >= SCRIPT_CUES[74].startFrame; // "frames,"
        const mp4Stage = gf >= SCRIPT_CUES[77].startFrame; // "MP4."
        return {
          upperTitle: 'ENGINE_COMPILER_DAG // REALTIME_BUILD_PIPELINE',
          upperBadge: mp4Stage
            ? 'MP4_ENCODED_READY'
            : framesStage
              ? 'STAGE_3 // RASTER_FRAMES'
              : codeStage
                ? 'STAGE_2 // TSX_AST'
                : 'STAGE_1 // PROMPT_PARSE',
          lowerTitle: 'COMPILER_EXECUTION_TERMINAL // PROMPT_TO_MP4',
          lowerBadge: mp4Stage ? '1547/1547_DONE' : 'COMPILING_LIVE',
          alert: false,
          showInlinePromptBar: true,
          nodes: [
            {id: 'N1', title: '01 PROMPT', sub: 'TOKENIZED_AST', active: promptStage || true},
            {id: 'N2', title: '02 TSX_CODE', sub: codeStage ? 'TYPED_MODULES' : 'PENDING', active: codeStage},
            {id: 'N3', title: '03 FRAMES', sub: framesStage ? '1,547_RGBA' : 'PENDING', active: framesStage},
            {id: 'N4', title: '04 H264_MP4', sub: mp4Stage ? '1080x1920_OK' : 'PENDING', active: mp4Stage},
          ],
          logs: [
            {cmd: 'prompt://in > compile({scenes: 6, words: 91, target: "mp4"})', status: 'AST_OK'},
            {cmd: '  [1/3] prompt -> code   : tsc --noEmit (src/Root.tsx + 6 scenes)', status: codeStage ? '0_ERR' : 'RUN'},
            {cmd: '  [2/3] code   -> frames : remotion render 0..1546 @ 30fps', status: framesStage ? '1547f' : 'WAIT'},
            {cmd: '  [3/3] frames -> MP4    : libx264 crf=18 + aac 48kHz stereo', status: mp4Stage ? 'MUXED' : 'WAIT'},
            {cmd: '  artifact: deliverables/AI-Agent-Engine-First.mp4', status: mp4Stage ? 'READY' : 'PIPE'},
          ],
        };
      }

      case 'verified-pillars': {
        const fastHit = gf >= SCRIPT_CUES[78].startFrame;
        const inspectHit = gf >= SCRIPT_CUES[79].startFrame;
        const repeatHit = gf >= SCRIPT_CUES[80].startFrame;
        return {
          upperTitle: 'PRODUCTION_ENGINE_TELEMETRY // VERIFIED_PILLARS',
          upperBadge: repeatHit ? '3/3_INVARIANTS_PROVEN' : 'VERIFYING_BUILD',
          lowerTitle: 'EXECUTION_PIPELINE_SUMMARY // DETERMINISTIC_LOCK',
          lowerBadge: 'ALL_CHECKS_GREEN',
          alert: false,
          nodes: [
            {id: 'N1', title: 'FAST', sub: 'ZERO_KEYFRAMES', active: fastHit || true},
            {id: 'N2', title: 'INSPECTABLE', sub: inspectHit ? 'DIFFABLE_TSX' : 'AST_READY', active: inspectHit},
            {id: 'N3', title: 'REPEATABLE', sub: repeatHit ? 'SHA256_EXACT' : 'HASH_LOCK', active: repeatHit},
            {id: 'N4', title: 'SHIPPED_MP4', sub: '1080x1920_30P', active: repeatHit},
          ],
          logs: [
            {cmd: '$ npm run typecheck && npm run verify:sync', status: 'PASS'},
            {cmd: '  [FAST]        automated headless Chromium ANGLE pipeline', status: fastHit ? 'VERIFIED' : 'OK'},
            {cmd: '  [INSPECTABLE] every frame pure function of (scene, localFrame)', status: inspectHit ? 'VERIFIED' : 'OK'},
            {cmd: '  [REPEATABLE]  WAV sha256 fdd626ed8a3b -> identical 1547 frames', status: repeatHit ? 'VERIFIED' : 'OK'},
            {cmd: '  pipeline_status: PRODUCTION_GRADE_ENGINE_LOCKED', status: 'GREEN'},
          ],
        };
      }

      default: {
        // 'monolith-engine': "Build the engine—" (F1466..F1509)
        return {
          upperTitle: 'ENGINE_ARCHITECTURE_MONOLITH // LIVE_CORE_DAG',
          upperBadge: 'ENGINE_ONLINE',
          lowerTitle: 'PRODUCTION_KERNEL_TERMINAL // ENGINE_LOCKED',
          lowerBadge: 'DETERMINISTIC_30FPS',
          alert: false,
          nodes: [
            {id: 'N1', title: 'INTENT_SPEC', sub: 'TYPED_SCHEMA', active: true},
            {id: 'N2', title: 'TIMING_DAG', sub: '6_SEQUENCES', active: true},
            {id: 'N3', title: 'MATH_SOLVER', sub: 'SPRING_CUBIC', active: true},
            {id: 'N4', title: 'MP4_ENGINE', sub: 'LOCKED_CORE', active: true},
          ],
          logs: [
            {cmd: '$ engine.build --architecture=sequence-isolated --strict', status: 'LOCKED'},
            {cmd: '  all 6 <Sequence> boundaries verified zero-bleed', status: 'PASS'},
            {cmd: '  all 91 spoken cues synced to millisecond frame array', status: 'PASS'},
            {cmd: '  real-time node pipeline connected end-to-end', status: 'ONLINE'},
          ],
        };
      }
    }
  })();

  const connectedCount = graphConfig.nodes.filter((n) => n.active).length;

  return (
    <>
      <SciFiUiCard
        slot="upper-focal"
        title={graphConfig.upperTitle}
        badge={graphConfig.upperBadge}
        accentColor={graphConfig.alert ? CRIMSON : ORANGE}
        alertMode={graphConfig.alert}
        reveal={state.cardReveal}
        dataAttrs={{
          'data-ui-sim-kind': 'engine-pipeline',
          'data-ui-variant': state.variant,
          'data-connected-nodes': connectedCount,
        }}
      >
        {/* Inline Prompt Tokenizer Bar when compiling "prompt to code..." */}
        {graphConfig.showInlinePromptBar && (
          <div
            data-inline-prompt-compiler="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(6, 9, 17, 0.9)',
              border: '1px solid rgba(255,69,0,0.45)',
              fontFamily: MONO,
              fontSize: 13,
            }}
          >
            <div>
              <span style={{color: ORANGE, fontWeight: 700}}>prompt://ast $ </span>
              <span style={{color: WHITE}}>compile(prompt) -&gt; tsx -&gt; frames[1547] -&gt; mp4</span>
              <span
                style={{
                  display: 'inline-block',
                  width: 9,
                  height: 15,
                  marginLeft: 6,
                  verticalAlign: 'middle',
                  background: ORANGE,
                  opacity: state.cursorVisible ? 1 : 0.14,
                }}
              />
            </div>
            <span style={{color: '#34d399', fontWeight: 700, fontSize: 11.5}}>TOKENIZED</span>
          </div>
        )}

        {/* Live Connecting Node-Graph Pipeline */}
        <svg
          viewBox="0 0 888 220"
          style={{width: '100%', height: graphConfig.mathVisual || graphConfig.showTimingGrid ? 168 : 230, flexShrink: 0}}
        >
          {graphConfig.nodes.map((node, idx) => {
            const x = 12 + idx * 224;
            const nextNode = graphConfig.nodes[idx + 1];
            const linkActive = node.active && Boolean(nextNode?.active);
            const linkFault = Boolean(nextNode && 'fault' in nextNode && nextNode.fault);
            const pulseX = x + 192 + ((state.clauseElapsed * 3.5) % 32);

            return (
              <g key={node.id}>
                {idx < 3 && (
                  <>
                    <line
                      x1={x + 192}
                      y1={110}
                      x2={x + 224}
                      y2={110}
                      stroke={linkFault ? CRIMSON : linkActive ? ORANGE : WHITE}
                      strokeOpacity={linkFault || linkActive ? 0.95 : 0.22}
                      strokeWidth={linkActive ? 3 : 1.5}
                      strokeDasharray={linkActive ? undefined : '4 4'}
                    />
                    {linkActive && (
                      <circle cx={pulseX} cy={110} r="4.5" fill={WHITE} />
                    )}
                  </>
                )}

                <rect
                  x={x}
                  y={32}
                  width={192}
                  height={156}
                  fill={
                    'fault' in node && node.fault
                      ? 'rgba(225,29,72,0.18)'
                      : node.active
                        ? 'rgba(255,69,0,0.13)'
                        : 'rgba(244,247,255,0.03)'
                  }
                  stroke={
                    'fault' in node && node.fault
                      ? CRIMSON
                      : node.active
                        ? ORANGE
                        : 'rgba(244,247,255,0.20)'
                  }
                  strokeWidth={node.active ? 2 : 1.2}
                />
                <circle
                  cx={x + 22}
                  cy={60}
                  r="5"
                  fill={'fault' in node && node.fault ? CRIMSON : node.active ? ORANGE : MUTED}
                />
                <text
                  x={x + 36}
                  y={65}
                  fill={'fault' in node && node.fault ? '#ff8fa3' : MUTED}
                  fontFamily={MONO}
                  fontSize="11"
                  letterSpacing="1.6"
                >
                  {node.id} // {node.active ? 'ONLINE' : 'fault' in node && node.fault ? 'FAULT' : 'STANDBY'}
                </text>
                <text
                  x={x + 18}
                  y={112}
                  fill={WHITE}
                  fontFamily={MONO}
                  fontSize="16"
                  fontWeight="700"
                >
                  {node.title}
                </text>
                <text
                  x={x + 18}
                  y={152}
                  fill={'fault' in node && node.fault ? '#ff8fa3' : node.active ? ORANGE : MUTED}
                  fontFamily={MONO}
                  fontSize="12.5"
                  fontWeight="700"
                >
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Contextual Math / Keyframe Sub-Visualizer inside Engine Focal Card */}
        {(graphConfig.showTimingGrid || graphConfig.mathVisual === 'timing') && (
          <div style={{position: 'relative', height: 214, width: '100%'}}>
            <TimelineGrid
              embedded
              progress={clamp((state.clauseElapsed % 42) / 36, 0.25, 1)}
              opacity={1}
              scale={1}
              triggerText="timing"
              startFrame={state.globalFrame}
            />
          </div>
        )}

        {graphConfig.mathVisual === 'physics' && (
          <svg viewBox="0 0 888 235" style={{width: '100%', height: 215}}>
            <text x="48" y="24" fill={ORANGE} fontFamily={MONO} fontSize="11.5" letterSpacing="2">
              DAMPED_HARMONIC_SPRING // x(t) = 1 - exp(-zeta*w*t)cos(wd*t)
            </text>
            <line x1="48" y1="44" x2="48" y2="218" stroke={WHITE} strokeOpacity="0.35" />
            <line x1="48" y1="218" x2="848" y2="218" stroke={WHITE} strokeOpacity="0.35" />
            <line x1="48" y1="130" x2="848" y2="130" stroke={WHITE} strokeOpacity="0.16" strokeDasharray="5 5" />
            <path d={HARMONIC_SPRING_CURVE_PATH} fill="none" stroke={ORANGE} strokeWidth="3.2" />
          </svg>
        )}

        {graphConfig.mathVisual === 'easing' && (
          <svg viewBox="0 0 888 235" style={{width: '100%', height: 215}}>
            <text x="48" y="24" fill={ORANGE} fontFamily={MONO} fontSize="11.5" letterSpacing="2">
              CUBIC_BEZIER_SOLVER // C(t) = cubic-bezier(0.65, 0.00, 0.35, 1.00)
            </text>
            <line x1="48" y1="44" x2="48" y2="216" stroke={WHITE} strokeOpacity="0.35" />
            <line x1="48" y1="216" x2="848" y2="216" stroke={WHITE} strokeOpacity="0.35" />
            <line x1="48" y1="212" x2="380" y2="212" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
            <line x1="516" y1="54" x2="848" y2="54" stroke={WHITE} strokeOpacity="0.28" strokeDasharray="4 4" />
            <circle cx="380" cy="212" r="5" fill={WHITE} />
            <circle cx="516" cy="54" r="5" fill={WHITE} />
            <path d="M48 212 C380 212, 516 54, 848 54" fill="none" stroke={ORANGE} strokeWidth="3.4" />
          </svg>
        )}

        {!graphConfig.showTimingGrid &&
          graphConfig.mathVisual !== 'timing' &&
          graphConfig.mathVisual !== 'physics' &&
          graphConfig.mathVisual !== 'easing' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
                borderTop: '1px solid rgba(244,247,255,0.10)',
                paddingTop: 16,
              }}
            >
              {[
                {k: 'PIPELINE_CLOCK', v: `F${String(gf).padStart(4, '0')} @ 30HZ`},
                {k: 'CONNECTED_BLOCKS', v: `${connectedCount} / ${graphConfig.nodes.length} NODES`},
                {k: 'STATE_ISOLATION', v: graphConfig.alert ? 'FAULT_DETECTED' : 'DETERMINISTIC'},
              ].map((m) => (
                <div
                  key={m.k}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(244,247,255,0.03)',
                    border: '1px solid rgba(244,247,255,0.09)',
                    fontFamily: MONO,
                  }}
                >
                  <div style={{fontSize: 10.5, letterSpacing: 1.6, color: MUTED, marginBottom: 6}}>
                    {m.k}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: graphConfig.alert && m.k === 'STATE_ISOLATION' ? CRIMSON : WHITE,
                    }}
                  >
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          )}
      </SciFiUiCard>

      {/* Lower-Third Live Execution Terminal */}
      <SciFiUiCard
        slot="lower-third"
        title={graphConfig.lowerTitle}
        badge={graphConfig.lowerBadge}
        accentColor={graphConfig.alert ? CRIMSON : ORANGE}
        alertMode={graphConfig.alert}
        reveal={state.cardReveal}
        dataAttrs={{'data-ui-lower-kind': 'execution-terminal'}}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 15, flex: 1, justifyContent: 'center'}}>
          {graphConfig.logs.map((row, idx) => {
            const reached = idx <= Math.floor(state.clauseProgress * graphConfig.logs.length) + 1;
            const isErr = Boolean('err' in row && row.err);
            return (
              <div
                key={row.cmd}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 16px',
                  background: isErr ? 'rgba(225,29,72,0.13)' : 'rgba(244,247,255,0.03)',
                  borderLeft: `3px solid ${isErr ? CRIMSON : reached ? ORANGE : 'rgba(244,247,255,0.16)'}`,
                  opacity: reached ? 1 : 0.28,
                  fontFamily: MONO,
                  fontSize: 14,
                }}
              >
                <span style={{color: isErr ? '#ffd6df' : WHITE}}>{row.cmd}</span>
                <span
                  style={{
                    color: isErr ? CRIMSON : '#34d399',
                    fontWeight: 700,
                    fontSize: 12,
                    marginLeft: 12,
                    flexShrink: 0,
                  }}
                >
                  [{row.status}]
                </span>
              </div>
            );
          })}
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <span style={{fontFamily: MONO, fontSize: 11.5, letterSpacing: 1.8, color: MUTED}}>
            EXECUTION_BUS_THROUGHPUT
          </span>
          <div style={{flex: 1, height: 6, background: 'rgba(244,247,255,0.10)'}}>
            <div
              style={{
                width: `${Math.round((0.22 + state.clauseProgress * 0.78) * 100)}%`,
                height: '100%',
                background: graphConfig.alert ? CRIMSON : ORANGE,
                boxShadow: `0 0 12px ${graphConfig.alert ? CRIMSON : ORANGE}`,
              }}
            />
          </div>
          <span style={{fontFamily: MONO, fontSize: 12, color: WHITE, fontWeight: 700}}>
            30.0 FPS
          </span>
        </div>
      </SciFiUiCard>
    </>
  );
};

// ============================================================================
// 3. BREAK / ERROR SIMULATION: Red Diagnostic Warning Overlay + Stack-Trace Logs
// ============================================================================
const ErrorDiagnosticSimulationPair: React.FC<{state: ActiveUiSimulationState}> = ({state}) => {
  const gf = state.globalFrame;

  const diag = (() => {
    switch (state.variant) {
      case 'codebase-break': {
        const breakHit = gf >= SCRIPT_CUES[21].startFrame; // "break." at F0343
        return {
          upperTitle: 'CRITICAL_RUNTIME_ERROR // PRODUCTION_CODEBASE_BREAK',
          upperBadge: breakHit ? 'FATAL_SIGABRT_134' : 'STRESS_FRACTURE',
          headline: breakHit
            ? 'UNCAUGHT ConstraintBreakError: TEMPLATE_SHELL_COLLAPSED'
            : 'WARNING: REAL_CODEBASE_SCHEMA_OVERLOAD',
          subline:
            'Template preset lacks deterministic frame clock, sequence isolation, and state invariants.',
          metrics: [
            {k: 'EXIT_STATUS', v: breakHit ? '134 (FATAL_BREAK)' : 'WARN_DEGRADED'},
            {k: 'DRIFT_DELTA', v: breakHit ? '+418ms DESYNC' : '+142ms JITTER'},
            {k: 'BROKEN_EDGES', v: breakHit ? '9 / 9 UNBOUND' : '4 / 9 STRESSED'},
          ],
          stackTrace: [
            'Uncaught ConstraintBreakError: real codebase state fractured template',
            '    at reconcileTemplateSlots (src/template/preset-shell.tsx:142:19)',
            '    at mountAsyncStoreGraph (src/codebase/prod-runtime.ts:309:11)',
            '    at evaluateFrameClock (src/player/css-timer-fallback.ts:88:7)',
            '    at renderLoop (src/index.tsx:54:3) [ERR_TIMING_MODEL_NULL]',
            'Caused by: TypeError: cannot read "frame_invariants" of static boilerplate',
          ],
        };
      }

      case 'roulette-quarantine': {
        return {
          upperTitle: 'DIAGNOSTIC_INTERCEPT // TEMPLATE_ROULETTE_BLOCKED',
          upperBadge: 'VARIANCE_PURGED',
          headline: 'TemplateRouletteError INTERCEPTED -> QUARANTINED_BY_ENGINE',
          subline:
            'Stochastic template guessing disabled. Enforcing bit-exact mathematical frame compilation.',
          metrics: [
            {k: 'ROULETTE_ATTEMPTS', v: 'BLOCKED (0 ALLOWED)'},
            {k: 'RANDOM_DRIFT', v: '0.000% (CLAMPED)'},
            {k: 'ENGINE_FALLBACK', v: 'PURE_MATH_LOCKED'},
          ],
          stackTrace: [
            '[GUARD] Intercepted nondeterministic template mutation at F1011',
            '    at blockTemplateRoulette (src/engine/determinism-guard.ts:44:13)',
            '    at verifyFrameInvariants (scripts/verify-frame-sync.cjs:198:5)',
            '    -> rejected: stochastic CSS keyframe fallback',
            '    -> enforced: WORD_START_FRAMES[91] + <Sequence> hard isolation',
            '[RESOLVED] Zero template roulette — deterministic math active',
          ],
        };
      }

      case 'template-deprecation': {
        return {
          upperTitle: 'DIAGNOSTIC_WARNING // FRAGILE_TEMPLATE_DEPRECATED',
          upperBadge: 'STOP_TEMPLATES',
          headline: 'DeprecationError: STATIC_TEMPLATE_PRESETS_REJECTED',
          subline:
            'Pasted templates collapse on real production constraints. Terminating boilerplate preset runner.',
          metrics: [
            {k: 'PRESET_STATUS', v: 'TERMINATED'},
            {k: 'TIMING_MODEL', v: 'MISSING_IN_TEMPLATE'},
            {k: 'ACTION_REQUIRED', v: 'BUILD_THE_ENGINE'},
          ],
          stackTrace: [
            'DiagnosticWarning: refusing to mount fragile template boilerplate',
            '    at auditPresetFragility (src/audit/template-detector.ts:71:15)',
            '    at rejectUnboundTimeline (src/engine/agentEngineModel.ts:119:9)',
            '    at validateProductionBuild (src/Root.tsx:18:5)',
            'Reason: ERR_TOY_SCAFFOLD — zero physics, timing, or DAG guarantees',
          ],
        };
      }

      default: {
        // 'toy-fatal': "or ship toys." (F1509..F1541)
        const toysHit = gf >= SCRIPT_CUES[90].startFrame;
        return {
          upperTitle: 'FATAL_SHIP_DIAGNOSTIC // TOY_ARTIFACT_REJECTED',
          upperBadge: toysHit ? 'ERR_TOY_BUILD' : 'RELEASE_GATE_ALERT',
          headline: 'ProductionGateError: CANNOT_SHIP_FRAGILE_TOY_BUILD',
          subline:
            'Without an engine-first timing graph & deterministic compiler, output degrades to non-repeatable toys.',
          metrics: [
            {k: 'RELEASE_VERDICT', v: 'REJECTED // TOY_OUTPUT'},
            {k: 'STACK_INTEGRITY', v: '0% WITHOUT ENGINE'},
            {k: 'REQUIRED_TARGET', v: 'ENGINE_FIRST_CORE'},
          ],
          stackTrace: [
            'FatalShipError: non-engine artifact failed production verification',
            '    at assertEngineArchitecture (scripts/verify-frame-sync.cjs:64:11)',
            '    at rejectToyTemplateOutput (src/engine/release-gate.ts:203:17)',
            '    at shipPipeline (src/compiler/mp4-target.ts:92:5)',
            'EXIT_CODE: 1 // BUILD_THE_ENGINE_OR_SHIP_TOYS',
          ],
        };
      }
    }
  })();

  // Fault waveform SVG points
  const wavePoints = Array.from({length: 38}, (_, i) => {
    const x = 24 + i * 22.5;
    const spike =
      i % 5 === 0
        ? Math.sin(state.globalFrame * 0.45 + i) * 38
        : Math.cos(state.globalFrame * 0.25 + i * 1.7) * 11;
    const y = 62 + spike;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${clamp(y, 12, 112).toFixed(1)}`;
  }).join(' ');

  return (
    <>
      <SciFiUiCard
        slot="upper-focal"
        title={diag.upperTitle}
        badge={diag.upperBadge}
        accentColor={CRIMSON}
        alertMode
        reveal={state.cardReveal}
        dataAttrs={{
          'data-ui-sim-kind': 'error-diagnostic',
          'data-ui-variant': state.variant,
          'data-stack-frames': diag.stackTrace.length,
        }}
      >
        {/* Red Diagnostic Warning Banner */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(225, 29, 72, 0.18)',
            border: `1px solid ${CRIMSON}`,
            borderLeft: `5px solid ${CRIMSON}`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 16.5,
              fontWeight: 700,
              color: '#ffe4e8',
              marginBottom: 8,
            }}
          >
            {diag.headline}
          </div>
          <div style={{fontFamily: MONO, fontSize: 13, color: 'rgba(255,228,232,0.78)', lineHeight: 1.45}}>
            {diag.subline}
          </div>
        </div>

        {/* Live Crimson Fault Telemetry Waveform */}
        <svg viewBox="0 0 888 124" style={{width: '100%', height: 124, flexShrink: 0}}>
          <rect
            x="0"
            y="0"
            width="888"
            height="124"
            fill="rgba(8, 5, 12, 0.72)"
            stroke="rgba(225,29,72,0.35)"
          />
          <line x1="0" y1="62" x2="888" y2="62" stroke="rgba(225,29,72,0.3)" strokeDasharray="4 4" />
          <path d={wavePoints} fill="none" stroke={CRIMSON} strokeWidth="2.8" />
          <text x="16" y="22" fill="#ff8fa3" fontFamily={MONO} fontSize="11" letterSpacing="1.8">
            FAULT_OSCILLOSCOPE // CONSTRAINT_VIOLATION_SPIKE
          </text>
        </svg>

        {/* 3 Diagnostic Fault Counters */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
          {diag.metrics.map((m) => (
            <div
              key={m.k}
              style={{
                padding: '12px 14px',
                background: 'rgba(225,29,72,0.10)',
                border: '1px solid rgba(225,29,72,0.38)',
                fontFamily: MONO,
              }}
            >
              <div style={{fontSize: 10.5, letterSpacing: 1.5, color: '#fda4af', marginBottom: 6}}>
                {m.k}
              </div>
              <div style={{fontSize: 13.5, fontWeight: 700, color: WHITE}}>{m.v}</div>
            </div>
          ))}
        </div>
      </SciFiUiCard>

      {/* Lower-Third Red Stack-Trace Log Overlay */}
      <SciFiUiCard
        slot="lower-third"
        title="STDERR_DIAGNOSTIC_STREAM // LIVE_STACK_TRACE"
        badge="STACK_TRACE_DUMP"
        accentColor={CRIMSON}
        alertMode
        reveal={state.cardReveal}
        dataAttrs={{'data-ui-lower-kind': 'stack-trace-logs'}}
      >
        <div
          data-stack-trace-log="true"
          style={{
            flex: 1,
            background: 'rgba(8, 4, 10, 0.86)',
            border: '1px solid rgba(225,29,72,0.42)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {diag.stackTrace.map((line, idx) => {
            const visible = idx <= Math.floor(state.clauseProgress * diag.stackTrace.length) + 1;
            const isHeader = idx === 0 || idx === diag.stackTrace.length - 1;
            return (
              <div
                key={line}
                style={{
                  fontFamily: MONO,
                  fontSize: 13.8,
                  lineHeight: 1.45,
                  padding: '8px 12px',
                  background: isHeader ? 'rgba(225,29,72,0.20)' : 'rgba(225,29,72,0.05)',
                  borderLeft: `3px solid ${isHeader ? CRIMSON : 'rgba(225,29,72,0.45)'}`,
                  color: isHeader ? '#ffe4e8' : '#fda4af',
                  fontWeight: isHeader ? 700 : 400,
                  opacity: visible ? 1 : 0.22,
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12}}>
          <span style={{color: '#fda4af'}}>DIAGNOSTIC_WATCHDOG // ACTIVE</span>
          <span style={{color: CRIMSON, fontWeight: 700}}>
            FRAMES_AFFECTED: F{String(state.startFrame).padStart(4, '0')}..F
            {String(state.globalFrame).padStart(4, '0')}
          </span>
        </div>
      </SciFiUiCard>
    </>
  );
};

/**
 * Full-canvas Contextual UI Simulation Layer (Upper Focal Card + Spoken Clause Strip + Lower-Third UI Dock).
 * Eliminates 100% of empty dead space while leaving the hero center band (y: 680..1136)
 * wide open for the monumental KineticEngine typography.
 */
export const ContextualUiSimulationLayer: React.FC<{
  scene: SceneSpec;
  localFrame: number;
}> = ({scene, localFrame}) => {
  const state = getActiveUiSimulation(scene, localFrame);
  if (!state) return null;

  const isAlert = state.kind === 'error-diagnostic';

  return (
    <div
      data-contextual-ui-scene={scene.id}
      data-contextual-ui-kind={state.kind}
      data-contextual-ui-clause={state.id}
      style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'}}
    >
      {state.kind === 'prompt-cli' && <PromptCliSimulationPair state={state} />}
      {state.kind === 'engine-pipeline' && <EnginePipelineSimulationPair state={state} />}
      {state.kind === 'error-diagnostic' && <ErrorDiagnosticSimulationPair state={state} />}

      {/* Spoken-So-Far Clause Telemetry Strip directly below Hero Kinetic Word (y: 1034px) */}
      <div
        data-spoken-clause-strip={state.id}
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1030,
          height: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '0 20px',
          background: 'rgba(11, 15, 25, 0.78)',
          borderTop: `1px solid ${isAlert ? 'rgba(225,29,72,0.38)' : 'rgba(244,247,255,0.12)'}`,
          borderBottom: `1px solid ${isAlert ? 'rgba(225,29,72,0.38)' : 'rgba(244,247,255,0.12)'}`,
          fontFamily: MONO,
          fontSize: 14,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          opacity: 0.3 + state.cardReveal * 0.7,
        }}
      >
        <span
          style={{
            color: isAlert ? CRIMSON : ORANGE,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.8,
            marginRight: 6,
          }}
        >
          {state.moduleCode} //
        </span>
        {state.spokenClauseWords.length === 0 ? (
          <span style={{color: MUTED, letterSpacing: 1.8, fontSize: 12}}>
            SYNCING_CLAUSE_LOCK...
          </span>
        ) : (
          state.spokenClauseWords.map((w) => (
            <span
              key={w.index}
              style={{
                color: w.isCurrent ? (isAlert ? '#ff8fa3' : ORANGE) : WHITE,
                fontWeight: w.isCurrent ? 800 : 500,
                opacity: w.isCurrent ? 1 : 0.76,
              }}
            >
              {w.text}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

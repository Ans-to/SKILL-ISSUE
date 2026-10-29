#!/usr/bin/env node
// Verify file-level separation, decoupled <Sequence> assembly in src/Root.tsx,
// vertical 1080x1920 framing, Contextual UI Simulation Override (zero empty dead space),
// TelemetryHud isolation, KineticEngine snapping, and all 1,547 frames.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
      fileName: filename,
    });
    module._compile(compiled.outputText, filename);
  };
}

const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const model = require('../src/engine/agentEngineModel.ts');
const {CANVAS_Z_LAYERS} = require('../src/SceneContainer.tsx');
const {
  TelemetryHud,
  AtmosphericOverlays,
  HUD_TRANSITION_FRAMES,
  SCENE_HUD_PROFILES,
  getHudEnvelope,
  getHudLifecycle,
} = require('../src/TelemetryHud.tsx');
const {
  KineticEngine,
  SceneSemanticGraph,
  SCENE_HERO_PHRASES,
  ALL_HERO_PHRASES,
  SCENE_TYPEWRITER_WINDOWS,
  TYPEWRITER_ENTER_FRAMES,
  getTypewriterWindowEnvelope,
  classifyTokenTypographicSchema,
  resolveCueTypographicSchema,
  computeTypographicKinematics,
} = require('../src/KineticEngine.tsx');
const {
  STAGGERED_SPRING_CONFIG,
  HOOK_POP_SPRINGS,
  TERMINAL_SLIDE_CONFIGS,
  TELEMETRY_FLICKER_TABLES,
  StaggeredTextItem,
  computeStaggeredTextMotion,
} = require('../src/StaggeredTextItem.tsx');
const {
  SFX_PATHS,
  getSceneWordAudioCues,
  getSceneActiveAudioFrames,
  getSceneClimaxAudioEvents,
  getSceneHumToneFrequency,
  computeDynamicHumVolume,
} = require('../src/SceneAudio.tsx');
const {
  ASSET_TRANSITION_FRAMES,
  CLAUSE_HANDOFF_OVERLAP_FRAMES,
  CLAUSE_MOTION_SIGNATURES,
  ALL_UI_CLAUSES,
  SCENE_UI_CLAUSES,
  computeAssetTransition,
  classifyUiSimulationKeyword,
  getActiveUiSimulation,
  getActiveUiSimulations,
  ContextualUiSimulationLayer,
} = require('../src/ContextualUiSimulation.tsx');
const {ContextualVectorBroll} = require('../src/ContextualBroll.tsx');
const {
  TENSION_SPRING_CONFIG,
  getEmotionalPacingMode,
  getConflictImpactWeight,
  computeWordMotion,
  getCinematographyState,
} = require('../src/EmotionalPacing.tsx');

const {
  SCRIPT_CUES,
  WORD_START_FRAMES,
  WORD_END_FRAMES,
  FRAME_WORD_INDICES,
  DURATION_FRAMES,
  OUTRO_CUT_FRAME,
  SCENE_SEQUENCES,
  energyAt,
  findCue,
  findSceneCue,
  isSceneCleared,
  sceneForFrame,
  sceneSpokenCues,
} = model;

// 1. Verify required modular files exist at exact paths.
const requiredFiles = [
  'src/Root.tsx',
  'src/SceneContainer.tsx',
  'src/SceneAudio.tsx',
  'src/ContextualBroll.tsx',
  'src/ContextualUiSimulation.tsx',
  'src/EmotionalPacing.tsx',
  'src/TelemetryHud.tsx',
  'src/KineticEngine.tsx',
  'src/StaggeredTextItem.tsx',
  'src/TimelineGrid.tsx',
  'src/scenes/HookScene.tsx',
  'src/scenes/TwistScene.tsx',
  'src/scenes/ShiftScene.tsx',
  'src/scenes/MechanismScene.tsx',
  'src/scenes/PayoffScene.tsx',
  'src/scenes/OutroScene.tsx',
];
for (const rel of requiredFiles) {
  assert.ok(fs.existsSync(path.join(__dirname, '..', rel)), `Missing required modular file: ${rel}`);
}

for (const sfxRel of Object.values(SFX_PATHS)) {
  const sfxFile = path.join(__dirname, '..', 'public', sfxRel);
  assert.ok(fs.existsSync(sfxFile), `Missing required SFX asset: public/${sfxRel}`);
  assert.ok(fs.statSync(sfxFile).size > 512, `Empty or invalid SFX asset: public/${sfxRel}`);
}

const sceneContainerSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'SceneContainer.tsx'),
  'utf8',
);
assert.ok(/export const SceneContainer\b/.test(sceneContainerSource), 'SceneContainer export missing');
assert.ok(
  !sceneContainerSource.includes('320px') && !sceneContainerSource.includes('gridTemplateColumns'),
  'SceneContainer must be full-canvas 1080x1920 with zero fixed 320px sidebar grid',
);
assert.ok(
  sceneContainerSource.includes('<TelemetryHud />'),
  'SceneContainer must mount floating <TelemetryHud /> overlays',
);
assert.equal(model.STAGE_WIDTH, 1080, 'STAGE_WIDTH must use 100% of 1080px canvas');
assert.equal(model.STAGE_HEIGHT, 1920, 'STAGE_HEIGHT must use 100% of 1920px canvas');

for (const sceneFile of [
  'src/scenes/HookScene.tsx',
  'src/scenes/TwistScene.tsx',
  'src/scenes/ShiftScene.tsx',
  'src/scenes/MechanismScene.tsx',
  'src/scenes/PayoffScene.tsx',
  'src/scenes/OutroScene.tsx',
]) {
  const src = fs.readFileSync(path.join(__dirname, '..', sceneFile), 'utf8');
  assert.ok(src.includes('<SceneContainer>'), `${sceneFile} must inherit <SceneContainer>`);
  assert.ok(src.includes('<SceneAudioBed'), `${sceneFile} must embed <SceneAudioBed>`);
  assert.ok(src.includes('<Audio '), `${sceneFile} must include Remotion <Audio> event triggers`);
  assert.ok(!src.includes('<TelemetryHud'), `${sceneFile} must not duplicate <TelemetryHud> inside right column`);
}

// Verify 1:1 millisecond/frame synchronization between WORD_START_FRAMES and embedded SFX triggers,
// plus dynamic floating HUD entry/exit lifecycle per scene transition.
let mappedAudioWordCount = 0;
for (const scene of SCENE_SEQUENCES) {
  const audioCues = getSceneWordAudioCues(scene);
  const activeAudioFrames = getSceneActiveAudioFrames(scene);
  const hudStart = getHudLifecycle(scene, 0);
  const hudMid = getHudLifecycle(scene, 24);
  const hudPreCut = getHudLifecycle(scene, activeAudioFrames - 1);
  const hudCleared = getHudLifecycle(scene, activeAudioFrames);
  assert.ok(hudStart < hudMid, `HUD must animate in on ${scene.id} entry`);
  assert.ok(hudMid > 0.95, `HUD must be visible mid-scene in ${scene.id}`);
  assert.ok(hudPreCut < 0.25, `HUD must retract/fade before ${scene.id} transition cut`);
  assert.equal(hudCleared, 0, `HUD must clear to zero opacity on ${scene.id} unmount window`);
  assert.equal(audioCues.length, scene.lastWordIndex - scene.firstWordIndex + 1);
  for (const audioCue of audioCues) {
    assert.equal(audioCue.startFrame, WORD_START_FRAMES[audioCue.globalIndex]);
    assert.equal(audioCue.localFrame, WORD_START_FRAMES[audioCue.globalIndex] - scene.from);
    assert.ok(
      audioCue.localFrame >= 0 && audioCue.localFrame < activeAudioFrames,
      `SFX cue ${audioCue.globalIndex} falls outside active audio window in ${scene.id}`,
    );
    mappedAudioWordCount += 1;
  }

  // Verify climax risers & heavy sub-bass drops + dynamic hum ducking
  const climaxes = getSceneClimaxAudioEvents(scene);
  assert.ok(climaxes.length >= 1, `Scene ${scene.id} must have at least one climax sub-drop`);
  for (const ev of climaxes) {
    if (ev.riserLocalStart !== null) {
      const preClimaxHum = computeDynamicHumVolume(scene, ev.climaxLocalFrame - 2);
      const onDropHum = computeDynamicHumVolume(scene, ev.climaxLocalFrame + 1);
      assert.ok(onDropHum < preClimaxHum, `Ambient hum must sidechain-duck on sub-bass drop in ${scene.id}`);
    }
  }
}
assert.equal(mappedAudioWordCount, SCRIPT_CUES.length);

// Verify zero random unscripted background shapes (no floating orbital torusGeometry or spiderweb constellations)
for (const cleanRel of [
  'src/ContextualBroll.tsx',
  'src/ContextualUiSimulation.tsx',
  'src/TelemetryHud.tsx',
  'src/TimelineGrid.tsx',
  'src/scenes/SceneStage.tsx',
]) {
  const src = fs.readFileSync(path.join(__dirname, '..', cleanRel), 'utf8');
  assert.ok(!src.includes('torusGeometry'), `${cleanRel} must not contain generic floating orbital rings`);
  assert.ok(!src.includes('SCENE_CONSTELLATIONS'), `${cleanRel} must not render random spiderweb constellations`);
}

// ============================================================================
// Verify CONTEXTUAL UI SIMULATION OVERRIDE:
// 1. Narrative UI Mapping classifiers:
//    - "prompt" / "input" -> 'prompt-cli'
//    - "engine" / "compiler" -> 'engine-pipeline'
//    - "break" / "error" -> 'error-diagnostic'
// 2. Zero Empty Dead Space: EVERY active frame across all 6 scenes mounts both
//    Upper Focal Card + Lower-Third UI Dock (and unmounts cleanly during clearFrames).
// ============================================================================
assert.equal(classifyUiSimulationKeyword('prompt'), 'prompt-cli');
assert.equal(classifyUiSimulationKeyword('input'), 'prompt-cli');
assert.equal(classifyUiSimulationKeyword('inputs.'), 'prompt-cli');
assert.equal(classifyUiSimulationKeyword('engine'), 'engine-pipeline');
assert.equal(classifyUiSimulationKeyword('compiler'), 'engine-pipeline');
assert.equal(classifyUiSimulationKeyword('compiles'), 'engine-pipeline');
assert.equal(classifyUiSimulationKeyword('break.'), 'error-diagnostic');
assert.equal(classifyUiSimulationKeyword('error'), 'error-diagnostic');

let activeUiFramesVerified = 0;
for (const scene of SCENE_SEQUENCES) {
  const clauses = SCENE_UI_CLAUSES[scene.id];
  assert.ok(clauses.length >= 2, `Scene ${scene.id} must have multi-clause contextual UI progression`);
  const expectedActiveEnd = scene.id === 'outro' ? OUTRO_CUT_FRAME : scene.endFrame - scene.clearFrames;
  assert.equal(clauses[0].startFrame, scene.from, `Scene ${scene.id} UI simulation must start at scene.from`);
  assert.equal(
    clauses[clauses.length - 1].endFrame,
    expectedActiveEnd,
    `Scene ${scene.id} UI simulation must cover full active span without dead space`,
  );
  for (let i = 1; i < clauses.length; i += 1) {
    assert.equal(
      clauses[i - 1].endFrame,
      clauses[i].startFrame,
      `Gap or overlap between UI clauses in ${scene.id}`,
    );
  }

  for (let localFrame = 0; localFrame < scene.durationInFrames; localFrame += 1) {
    const globalFrame = scene.from + localFrame;
    const sim = getActiveUiSimulation(scene, localFrame);
    if (isSceneCleared(scene, localFrame)) {
      assert.equal(sim, null, `UI simulation must clear during hard-cut clear window at F${globalFrame}`);
    } else {
      assert.ok(sim !== null, `Empty dead space detected at F${globalFrame} in ${scene.id}`);
      // Ensure spokenClauseWords never previews future unspoken narration words
      for (const w of sim.spokenClauseWords) {
        assert.ok(
          SCRIPT_CUES[w.index].startFrame <= globalFrame,
          `Future word leaked into clause strip at F${globalFrame}`,
        );
      }
      activeUiFramesVerified += 1;
    }
  }
}
assert.equal(activeUiFramesVerified, 1531, 'All 1,531 active frames must mount contextual UI simulations');

// ============================================================================
// Verify NARRATIVE-DRIVEN ASSET TRANSITION OVERRIDE (Zero Jump Cuts):
// 1. Every UI card, HUD overlay, and terminal typewriter window enters over
//    10–15 frames via spring()/interpolate() (scale: 0.95 -> 1.0, translateY, opacity: 0 -> 1)
//    and reverses easing cleanly on exit (scale: 1.0 -> 0.95, translateY, opacity: 1 -> 0).
// 2. Intra-scene clause transitions overlap smoothly (+6f cross-handoff) so no
//    widget pops in or vanishes on a binary 1-frame cut.
// ============================================================================
assert.ok(
  ASSET_TRANSITION_FRAMES >= 10 && ASSET_TRANSITION_FRAMES <= 15,
  `ASSET_TRANSITION_FRAMES (${ASSET_TRANSITION_FRAMES}) must be 10..15 frames`,
);
assert.ok(
  HUD_TRANSITION_FRAMES >= 10 && HUD_TRANSITION_FRAMES <= 15,
  `HUD_TRANSITION_FRAMES (${HUD_TRANSITION_FRAMES}) must be 10..15 frames`,
);
assert.ok(
  TYPEWRITER_ENTER_FRAMES >= 10 && TYPEWRITER_ENTER_FRAMES <= 15,
  `TYPEWRITER_ENTER_FRAMES (${TYPEWRITER_ENTER_FRAMES}) must be 10..15 frames`,
);
assert.ok(CLAUSE_HANDOFF_OVERLAP_FRAMES >= 2, 'Intra-scene UI clauses must smoothly cross-handoff');

const sampleTotal = 60;
const envStart = computeAssetTransition(0, sampleTotal, {mode: 'heavy-spring-pop'});
const envMidEnter = computeAssetTransition(6, sampleTotal, {mode: 'heavy-spring-pop'});
const envSettled = computeAssetTransition(ASSET_TRANSITION_FRAMES + 4, sampleTotal, {mode: 'heavy-spring-pop'});
const envMidExit = computeAssetTransition(sampleTotal - 6, sampleTotal, {mode: 'heavy-spring-pop'});
const envEnd = computeAssetTransition(sampleTotal, sampleTotal, {mode: 'heavy-spring-pop'});
assert.equal(envStart.opacity, 0, 'Asset entrance must start at opacity 0');
assert.equal(envStart.scale, 0.95, 'Asset entrance must start at scale 0.95');
assert.ok(Math.abs(envStart.translateY) >= 18, 'Heavy-pop asset entrance must offset translateY');
assert.ok(envMidEnter.opacity > 0.3 && envMidEnter.opacity < 0.95, 'Asset entrance must smoothly interpolate opacity');
assert.ok(envMidEnter.scale > 0.96 && envMidEnter.scale <= 1.0, 'Asset entrance must smoothly spring scale 0.95 -> 1.0');
assert.equal(envSettled.opacity, 1, 'Settled asset must reach opacity 1.0');
assert.equal(envSettled.scale, 1, 'Settled asset must reach scale 1.0');
assert.equal(envSettled.translateY, 0, 'Settled asset must settle at translateY 0');
assert.ok(envMidExit.opacity > 0.1 && envMidExit.opacity < 0.9, 'Asset exit must reverse-ease opacity smoothly');
assert.ok(envMidExit.scale > 0.95 && envMidExit.scale < 1.0, 'Asset exit must reverse-ease scale 1.0 -> 0.95');
assert.ok(Math.abs(envMidExit.translateY) > 1, 'Asset exit must slide out smoothly');
assert.equal(envEnd.opacity, 0, 'Asset exit must complete at opacity 0');
assert.equal(envEnd.scale, 0.95, 'Asset exit must complete at scale 0.95');

const envHorizStart = computeAssetTransition(0, sampleTotal, {mode: 'horizontal-terminal-slide', slideX: -54});
const envHorizSettled = computeAssetTransition(ASSET_TRANSITION_FRAMES + 4, sampleTotal, {mode: 'horizontal-terminal-slide', slideX: -54});
assert.equal(envHorizStart.translateX, -54, 'Horizontal-terminal-slide asset must start offset along X');
assert.equal(envHorizSettled.translateX, 0, 'Horizontal-terminal-slide asset must settle at translateX 0');

const envFlick2 = computeAssetTransition(2, sampleTotal, {mode: 'digital-flicker-fade'});
const envFlick1 = computeAssetTransition(1, sampleTotal, {mode: 'digital-flicker-fade'});
assert.ok(envFlick2.opacity < envFlick1.opacity, 'Digital-flicker-fade asset must step through digital shutter onset');

// Verify frame-by-frame continuity across every UI clause, HUD, and Typewriter window
for (const scene of SCENE_SEQUENCES) {
  const activeFrames = getSceneActiveAudioFrames(scene);
  // HUD continuity check
  let prevHudOp = 0;
  for (let lf = 0; lf <= activeFrames; lf += 1) {
    const hudEnv = getHudEnvelope(scene, lf);
    const maxStep = hudEnv.mode === 'digital-flicker' ? 0.35 : 0.3;
    assert.ok(
      Math.abs(hudEnv.opacity - prevHudOp) <= maxStep,
      `Binary HUD opacity jump detected in ${scene.id} at localFrame=${lf} (${prevHudOp} -> ${hudEnv.opacity})`,
    );
    if (lf === 0) {
      assert.ok(hudEnv.scale < 1.0 && hudEnv.scale >= 0.85, `HUD in ${scene.id} must start compressed (< 1.0)`);
    }
    prevHudOp = hudEnv.opacity;
  }

  // UI simulation clause continuity check across every clause in this scene
  const clauses = SCENE_UI_CLAUSES[scene.id];
  clauses.forEach((clause, idx) => {
    let prevClauseOp = 0;
    const isLast = idx === clauses.length - 1;
    const endGlobal = isLast
      ? clause.endFrame
      : Math.min(scene.from + activeFrames, clause.endFrame + CLAUSE_HANDOFF_OVERLAP_FRAMES);
    for (let gf = clause.startFrame; gf <= endGlobal; gf += 1) {
      const sims = getActiveUiSimulations(scene, gf - scene.from);
      const match = sims.find((s) => s.id === clause.id);
      const curOp = match ? match.envelope.opacity : 0;
      assert.ok(
        Math.abs(curOp - prevClauseOp) <= 0.3,
        `Binary UI clause jump detected on ${clause.id} at F${gf} (${prevClauseOp} -> ${curOp})`,
      );
      prevClauseOp = curOp;
    }
    assert.equal(prevClauseOp, 0, `Clause ${clause.id} must finish reverse-easing to opacity 0`);

    if (!isLast) {
      // At intra-scene clause boundary, both outgoing and incoming UI simulations cross-handoff smoothly
      const boundarySims = getActiveUiSimulations(scene, clause.endFrame + 1 - scene.from);
      assert.equal(
        boundarySims.length,
        2,
        `Expected smooth 2-layer cross-handoff after ${clause.id} at F${clause.endFrame + 1}`,
      );
    }
  });

  // Terminal Typewriter window continuity check
  for (const tw of SCENE_TYPEWRITER_WINDOWS[scene.id]) {
    const cue = SCRIPT_CUES[tw.firstWordIndex];
    let prevTwOp = 0;
    for (let gf = tw.renderStartFrame; gf <= tw.renderEndFrame; gf += 1) {
      const env =
        gf === tw.renderEndFrame ? {opacity: 0} : getTypewriterWindowEnvelope(scene, cue, gf);
      assert.ok(
        Math.abs(env.opacity - prevTwOp) <= 0.35,
        `Binary terminal box jump on ${tw.id} at F${gf} (${prevTwOp} -> ${env.opacity})`,
      );
      prevTwOp = env.opacity;
    }
  }
}

// Verify useCurrentFrame() connected transition wrappers are wired into SceneStage and all 6 scenes
const sceneStageSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'scenes', 'SceneStage.tsx'),
  'utf8',
);
assert.ok(
  sceneStageSource.includes('<ConnectedContextualUiSimulation'),
  'SceneStage must mount <ConnectedContextualUiSimulation> driven by useCurrentFrame()',
);
// ============================================================================
// FULL-CANVAS LAYER DECOUPLING OVERRIDE:
// 1. Eliminate single-board container (no parent flex/grid or unified wrapper
//    grouping background UI widgets and central hero text).
// 2. Absolute z-index layering across the 1080x1920 canvas:
//    z=1 grid < z=10 WebGL < z=20 UI widget < z=30 terminal box < z=36 calibration
//    < z=42 clause ribbon < z=55 hero kinetic text < z=65 conflict flash < z=75/76 HUD.
// ============================================================================
const decoupledContainerSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'SceneContainer.tsx'),
  'utf8',
);
const kineticEngineSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'KineticEngine.tsx'),
  'utf8',
);
assert.ok(
  !/<div\b/.test(decoupledContainerSrc),
  'SceneContainer must not wrap children in an intermediate grouping <div>',
);
const sceneStageFnBody = sceneStageSource.slice(
  sceneStageSource.indexOf('export const SceneStage'),
);
assert.ok(
  !/<div\b/.test(sceneStageFnBody),
  'SceneStage must NEVER wrap layers in a single-board or grouping <div>',
);
assert.ok(
  !sceneStageSource.includes('display:') && !kineticEngineSource.includes("display: 'grid'"),
  'Stage and KineticEngine must not use a parent flex/grid board wrapper around hero text',
);
assert.ok(
  CANVAS_Z_LAYERS.coordinateGrid < CANVAS_Z_LAYERS.webglDepth &&
    CANVAS_Z_LAYERS.webglDepth < CANVAS_Z_LAYERS.uiBackgroundWidget &&
    CANVAS_Z_LAYERS.uiBackgroundWidget < CANVAS_Z_LAYERS.terminalBox &&
    CANVAS_Z_LAYERS.terminalBox < CANVAS_Z_LAYERS.atmosphericCalibration &&
    CANVAS_Z_LAYERS.atmosphericCalibration < CANVAS_Z_LAYERS.clauseRibbon &&
    CANVAS_Z_LAYERS.clauseRibbon < CANVAS_Z_LAYERS.heroKineticText &&
    CANVAS_Z_LAYERS.heroKineticText < CANVAS_Z_LAYERS.conflictFlash &&
    CANVAS_Z_LAYERS.conflictFlash < CANVAS_Z_LAYERS.hudHeader &&
    CANVAS_Z_LAYERS.hudHeader < CANVAS_Z_LAYERS.hudFooter,
  'CANVAS_Z_LAYERS must define a strictly ascending independent z-index depth stack',
);

for (const scene of SCENE_SEQUENCES) {
  const lf = Math.min(scene.durationInFrames - 15, 36);
  const uiLayerHtml = renderToStaticMarkup(
    React.createElement(ContextualUiSimulationLayer, {scene, localFrame: lf}),
  );
  // Top-level markup of ContextualUiSimulationLayer must start directly with Upper Widget (z=20), NOT a wrapper board
  assert.ok(
    uiLayerHtml.startsWith('<div data-canvas-layer="ui-background-widget" data-layer-z="20"'),
    `ContextualUiSimulationLayer in ${scene.id} must emit decoupled top-level absolute layers without a parent wrapper`,
  );
  assert.ok(
    uiLayerHtml.includes('data-canvas-layer="terminal-box" data-layer-z="30"') &&
      uiLayerHtml.includes('data-canvas-layer="clause-ribbon" data-layer-z="42"') &&
      uiLayerHtml.includes('z-index:20') &&
      uiLayerHtml.includes('z-index:30') &&
      uiLayerHtml.includes('z-index:42'),
    `Decoupled z-index layers (20, 30, 42) missing in ${scene.id}`,
  );
  const sim = getActiveUiSimulation(scene, lf);
  assert.notEqual(
    sim.upperEnvelope.spatialLeft,
    sim.lowerEnvelope.spatialLeft,
    `Upper UI widget (z=20) and lower terminal box (z=30) in ${scene.id} must be spatially offset across 1080x1920`,
  );

  const sampleCue = SCRIPT_CUES[scene.firstWordIndex];
  const heroHtml = renderToStaticMarkup(
    React.createElement(KineticEngine, {
      cue: sampleCue,
      variant: scene.id,
      globalFrame: sampleCue.startFrame,
    }),
  );
  assert.ok(
    heroHtml.includes('data-canvas-layer="hero-kinetic-text" data-layer-z="55"') &&
      heroHtml.includes('position:absolute') &&
      heroHtml.includes('z-index:55'),
    `Hero kinetic text in ${scene.id} must mount as independent absolute z-index:55 foreground layer`,
  );
  const hudHtml = renderToStaticMarkup(
    React.createElement(TelemetryHud, {
      scene,
      localFrame: lf,
      energy: 0.5,
      activeCue: sampleCue,
    }),
  );
  assert.ok(
    hudHtml.startsWith('<div data-canvas-layer="hud-header" data-layer-z="75"') &&
      hudHtml.includes('data-canvas-layer="hud-footer" data-layer-z="76"'),
    `HUD header (z=75) and footer (z=76) in ${scene.id} must mount as decoupled absolute layers`,
  );
}

for (const sceneFile of [
  'src/scenes/HookScene.tsx',
  'src/scenes/TwistScene.tsx',
  'src/scenes/ShiftScene.tsx',
  'src/scenes/MechanismScene.tsx',
  'src/scenes/PayoffScene.tsx',
  'src/scenes/OutroScene.tsx',
]) {
  const src = fs.readFileSync(path.join(__dirname, '..', sceneFile), 'utf8');
  assert.ok(
    src.includes('<SceneKineticStage') &&
      src.includes('<ConnectedAtmosphericOverlays') &&
      src.includes('overlays={'),
    `${sceneFile} must pass decoupled overlays and typography planes to <SceneStage>`,
  );
}

// ============================================================================
// SYSTEM ARCHITECTURE RULE 1: MANDATORY TYPOGRAPHIC & MOTION VARIETY
// 1. Prohibit repeating entrance animations, transitions, or spring physics
//    across consecutive scenes, consecutive hero phrases, consecutive UI clauses,
//    or consecutive text elements.
// 2. Dynamically vary motion profiles:
//    - Hooks/Errors     -> heavy, high-velocity spring pops ('hook-pop' / 'hook-climax')
//    - Code/Prompts     -> smooth horizontal terminal slides ('terminal-slide' / 'code-typewriter')
//    - Telemetry/Data   -> sharp digital flicker-fades ('telemetry-flicker' / 'metric-glitch')
// ============================================================================
const staggeredSrc = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'StaggeredTextItem.tsx'),
  'utf8',
);
assert.ok(
  staggeredSrc.includes('useCurrentFrame') && staggeredSrc.includes('useVideoConfig'),
  'StaggeredTextItem must use Remotion useCurrentFrame() and useVideoConfig()',
);
assert.ok(HOOK_POP_SPRINGS.length >= 4, 'HOOK_POP_SPRINGS must provide varied high-velocity springs');
assert.ok(TERMINAL_SLIDE_CONFIGS.length >= 4, 'TERMINAL_SLIDE_CONFIGS must provide varied horizontal slides');
assert.ok(TELEMETRY_FLICKER_TABLES.length >= 4, 'TELEMETRY_FLICKER_TABLES must provide varied digital flickers');

// A) Verify 'hook-pop' heavy high-velocity spring pop
const popPre = computeStaggeredTextMotion(5, 10, 30, 'hook-pop', 0);
const popOnset = computeStaggeredTextMotion(10, 10, 30, 'hook-pop', 0);
const popOvershoot = computeStaggeredTextMotion(14, 10, 30, 'hook-pop', 0);
const popSettled = computeStaggeredTextMotion(55, 10, 30, 'hook-pop', 0);
assert.equal(popPre.opacity, 0, 'hook-pop before delay must have opacity 0');
assert.ok(popOnset.scale < 0.85, 'hook-pop at delay must start compressed for heavy pop');
assert.ok(popOvershoot.scale > 1.01, 'hook-pop must exhibit high-velocity spring overshoot');
assert.ok(Math.abs(popSettled.opacity - 1) < 0.01 && Math.abs(popSettled.scale - 1) < 0.01);
assert.notEqual(
  computeStaggeredTextMotion(12, 10, 30, 'hook-pop', 0).signature,
  computeStaggeredTextMotion(12, 10, 30, 'hook-pop', 1).signature,
  'Consecutive hook-pop items must never share identical spring physics',
);

// B) Verify 'terminal-slide' smooth horizontal terminal slide
const slidePre = computeStaggeredTextMotion(5, 10, 30, 'terminal-slide', 0);
const slideMid = computeStaggeredTextMotion(13, 10, 30, 'terminal-slide', 0);
const slideSettled = computeStaggeredTextMotion(55, 10, 30, 'terminal-slide', 0);
assert.equal(slidePre.opacity, 0, 'terminal-slide before delay must have opacity 0');
assert.ok(slidePre.translateX <= -48 && slidePre.translateY === 0, 'terminal-slide must slide strictly horizontally');
assert.ok(slideMid.translateX > slidePre.translateX && slideMid.translateX < 0, 'terminal-slide must glide smoothly along X');
assert.ok(Math.abs(slideSettled.opacity - 1) < 0.01 && Math.abs(slideSettled.translateX) < 0.05);
assert.notEqual(
  computeStaggeredTextMotion(12, 10, 30, 'terminal-slide', 0).signature,
  computeStaggeredTextMotion(12, 10, 30, 'terminal-slide', 1).signature,
  'Consecutive terminal-slide items must never share identical slide physics',
);

// C) Verify 'telemetry-flicker' sharp digital flicker-fade
const flickPre = computeStaggeredTextMotion(5, 10, 30, 'telemetry-flicker', 0);
const flickF1 = computeStaggeredTextMotion(11, 10, 30, 'telemetry-flicker', 0);
const flickF2 = computeStaggeredTextMotion(12, 10, 30, 'telemetry-flicker', 0);
const flickF3 = computeStaggeredTextMotion(13, 10, 30, 'telemetry-flicker', 0);
const flickSettled = computeStaggeredTextMotion(30, 10, 30, 'telemetry-flicker', 0);
assert.equal(flickPre.opacity, 0, 'telemetry-flicker before delay must have opacity 0');
assert.ok(
  flickF2.opacity < flickF1.opacity && flickF3.opacity > flickF2.opacity,
  'telemetry-flicker must exhibit sharp digital shutter flicker on onset',
);
assert.equal(flickSettled.opacity, 1, 'telemetry-flicker must lock cleanly at opacity 1');
assert.notEqual(
  computeStaggeredTextMotion(12, 10, 30, 'telemetry-flicker', 0).signature,
  computeStaggeredTextMotion(12, 10, 30, 'telemetry-flicker', 1).signature,
  'Consecutive telemetry-flicker items must never share identical flicker tables',
);

const sampleStaggerMarkup = renderToStaticMarkup(
  React.createElement(StaggeredTextItem, {
    text: 'ENGINE',
    delay: 10,
    profile: 'terminal-slide',
    frameOverride: 10,
  }),
);
assert.ok(sampleStaggerMarkup.includes('display:inline-block'), 'StaggeredTextItem must be inline-block');
assert.ok(sampleStaggerMarkup.includes('data-staggered-profile="terminal-slide"'));

// D) Verify consecutive scenes NEVER repeat HUD transition mode or spring physics
for (let sIdx = 1; sIdx < SCENE_SEQUENCES.length; sIdx += 1) {
  const prevHud = SCENE_HUD_PROFILES[SCENE_SEQUENCES[sIdx - 1].id];
  const currHud = SCENE_HUD_PROFILES[SCENE_SEQUENCES[sIdx].id];
  assert.notEqual(
    prevHud.mode,
    currHud.mode,
    `Consecutive scenes ${SCENE_SEQUENCES[sIdx - 1].id} -> ${SCENE_SEQUENCES[sIdx].id} must not share HUD mode`,
  );
  assert.ok(
    prevHud.damping !== currHud.damping || prevHud.stiffness !== currHud.stiffness,
    `Consecutive scenes ${SCENE_SEQUENCES[sIdx - 1].id} -> ${SCENE_SEQUENCES[sIdx].id} must not share HUD spring physics`,
  );
}

// E) Verify ALL 29 Hero Phrases NEVER repeat schema OR springSignature consecutively (even across scene cuts!)
assert.ok(ALL_HERO_PHRASES.length >= 25, 'Expected fine-grained varied hero phrases across all 6 scenes');
for (let pIdx = 1; pIdx < ALL_HERO_PHRASES.length; pIdx += 1) {
  const prevPh = ALL_HERO_PHRASES[pIdx - 1];
  const currPh = ALL_HERO_PHRASES[pIdx];
  assert.notEqual(
    prevPh.schema,
    currPh.schema,
    `Consecutive hero phrases ${prevPh.id} -> ${currPh.id} must NOT repeat entrance schema (${currPh.schema})`,
  );
  assert.notEqual(
    prevPh.springSignature,
    currPh.springSignature,
    `Consecutive hero phrases ${prevPh.id} -> ${currPh.id} must NOT repeat spring physics (${currPh.springSignature})`,
  );
}

// F) Verify ALL 16 UI Clauses NEVER repeat transitionMode OR spring physics consecutively (even across scene cuts!)
assert.equal(ALL_UI_CLAUSES.length, 16, 'Expected all 16 narrative UI clauses');
for (let cIdx = 1; cIdx < ALL_UI_CLAUSES.length; cIdx += 1) {
  const prevCl = ALL_UI_CLAUSES[cIdx - 1];
  const currCl = ALL_UI_CLAUSES[cIdx];
  const prevSig = CLAUSE_MOTION_SIGNATURES[prevCl.variant];
  const currSig = CLAUSE_MOTION_SIGNATURES[currCl.variant];
  assert.notEqual(
    prevSig.mode,
    currSig.mode,
    `Consecutive UI clauses ${prevCl.id} -> ${currCl.id} must NOT repeat transition mode (${currSig.mode})`,
  );
  assert.ok(
    prevSig.damping !== currSig.damping || prevSig.stiffness !== currSig.stiffness,
    `Consecutive UI clauses ${prevCl.id} -> ${currCl.id} must NOT repeat spring physics`,
  );
}

let heroPhraseWordTotal = 0;
for (const scene of SCENE_SEQUENCES) {
  const phrases = SCENE_HERO_PHRASES[scene.id];
  assert.ok(phrases.length >= 2, `Scene ${scene.id} must define multiple non-repeating hero phrases`);
  for (const ph of phrases) {
    for (let wi = ph.firstWordIndex; wi <= ph.lastWordIndex; wi += 1) {
      assert.equal(
        resolveCueTypographicSchema(SCRIPT_CUES[wi], scene.id),
        ph.schema,
        `Hero phrase ${ph.id} must resolve cue #${wi} to schema ${ph.schema}`,
      );
      heroPhraseWordTotal += 1;
    }
    if (ph.lastWordIndex > ph.firstWordIndex) {
      const phraseCues = SCRIPT_CUES.slice(ph.firstWordIndex, ph.lastWordIndex + 1);
      const lastCue = phraseCues[phraseCues.length - 1];
      const phraseHtml = renderToStaticMarkup(
        React.createElement(KineticEngine, {
          cue: lastCue,
          variant: scene.id,
          globalFrame: lastCue.startFrame + 2,
          phraseCues,
          fullPhraseCharCount: ph.fullCharCount,
        }),
      );
      const itemMatches = phraseHtml.match(/data-staggered-item="true"/g) || [];
      assert.ok(
        itemMatches.length >= phraseCues.length,
        `Multi-word hero phrase ${ph.id} must render each spoken word via StaggeredTextItem`,
      );
      const sigMatches = [...phraseHtml.matchAll(/data-staggered-sig="([^"]+)"/g)].map((m) => m[1]);
      for (let k = 1; k < sigMatches.length; k += 1) {
        assert.notEqual(
          sigMatches[k - 1],
          sigMatches[k],
          `Consecutive words in hero phrase ${ph.id} must NOT share identical spring/curve signature`,
        );
      }
    }
  }
  const midUiHtml = renderToStaticMarkup(
    React.createElement(ContextualUiSimulationLayer, {
      scene,
      localFrame: Math.min(scene.durationInFrames - 15, 45),
    }),
  );
  const uiStaggerMatches = midUiHtml.match(/data-staggered-item="true"/g) || [];
  assert.ok(
    uiStaggerMatches.length >= 6,
    `UI simulation & clause strip in ${scene.id} must animate items via StaggeredTextItem`,
  );
  // Upper vs lower focal cards in the same clause must never share the same transition mode
  const simState = getActiveUiSimulation(scene, Math.min(scene.durationInFrames - 15, 45));
  assert.notEqual(
    simState.upperEnvelope.mode,
    simState.lowerEnvelope.mode,
    `Upper and lower UI cards in ${scene.id} must use distinct transition modes`,
  );
  // Verify consecutive spoken words in Clause Strip never share the same entrance profile
  const lateClauseHtml = renderToStaticMarkup(
    React.createElement(ContextualUiSimulationLayer, {
      scene,
      localFrame: Math.max(20, scene.durationInFrames - scene.clearFrames - 20),
    }),
  );
  const clauseWordProfiles = [
    ...lateClauseHtml.matchAll(
      /data-staggered-profile="([^"]+)"[^>]*data-clause-word-index="(\d+)"/g,
    ),
  ];
  for (let cw = 1; cw < clauseWordProfiles.length; cw += 1) {
    assert.notEqual(
      clauseWordProfiles[cw - 1][1],
      clauseWordProfiles[cw][1],
      `Consecutive Clause Strip words in ${scene.id} must NOT share identical motion profile`,
    );
  }
}
assert.equal(heroPhraseWordTotal, SCRIPT_CUES.length, 'SCENE_HERO_PHRASES must partition all 91 script cues');

// ============================================================================
// SYSTEM ARCHITECTURE RULE 2: ACTIVE CONTEXTUAL UI SIMULATION
// Verify interactive AI chat window, live code-input box, and real-time
// compiler/engine execution terminal across all action verbs:
// ============================================================================
// A) Typing a prompt / feeding intent ("paste a template", "Prompt harder?", "pretty prompt.", "Same inputs.", "feed intent")
for (const promptFrame of [140, 376, 384, 618, 942, 1076]) {
  const sc = sceneForFrame(promptFrame);
  const html = renderToStaticMarkup(
    React.createElement(ContextualUiSimulationLayer, {scene: sc, localFrame: promptFrame - sc.from}),
  );
  assert.ok(html.includes('data-ui-sim-kind="prompt-cli"'), `Expected prompt-cli UI at F${promptFrame}`);
  assert.ok(html.includes('data-interactive-chat-window="true"'), `Expected interactive AI chat window at F${promptFrame}`);
  assert.ok(html.includes('data-live-code-input="true"'), `Expected live code-input buffer at F${promptFrame}`);
  assert.ok(html.includes('data-chat-send-btn="true"'), `Expected interactive chat SEND button at F${promptFrame}`);
  assert.ok(html.includes('data-blinking-cursor="true"'), `Expected blinking cursor in prompt-cli at F${promptFrame}`);
  assert.ok(html.includes('SYNTAX_TOKENIZATION_STREAM'), `Expected syntax tokenization at F${promptFrame}`);
  assert.ok(html.includes('data-ui-slot="upper-focal"') && html.includes('data-ui-slot="lower-third"'));
}
// Verify cursor deterministic blink toggles between ON and OFF across consecutive frames
const shiftScene = SCENE_SEQUENCES[2];
const blinkA = getActiveUiSimulation(shiftScene, 375 - shiftScene.from).cursorVisible;
const blinkB = getActiveUiSimulation(shiftScene, 386 - shiftScene.from).cursorVisible;
assert.notEqual(blinkA, blinkB, 'AI CLI cursor must actively blink across frames');

// B) Compiling code / running an engine ("Engine-first", "It compiles the prompt to code, code to frames, frames to MP4.", "Build the engine—")
for (const engineFrame of [656, 1140, 1175, 1215, 1262, 1484]) {
  const sc = sceneForFrame(engineFrame);
  const html = renderToStaticMarkup(
    React.createElement(ContextualVectorBroll, {scene: sc, localFrame: engineFrame - sc.from}),
  );
  assert.ok(html.includes('data-ui-sim-kind="engine-pipeline"'), `Expected engine-pipeline UI at F${engineFrame}`);
  assert.ok(html.includes('data-live-code-compiler="true"'), `Expected live code-compiler at F${engineFrame}`);
  assert.ok(html.includes('data-active-engine-terminal="true"'), `Expected active engine terminal at F${engineFrame}`);
  assert.ok(html.includes('data-ui-lower-kind="execution-terminal"'), `Expected execution terminal at F${engineFrame}`);
}
// Verify blocks connect progressively in Payoff compiler pipeline ("prompt" -> "code," -> "frames," -> "MP4.")
const payoffScene = SCENE_SEQUENCES[4];
const htmlStage1 = renderToStaticMarkup(
  React.createElement(ContextualUiSimulationLayer, {scene: payoffScene, localFrame: 1155 - payoffScene.from}),
);
const htmlStage4 = renderToStaticMarkup(
  React.createElement(ContextualUiSimulationLayer, {scene: payoffScene, localFrame: 1262 - payoffScene.from}),
);
assert.ok(htmlStage1.includes('data-connected-nodes="1"'), 'Stage 1 compiler pipeline should start with 1 active block');
assert.ok(htmlStage4.includes('data-connected-nodes="4"'), 'Stage 4 compiler pipeline should connect all 4 blocks');

// C) "Real codebases break." (F0345) & "or ship toys." (F1526) -> Red diagnostic warning overlay + stack-trace logs
for (const breakFrame of [345, 1028, 1435, 1526]) {
  const sc = sceneForFrame(breakFrame);
  const html = renderToStaticMarkup(
    React.createElement(ContextualUiSimulationLayer, {scene: sc, localFrame: breakFrame - sc.from}),
  );
  assert.ok(html.includes('data-ui-sim-kind="error-diagnostic"'), `Expected error-diagnostic UI at F${breakFrame}`);
  assert.ok(html.includes('data-stack-trace-log="true"'), `Expected stack-trace logs at F${breakFrame}`);
}

// Verify Emotional Pacing & Dynamic Cinematography rules.
assert.equal(TENSION_SPRING_CONFIG.damping, 8);
assert.equal(TENSION_SPRING_CONFIG.stiffness, 300);
assert.equal(getEmotionalPacingMode('hook', 20), 'tension');
assert.equal(getEmotionalPacingMode('twist', 345), 'tension');
assert.equal(getEmotionalPacingMode('mechanism', 700), 'precision');
assert.equal(getEmotionalPacingMode('payoff', 1180), 'precision');
assert.equal(getConflictImpactWeight('break.'), 1.0);
assert.equal(getConflictImpactWeight('fail'), 1.0);
assert.equal(getConflictImpactWeight('error'), 1.0);
assert.ok(getSceneHumToneFrequency('twist') > getSceneHumToneFrequency('mechanism'));

const breakScene = sceneForFrame(343);
const breakCinema = getCinematographyState(breakScene, 344 - breakScene.from);
assert.notEqual(breakCinema.shakeX, 0, 'Conflict word "break." must trigger translateX screen shake');
assert.ok(breakCinema.crimsonFlash > 0.25, 'Conflict word "break." must trigger crimson flash overlay');

const mechCue = SCRIPT_CUES[45]; // "physics," in MechanismScene
const mechStart = computeWordMotion(mechCue, 'mechanism', mechCue.startFrame);
const mechSettled = computeWordMotion(mechCue, 'mechanism', mechCue.startFrame + 10);
assert.equal(mechStart.mode, 'precision');
assert.ok(mechStart.opacity < 0.25 && mechSettled.opacity === 1, 'Precision scenes must easeInOutCubic fade words');

// ============================================================================
// Verify TYPOGRAPHIC VARIATION SCHEMA across all 91 tokens & 6 scenes:
// 1. 'hook-climax'     -> spring(damping:8, stiffness:300), scale 0.8 -> 1.0, vector slice + red glow flash
// 2. 'code-typewriter' -> character-by-character monospaced terminal line + blinking `_` cursor
// 3. 'metric-glitch'   -> rapid horizontal translateX slide + chromatic aberration + opacity flicker
// ============================================================================
assert.equal(classifyTokenTypographicSchema('break.'), 'hook-climax');
assert.equal(classifyTokenTypographicSchema('Prompt'), 'code-typewriter');
assert.equal(classifyTokenTypographicSchema('template.'), 'code-typewriter');
assert.equal(classifyTokenTypographicSchema('physics,'), 'metric-glitch');
assert.equal(classifyTokenTypographicSchema('Repeatable.'), 'metric-glitch');

const schemaCounts = {'hook-climax': 0, 'code-typewriter': 0, 'metric-glitch': 0};
for (const scene of SCENE_SEQUENCES) {
  const sceneSchemas = new Set();
  for (let idx = scene.firstWordIndex; idx <= scene.lastWordIndex; idx += 1) {
    const cue = SCRIPT_CUES[idx];
    const schema = resolveCueTypographicSchema(cue, scene.id);
    sceneSchemas.add(schema);
    schemaCounts[schema] += 1;

    const kinStart = computeTypographicKinematics(cue, scene.id, cue.startFrame);
    const kinEnd = computeTypographicKinematics(cue, scene.id, cue.endFrame - 1);
    const startMarkup = renderToStaticMarkup(
      React.createElement(KineticEngine, {cue, variant: scene.id, globalFrame: cue.startFrame}),
    );

    assert.ok(
      startMarkup.includes(`data-typography-schema="${schema}"`),
      `Cue #${idx} missing data-typography-schema="${schema}"`,
    );

    if (schema === 'hook-climax') {
      assert.equal(kinStart.scale, 0.8, `Hook/Climax cue #${idx} must pop from scale 0.8`);
      if (cue.endFrame - cue.startFrame >= 12) {
        assert.ok(
          Math.abs(kinEnd.scale - 1.0) < 0.06,
          `Hook/Climax cue #${idx} must settle near scale 1.0`,
        );
      }
      assert.ok(kinStart.sliceIntensity > 0.9, `Hook/Climax cue #${idx} missing horizontal vector slice`);
      assert.ok(kinStart.redGlowFlash > 0.35, `Hook/Climax cue #${idx} missing red glow flash`);
      assert.ok(startMarkup.includes('data-vector-slice="true"'));
      assert.ok(startMarkup.includes('data-red-glow-flash='));
    } else if (schema === 'code-typewriter') {
      if (cue.text.length > 1 && cue.endFrame - cue.startFrame > 1) {
        assert.equal(
          kinStart.visibleChars,
          1,
          `Typewriter cue #${idx} ("${cue.text}") must begin typing at 1 char`,
        );
      }
      assert.equal(
        kinEnd.visibleChars,
        cue.text.length,
        `Typewriter cue #${idx} ("${cue.text}") must complete 100% of characters before cue end`,
      );
      assert.equal(kinEnd.visibleText, cue.text);
      assert.equal(kinStart.terminalSlideX, -76, `Code/Prompt cue #${idx} must smoothly slide horizontally from -76px`);
      assert.ok(startMarkup.includes('ui-monospace'), 'Typewriter schema must use monospaced font');
      assert.ok(startMarkup.includes('data-motion-family="horizontal-terminal-slide"'), 'Code/Prompt schema must use horizontal-terminal-slide');
      assert.ok(startMarkup.includes('data-typewriter-cursor='), 'Typewriter schema must render blinking `_` cursor');
      assert.ok(startMarkup.includes('>_</span>'), 'Typewriter schema must render literal `_` cursor glyph');
    } else if (schema === 'metric-glitch') {
      assert.equal(Math.abs(kinStart.slideTranslateX), 96, `Metric/Glitch cue #${idx} must snap from ±96px digital offset`);
      assert.ok(kinStart.chromaticOffsetPx > 10, `Metric/Glitch cue #${idx} must apply chromatic aberration on entry`);
      assert.ok(kinStart.flickerOpacity < 1.0, `Metric/Glitch cue #${idx} must apply sharp digital flicker-fade on entry`);
      assert.ok(startMarkup.includes('data-motion-family="digital-flicker-fade"'), 'Telemetry/Data schema must use digital-flicker-fade');
      if (cue.endFrame - cue.startFrame >= 7) {
        assert.equal(kinEnd.slideTranslateX, 0, `Metric/Glitch cue #${idx} must lock to translateX(0)`);
        assert.equal(kinEnd.flickerOpacity, 1.0, `Metric/Glitch cue #${idx} flicker must stabilize to 1.0`);
      }
      assert.ok(startMarkup.includes('data-chromatic-aberration='));
      assert.ok(startMarkup.includes('data-opacity-flicker='));
    }
  }
  assert.ok(
    sceneSchemas.size >= 2,
    `Scene ${scene.id} must not use a single uniform entrance animation (found: ${[...sceneSchemas].join(',')})`,
  );
}
assert.ok(schemaCounts['hook-climax'] >= 20, 'Expected substantial hook-climax coverage');
assert.ok(schemaCounts['code-typewriter'] >= 20, 'Expected substantial code-typewriter coverage');
assert.ok(schemaCounts['metric-glitch'] >= 18, 'Expected substantial metric-glitch coverage');
// Verify typewriter `_` cursor blinks across settled frames (e.g. "codebases" F0321..F0343)
const codebasesCue = SCRIPT_CUES[20];
const twBlinkA = computeTypographicKinematics(codebasesCue, 'twist', 332).cursorBlinkOn;
const twBlinkB = computeTypographicKinematics(codebasesCue, 'twist', 336).cursorBlinkOn;
assert.notEqual(twBlinkA, twBlinkB, 'Typewriter `_` cursor must blink across settled frames');

const rootSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'Root.tsx'), 'utf8');
assert.ok(/export const Root\b/.test(rootSource), 'src/Root.tsx must export Root');
assert.equal(model.COMP_WIDTH, 1080, 'COMP_WIDTH must be 1080');
assert.equal(model.COMP_HEIGHT, 1920, 'COMP_HEIGHT must be 1920');
assert.ok(
  /id="Root"[\s\S]*?width=\{1080\}[\s\S]*?height=\{1920\}/.test(rootSource),
  'Root composition must be configured as vertical 1080x1920 in src/Root.tsx',
);
assert.ok(
  /id="EngineFirstExplainer"[\s\S]*?width=\{1080\}[\s\S]*?height=\{1920\}/.test(rootSource),
  'EngineFirstExplainer must be configured as vertical 1080x1920 in src/Root.tsx',
);
const propsJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'props.json'), 'utf8'));
assert.equal(propsJson.compositionId, 'Root', 'props.json must define Root composition props');
assert.ok(
  fs.existsSync(path.join(__dirname, '..', 'remotion.config.ts')),
  'remotion.config.ts must exist for entry-point-less CLI invocation',
);
assert.equal(
  (rootSource.match(/<Sequence\b/g) || []).length,
  6,
  'src/Root.tsx must assemble all 6 scene beats with <Sequence>',
);
for (const tag of [
  '<HookScene',
  '<TwistScene',
  '<ShiftScene',
  '<MechanismScene',
  '<PayoffScene',
  '<OutroScene',
]) {
  assert.ok(rootSource.includes(tag), `src/Root.tsx missing ${tag}`);
}

// 2. Verify non-overlapping <Sequence> coverage and pre-unmount hard-cut clears.
assert.equal(SCENE_SEQUENCES.length, 6);
assert.equal(SCENE_SEQUENCES[0].from, 0);
assert.equal(SCENE_SEQUENCES[SCENE_SEQUENCES.length - 1].endFrame, DURATION_FRAMES);
SCENE_SEQUENCES.forEach((scene, index) => {
  if (index > 0) {
    assert.equal(
      SCENE_SEQUENCES[index - 1].from + SCENE_SEQUENCES[index - 1].durationInFrames,
      scene.from,
      `Overlapping or gapped <Sequence> between ${SCENE_SEQUENCES[index - 1].id} and ${scene.id}`,
    );
  }
  assert.deepEqual(sceneSpokenCues(scene, 0), [], `Scene ${scene.id} leaked cues at localFrame=0`);
  if (scene.clearFrames > 0) {
    for (let f = scene.durationInFrames - scene.clearFrames; f < scene.durationInFrames; f += 1) {
      assert.equal(isSceneCleared(scene, f), true, `Scene ${scene.id} failed to clear at localFrame=${f}`);
      assert.equal(findSceneCue(scene, f), null, `Scene ${scene.id} still showed a cue during clear frame ${f}`);
    }
  }
});
assert.equal(isSceneCleared(SCENE_SEQUENCES[5], OUTRO_CUT_FRAME - SCENE_SEQUENCES[5].from), true);

// 3. Verify every composition frame resolves the exact active word strictly within its owning scene.
assert.equal(FRAME_WORD_INDICES.length, DURATION_FRAMES);
for (let frame = 0; frame < DURATION_FRAMES; frame += 1) {
  const expected = SCRIPT_CUES.find((cue) => cue.startFrame <= frame && frame < cue.endFrame) ?? null;
  assert.equal(findCue(frame), expected, `Wrong word or lingering text at frame ${frame}`);
  const owningScene = sceneForFrame(frame);
  const localFrame = frame - owningScene.from;
  assert.equal(
    findSceneCue(owningScene, localFrame),
    expected,
    `Scene-isolated cue mismatch in ${owningScene.id} at globalFrame=${frame}`,
  );
  for (const spoken of sceneSpokenCues(owningScene, localFrame)) {
    assert.ok(
      spoken.globalIndex >= owningScene.firstWordIndex && spoken.globalIndex <= owningScene.lastWordIndex,
      `Cross-scene word bleed detected in ${owningScene.id}: word ${spoken.globalIndex}`,
    );
  }
}
assert.equal(findCue(-1), null);
assert.equal(findCue(DURATION_FRAMES), null);
assert.equal(findCue(0.5), null);

// 4. Verify TelemetryHud, KineticEngine snapping, and AtmosphericOverlays across all 91 words.
const escapeText = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

for (const cue of SCRIPT_CUES) {
  assert.equal(cue.startFrame, WORD_START_FRAMES[cue.globalIndex]);
  assert.equal(cue.endFrame, WORD_END_FRAMES[cue.globalIndex]);
  assert.equal(findCue(cue.startFrame), cue, `Missing cue ${cue.globalIndex} on its first frame`);
  assert.notEqual(findCue(cue.endFrame), cue, `Cue ${cue.globalIndex} lingers past its last frame`);

  const scene = sceneForFrame(cue.startFrame);
  const localFrame = cue.startFrame - scene.from;
  const energy = energyAt(cue.startFrame);
  const props = {scene, localFrame, energy, activeCue: cue};

  const telemetry = renderToStaticMarkup(React.createElement(TelemetryHud, props));
  const graph = renderToStaticMarkup(React.createElement(AtmosphericOverlays, props));
  const kinetic = renderToStaticMarkup(
    React.createElement(KineticEngine, {cue, variant: scene.id, globalFrame: cue.startFrame}),
  );
  const semantic = renderToStaticMarkup(
    React.createElement(SceneSemanticGraph, {scene, localFrame, activeCue: cue, energy}),
  );

  assert.ok(telemetry.includes(`data-scene-telemetry="${scene.id}"`), `Wrong telemetry scope for ${scene.id}`);
  assert.ok(telemetry.includes(`data-active-cue="${cue.globalIndex}"`), `Telemetry missed cue ${cue.globalIndex}`);
  assert.ok(
    telemetry.includes('data-current-token="true"') && telemetry.includes(`>${escapeText(cue.text)}</span>`),
    `Telemetry has wrong active word at cue ${cue.globalIndex}`,
  );
  assert.ok(graph.includes(`data-scene-graph="${scene.id}"`), `Wrong graph scope for ${scene.id}`);
  assert.ok(graph.includes(`data-active-cue="${cue.globalIndex}"`), `Graph missed cue ${cue.globalIndex}`);
  assert.ok(graph.includes(`data-hot-node="${cue.globalIndex % 14}"`), `Graph node did not update at cue ${cue.globalIndex}`);
  assert.ok(kinetic.includes(`data-kinetic-variant="${scene.id}"`), `Wrong kinetic layout variant for ${scene.id}`);
  assert.ok(semantic.includes(`data-scene-semantic="${scene.id}"`), `Wrong semantic graph scope for ${scene.id}`);
}

const pauseScene = sceneForFrame(0);
const pauseProps = {scene: pauseScene, localFrame: 0, energy: energyAt(0), activeCue: null};
assert.ok(renderToStaticMarkup(React.createElement(TelemetryHud, pauseProps)).includes('>—</span>'));
assert.ok(renderToStaticMarkup(React.createElement(AtmosphericOverlays, pauseProps)).includes('data-hot-node="-1"'));

const {audioSha256} = require('../src/engine/agent-engine-frame-cues.json');
if (audioSha256 === 'fdd626ed8a3bb1af484e61588aeef72a03ae256be7171c539f53cd6b54fb2cd1') {
  assert.equal(findCue(675)?.text, 'first');
  assert.equal(findCue(685), null);
  assert.equal(findCue(686)?.text, 'means');
  assert.equal(findCue(1508), null);
  assert.equal(findCue(1509)?.text, 'or');
}

console.log(
  `Verified vertical 1080x1920 modular file tree, 6 isolated <Sequence> scenes (${SCENE_SEQUENCES.map((s) => `${s.id}:${s.from}-${s.endFrame}`).join(', ')}), 100% zero-dead-space Contextual UI Simulation across all ${activeUiFramesVerified} active frames, and live TelemetryHud/KineticEngine updates across all ${SCRIPT_CUES.length} word onsets.`,
);

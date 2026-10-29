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
const {TelemetryHud, AtmosphericOverlays, getHudLifecycle} = require('../src/TelemetryHud.tsx');
const {
  KineticEngine,
  SceneSemanticGraph,
  classifyTokenTypographicSchema,
  resolveCueTypographicSchema,
  computeTypographicKinematics,
} = require('../src/KineticEngine.tsx');
const {
  SFX_PATHS,
  getSceneWordAudioCues,
  getSceneActiveAudioFrames,
  getSceneClimaxAudioEvents,
  getSceneHumToneFrequency,
  computeDynamicHumVolume,
} = require('../src/SceneAudio.tsx');
const {
  SCENE_UI_CLAUSES,
  classifyUiSimulationKeyword,
  getActiveUiSimulation,
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

// Verify specific narrative UI components at key script moments:
// A) "Prompt harder?" (F0376) & "pretty prompt." (F0616) & "Same inputs." (F0942) -> AI CLI input box + blinking cursor + tokenization
for (const promptFrame of [376, 384, 618, 942, 1076]) {
  const sc = sceneForFrame(promptFrame);
  const html = renderToStaticMarkup(
    React.createElement(ContextualUiSimulationLayer, {scene: sc, localFrame: promptFrame - sc.from}),
  );
  assert.ok(html.includes('data-ui-sim-kind="prompt-cli"'), `Expected prompt-cli UI at F${promptFrame}`);
  assert.ok(html.includes('data-blinking-cursor="true"'), `Expected blinking cursor in prompt-cli at F${promptFrame}`);
  assert.ok(html.includes('SYNTAX_TOKENIZATION_STREAM'), `Expected syntax tokenization at F${promptFrame}`);
  assert.ok(html.includes('data-ui-slot="upper-focal"') && html.includes('data-ui-slot="lower-third"'));
}
// Verify cursor deterministic blink toggles between ON and OFF across consecutive frames
const shiftScene = SCENE_SEQUENCES[2];
const blinkA = getActiveUiSimulation(shiftScene, 375 - shiftScene.from).cursorVisible;
const blinkB = getActiveUiSimulation(shiftScene, 386 - shiftScene.from).cursorVisible;
assert.notEqual(blinkA, blinkB, 'AI CLI cursor must actively blink across frames');

// B) "Engine-first" (F0656), "It compiles the prompt to code, code to frames, frames to MP4." (F1135..F1270), "Build the engine—" (F1484)
for (const engineFrame of [656, 1140, 1175, 1215, 1262, 1484]) {
  const sc = sceneForFrame(engineFrame);
  const html = renderToStaticMarkup(
    React.createElement(ContextualVectorBroll, {scene: sc, localFrame: engineFrame - sc.from}),
  );
  assert.ok(html.includes('data-ui-sim-kind="engine-pipeline"'), `Expected engine-pipeline UI at F${engineFrame}`);
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
      assert.ok(startMarkup.includes('ui-monospace'), 'Typewriter schema must use monospaced font');
      assert.ok(startMarkup.includes('data-typewriter-cursor='), 'Typewriter schema must render blinking `_` cursor');
      assert.ok(startMarkup.includes('>_</span>'), 'Typewriter schema must render literal `_` cursor glyph');
    } else if (schema === 'metric-glitch') {
      assert.equal(Math.abs(kinStart.slideTranslateX), 96, `Metric/Glitch cue #${idx} must horizontal-slide from ±96px`);
      assert.ok(kinStart.chromaticOffsetPx > 10, `Metric/Glitch cue #${idx} must apply chromatic aberration on entry`);
      assert.ok(kinStart.flickerOpacity < 1.0, `Metric/Glitch cue #${idx} must apply subtle opacity flicker on entry`);
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
  /id="EngineFirstExplainer"[\s\S]*?width=\{1080\}[\s\S]*?height=\{1920\}/.test(rootSource),
  'EngineFirstExplainer must be configured as vertical 1080x1920 in src/Root.tsx',
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

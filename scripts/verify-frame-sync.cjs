#!/usr/bin/env node
// Verify file-level separation, decoupled <Sequence> assembly in src/Root.tsx,
// vertical 1080x1920 framing, TelemetryHud isolation, KineticEngine snapping, and all 1,547 frames.
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
const {TelemetryHud, AtmosphericOverlays} = require('../src/TelemetryHud.tsx');
const {KineticEngine, SceneSemanticGraph} = require('../src/KineticEngine.tsx');
const {SFX_PATHS, getSceneWordAudioCues, getSceneActiveAudioFrames} = require('../src/SceneAudio.tsx');

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
  sceneContainerSource.includes("gridTemplateColumns: '320px 1fr'"),
  "SceneContainer must enforce gridTemplateColumns: '320px 1fr'",
);
assert.ok(
  sceneContainerSource.includes('<TelemetryHud />'),
  'SceneContainer left column must mount <TelemetryHud />',
);

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

// Verify 1:1 millisecond/frame synchronization between WORD_START_FRAMES and embedded SFX triggers.
let mappedAudioWordCount = 0;
for (const scene of SCENE_SEQUENCES) {
  const audioCues = getSceneWordAudioCues(scene);
  const activeAudioFrames = getSceneActiveAudioFrames(scene);
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
}
assert.equal(mappedAudioWordCount, SCRIPT_CUES.length);

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

// 4. Verify reusable left-zone TelemetryHud, KineticEngine snapping, and node-graph updates on all 91 words.
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
  assert.ok(graph.includes(`data-scene-graph="${scene.id}"`), `Wrong graph constellation for ${scene.id}`);
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
  `Verified vertical 1080x1920 modular file tree, 6 isolated <Sequence> scenes (${SCENE_SEQUENCES.map((s) => `${s.id}:${s.from}-${s.endFrame}`).join(', ')}), all ${DURATION_FRAMES} frames, and live TelemetryHud/graph/KineticEngine updates across all ${SCRIPT_CUES.length} word onsets.`,
);

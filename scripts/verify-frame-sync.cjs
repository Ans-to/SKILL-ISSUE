#!/usr/bin/env node
// Exercise the decoupled <Sequence> architecture, scene isolation, and word-reactive UI across all 1,547 frames.
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
const {TelemetryRail, AtmosphericOverlays} = require('../src/engine/TelemetryHud.tsx');
const {KineticText, SceneSemanticGraph} = require('../src/engine/KineticEngine.tsx');

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

// 1. Verify Root.tsx mounts 6 explicit <Sequence from={...} durationInFrames={...}> blocks.
const rootSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'Root.tsx'), 'utf8');
const sequenceCount = (rootSource.match(/<Sequence\b/g) || []).length;
assert.equal(sequenceCount, 6, `Expected 6 isolated <Sequence> blocks in src/Root.tsx, found ${sequenceCount}`);
for (const sceneFile of [
  'SceneHook.tsx',
  'SceneTwist.tsx',
  'SceneShift.tsx',
  'SceneMechanism.tsx',
  'ScenePayoff.tsx',
  'SceneOutro.tsx',
]) {
  assert.ok(
    fs.existsSync(path.join(__dirname, '..', 'src', 'engine', sceneFile)),
    `Missing modular scene component: src/engine/${sceneFile}`,
  );
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
  // Entry of every scene must start completely clean with zero carryover cues.
  assert.deepEqual(
    sceneSpokenCues(scene, 0),
    [],
    `Scene ${scene.id} leaked cues at localFrame=0`,
  );
  // Pre-unmount clear frames must clear the screen cleanly before the next Sequence mounts.
  if (scene.clearFrames > 0) {
    for (let f = scene.durationInFrames - scene.clearFrames; f < scene.durationInFrames; f += 1) {
      assert.equal(isSceneCleared(scene, f), true, `Scene ${scene.id} failed to clear at localFrame=${f}`);
      assert.equal(findSceneCue(scene, f), null, `Scene ${scene.id} still showed a cue during clear frame ${f}`);
    }
  }
});
assert.equal(isSceneCleared(SCENE_SEQUENCES[5], OUTRO_CUT_FRAME - SCENE_SEQUENCES[5].from), true);

// 3. Verify every composition frame resolves the exact active word and strictly within its owning scene.
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

// 4. Verify live per-scene telemetry, distinct kinetic layout variant, and node-graph updates on all 91 words.
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

  const telemetry = renderToStaticMarkup(React.createElement(TelemetryRail, props));
  const graph = renderToStaticMarkup(React.createElement(AtmosphericOverlays, props));
  const kinetic = renderToStaticMarkup(
    React.createElement(KineticText, {cue, variant: scene.id, globalFrame: cue.startFrame}),
  );
  const semantic = renderToStaticMarkup(
    React.createElement(SceneSemanticGraph, {scene, localFrame, activeCue: cue, energy}),
  );

  assert.ok(telemetry.includes(`data-scene-telemetry="${scene.id}"`), `Wrong telemetry layout for ${scene.id}`);
  assert.ok(telemetry.includes(`data-active-cue="${cue.globalIndex}"`), `Telemetry missed cue ${cue.globalIndex}`);
  assert.ok(
    telemetry.includes(`data-current-token="true"` ) && telemetry.includes(`>${escapeText(cue.text)}</span>`),
    `Telemetry has wrong active word at cue ${cue.globalIndex}`,
  );
  assert.ok(graph.includes(`data-scene-graph="${scene.id}"`), `Wrong graph constellation for ${scene.id}`);
  assert.ok(graph.includes(`data-active-cue="${cue.globalIndex}"`), `Graph missed cue ${cue.globalIndex}`);
  assert.ok(graph.includes(`data-hot-node="${cue.globalIndex % 14}"`), `Graph node did not update at cue ${cue.globalIndex}`);
  assert.ok(kinetic.includes(`data-kinetic-variant="${scene.id}"`), `Wrong kinetic layout variant for ${scene.id}`);
  assert.ok(semantic.includes(`data-scene-semantic="${scene.id}"`), `Wrong semantic graph scope for ${scene.id}`);
}

// 5. Verify pause frames and reviewed phonetic alignment regressions.
const pauseScene = sceneForFrame(0);
const pauseProps = {scene: pauseScene, localFrame: 0, energy: energyAt(0), activeCue: null};
assert.ok(renderToStaticMarkup(React.createElement(TelemetryRail, pauseProps)).includes('>—</span>'));
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
  `Verified 6 isolated <Sequence> scenes (${SCENE_SEQUENCES.map((s) => `${s.id}:${s.from}-${s.endFrame}`).join(', ')}), all ${DURATION_FRAMES} frames, and live scene-scoped telemetry/graph/kinetic updates at all ${SCRIPT_CUES.length} word onsets.`,
);

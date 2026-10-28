#!/usr/bin/env node
// Exercise the production frame selector and word-reactive UI at every cue.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Run the project's TypeScript modules without adding a separate test runtime.
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
const {SCRIPT_CUES, WORD_START_FRAMES, WORD_END_FRAMES, FRAME_WORD_INDICES, DURATION_FRAMES, currentSection, energyAt, findCue} = model;

assert.equal(FRAME_WORD_INDICES.length, DURATION_FRAMES);
for (let frame = 0; frame < DURATION_FRAMES; frame += 1) {
  const expected = SCRIPT_CUES.find((cue) => cue.startFrame <= frame && frame < cue.endFrame) ?? null;
  assert.equal(findCue(frame), expected, `Wrong word or lingering text at frame ${frame}`);
}
assert.equal(findCue(-1), null);
assert.equal(findCue(DURATION_FRAMES), null);
assert.equal(findCue(0.5), null);

const escapeText = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
for (const cue of SCRIPT_CUES) {
  assert.equal(cue.startFrame, WORD_START_FRAMES[cue.globalIndex]);
  assert.equal(cue.endFrame, WORD_END_FRAMES[cue.globalIndex]);
  assert.equal(findCue(cue.startFrame), cue, `Missing cue ${cue.globalIndex} on its first frame`);
  assert.notEqual(findCue(cue.endFrame), cue, `Cue ${cue.globalIndex} lingers past its last frame`);
  const props = {frame: cue.startFrame, section: currentSection(cue.startFrame), energy: energyAt(cue.startFrame), activeCue: cue};
  const telemetry = renderToStaticMarkup(React.createElement(TelemetryRail, props));
  const graph = renderToStaticMarkup(React.createElement(AtmosphericOverlays, props));
  assert.ok(telemetry.includes(`data-active-cue="${cue.globalIndex}"`), `Telemetry missed cue ${cue.globalIndex}`);
  assert.ok(telemetry.includes(`data-current-token="true">${escapeText(cue.text)}</span>`), `Telemetry has the wrong active word at cue ${cue.globalIndex}`);
  assert.ok(graph.includes(`data-active-cue="${cue.globalIndex}"`), `Graph missed cue ${cue.globalIndex}`);
  assert.ok(graph.includes(`data-hot-node="${cue.globalIndex % 14}"`), `Graph node did not update at cue ${cue.globalIndex}`);
}
const pauseFrame = 0;
assert.equal(findCue(pauseFrame), null);
const pauseProps = {frame: pauseFrame, section: currentSection(pauseFrame), energy: energyAt(pauseFrame), activeCue: null};
assert.ok(renderToStaticMarkup(React.createElement(TelemetryRail, pauseProps)).includes('data-current-token="true">—</span>'));
assert.ok(renderToStaticMarkup(React.createElement(AtmosphericOverlays, pauseProps)).includes('data-hot-node="-1"'));

// Regressions for the reviewed WAV: these cues previously appeared early.
const {audioSha256} = require('../src/engine/agent-engine-frame-cues.json');
if (audioSha256 === 'fdd626ed8a3bb1af484e61588aeef72a03ae256be7171c539f53cd6b54fb2cd1') {
  assert.equal(findCue(675)?.text, 'first');
  assert.equal(findCue(685), null);
  assert.equal(findCue(686)?.text, 'means');
  assert.equal(findCue(1508), null);
  assert.equal(findCue(1509)?.text, 'or');
}
console.log(`Verified production frame selection for all ${DURATION_FRAMES} frames and live telemetry/graph updates at all ${SCRIPT_CUES.length} word onsets.`);

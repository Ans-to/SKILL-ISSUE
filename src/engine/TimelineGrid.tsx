import React from 'react';
import {Micro, Panel} from './TelemetryHud';
import {MUTED, ORANGE, SCRIPT_CUES, SECTION_STARTS, WHITE, clamp, cueIndexFor, sectionIndices} from './agentEngineModel';

export const TimelineGrid: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const sectionStart = sectionIndices[4];
  const promptIndex = cueIndexFor('prompt', sectionStart);
  const codeIndex = cueIndexFor('code', promptIndex);
  const framesIndex = cueIndexFor('frames', codeIndex);
  const mp4Index = cueIndexFor('MP4.', framesIndex);
  const stages = [
    {label: 'PROMPT', index: promptIndex},
    {label: 'CODE', index: codeIndex},
    {label: 'FRAMES', index: framesIndex},
    {label: 'MP4', index: mp4Index},
  ];
  const elapsed = Math.max(0, frame - SECTION_STARTS[4]);
  const progress = clamp(elapsed / Math.max(1, SECTION_STARTS[5] - SECTION_STARTS[4]), 0, 1);
  const codeVisible = frame >= SCRIPT_CUES[codeIndex].startFrame;
  const promptVisible = frame >= SCRIPT_CUES[promptIndex].startFrame && frame < SCRIPT_CUES[promptIndex].endFrame;
  const framesVisible = frame >= SCRIPT_CUES[framesIndex].startFrame;
  const mp4Visible = frame >= SCRIPT_CUES[mp4Index].startFrame && frame < SCRIPT_CUES[mp4Index].endFrame;
  const scroll = elapsed * 21;
  return <div style={{position: 'absolute', inset: '125px 2% 130px 30%', overflow: 'hidden'}}>
    <Panel style={{position: 'absolute', inset: 0, borderRadius: 18, padding: 26, opacity: .78}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}><Micro accent>TIMELINE / RENDER QUEUE</Micro><Micro>FRAME {String(Math.floor(frame)).padStart(4, '0')}</Micro></div>
      <div style={{position: 'absolute', left: 24, right: 24, top: 74, bottom: 28, overflow: 'hidden', opacity: codeVisible ? .2 : .7}}>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${-scroll}px)`, display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: 10, width: 2700}}>{[0, 1, 2, 3, 4, 5].map((row) => <div key={row} style={{position: 'relative', border: '1px solid rgba(244,247,255,.1)', background: 'rgba(244,247,255,.012)'}}>{[0, 1, 2, 3, 4, 5, 6, 7].map((block) => <i key={block} style={{position: 'absolute', left: `${block * 13 + row * 3}%`, top: 6, bottom: 6, width: `${6 + (block % 3) * 4}%`, background: block % 4 === 1 ? 'rgba(255,69,0,.3)' : 'rgba(244,247,255,.12)'}}/>)}</div>)}</div>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: '53%', width: 2, background: ORANGE, boxShadow: `0 0 15px ${ORANGE}`}}/>
      </div>
      <div style={{position: 'absolute', right: 35, top: 64, width: 390, height: 280, border: `1px solid rgba(255,69,0,${codeVisible ? .72 : .05})`, background: codeVisible ? 'rgba(6,9,15,.96)' : 'rgba(6,9,15,.26)', boxShadow: codeVisible ? `0 0 ${26 + energy * 28}px rgba(255,69,0,.21)` : 'none', padding: 22, fontFamily: 'monospace', fontSize: 18, lineHeight: 1.7, opacity: codeVisible ? 1 : 0, transform: `translateY(${codeVisible ? 0 : 24}px) scale(${codeVisible ? 1 : .95})`}}>
        <div style={{color: ORANGE}}>const render = (intent) =&gt; {'{'}</div><div style={{paddingLeft: 22, color: WHITE}}>compile(intent);</div><div style={{paddingLeft: 22, color: 'rgba(244,247,255,.55)'}}>return output;</div><div style={{color: ORANGE}}>{'}'}</div>
        <div style={{position: 'absolute', right: 14, top: 13, color: MUTED, fontSize: 9, letterSpacing: 2}}>ENGINE / LIVE</div>
      </div>
      {framesVisible && <div style={{position: 'absolute', right: 58, bottom: 55, display: 'flex', gap: 8, transform: `translateX(${(1 - progress) * 80}px)`}}>{[0, 1, 2, 3].map((i) => <div key={i} style={{width: 92, height: 57, border: '1px solid rgba(244,247,255,.24)', background: `linear-gradient(${135 + i * 12}deg, rgba(255,69,0,${.12 + i * .07}), rgba(244,247,255,.06))`}}/>)}</div>}
      {mp4Visible && <div style={{position: 'absolute', right: 48, bottom: 40, width: 148, height: 88, border: `1px solid ${ORANGE}`, background: 'rgba(255,69,0,.1)', display: 'grid', placeItems: 'center', color: WHITE, fontSize: 18, fontWeight: 900, letterSpacing: 2, boxShadow: `0 0 30px rgba(255,69,0,.24)`}}>{SCRIPT_CUES[mp4Index].text}</div>}
      {promptVisible && <div style={{position: 'absolute', left: 42, bottom: 42, color: WHITE, fontSize: 20, fontWeight: 850, letterSpacing: 1, textTransform: 'uppercase'}}><span style={{color: ORANGE}}>→</span> {SCRIPT_CUES[promptIndex].text}</div>}
      {stages.map((stage, index) => {const cue = SCRIPT_CUES[stage.index]; const shown = frame >= cue.startFrame && frame < cue.endFrame; return <React.Fragment key={stage.label}>{index > 0 && shown && <span style={{position: 'absolute', top: 404, left: `${20 + index * 18}%`, color: ORANGE, fontSize: 26}}>→</span>}<span style={{position: 'absolute', top: 418, left: `${8 + index * 19}%`, opacity: shown ? 1 : 0, color: index === 3 ? ORANGE : WHITE, fontSize: 17, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', textShadow: shown ? `0 0 18px rgba(255,69,0,.3)` : 'none'}}>{cue.text}</span></React.Fragment>;})}
    </Panel>
  </div>;
};

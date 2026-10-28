import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import wordCueData from './agent-engine-word-cues.json';
import audioEnvelope from './agent-engine-audio-envelope.json';

const OBSIDIAN = '#0b0f19';
const ORANGE = '#ff4500';
const WHITE = '#f4f7ff';
const MUTED = 'rgba(244,247,255,.42)';
const FPS = 30;
const DURATION_SECONDS = 45;
const DURATION_FRAMES = FPS * DURATION_SECONDS;

type RawWord = {text: string; start: number; end: number};
type RawTrack = {audio: string; words: RawWord[]; text: string};
export type ScriptCue = RawWord & {globalIndex: number; startFrame: number; endFrame: number};

const track = (wordCueData.tracks as RawTrack[])[0];
export const MOTION_ENGINE_DURATION_FRAMES = DURATION_FRAMES;
export const timestamps = track.words.map((word) => ({start: word.start, end: word.end}));
export const SCRIPT_CUES: ScriptCue[] = track.words.map((word, globalIndex) => ({
  ...word,
  globalIndex,
  // A 30 fps composition resolves millisecond transcript timestamps to the nearest frame.
  startFrame: Math.round(timestamps[globalIndex].start * FPS),
  endFrame: Math.round(timestamps[globalIndex].end * FPS),
}));
const envelope = audioEnvelope.energy as number[];
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const normalize = (word: string): string => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const hashText = (text: string): number => {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};

const findPhraseIndex = (phrase: string): number => {
  const query = phrase.split(/\s+/).map(normalize);
  for (let start = 0; start <= SCRIPT_CUES.length - query.length; start += 1) {
    if (query.every((word, offset) => normalize(SCRIPT_CUES[start + offset].text) === word)) return start;
  }
  return 0;
};
const phraseIndexFrom = (phrase: string, fromIndex: number): number => {
  const query = phrase.split(/\s+/).map(normalize);
  for (let start = fromIndex; start <= SCRIPT_CUES.length - query.length; start += 1) {
    if (query.every((word, offset) => normalize(SCRIPT_CUES[start + offset].text) === word)) return start;
  }
  return fromIndex;
};
const cueAfter = (phrase: string, fromIndex = 0): ScriptCue => SCRIPT_CUES[phraseIndexFrom(phrase, fromIndex)];
const cueIndexFor = (phrase: string, fromIndex = 0): number => phraseIndexFrom(phrase, fromIndex);
const sectionIndices = [
  findPhraseIndex('Your AI agent didn’t build anything'),
  findPhraseIndex('It looks finished'),
  findPhraseIndex('Prompt harder? No.'),
  findPhraseIndex('Engine- first means'),
  findPhraseIndex('Feed intent into the engine'),
  findPhraseIndex('Stop playing with templates'),
];
const SECTION_STARTS = sectionIndices.map((index) => SCRIPT_CUES[index]?.startFrame ?? 0);
const OUTRO_BUILD_INDEX = cueIndexFor('Build', sectionIndices[5]);
const OUTRO_CUT_FRAME = cueAfter('toys.').endFrame + 3;
const findCue = (frame: number): ScriptCue | null => SCRIPT_CUES.find((cue) => frame >= cue.startFrame && frame < cue.endFrame) ?? null;
const lastStartedCue = (frame: number): ScriptCue | null => {
  let result: ScriptCue | null = null;
  for (const cue of SCRIPT_CUES) {
    if (cue.startFrame > frame) break;
    result = cue;
  }
  return result;
};
const energyAt = (frame: number): number => envelope[Math.max(0, Math.min(envelope.length - 1, Math.round(frame)))] ?? 0;
const currentSection = (frame: number): number => {
  let section = 0;
  SECTION_STARTS.forEach((start, index) => {if (frame >= start) section = index;});
  return section;
};

/** Millisecond-aligned single-word slam in the center/right 70% zone. */
export const KineticText: React.FC<{cue: ScriptCue; section: number; frame: number}> = ({cue, section, frame}) => {
  const {fps} = useVideoConfig();
  const elapsed = frame - cue.startFrame;
  const reveal = spring({frame: elapsed, fps, config: {damping: 12, stiffness: 120}});
  const exitStart = cue.endFrame;
  const dissolve = clamp((frame - exitStart) / 4, 0, 1);
  const previous = SCRIPT_CUES[cue.globalIndex - 1];
  const echoAge = frame - cue.startFrame;
  const showEcho = Boolean(previous && cue.startFrame - previous.endFrame <= 12 && echoAge >= 0 && echoAge < 4);
  const hook = section === 0;
  const color = hook ? WHITE : cue.globalIndex % 5 === 0 ? ORANGE : WHITE;
  const shared: React.CSSProperties = {
    position: 'absolute', left: '31%', right: '3%', top: hook ? '47%' : '67%',
    transform: 'translateY(-50%)', transformOrigin: 'left center',
    fontWeight: 950, letterSpacing: -3, lineHeight: .9, whiteSpace: 'nowrap',
    fontFamily: 'Arial, Helvetica, sans-serif',
  };
  return <>
    {showEcho && previous && <div aria-hidden="true" style={{...shared, zIndex: 11, fontSize: 62, color: ORANGE, opacity: .18 * (1 - echoAge / 4), transform: `translate(${32 + echoAge * 12}px, calc(-50% + 18px)) scale(${.82 - echoAge * .035})`, filter: `blur(${1.5 + echoAge * .8}px)`}}>{previous.text}</div>}
    <div aria-hidden="true" style={{
      ...shared, zIndex: 12, color,
      transform: `translateY(-50%) translateY(${(1 - reveal) * 20}px) scale(${(.72 + reveal * .48) * (1 - dissolve * .24)})`,
      opacity: clamp(.98 - dissolve, 0, 1), filter: `blur(${dissolve * 3}px)`,
      fontSize: hook ? 116 : 96,
      textShadow: `0 0 28px rgba(255,69,0,.3), 6px 0 0 rgba(255,69,0,.28)`,
    }}>{cue.text}</div>
  </>;
};

/** Background, isolated Three.js depth, and front-facing 2D text composite independently. */
export const CinematicStack: React.FC<{background: React.ReactNode; threeD: React.ReactNode; typography: React.ReactNode}> = ({background, threeD, typography}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', isolation: 'isolate'}}>
    <div data-layer="1-background" style={{position: 'absolute', inset: 0, zIndex: 0}}>{background}</div>
    <div data-layer="2-three-dimensional" style={{position: 'absolute', inset: 0, zIndex: 2}}>{threeD}</div>
    <div data-layer="10-two-dimensional-type" style={{position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none'}}>{typography}</div>
  </div>
);

/** Procedural cue graph only contains words that have already begun. */
export const SemanticFlow: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const section = currentSection(frame);
  const start = sectionIndices[section] ?? 0;
  const spoken = SCRIPT_CUES.filter((cue) => cue.globalIndex >= start && cue.startFrame <= frame).slice(-13);
  const points = spoken.map((cue, index) => {
    const seed = hashText(`${cue.text}:${cue.globalIndex}`);
    return {cue, x: 36 + index / Math.max(1, spoken.length - 1) * 880, y: 250 + ((seed % 230) - 115) * .6 + Math.sin(frame * .023 + index) * energy * 8};
  });
  return <svg aria-hidden="true" viewBox="0 0 950 500" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', right: 52, top: 130, width: '46vw', height: '58vh', opacity: .24 + energy * .28, overflow: 'visible'}}>
    <defs><filter id="cue-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M20 250H930" stroke={WHITE} strokeOpacity=".1" strokeDasharray="2 12"/>
    {points.slice(1).map((point, index) => <line key={`edge-${point.cue.globalIndex}`} x1={points[index].x} y1={points[index].y} x2={point.x} y2={point.y} stroke={index % 3 ? WHITE : ORANGE} strokeOpacity={.14 + energy * .25} strokeWidth={index % 3 ? 1 : 1.5}/>)}
    {points.map((point) => <circle key={`node-${point.cue.globalIndex}`} cx={point.x} cy={point.y} r={point.cue.startFrame <= frame && frame < point.cue.endFrame ? 7 + energy * 3 : 3} fill={point.cue.startFrame <= frame && frame < point.cue.endFrame ? ORANGE : WHITE} filter={point.cue.startFrame <= frame && frame < point.cue.endFrame ? 'url(#cue-glow)' : undefined}/>)}
  </svg>;
};

const BackgroundLayer: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
  const outro = section === 5;
  const lineX = ((frame * 34) % 2380) - 190;
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: OBSIDIAN}}>
    <div style={{position: 'absolute', inset: 0, background: outro ? 'radial-gradient(circle at center, rgba(255,69,0,.055), transparent 20%), radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,.98) 86%)' : `radial-gradient(ellipse at 72% 45%, rgba(255,69,0,${.025 + energy * .075}), transparent 42%), linear-gradient(110deg, rgba(11,15,25,.98), rgba(11,15,25,.76) 54%, rgba(11,15,25,.34))`}}/>
    {!outro && <>
      <div style={{position: 'absolute', inset: 0, opacity: .09 + energy * .08, backgroundImage: 'linear-gradient(rgba(244,247,255,.32) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.32) 1px, transparent 1px)', backgroundSize: '62px 62px', maskImage: 'linear-gradient(90deg, transparent, black 20%, black 82%, transparent)'}}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 1, transform: `translateX(${lineX - 800}px)`, background: `linear-gradient(90deg, transparent, rgba(255,69,0,${.15 + energy * .45}), transparent)`, boxShadow: `0 0 ${10 + energy * 20}px ${ORANGE}`}}/>
    </>}
  </div>;
};

const ShockVector: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const x = ((frame * 38) % 2380) - 170;
  return <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .32 + energy * .48}} aria-hidden="true">
    <defs><filter id="vector-glow" x="-40%" y="-400%" width="180%" height="900%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d={`M${x - 450} 520H${x + 230}`} stroke={ORANGE} strokeWidth={2 + energy * 2} filter="url(#vector-glow)"/>
    <path d={`M${x - 120} 520H${x + 460}`} stroke={WHITE} strokeOpacity=".48" strokeWidth=".8"/>
    <circle cx={x + 230} cy="520" r={4 + energy * 5} fill={ORANGE}/>
  </svg>;
};

const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => <div style={{background: 'linear-gradient(145deg, rgba(18,24,38,.96), rgba(8,11,19,.9))', border: '1px solid rgba(244,247,255,.13)', boxShadow: '0 24px 90px rgba(0,0,0,.4)', backdropFilter: 'blur(12px)', ...style}}>{children}</div>;
const Micro: React.FC<{children: React.ReactNode; accent?: boolean}> = ({children, accent = false}) => <span style={{fontSize: 10, fontWeight: 900, letterSpacing: 2.4, color: accent ? ORANGE : 'rgba(244,247,255,.52)', textTransform: 'uppercase'}}>{children}</span>;

const TelemetryRail: React.FC<{frame: number; section: number; energy: number; activeCue: ScriptCue | null}> = ({frame, section, energy, activeCue}) => {
  if (section === 5 && frame >= OUTRO_CUT_FRAME) return null;
  const latest = lastStartedCue(frame);
  const history = SCRIPT_CUES.filter((cue) => cue.startFrame <= frame).slice(-8);
  const sectionName = ['HOOK', 'TWIST', 'SHIFT', 'MECHANISM', 'PAYOFF', 'OUTRO'][section];
  const samples = envelope.slice(Math.max(0, Math.floor(frame) - 34), Math.floor(frame) + 1);
  const points = samples.map((value, index) => `${index * 10},${58 - value * 42}`).join(' ');
  const cueNumber = latest ? String(latest.globalIndex + 1).padStart(2, '0') : '00';
  return <div style={{position: 'absolute', zIndex: 12, left: '2%', top: 92, bottom: 96, width: '26vw', minWidth: 360, maxWidth: 480, pointerEvents: 'none'}}>
    <Panel style={{height: '100%', borderRadius: 14, padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 15, overflow: 'hidden', background: 'linear-gradient(155deg, rgba(15,21,34,.96), rgba(6,9,16,.94))', borderColor: 'rgba(244,247,255,.2)'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(244,247,255,.12)'}}><Micro accent>AGENT / LIVE</Micro><span style={{fontFamily: 'monospace', fontSize: 11, color: activeCue ? ORANGE : MUTED}}>● {activeCue ? 'LOCKED' : 'HOLD'}</span></div>
      <div style={{display: 'flex', alignItems: 'end', justifyContent: 'space-between'}}><div><Micro>FRAME COUNTER</Micro><div style={{fontFamily: 'monospace', fontSize: 42, lineHeight: 1, fontWeight: 800, letterSpacing: -2, color: WHITE}}>{String(Math.floor(frame)).padStart(4, '0')}</div></div><div style={{textAlign: 'right'}}><Micro>SCENE</Micro><div style={{fontSize: 13, fontWeight: 900, letterSpacing: 2, color: ORANGE}}>{sectionName}</div></div></div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>{[
        ['WORD CUE', `${cueNumber} / ${String(SCRIPT_CUES.length).padStart(2, '0')}`],
        ['AUDIO RMS', `${Math.round(energy * 100)}%`],
        ['FRAME RATE', '30 FPS'],
        ['SYNC STATE', activeCue ? 'REALTIME' : 'BREATH'],
      ].map(([label, value], index) => <div key={label} style={{padding: '9px 10px', border: '1px solid rgba(244,247,255,.12)', background: index === 0 ? 'rgba(255,69,0,.075)' : 'rgba(244,247,255,.025)'}}><Micro accent={index === 0}>{label}</Micro><div style={{marginTop: 5, fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: WHITE}}>{value}</div></div>)}</div>
      <div style={{border: '1px solid rgba(244,247,255,.12)', background: 'rgba(244,247,255,.025)', padding: '10px 11px'}}><div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 7}}><Micro>TRANSIENT / ENVELOPE</Micro><Micro accent>30 × 30</Micro></div><svg viewBox="0 0 340 70" preserveAspectRatio="none" style={{display: 'block', width: '100%', height: 66}}><path d={`M0 59 L${points || '0,58'}`} fill="none" stroke={ORANGE} strokeWidth="2"/><path d="M0 60H340" stroke={WHITE} strokeOpacity=".17" strokeDasharray="3 7"/></svg></div>
      <div style={{display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, border: '1px solid rgba(244,247,255,.12)', background: 'rgba(0,0,0,.2)', padding: 11, fontFamily: 'monospace'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: 9, borderBottom: '1px solid rgba(244,247,255,.1)'}}><Micro accent>TERMINAL / STREAM</Micro><Micro>NO BUFFER</Micro></div>
        <div style={{paddingTop: 9, color: ORANGE, fontSize: 12, whiteSpace: 'nowrap'}}>$ engine --sync --frame {String(Math.floor(frame)).padStart(4, '0')}</div>
        <div style={{paddingTop: 8, color: 'rgba(244,247,255,.43)', fontSize: 10, letterSpacing: 1.2}}>OUTPUT / SPOKEN TOKENS</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden', paddingTop: 7}}>{history.slice(-6).map((cue, index) => <div key={cue.globalIndex} style={{display: 'flex', gap: 8, alignItems: 'center', color: cue.globalIndex === latest?.globalIndex ? WHITE : 'rgba(244,247,255,.46)', fontSize: 13}}><span style={{color: cue.globalIndex === latest?.globalIndex ? ORANGE : 'rgba(244,247,255,.24)'}}>&gt;</span><span>{cue.text}</span><span style={{marginLeft: 'auto', fontSize: 9, color: 'rgba(244,247,255,.26)'}}>{cue.start.toFixed(2)}</span></div>)}</div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(244,247,255,.1)'}}><Micro>SEQUENCE {String(section + 1).padStart(2, '0')} / 06</Micro><Micro accent>{latest ? 'WORD-LOCKED' : 'ARMED'}</Micro></div>
      </div>
    </Panel>
  </div>;
};

const AtmosphericOverlays: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
  if (section === 5 && frame >= OUTRO_CUT_FRAME) return null;
  const trackX = 30 + ((frame * .07) % 38);
  const graphNodes = [[610,290],[820,180],[1035,350],[1240,220],[1490,340],[1780,225],[700,620],[960,760],[1195,590],[1440,760],[1660,610],[1840,850],[620,885],[1040,900]];
  const graphEdges = [[0,1],[0,6],[1,2],[1,3],[2,3],[2,7],[3,4],[3,8],[4,5],[4,8],[4,9],[5,10],[6,7],[6,12],[7,8],[7,12],[8,9],[8,13],[9,10],[9,13],[10,11],[11,13]];
  const hotNode = (lastStartedCue(frame)?.globalIndex ?? 0) % graphNodes.length;
  return <svg aria-hidden="true" viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none', opacity: .52}}>
    <path d="M552 92V982" stroke={WHITE} strokeOpacity=".17" strokeWidth="1" strokeDasharray="2 10"/>
    <path d="M585 140H1850M585 940H1850" stroke={WHITE} strokeOpacity=".08" strokeWidth="1"/>
    <path d={`M${trackX * 19.2} 110V948`} stroke={ORANGE} strokeOpacity=".16" strokeWidth="1" strokeDasharray="2 18"/>
    <g>{graphEdges.map(([a,b],index) => <line key={`graph-edge-${index}`} x1={graphNodes[a][0]} y1={graphNodes[a][1]} x2={graphNodes[b][0]} y2={graphNodes[b][1]} stroke={index % 5 === frame % 5 ? ORANGE : WHITE} strokeOpacity={index % 5 === frame % 5 ? .25 + energy * .2 : .09} strokeWidth="1"/>)}
    {graphNodes.map(([x,y],index) => <g key={`graph-node-${index}`} transform={`translate(${x} ${y + Math.sin(frame * .025 + index) * 3})`}><circle r={index === hotNode ? 9 + energy * 3 : 4 + energy * 1.5} fill={index === hotNode ? ORANGE : WHITE} fillOpacity={index === hotNode ? .62 : .22}/><circle r={index === hotNode ? 18 : 10} fill="none" stroke={index === hotNode ? ORANGE : WHITE} strokeOpacity={index === hotNode ? .22 : .08}/></g>)}</g>
    {[ [585,140], [1845,140], [585,940], [1845,940], [552,540] ].map(([x,y],i) => <g key={i} transform={`translate(${x} ${y})`} stroke={i === 4 ? ORANGE : WHITE} strokeOpacity={i === 4 ? .48 : .26} strokeWidth="1"><path d="M-12 0H12M0-12V12"/><circle r="4" fill="none"/></g>)}
    <text x="570" y="120" fill={WHITE} fillOpacity=".35" fontSize="10" letterSpacing="3">X / 0300</text>
    <text x="1815" y="965" fill={ORANGE} fillOpacity=".55" fontSize="10" letterSpacing="3">TRACE / {String(Math.floor(frame)).padStart(4, '0')}</text>
    <path d="M560 360h14m-14 90h8m-8 90h14m-14 90h8m-8 90h14" stroke={WHITE} strokeOpacity=".36"/>
  </svg>;
};

const DashboardSlash: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const start = SECTION_STARTS[1];
  const breakCue = cueAfter('break.', sectionIndices[1]);
  const broken = frame >= breakCue.startFrame;
  const slash = spring({frame: Math.max(0, frame - breakCue.startFrame), fps: FPS, config: {damping: 13, stiffness: 135}});
  const progress = clamp((frame - start) / Math.max(1, SECTION_STARTS[2] - start), 0, 1);
  return <div style={{position: 'absolute', left: '30%', right: '2%', top: 132, bottom: 125, transform: `translateY(${(1 - progress) * 25}px) scale(${.98 + progress * .02})`}}>
    <Panel style={{position: 'absolute', inset: 0, borderRadius: 18, padding: 32, opacity: .82}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><Micro accent>OVERVIEW</Micro><Micro>WORKSPACE / 01</Micro></div>
      <div style={{display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 22, marginTop: 26, height: '80%'}}>
        <div style={{display: 'grid', gridTemplateRows: '1fr 1fr', gap: 18}}>
          <Panel style={{borderRadius: 10, padding: 22, background: 'rgba(244,247,255,.025)', boxShadow: 'none'}}><Micro>WEEKLY ACTIVITY</Micro><div style={{height: 150, marginTop: 18, display: 'flex', alignItems: 'end', gap: 16}}>{[37, 70, 48, 89, 57, 95, 65, 78, 42, 74, 54, 90].map((height, index) => <i key={index} style={{flex: 1, height: `${height}%`, background: index % 4 === 1 ? 'rgba(255,69,0,.46)' : 'rgba(244,247,255,.19)', borderRadius: '3px 3px 0 0'}}/>)}</div></Panel>
          <Panel style={{borderRadius: 10, padding: 22, background: 'rgba(244,247,255,.025)', boxShadow: 'none'}}><Micro>RECENT ITEMS</Micro>{[0, 1, 2].map((row) => <div key={row} style={{height: 28, marginTop: 13, display: 'flex', alignItems: 'center', gap: 14}}><i style={{width: 20, height: 20, borderRadius: 5, background: 'rgba(255,69,0,.28)'}}/><i style={{width: `${42 + row * 12}%`, height: 6, background: 'rgba(244,247,255,.17)', borderRadius: 8}}/><i style={{marginLeft: 'auto', width: 54, height: 6, background: 'rgba(244,247,255,.09)', borderRadius: 8}}/></div>)}</Panel>
        </div>
        <div style={{display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>{[0, 1].map((i) => <Panel key={i} style={{borderRadius: 10, padding: 20, background: 'rgba(244,247,255,.025)', boxShadow: 'none'}}><Micro>{i ? 'COMPLETION' : 'TOTAL'}</Micro><div style={{fontSize: 46, fontWeight: 900, marginTop: 14, color: WHITE}}>{i ? '84%' : '2,408'}</div><div style={{height: 3, marginTop: 16, background: i ? ORANGE : 'rgba(244,247,255,.14)', width: i ? '84%' : '62%'}}/></Panel>)}</div>
          <Panel style={{borderRadius: 10, padding: 22, background: 'rgba(244,247,255,.025)', boxShadow: 'none'}}><Micro>PERFORMANCE</Micro><svg viewBox="0 0 500 210" style={{width: '100%', height: '80%', marginTop: 12}}><path d="M0 160 C70 150 78 75 142 111 S230 174 286 93 S390 142 500 34" fill="none" stroke="rgba(244,247,255,.5)" strokeWidth="3"/><path d="M0 160 C70 150 78 75 142 111 S230 174 286 93 S390 142 500 34" fill="none" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="3 12"/></svg></Panel>
        </div>
      </div>
      <svg viewBox="0 0 1500 650" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none'}}><path d="M40 600L1460 30" fill="none" stroke={ORANGE} strokeWidth={4 + energy * 2} strokeLinecap="round" strokeDasharray="1900" strokeDashoffset={broken ? (1 - slash) * 1900 : 1900} style={{filter: `drop-shadow(0 0 13px ${ORANGE})`}}/></svg>
      {broken && <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 260, color: 'rgba(255,69,0,.76)', fontWeight: 300, transform: `rotate(-17deg) scale(${.8 + slash * .18})`, textShadow: `0 0 40px rgba(255,69,0,.4)`}}>×</div>}
    </Panel>
  </div>;
};

const AgentShiftScene: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const chatStart = sectionIndices[2];
  const terminalStart = cueIndexFor('your codebase’s timing model', chatStart);
  const chatWords = SCRIPT_CUES.filter((cue) => cue.globalIndex >= chatStart && cue.startFrame <= frame && cue.globalIndex < terminalStart).slice(-7);
  const terminalWords = SCRIPT_CUES.filter((cue) => cue.globalIndex >= terminalStart && cue.startFrame <= frame).slice(-13);
  const progress = clamp((frame - SECTION_STARTS[2]) / Math.max(1, SECTION_STARTS[3] - SECTION_STARTS[2]), 0, 1);
  return <div style={{position: 'absolute', inset: '130px 2% 135px 30%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
    <Panel style={{position: 'relative', borderRadius: 16, padding: 28, transform: `translateX(${(1 - progress) * -55}px)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}><Micro accent>CHAT / INPUT</Micro><Micro>01</Micro></div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 95, bottom: 100, display: 'grid', placeItems: 'center'}}><div style={{maxWidth: 620, fontSize: 52, lineHeight: 1.2, fontWeight: 850, letterSpacing: -2, color: WHITE}}>{chatWords.map((cue) => <span key={cue.globalIndex} style={{marginRight: 14}}>{cue.text}</span>)}<span style={{color: ORANGE}}>{frame >= SCRIPT_CUES[chatStart + 2].startFrame ? '' : '▌'}</span></div></div>
      <div style={{position: 'absolute', left: 28, right: 28, bottom: 24, borderTop: '1px solid rgba(244,247,255,.1)', paddingTop: 15, display: 'flex', justifyContent: 'space-between'}}><Micro>ASK AGAIN</Micro><Micro accent>↵</Micro></div>
    </Panel>
    <Panel style={{position: 'relative', borderRadius: 16, padding: 28, overflow: 'hidden', transform: `translateX(${(1 - progress) * 55}px)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}><Micro accent>TERMINAL / LIVE</Micro><Micro>STREAMING</Micro></div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 94, bottom: 36, background: 'rgba(0,0,0,.2)', border: '1px solid rgba(244,247,255,.07)', padding: 22, fontFamily: 'monospace', fontSize: 22, lineHeight: 1.7, overflow: 'hidden'}}>
        <div style={{color: ORANGE}}>$ agent inspect --constraints</div>
        {terminalWords.map((cue) => <span key={cue.globalIndex} style={{display: 'inline-block', marginRight: 9, color: cue.globalIndex % 4 === 0 ? ORANGE : 'rgba(244,247,255,.78)'}}>{cue.text}</span>)}
        <span style={{display: 'inline-block', width: 9, height: 22, background: ORANGE, marginLeft: 3, verticalAlign: '-4px', opacity: Math.sin(frame * .35) > 0 ? 1 : .15}}/>
        <div style={{position: 'absolute', left: 22, right: 22, bottom: 20, height: 2, background: 'rgba(244,247,255,.08)'}}><div style={{height: '100%', width: `${clamp(energy * 100, 4, 100)}%`, background: ORANGE, boxShadow: `0 0 12px ${ORANGE}`}}/></div>
      </div>
    </Panel>
  </div>;
};

const MechanicsScene: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const sectionStart = sectionIndices[3];
  const words = [
    {label: 'PHYSICS', cue: cueIndexFor('physics', sectionStart), accent: false},
    {label: 'ISOLATION', cue: cueIndexFor('isolation', sectionStart), accent: true},
    {label: 'MATH', cue: cueIndexFor('math', sectionStart), accent: false},
  ];
  const detailWords = ['timing', 'positions', 'easing', 'transitions—', 'defined'].map((word) => ({word, cue: cueIndexFor(word, sectionStart)}));
  const sameInputs = cueIndexFor('Same inputs.', sectionStart);
  const sameFrames = cueIndexFor('Same frames.', sectionStart);
  const progress = clamp((frame - SECTION_STARTS[3]) / Math.max(1, SECTION_STARTS[4] - SECTION_STARTS[3]), 0, 1);
  return <div style={{position: 'absolute', inset: '130px 2% 135px 30%', overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, opacity: .18, backgroundImage: 'linear-gradient(rgba(244,247,255,.24) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.24) 1px, transparent 1px)', backgroundSize: '54px 54px', transform: `perspective(900px) rotateX(8deg) scale(1.12)`}}/>
    <div style={{position: 'absolute', left: 25, right: 25, top: 30, display: 'flex', justifyContent: 'space-between'}}><Micro accent>SYSTEM / LIVE</Micro><Micro>DETERMINISTIC / 01</Micro></div>
    <div style={{position: 'absolute', inset: '95px 10px 130px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28}}>
      {words.map((item, index) => {
        const cue = SCRIPT_CUES[item.cue];
        const nextCue = words[index + 1] ? SCRIPT_CUES[words[index + 1].cue] : null;
        const disappearAt = Math.min(cue.endFrame + 12, nextCue?.startFrame ?? cue.endFrame + 12);
        const fade = clamp((frame - (disappearAt - 6)) / 6, 0, 1);
        const visible = frame >= cue.startFrame && frame < disappearAt;
        const scale = spring({frame: Math.max(0, frame - cue.startFrame), fps: FPS, config: {damping: 12, stiffness: 120}});
        return <div key={item.label} style={{width: '32%', height: 260, display: 'grid', placeItems: 'center', border: `1px solid ${visible ? (item.accent ? ORANGE : 'rgba(244,247,255,.44)') : 'rgba(244,247,255,.04)'}`, background: visible ? (item.accent ? 'rgba(255,69,0,.1)' : 'rgba(244,247,255,.035)') : 'transparent', boxShadow: visible && item.accent ? `0 0 ${35 + energy * 30}px rgba(255,69,0,.16)` : 'none', opacity: visible ? 1 - fade : 0, transform: `scale(${visible ? .72 + scale * .28 - fade * .12 : .92}) rotate(${visible ? (item.accent ? -2 : 1) : 0}deg)`, color: item.accent ? ORANGE : WHITE, fontSize: 66, fontWeight: 950, letterSpacing: -3}}>{item.label}</div>;
      })}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 92, display: 'flex', justifyContent: 'center', gap: 22}}>{detailWords.map(({word, cue}) => {const timed = SCRIPT_CUES[cue]; const visible = frame >= timed.startFrame && frame < timed.endFrame + 6; const fade = clamp((frame - (timed.endFrame - 2)) / 8, 0, 1); return <span key={word} style={{opacity: visible ? 1 - fade : 0, transform: `translateY(${visible ? fade * 9 : 12}px)`, padding: '10px 16px', border: '1px solid rgba(244,247,255,.16)', color: WHITE, background: 'rgba(244,247,255,.025)', fontFamily: 'monospace', fontSize: 15, letterSpacing: 1.4}}>{word.replace('—', '')}</span>;})}</div>
    <div style={{position: 'absolute', left: '50%', bottom: 2, transform: 'translateX(-50%)', display: 'flex', gap: 18, alignItems: 'center'}}>
      {frame >= SCRIPT_CUES[sameInputs].startFrame && frame < SCRIPT_CUES[sameFrames].startFrame + 4 && <div style={{opacity: 1 - clamp((frame - (SCRIPT_CUES[sameFrames].startFrame - 3)) / 7, 0, 1), padding: '12px 22px', color: WHITE, border: '1px solid rgba(244,247,255,.28)', fontWeight: 900, letterSpacing: 2}}>SAME INPUTS</div>}
      {frame >= SCRIPT_CUES[sameFrames].startFrame && frame < SCRIPT_CUES[cueIndexFor('No template roulette.', sectionStart)].startFrame && <><span style={{color: ORANGE, fontSize: 25}}>→</span><div style={{opacity: 1 - clamp((frame - (SCRIPT_CUES[sameFrames + 1].endFrame)) / 9, 0, 1), padding: '12px 22px', color: ORANGE, border: `1px solid ${ORANGE}`, fontWeight: 900, letterSpacing: 2, boxShadow: `0 0 22px rgba(255,69,0,.13)`}}>SAME FRAMES</div></>}
    </div>
    <div style={{position: 'absolute', inset: '50% auto auto 0', width: `${progress * 100}%`, height: 1, background: `linear-gradient(90deg, transparent, rgba(255,69,0,${.2 + energy * .6}), transparent)`}}/>
  </div>;
};

const CompilerPipeline: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
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
  const promptVisible = frame >= SCRIPT_CUES[promptIndex].startFrame;
  const framesVisible = frame >= SCRIPT_CUES[framesIndex].startFrame;
  const mp4Visible = frame >= SCRIPT_CUES[mp4Index].startFrame;
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
      {mp4Visible && <div style={{position: 'absolute', right: 48, bottom: 40, width: 148, height: 88, border: `1px solid ${ORANGE}`, background: 'rgba(255,69,0,.1)', display: 'grid', placeItems: 'center', color: WHITE, fontSize: 18, fontWeight: 900, letterSpacing: 2, boxShadow: `0 0 30px rgba(255,69,0,.24)`}}>MP4</div>}
      {promptVisible && <div style={{position: 'absolute', left: 42, bottom: 42, color: WHITE, fontSize: 20, fontWeight: 850, letterSpacing: 1}}>INTENT <span style={{color: ORANGE}}>→</span> PROMPT</div>}
      {stages.map((stage, index) => {const shown = frame >= SCRIPT_CUES[stage.index].startFrame; return <React.Fragment key={stage.label}>{index > 0 && shown && <span style={{position: 'absolute', top: 404, left: `${20 + index * 18}%`, color: ORANGE, fontSize: 26}}>→</span>}<span style={{position: 'absolute', top: 418, left: `${8 + index * 19}%`, opacity: shown ? 1 : 0, color: index === 3 ? ORANGE : WHITE, fontSize: 17, fontWeight: 900, letterSpacing: 3, textShadow: shown ? `0 0 18px rgba(255,69,0,.3)` : 'none'}}>{stage.label}</span></React.Fragment>;})}
    </Panel>
  </div>;
};

const OutroPunch: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  if (frame >= OUTRO_CUT_FRAME) return <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,69,0,.055), transparent 13%), radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,.99) 75%)'}}/>;
  const buildIndex = OUTRO_BUILD_INDEX;
  const buildCue = SCRIPT_CUES[buildIndex];
  const words = [
    SCRIPT_CUES[buildIndex],
    SCRIPT_CUES[buildIndex + 1],
    SCRIPT_CUES[buildIndex + 2],
  ].filter((cue) => cue.startFrame <= frame);
  const started = frame >= buildCue.startFrame;
  const reveal = spring({frame: Math.max(0, frame - buildCue.startFrame), fps: FPS, config: {damping: 10, stiffness: 155}});
  const scale = .72 + reveal * .4 + Math.min(.24, Math.max(0, frame - buildCue.startFrame) / (FPS * 4));
  return <div style={{position: 'absolute', inset: '0 2% 0 29.5%', display: 'grid', placeItems: 'center'}}>
    {!started && <svg viewBox="0 0 420 120" style={{position: 'absolute', top: '20%', left: '50%', width: 680, transform: `translateX(-50%) scale(${.82 + Math.sin(frame * .06) * .035})`, opacity: .34}}><path d="M18 85L104 34L190 85L104 111Z M104 34V72 M190 85V111 M104 72L18 120 M104 72L190 120" fill="none" stroke={ORANGE} strokeWidth="2"/><path d="M230 38H400M230 62H360M230 86H390" stroke={WHITE} strokeOpacity=".3" strokeWidth="3"/></svg>}
    {started && <div style={{textAlign: 'center', transform: `scale(${scale})`, fontSize: 96, lineHeight: .9, fontWeight: 950, letterSpacing: -8, textTransform: 'uppercase', textShadow: `0 0 ${20 + energy * 35}px rgba(255,69,0,.27)`}}>{words.map((cue, index) => <span key={cue.globalIndex} style={{color: index === 2 ? ORANGE : WHITE, marginRight: 24}}>{cue.text.replace(/[—-]$/, '')}</span>)}</div>}
  </div>;
};

const HUD: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => {
  if (section === 5 && frame >= OUTRO_CUT_FRAME) return null;
  const progress = frame / (DURATION_FRAMES - 1);
  const displayCue = lastStartedCue(frame);
  const labels = ['01 / HOOK', '02 / TWIST', '03 / SHIFT', '04 / MECHANISM', '05 / PAYOFF', '06 / OUTRO'];
  return <div style={{position: 'absolute', inset: 0, zIndex: 13, color: WHITE, pointerEvents: 'none', fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <header style={{position: 'absolute', left: '31%', right: '3%', top: 34, display: 'flex', justifyContent: 'space-between', color: 'rgba(244,247,255,.72)', fontSize: 10, fontWeight: 900, letterSpacing: 3.1}}><span>LIVE / MOTION RUNTIME</span><span style={{display: 'flex', alignItems: 'center', gap: 12}}><i style={{width: 6, height: 6, borderRadius: '50%', background: activeCue ? ORANGE : MUTED, boxShadow: activeCue ? `0 0 12px ${ORANGE}` : 'none'}}/>{labels[section]} &nbsp;·&nbsp; {(frame / FPS).toFixed(2)} SEC</span></header>
    {(section === 0 || section === 3 || (section === 1 && frame >= cueAfter('break.', sectionIndices[1]).endFrame)) && <SemanticFlow frame={frame} energy={energy}/>}

    {displayCue && (section < 5 || frame < SCRIPT_CUES[OUTRO_BUILD_INDEX].startFrame) && <KineticText key={displayCue.globalIndex} cue={displayCue} section={section} frame={frame}/>}
    {section === 0 && <ShockVector frame={frame} energy={energy}/>}
    <div style={{position: 'absolute', left: 72, right: 72, bottom: 40}}><div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 9, color: 'rgba(244,247,255,.44)', fontSize: 9, fontWeight: 900, letterSpacing: 2.2}}><span>{displayCue ? `WORD / ${String(displayCue.globalIndex + 1).padStart(2, '0')}` : 'BREATH / CUT'}</span><span>{Math.round(energy * 100)}% AUDIO</span></div><div style={{height: 2, background: 'rgba(244,247,255,.14)', position: 'relative'}}><div style={{position: 'absolute', inset: '0 auto 0 0', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${WHITE}, ${ORANGE})`, boxShadow: `0 0 ${6 + energy * 12}px ${ORANGE}`}}/><i style={{position: 'absolute', left: `${progress * 100}%`, top: '50%', width: 6 + energy * 4, height: 6 + energy * 4, borderRadius: '50%', background: ORANGE, transform: 'translate(-50%,-50%)'}}/></div></div>
  </div>;
};

const CameraRig: React.FC<{frame: number; energy: number; section: number}> = ({frame, energy, section}) => {
  const camera = useThree((state) => state.camera);
  camera.position.set(section === 0 ? Math.sin(frame * .01) * .03 : 0, 0, clamp(13 - energy * 1.4, 10.5, 14));
  camera.lookAt(0, 0, 0);
  return null;
};

const ThreeVisuals: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => {
  const past = SCRIPT_CUES.filter((cue) => cue.startFrame <= frame).slice(-22);
  const signature = past.map((cue) => cue.globalIndex).join(',');
  const points = useMemo(() => past.map((cue, index) => {const seed = hashText(`${cue.text}:${cue.globalIndex}`); const angle = index * 2.4 + seed * .000013; const radius = 1.2 + seed % 100 / 100 * 2.4; return {cue, x: Math.cos(angle) * radius, y: Math.sin(angle * 1.2) * (.6 + seed % 37 / 44), z: Math.sin(angle) * 1.3};}), [signature]);
  const vertices: THREE.Vector3[] = [];
  points.slice(1).forEach((point, index) => {const previous = points[index]; vertices.push(new THREE.Vector3(previous.x, previous.y, previous.z), new THREE.Vector3(point.x, point.y, point.z));});
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(vertices), [signature]);
  const rotation = frame * (.002 + energy * .006);
  return <group position={[section === 0 ? 0 : 2.6, 0, 0]} rotation={[.08, rotation, -.03]}>
    <lineSegments visible={section !== 1 || frame >= cueAfter('break.', sectionIndices[1]).endFrame} geometry={geometry}><lineBasicMaterial color={ORANGE} transparent opacity={.11 + energy * .24}/></lineSegments>
    {points.map((point, index) => {const active = point.cue.globalIndex === activeCue?.globalIndex; return <mesh key={point.cue.globalIndex} position={[point.x, point.y + Math.sin(frame * .02 + index) * energy * .08, point.z]} scale={1 + Math.sin(frame * .06 + index) * (.04 + energy * .1)}><sphereGeometry args={[active ? .075 : .04, 12, 10]}/><meshBasicMaterial color={active ? ORANGE : WHITE} transparent opacity={active ? .9 : .2 + energy * .22}/></mesh>;})}
    <mesh rotation={[.5, .2, rotation]}><torusGeometry args={[3.25, .008, 5, 96]}/><meshBasicMaterial color={WHITE} transparent opacity={section === 5 ? 0 : .065 + energy * .1}/></mesh>
  </group>;
};

const ThreeLayer: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => <ThreeCanvas width={1920} height={1080} dpr={1} camera={{position: [0, 0, 13], fov: 38, near: .1, far: 60}} gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: section === 5 ? (frame < OUTRO_CUT_FRAME ? .2 : 0) : .44}}><CameraRig frame={frame} energy={energy} section={section}/><ambientLight intensity={.7}/><pointLight position={[0, 2, 5]} color={ORANGE} intensity={.8 + energy}/><ThreeVisuals frame={frame} section={section} activeCue={activeCue} energy={energy}/></ThreeCanvas>;

const StoryVisuals: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
  if (section === 0) return null;
  if (section === 1) return <DashboardSlash frame={frame} energy={energy}/>;
  if (section === 2) return <AgentShiftScene frame={frame} energy={energy}/>;
  if (section === 3) return <MechanicsScene frame={frame} energy={energy}/>;
  if (section === 4) return <CompilerPipeline frame={frame} energy={energy}/>;
  return <OutroPunch frame={frame} energy={energy}/>;
};

const TypographyLayer: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => {
  const cutToBlack = section === 5 && frame >= OUTRO_CUT_FRAME;
  return <div style={{position: 'absolute', inset: 0, zIndex: 10, color: WHITE, fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <StoryVisuals frame={frame} section={section} energy={energy}/>
    {!cutToBlack && <>
      <AtmosphericOverlays frame={frame} section={section} energy={energy}/>
      <TelemetryRail frame={frame} section={section} energy={energy} activeCue={activeCue}/>
      <HUD frame={frame} section={section} activeCue={activeCue} energy={energy}/>
    </>}
  </div>;
};

export const MotionEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const activeCue = findCue(frame);
  const section = currentSection(frame);
  const energy = energyAt(frame);
  return <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}><CinematicStack background={<BackgroundLayer frame={frame} section={section} energy={energy}/>} threeD={<ThreeLayer frame={frame} section={section} activeCue={activeCue} energy={energy}/>} typography={<TypographyLayer frame={frame} section={section} activeCue={activeCue} energy={energy}/>}/><Audio src={staticFile('agent-engine/voiceover.wav')}/></AbsoluteFill>;
};

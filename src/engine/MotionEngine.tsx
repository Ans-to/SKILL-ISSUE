import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {
  AbsoluteFill,
  Audio,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import * as THREE from 'three';
import wordCueData from './word-cues.json';
import audioEnvelope from './audio-envelope.json';

const OBSIDIAN = '#0b0f19';
const ORANGE = '#ff4500';
const WHITE = '#f4f7ff';
const MUTED = 'rgba(244,247,255,.42)';
const FPS = 30;
const DURATION_SECONDS = 60;
const DURATION_FRAMES = FPS * DURATION_SECONDS;

type RawWord = {text: string; start: number; end: number};
type RawCueTrack = {audio: string; words: RawWord[]; text: string};
export type ScriptCue = RawWord & {globalIndex: number; startFrame: number; endFrame: number};

const track = (wordCueData.tracks as RawCueTrack[])[0];
export const MOTION_ENGINE_DURATION_FRAMES = DURATION_FRAMES;
export const SCRIPT_CUES: ScriptCue[] = track.words.map((word, globalIndex) => ({
  ...word,
  globalIndex,
  startFrame: word.start * FPS,
  endFrame: word.end * FPS,
}));
const envelope = audioEnvelope.energy as number[];
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const mixHex = (from: string, to: string, progress: number): string => {
  const a = from.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16));
  const b = to.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16));
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * progress)).join(',')})`;
};
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
const sectionIndices = [
  findPhraseIndex('Holy shit'),
  findPhraseIndex('I made these motion graphics'),
  findPhraseIndex('This is Claude Opus 5.5.'),
  findPhraseIndex('Claude doesn’t actually generate'),
  findPhraseIndex('So instead of:'),
  findPhraseIndex('And because the animation is procedural'),
  findPhraseIndex('Does this replace After Effects?'),
];
const SECTION_STARTS = sectionIndices.map((index) => SCRIPT_CUES[index]?.startFrame ?? 0);
const findCue = (frame: number): ScriptCue | null => SCRIPT_CUES.find((cue) => frame >= cue.startFrame && frame < cue.endFrame) ?? null;
const cueIndexFor = (phrase: string, fromIndex = 0): number => phraseIndexFrom(phrase, fromIndex);
const CLAIM_GRAPH_REVEAL_FRAME = SCRIPT_CUES[cueIndexFor('MCP.', sectionIndices[1])].endFrame;
const OUTRO_CUT_FRAME = SCRIPT_CUES[cueIndexFor('insane.')].endFrame + FPS * 0.14;
const currentSection = (frame: number): number => {
  let index = 0;
  SECTION_STARTS.forEach((start, candidate) => { if (frame >= start) index = candidate; });
  return index;
};
const energyAt = (frame: number): number => envelope[Math.max(0, Math.min(envelope.length - 1, Math.round(frame)))] ?? 0;

/** Exact spoken word cues, with onset spring and no look-ahead into the narration. */
export const KineticText: React.FC<{cue: ScriptCue; section: number}> = ({cue, section}) => {
  const frame = useCurrentFrame() - cue.startFrame;
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 12, stiffness: 120}});
  const isHook = section === 0;
  const color = section === 0 ? WHITE : cue.globalIndex % 5 === 0 || section === 6 ? ORANGE : WHITE;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        zIndex: 12,
        left: isHook ? '50%' : 92,
        top: isHook ? '48%' : '76%',
        transform: `translate(${isHook ? '-50%' : '0'}, -50%) translateY(${(1 - reveal) * 30}px) scale(${(0.78 + reveal * 0.22) * (isHook ? 1.48 : 1)})`,
        transformOrigin: isHook ? 'center center' : 'left center',
        opacity: 0.82 + clamp(reveal, 0, 1) * 0.18,
        fontSize: '96px',
        fontWeight: 900,
        letterSpacing: '-2px',
        lineHeight: 0.98,
        whiteSpace: 'nowrap',
        color,
        textShadow: `0 0 28px rgba(255,69,0,.28), 5px 0 0 rgba(255,69,0,.38)`,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {cue.text}
    </div>
  );
};

/** Background, Three.js geometry, and front-facing typography remain separate compositing planes. */
export const CinematicStack: React.FC<{
  background: React.ReactNode;
  threeD: React.ReactNode;
  typography: React.ReactNode;
}> = ({background, threeD, typography}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', isolation: 'isolate'}}>
    <div data-layer="1-background" style={{position: 'absolute', inset: 0, zIndex: 0}}>{background}</div>
    <div data-layer="2-three-dimensional" style={{position: 'absolute', inset: 0, zIndex: 2}}>{threeD}</div>
    <div data-layer="10-two-dimensional-type" style={{position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none'}}>{typography}</div>
  </div>
);

/** The word graph grows only from cues that have already begun. */
export const SemanticFlow: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const section = currentSection(frame);
  const sectionStart = sectionIndices[section];
  const spoken = SCRIPT_CUES.filter((cue) => cue.globalIndex >= sectionStart && cue.startFrame <= frame).slice(-12);
  const points = spoken.map((cue, index) => {
    const seed = hashText(`${cue.text}:${cue.globalIndex}`);
    return {
      cue,
      x: 48 + (index / Math.max(1, spoken.length - 1)) * 850,
      y: 255 + ((seed % 241) - 120) * 0.56 + Math.sin(frame * 0.026 + index) * energy * 10,
      radius: cue.startFrame <= frame && frame < cue.endFrame ? 5.5 + energy * 4 : 2.5 + seed % 3,
    };
  });
  return (
    <svg aria-hidden="true" viewBox="0 0 950 520" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', right: '3.5%', top: '12%', width: '46vw', height: '62vh', overflow: 'visible', opacity: section === 0 || section === 6 ? 0.08 : 0.37 + energy * 0.43}}>
      <defs><filter id="graph-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path d="M25 260H925" stroke={WHITE} strokeOpacity=".12" strokeDasharray="2 11"/>
      {points.slice(1).map((point, index) => <g key={`edge-${point.cue.globalIndex}`}>
        <line x1={points[index].x} y1={points[index].y} x2={point.x} y2={point.y} stroke={index % 3 === 1 ? ORANGE : WHITE} strokeOpacity={0.14 + energy * (index % 3 === 1 ? 0.34 : 0.15)} strokeWidth={index % 3 === 1 ? 1.6 : 0.8}/>
        {index > 3 && index % 4 === 0 && <line x1={points[index - 3].x} y1={points[index - 3].y} x2={point.x} y2={point.y} stroke={ORANGE} strokeOpacity=".16" strokeWidth=".8"/>}
      </g>)}
      {points.map((point) => <g key={`node-${point.cue.globalIndex}`}>
        {point.radius > 5 && <circle cx={point.x} cy={point.y} r="28" fill={ORANGE} opacity=".22" filter="url(#graph-glow)"/>}
        <circle cx={point.x} cy={point.y} r={point.radius} fill={point.radius > 5 ? ORANGE : WHITE} opacity={point.radius > 5 ? 1 : 0.48}/>
      </g>)}
    </svg>
  );
};

const BackgroundLayer: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
  const outro = section === 6;
  const gridOpacity = outro ? 0 : 0.08 + energy * 0.09;
  const lineX = ((frame * 25) % 2300) - 180;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: OBSIDIAN}}>
      <div style={{position: 'absolute', inset: 0, background: outro ? 'radial-gradient(circle at center, rgba(255,69,0,.075), transparent 24%), radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,.96) 88%)' : `radial-gradient(ellipse at 71% 46%, rgba(255,69,0,${0.035 + energy * 0.09}), transparent 40%), linear-gradient(110deg, rgba(11,15,25,.98), rgba(11,15,25,.72) 54%, rgba(11,15,25,.3))`}}/>
      {!outro && <>
        <div style={{position: 'absolute', inset: 0, opacity: gridOpacity, backgroundImage: 'linear-gradient(rgba(244,247,255,.36) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.36) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'linear-gradient(90deg, transparent, black 22%, black 78%, transparent)'}}/>
        <div style={{position: 'absolute', left: 0, right: 0, top: '52%', height: 1, background: `linear-gradient(90deg, transparent, rgba(255,69,0,${0.1 + energy * 0.32}), transparent)`, transform: `translateX(${lineX - 800}px)`, boxShadow: `0 0 18px rgba(255,69,0,${0.2 + energy * 0.3})`}}/>
      </>}
      {outro && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,.2) 38%, rgba(0,0,0,.9) 100%)'}}/>}
    </div>
  );
};

const ShockVector: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const x = ((frame * 32) % 2300) - 160;
  return <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.34 + energy * 0.5}} aria-hidden="true">
    <defs><filter id="streak-glow" x="-50%" y="-500%" width="200%" height="1100%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d={`M${x - 420} 520 H${x + 180}`} stroke={ORANGE} strokeWidth={2 + energy * 2} filter="url(#streak-glow)"/>
    <path d={`M${x - 120} 520 H${x + 420}`} stroke={WHITE} strokeOpacity=".6" strokeWidth=".8"/>
    <circle cx={x + 182} cy="520" r={4 + energy * 5} fill={ORANGE}/>
  </svg>;
};

const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{background: 'linear-gradient(145deg, rgba(18,24,38,.94), rgba(9,12,20,.84))', border: '1px solid rgba(244,247,255,.12)', boxShadow: '0 24px 100px rgba(0,0,0,.35)', backdropFilter: 'blur(12px)', ...style}}>{children}</div>
);

const PanelLabel: React.FC<{children: React.ReactNode; accent?: boolean}> = ({children, accent = false}) => (
  <span style={{fontSize: 11, fontWeight: 900, letterSpacing: 2.5, color: accent ? ORANGE : 'rgba(244,247,255,.54)', textTransform: 'uppercase'}}>{children}</span>
);

const TimelineSubversion: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const claimStart = sectionIndices[1];
  const firstAfterEffects = cueIndexFor('After Effects', claimStart);
  const mcpIndex = cueIndexFor('MCP.', claimStart);
  const secondSceneProgress = clamp((frame - SECTION_STARTS[1]) / Math.max(1, SECTION_STARTS[2] - SECTION_STARTS[1]), 0, 1);
  const crossed = frame >= SCRIPT_CUES[mcpIndex].endFrame;
  const aeSpoken = frame >= SCRIPT_CUES[firstAfterEffects + 1].startFrame;
  const playhead = clamp((frame - SCRIPT_CUES[claimStart].startFrame) / Math.max(1, SCRIPT_CUES[mcpIndex].endFrame - SCRIPT_CUES[claimStart].startFrame), 0, 1);
  return (
    <div style={{position: 'absolute', left: 110, right: '43%', top: 155, height: 500, opacity: (0.36 + energy * 0.2) * (crossed ? 0.72 : 1), transform: `translateY(${(1 - secondSceneProgress) * 28}px) scale(${0.96 + secondSceneProgress * 0.04})`}}>
      <Panel style={{position: 'absolute', inset: '0 0 0 0', borderRadius: 18, padding: 34}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><PanelLabel accent>{aeSpoken ? 'AFTER EFFECTS' : 'TIMELINE'}</PanelLabel><PanelLabel>01 — 04 / SEQUENCE</PanelLabel></div>
        <div style={{position: 'absolute', left: 34, right: 34, top: 87, bottom: 40, display: 'grid', gridTemplateColumns: '94px 1fr', gridTemplateRows: 'repeat(5, 1fr)', gap: 14}}>
          {['V1', 'V2', 'V3', 'FX', 'A1'].map((label, index) => <React.Fragment key={label}>
            <span style={{alignSelf: 'center', color: MUTED, fontSize: 12, fontWeight: 800, letterSpacing: 2}}>{label}</span>
            <div style={{position: 'relative', alignSelf: 'center', height: 34, border: '1px solid rgba(244,247,255,.11)', background: 'rgba(244,247,255,.025)'}}>
              <div style={{position: 'absolute', left: `${10 + index * 9}%`, width: `${36 + (index % 2) * 14}%`, top: 4, bottom: 4, background: index === 3 ? 'rgba(255,69,0,.19)' : 'rgba(244,247,255,.12)', borderLeft: `2px solid ${index === 3 ? ORANGE : 'rgba(244,247,255,.28)'}`}}/>
              <div style={{position: 'absolute', left: `${55 + index * 5}%`, width: '22%', top: 4, bottom: 4, background: 'rgba(244,247,255,.08)'}}/>
              {crossed && <div style={{position: 'absolute', inset: '50% -2% auto', height: 2, background: ORANGE, boxShadow: `0 0 15px ${ORANGE}`, transform: `rotate(${index % 2 === 0 ? -4 : 4}deg)`, transformOrigin: 'left center'}}/>}
            </div>
          </React.Fragment>)}
        </div>
        <div style={{position: 'absolute', top: 78 + playhead * 315, bottom: 38, left: `calc(34px + 94px + ${(playhead * 70).toFixed(1)}%)`, width: 1, background: ORANGE, boxShadow: `0 0 12px ${ORANGE}`}}/>
        {crossed && <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none'}}><div style={{fontSize: 300, fontWeight: 300, color: 'rgba(255,69,0,.86)', lineHeight: 1, transform: `rotate(-15deg) scale(${0.8 + secondSceneProgress * 0.35})`, textShadow: `0 0 34px rgba(255,69,0,.4)`}}>×</div></div>}
      </Panel>
    </div>
  );
};

const PromptWindow: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const revealIndex = cueIndexFor('what you want the animation to look like.');
  const typed = SCRIPT_CUES.filter((cue) => cue.globalIndex >= revealIndex && cue.startFrame <= frame).slice(0, 7);
  const panelStart = cueIndexFor('what you want the animation');
  const progress = spring({frame: Math.max(0, frame - SCRIPT_CUES[panelStart].startFrame), fps: FPS, config: {damping: 20, stiffness: 105}});
  return (
    <Panel style={{position: 'absolute', left: '52%', right: 90, bottom: 165, borderRadius: 16, padding: '22px 28px', transform: `translateY(${(1 - progress) * 190}px)`, opacity: progress, boxShadow: `0 16px 75px rgba(0,0,0,.48), 0 0 ${8 + energy * 24}px rgba(255,69,0,.12)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}><PanelLabel accent>INPUT / LIVE</PanelLabel><PanelLabel>CLAUDE / READY</PanelLabel></div>
      <div style={{minHeight: 54, fontSize: 26, fontWeight: 700, letterSpacing: '-.3px', color: WHITE, lineHeight: 1.35}}>
        {typed.map((cue) => <span key={cue.globalIndex} style={{color: cue.globalIndex >= revealIndex + 3 ? ORANGE : WHITE, marginRight: 8}}>{cue.text}</span>)}
        {typed.length > 0 && <span style={{display: 'inline-block', width: 2, height: 27, background: ORANGE, verticalAlign: '-4px', animation: 'cursor 900ms steps(2) infinite'}}/>}
      </div>
    </Panel>
  );
};

const RevealHeadline: React.FC<{frame: number}> = ({frame}) => {
  const start = sectionIndices[2];
  const headEnd = start + 4;
  const words = SCRIPT_CUES.filter((cue) => cue.globalIndex >= start && cue.globalIndex <= headEnd && cue.startFrame <= frame);
  const cue = SCRIPT_CUES[start];
  const reveal = spring({frame: Math.max(0, frame - cue.startFrame), fps: FPS, config: {damping: 16, stiffness: 90}});
  return <div style={{position: 'absolute', left: 108, top: 146, width: '82%', transform: `translateY(${(1 - reveal) * 50}px) scale(${0.94 + reveal * 0.06})`, fontSize: 84, fontWeight: 900, letterSpacing: -4, lineHeight: 1.02, textTransform: 'uppercase', textShadow: `0 0 28px rgba(255,69,0,.13)`}}>
    {words.map((word) => <span key={word.globalIndex} style={{color: word.globalIndex >= start + 2 ? ORANGE : WHITE, marginRight: 18}}>{word.text.replace(/[.,]$/, '')}</span>)}
  </div>;
};

const MechanicsScene: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const startIndex = sectionIndices[3];
  const mechanicsCues = ['text,', 'shapes,', 'positions,', 'easing,', 'transitions,', 'particles—'].map((word) => cueIndexFor(word, startIndex));
  const mathStart = cueIndexFor('mathematically', startIndex);
  const progress = clamp((frame - SECTION_STARTS[3]) / Math.max(1, SECTION_STARTS[4] - SECTION_STARTS[3]), 0, 1);
  const t = Math.max(0, frame - SECTION_STARTS[3]) / FPS;
  return (
    <div style={{position: 'absolute', inset: '128px 90px 128px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, opacity: 0.96}}>
      <Panel style={{position: 'relative', borderRadius: 18, padding: '30px 30px 34px', overflow: 'hidden', transform: `translateX(${(1 - progress) * -90}px)`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 24}}><PanelLabel accent>SYSTEM / SOURCE</PanelLabel><PanelLabel>FRAME {String(Math.floor(frame)).padStart(4, '0')}</PanelLabel></div>
        <div style={{fontFamily: 'monospace', fontSize: 22, lineHeight: 1.85, color: 'rgba(244,247,255,.7)'}}>
          <div><span style={{color: ORANGE}}>const</span> motion = {'{'}</div>
          {mechanicsCues.map((cueIndex, index) => {
            const cue = SCRIPT_CUES[cueIndex];
            const show = cue && cue.startFrame <= frame;
            const names = ['text', 'shapes', 'positions', 'easing', 'transitions', 'particles'];
            const values = ['kineticType()', 'geometry[]', '[x, y, z]', 'spring(12)', 'morph()', 'emit()'];
            return <div key={names[index]} style={{paddingLeft: 34, opacity: show ? 1 : 0, color: show ? WHITE : MUTED, transform: `translateX(${show ? 0 : -12}px)`, transition: 'none'}}><span style={{color: ORANGE}}>{names[index]}</span>: <span style={{color: show ? '#c3d0ec' : MUTED}}>{values[index]}</span>,</div>;
          })}
          <div>{'}'}</div>
        </div>
        <div style={{position: 'absolute', left: 30, right: 30, bottom: 27, display: 'flex', justifyContent: 'space-between'}}><PanelLabel>SYSTEM / LIVE</PanelLabel><PanelLabel accent>{frame >= SCRIPT_CUES[mathStart].startFrame ? 'MATH → MOTION' : 'LIVE COMPILE'}</PanelLabel></div>
      </Panel>
      <Panel style={{position: 'relative', borderRadius: 18, overflow: 'hidden', transform: `translateX(${(1 - progress) * 90}px)`}}>
        <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(244,247,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,255,.08) 1px, transparent 1px)', backgroundSize: '48px 48px', transform: `perspective(600px) rotateX(3deg) scale(1.15)`}}/>
        <div style={{position: 'absolute', left: 28, top: 25}}><PanelLabel accent>COORDINATE SPACE</PanelLabel></div>
        <svg viewBox="0 0 800 650" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', inset: '30px 12px 12px', width: 'calc(100% - 24px)', height: 'calc(100% - 42px)'}}>
          <defs><filter id="shape-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <path d="M90 330H710M400 100V560" stroke={WHITE} strokeOpacity=".13" strokeDasharray="3 10"/>
          <path d={`M110 ${470 - Math.sin(t * 1.2) * 45} C230 160, ${400 + Math.sin(t * .7) * 70} 540, ${690 - Math.cos(t) * 80} 210`} fill="none" stroke={ORANGE} strokeOpacity=".45" strokeWidth="2" strokeDasharray="8 9"/>
          <rect x={330 + Math.sin(t * .9) * 120} y={220 + Math.cos(t * .8) * 60} width={110 + Math.sin(t * .6) * 30} height={110 - Math.sin(t * .6) * 30} rx={clamp((t - 4) * 16, 0, 54)} fill="none" stroke={WHITE} strokeWidth="2.5" filter="url(#shape-glow)" transform={`rotate(${t * 12}, 385, 275)`}/>
          <circle cx={385 + Math.sin(t * 1.2) * 175} cy={340 + Math.cos(t * 1.1) * 110} r={40 + Math.sin(t * 2) * 8} fill="rgba(255,69,0,.12)" stroke={ORANGE} strokeWidth="2.4"/>
          <path d={`M${190 + Math.cos(t) * 120} ${430 + Math.sin(t * 1.3) * 80} l${145 + Math.sin(t * .8) * 45} -${95 + Math.cos(t) * 30}`} stroke={WHITE} strokeWidth="3" strokeLinecap="round"/>
          <circle cx={690 - progress * 160} cy={210 + Math.sin(t * 2.3) * 90} r="5" fill={ORANGE}/>
          <text x="400" y="620" fill="rgba(244,247,255,.55)" textAnchor="middle" fontFamily="monospace" fontSize="17">x = {Math.round(385 + Math.sin(t * 1.2) * 175)}  /  y = {Math.round(340 + Math.cos(t * 1.1) * 110)}</text>
        </svg>
        <div style={{position: 'absolute', right: 26, top: 25}}><PanelLabel>{Math.round(energy * 100)}% / AUDIO</PanelLabel></div>
      </Panel>
    </div>
  );
};

const WorkflowCollapse: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const start = sectionIndices[4];
  const oldNodes = [
    {label: 'After Effects', phrase: 'After Effects', color: WHITE},
    {label: 'layers', phrase: 'layers', color: WHITE},
    {label: 'keyframes', phrase: 'keyframes', color: WHITE},
    {label: 'graph editor', phrase: 'graph editor', color: WHITE},
    {label: 'render', phrase: 'render...', color: WHITE},
  ].map((node) => ({...node, cue: cueAfter(node.phrase, start)}));
  const newNodes = [
    {label: 'PROMPT', phrase: 'Prompt'},
    {label: 'CODE', phrase: 'code', start: cueIndexFor('Prompt', start)},
    {label: 'VIDEO', phrase: 'video.', start: cueIndexFor('Prompt', start)},
  ].map((node) => ({...node, cue: cueAfter(node.phrase, node.start ?? start)}));
  const promptIndex = cueIndexFor('Prompt', start);
  const renderCue = cueAfter('render', promptIndex);
  const collapse = spring({frame: Math.max(0, frame - SCRIPT_CUES[promptIndex].startFrame), fps: FPS, config: {damping: 18, stiffness: 130}});
  const progress = clamp((frame - SECTION_STARTS[4]) / Math.max(1, SECTION_STARTS[5] - SECTION_STARTS[4]), 0, 1);
  return (
    <div style={{position: 'absolute', inset: '150px 90px 168px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 64}}>
      <div style={{display: 'flex', justifyContent: 'space-between', opacity: 0.5 + progress * 0.3}}>
        {oldNodes.map((node, index) => {
          const visible = frame >= node.cue.endFrame;
          return <div key={node.label} style={{position: 'relative', width: '18%', height: 84, display: 'grid', placeItems: 'center', border: `1px solid ${visible ? 'rgba(244,247,255,.24)' : 'rgba(244,247,255,.06)'}`, background: visible ? 'rgba(244,247,255,.045)' : 'rgba(244,247,255,.015)', color: visible ? WHITE : 'rgba(244,247,255,.14)', fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textAlign: 'center', transform: `scale(${frame >= node.cue.startFrame ? 1 : 0.92})`, transition: 'none'}}>
            {visible && node.label}
            {visible && <span style={{position: 'absolute', inset: '49% -5%', height: 2, background: ORANGE, boxShadow: `0 0 12px ${ORANGE}`, transform: `rotate(${index % 2 ? 4 : -4}deg)`}}/>}
            {index < oldNodes.length - 1 && <span style={{position: 'absolute', left: '100%', width: 45, top: '50%', borderTop: `1px solid ${visible ? 'rgba(255,69,0,.5)' : 'rgba(244,247,255,.08)'}`}}/>}
          </div>;
        })}
      </div>
      <div style={{height: 2, width: `${progress * 100}%`, margin: '0 auto', background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`, boxShadow: `0 0 ${8 + energy * 18}px ${ORANGE}`, opacity: 0.5}}/>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 35, transform: `scale(${0.86 + collapse * 0.14}) translateY(${(1 - collapse) * 45}px)`}}>
        {newNodes.map((node, index) => {
          const visible = frame >= node.cue.startFrame;
          return <React.Fragment key={`${node.label}-${index}`}>
            <div style={{minWidth: 210, padding: '28px 32px', border: `1px solid ${visible ? ORANGE : 'rgba(244,247,255,.08)'}`, background: visible ? 'rgba(255,69,0,.1)' : 'rgba(244,247,255,.015)', boxShadow: visible ? `0 0 34px rgba(255,69,0,.12)` : 'none', opacity: visible ? 1 : 0.12, textAlign: 'center', color: visible ? WHITE : MUTED, fontWeight: 900, letterSpacing: 4, fontSize: 24}}>{visible ? node.label : '···'}</div>
            {index < newNodes.length - 1 && <div style={{position: 'relative', color: visible ? ORANGE : 'rgba(244,247,255,.12)', fontSize: 38, fontWeight: 300}}>→{index === 1 && frame >= renderCue.startFrame && <span style={{position: 'absolute', left: '50%', top: -25, transform: 'translateX(-50%)', color: ORANGE, fontSize: 9, fontWeight: 900, letterSpacing: 1.5}}>RENDER</span>}</div>}
          </React.Fragment>;
        })}
      </div>
    </div>
  );
};

const FlexControl: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const start = cueIndexFor('Make this transition smoother,');
  const spoken = SCRIPT_CUES.filter((cue) => cue.globalIndex >= start && cue.startFrame <= frame).slice(-26);
  const typed = spoken.map((cue) => cue.text).join(' ');
  const flexStart = SECTION_STARTS[5];
  const outroStart = SECTION_STARTS[6];
  const loopProgress = clamp((frame - flexStart) / Math.max(1, outroStart - flexStart), 0, 1);
  const smoothCue = SCRIPT_CUES[cueIndexFor('smoother,')];
  const colorCue = SCRIPT_CUES[cueIndexFor('color,')];
  const slowCue = SCRIPT_CUES[cueIndexFor('slow')];
  const loopCue = SCRIPT_CUES[cueIndexFor('loop')];
  const makeSmooth = frame >= smoothCue.startFrame;
  const orangeState = frame >= colorCue.startFrame;
  const slowed = frame >= slowCue.startFrame;
  const looped = frame >= loopCue.startFrame;
  const loopPhase = clamp((frame - loopCue.startFrame) / Math.max(1, outroStart - loopCue.startFrame), 0, 1);
  const t = (frame - flexStart) / FPS;
  const cycle = looped ? Math.sin(loopPhase * Math.PI * 2) : Math.sin(t * (slowed ? 1.15 : 2.8));
  const size = 152 + cycle * (makeSmooth ? 32 : 56);
  const returnToWhite = looped ? loopPhase : 0;
  const color = orangeState ? mixHex(ORANGE, WHITE, returnToWhite) : WHITE;
  const rotation = looped ? loopPhase * 360 : t * (slowed ? 14 : 42);
  const cornerRadius = looped ? 5 + Math.sin(loopPhase * Math.PI) * 47 : makeSmooth ? 34 : 5;
  return (
    <div style={{position: 'absolute', inset: '130px 110px 138px', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 60, alignItems: 'center'}}>
      <div style={{position: 'relative', height: 510, display: 'grid', placeItems: 'center'}}>
        <div style={{position: 'absolute', width: 470, height: 470, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,69,0,${0.06 + energy * 0.16}), transparent 69%)`, transform: `scale(${1 + cycle * .06})`}}/>
        <svg width="500" height="500" viewBox="0 0 500 500" style={{overflow: 'visible'}}>
          <defs><filter id="morph-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="15" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <circle cx="250" cy="250" r="197" fill="none" stroke={WHITE} strokeOpacity=".1" strokeWidth="1" strokeDasharray="3 11"/>
          <rect x={250 - size / 2} y={250 - size / 2} width={size} height={size} rx={cornerRadius} fill={color} fillOpacity=".9" filter="url(#morph-glow)" transform={`rotate(${rotation},250,250)`}/>
          <circle cx="250" cy="250" r={9 + energy * 14} fill={WHITE} fillOpacity={orangeState ? .85 : .7}/>
          <path d={`M250 42V${85 + cycle * 30}M458 250H${416 - cycle * 22}M250 458V${416 - cycle * 18}M42 250H${84 + cycle * 25}`} stroke={ORANGE} strokeWidth="2" strokeLinecap="round" opacity=".8"/>
        </svg>
        <div style={{position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center'}}><PanelLabel accent>{looped ? 'LOOP / CLOSED' : slowed ? 'EASING / SLOWED' : 'STATE / LIVE'}</PanelLabel></div>
      </div>
      <Panel style={{borderRadius: 18, padding: 30, minHeight: 420, display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 24}}><PanelLabel accent>COMMAND STREAM</PanelLabel><PanelLabel>STREAM / LIVE</PanelLabel></div>
        <div style={{fontFamily: 'monospace', fontSize: 21, lineHeight: 1.75, color: WHITE, flex: 1, overflow: 'hidden'}}>
          <span style={{color: ORANGE}}>&gt; </span>{typed || <span style={{color: MUTED}}>awaiting instruction</span>}
          {typed && <span style={{display: 'inline-block', width: 2, height: 22, background: ORANGE, marginLeft: 4, verticalAlign: '-3px'}}/>}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 20, borderTop: '1px solid rgba(244,247,255,.1)', paddingTop: 20}}><PanelLabel>SPRING / {makeSmooth ? 'SMOOTH' : 'LIVE'}</PanelLabel><PanelLabel accent>STATE / {orangeState ? 'ORANGE' : 'WHITE'}</PanelLabel></div>
      </Panel>
    </div>
  );
};

const OutroPunch: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const pretty = SCRIPT_CUES[cueIndexFor('pretty')];
  const insane = SCRIPT_CUES[cueIndexFor('insane.')];
  const cutFrame = OUTRO_CUT_FRAME;
  if (frame >= cutFrame) {
    const pulse = 0.62 + Math.sin((frame - cutFrame) * 0.22) * 0.2 + energy * 0.12;
    return <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at center, rgba(255,69,0,.1), transparent 12%), radial-gradient(ellipse at center, transparent 14%, rgba(0,0,0,.98) 70%)'}}><div style={{width: 8 + pulse * 10, height: 8 + pulse * 10, borderRadius: '50%', background: ORANGE, boxShadow: `0 0 ${18 + pulse * 28}px ${ORANGE}, 0 0 ${60 + pulse * 90}px rgba(255,69,0,.7)`, opacity: pulse}}/></div>;
  }
  const showPretty = frame >= pretty.startFrame;
  const showInsane = frame >= insane.startFrame;
  const reveal = spring({frame: Math.max(0, frame - pretty.startFrame), fps: FPS, config: {damping: 11, stiffness: 150}});
  const zoom = 0.8 + reveal * 0.32 + Math.max(0, frame - insane.startFrame) / (FPS * 6);
  return <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: `scale(${zoom})`, opacity: showPretty ? 1 : 0}}>
    <div style={{textAlign: 'center', fontSize: 174, lineHeight: .86, fontWeight: 900, letterSpacing: -9, textTransform: 'uppercase', textShadow: `0 0 55px rgba(255,69,0,.2)`}}>
      {showPretty && <div style={{color: WHITE}}>Pretty</div>}
      {showInsane && <div style={{color: ORANGE, filter: `drop-shadow(0 0 ${18 + energy * 24}px rgba(255,69,0,.65))`}}>Insane.</div>}
    </div>
  </div>;
};

const HUD: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => {
  if (section === 6 && frame >= OUTRO_CUT_FRAME) return null;
  const progress = frame / (DURATION_FRAMES - 1);
  const sectionLabels = ['01 / SHOCK', '02 / CLAIM', '03 / REVEAL', '04 / MECHANICS', '05 / FLOW', '06 / CONTROL', '07 / CLOSE'];
  return <div style={{position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none', color: WHITE, fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <header style={{position: 'absolute', top: 34, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(244,247,255,.72)', fontSize: 10, fontWeight: 900, letterSpacing: 3.2}}>
      <span>MOTION STUDY / LIVE SYSTEM</span>
      <span style={{display: 'flex', alignItems: 'center', gap: 12}}><i style={{width: 7, height: 7, borderRadius: '50%', background: activeCue ? ORANGE : 'rgba(244,247,255,.28)', boxShadow: activeCue ? `0 0 13px ${ORANGE}` : 'none'}}/>{sectionLabels[section]}&nbsp;&nbsp;·&nbsp;&nbsp;{(frame / FPS).toFixed(2)} SEC</span>
    </header>
    {section > 0 && section < 6 && (section > 1 || frame >= CLAIM_GRAPH_REVEAL_FRAME) && <SemanticFlow frame={frame} energy={energy}/>}
    {activeCue && section < 6 && <KineticText key={activeCue.globalIndex} cue={activeCue} section={section}/>}
    {section === 0 && <ShockVector frame={frame} energy={energy}/>}
    <div style={{position: 'absolute', left: 72, right: 72, bottom: 40}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 9, color: 'rgba(244,247,255,.43)', fontSize: 9, fontWeight: 900, letterSpacing: 2.2}}><span>{activeCue ? `WORD CUE / ${String(activeCue.globalIndex + 1).padStart(3, '0')}` : 'BREATH / CUT'}</span><span>{Math.round(energy * 100)}% AUDIO ENERGY</span></div>
      <div style={{height: 2, background: 'rgba(244,247,255,.14)', position: 'relative'}}><div style={{position: 'absolute', inset: '0 auto 0 0', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${WHITE}, ${ORANGE})`, boxShadow: `0 0 ${6 + energy * 13}px ${ORANGE}`}}/><div style={{position: 'absolute', left: `${progress * 100}%`, top: '50%', width: 5 + energy * 4, height: 5 + energy * 4, background: ORANGE, borderRadius: '50%', transform: 'translate(-50%, -50%)'}}/></div>
    </div>
  </div>;
};

const CameraRig: React.FC<{frame: number; energy: number; section: number}> = ({frame, energy, section}) => {
  const camera = useThree((state) => state.camera);
  const depth = clamp(13 - energy * 1.2, 10.5, 14.5);
  camera.position.set(section === 0 ? Math.sin(frame * 0.01) * 0.04 : 0, 0, depth);
  camera.lookAt(0, 0, 0);
  return null;
};

const ThreeVisuals: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => {
  const past = SCRIPT_CUES.filter((cue) => cue.startFrame <= frame).slice(-20);
  const signature = past.map((cue) => cue.globalIndex).join(',');
  const points = useMemo(() => past.map((cue, index) => {
    const seed = hashText(`${cue.text}:${cue.globalIndex}`);
    const angle = index * 2.399963 + seed * 0.000013;
    const radius = 1.3 + (seed % 100) / 100 * 2.2;
    return {cue, x: Math.cos(angle) * radius, y: Math.sin(angle * 1.13) * (0.55 + (seed % 43) / 50), z: Math.sin(angle) * 1.1};
  }), [signature]);
  const vertices: THREE.Vector3[] = [];
  points.slice(1).forEach((point, index) => {const prev = points[index]; vertices.push(new THREE.Vector3(prev.x, prev.y, prev.z), new THREE.Vector3(point.x, point.y, point.z));});
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(vertices), [signature]);
  const t = frame / FPS;
  const orbit = t * (section === 5 ? 0.22 : 0.5) * (energy > .8 ? 1.03 : 1);
  const centerX = section === 3 ? 3.35 : section === 0 ? 0 : 2.9;
  return <group position={[centerX, 0, 0]} rotation={[0.1, orbit, -0.04]}>
    <lineSegments visible={section > 1 || frame >= CLAIM_GRAPH_REVEAL_FRAME} geometry={lineGeometry}><lineBasicMaterial color={ORANGE} transparent opacity={0.16 + energy * 0.35}/></lineSegments>
    {points.map((point, index) => {
      const isActive = point.cue.globalIndex === activeCue?.globalIndex;
      const pulse = 1 + Math.sin(frame * .07 + index * 1.8) * (.07 + energy * .17);
      return <mesh key={point.cue.globalIndex} position={[point.x, point.y + Math.sin(frame * .018 + index) * energy * .09, point.z]} scale={pulse * (isActive ? 1.8 : .95)}><sphereGeometry args={[isActive ? .075 : .04, 12, 10]}/><meshBasicMaterial color={isActive ? ORANGE : WHITE} transparent opacity={isActive ? .95 : .3 + energy * .3}/></mesh>;
    })}
    <mesh rotation={[.5, .2, orbit]}><torusGeometry args={[3.2 + energy * .13, .008, 5, 96]}/><meshBasicMaterial color={WHITE} transparent opacity={section === 0 || section === 6 ? .05 : .09 + energy * .13}/></mesh>
    {section === 3 && <group position={[Math.sin(t) * .2, Math.cos(t * .8) * .15, .3]} rotation={[t * .1, t * .28, t * .16]}>
      <mesh><boxGeometry args={[1.4 + Math.sin(t * .6) * .18, 1.4 - Math.sin(t * .6) * .18, .14]}/><meshBasicMaterial color={WHITE} wireframe transparent opacity={.55}/></mesh>
      <mesh rotation={[0, 0, -t * .3]}><torusGeometry args={[1.25, .035, 6, 64]}/><meshBasicMaterial color={ORANGE} transparent opacity={.72}/></mesh>
    </group>}
  </group>;
};

const ThreeLayer: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => (
  <ThreeCanvas width={1920} height={1080} dpr={1} camera={{position: [0, 0, 13], fov: 38, near: .1, far: 60}} gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: section === 6 ? 0 : .54}}>
    <CameraRig frame={frame} energy={energy} section={section}/>
    <ambientLight intensity={.7}/><pointLight position={[0, 2, 5]} color={ORANGE} intensity={.8 + energy}/>
    <ThreeVisuals frame={frame} section={section} activeCue={activeCue} energy={energy}/>
  </ThreeCanvas>
);

const StoryVisuals: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
  if (section === 0) return null;
  if (section === 1) return <TimelineSubversion frame={frame} energy={energy}/>;
  if (section === 2) return <><RevealHeadline frame={frame}/><PromptWindow frame={frame} energy={energy}/></>;
  if (section === 3) return <MechanicsScene frame={frame} energy={energy}/>;
  if (section === 4) return <WorkflowCollapse frame={frame} energy={energy}/>;
  if (section === 5) return <FlexControl frame={frame} energy={energy}/>;
  return <OutroPunch frame={frame} energy={energy}/>;
};

const TypographyLayer: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => (
  <div style={{position: 'absolute', inset: 0, zIndex: 10, color: WHITE, fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <StoryVisuals frame={frame} section={section} energy={energy}/>
    <HUD frame={frame} section={section} activeCue={activeCue} energy={energy}/>
  </div>
);

export const MotionEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const activeCue = findCue(frame);
  const section = currentSection(frame);
  const energy = energyAt(frame);
  const background = <BackgroundLayer frame={frame} section={section} energy={energy}/>;
  const threeD = <ThreeLayer frame={frame} section={section} activeCue={activeCue} energy={energy}/>;
  const typography = <TypographyLayer frame={frame} section={section} activeCue={activeCue} energy={energy}/>;
  return (
    <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}>
      <CinematicStack background={background} threeD={threeD} typography={typography}/>
      <Audio src={staticFile('after-effects/voiceover.wav')}/>
    </AbsoluteFill>
  );
};

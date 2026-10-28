import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {audioEnergyAt, PlaybackState, playbackAt, TimedWord, TOTAL_FRAMES, TOTAL_WORDS} from './timing';

const LIME = '#c7ff00';
const WHITE = '#f4f7f1';
const clamp = (value: number, low = 0, high = 1): number => Math.max(low, Math.min(high, value));
const clean = (word: string): string => word.toLowerCase().replace(/[^a-z0-9]/g, '');

const hashWord = (word: string): number => {
  let hash = 2166136261;
  for (const character of word) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};

const GraphOverlay: React.FC<{state: PlaybackState}> = ({state}) => {
  const cue = state.active ?? state.held;
  const token = cue?.text ?? '';
  const seed = hashWord(token || 'pause');
  const count = Math.max(8, Math.min(19, 8 + clean(token).length));
  const nodes = Array.from({length: count}, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (seed % 300) / 100;
    const wobble = Math.sin(state.frame * 0.038 + index * 1.7 + seed * 0.0001) * (3 + state.energy * 15);
    const radius = 118 + ((seed >>> (index % 16)) % 70) + wobble;
    return {x: 360 + Math.cos(angle) * radius, y: 290 + Math.sin(angle) * radius * 0.72, radius: index % 4 === 0 ? 4.3 : 2.8};
  });
  const links = nodes.flatMap((node, index) => {
    const step = 1 + ((seed >>> (index % 20)) % 4);
    const target = nodes[(index + step) % nodes.length];
    return [{from: node, to: target, major: index % 3 === 0}];
  });
  const pulse = state.wordProgress;
  const pulseEdge = links[Math.floor(pulse * links.length) % links.length];
  const pulseX = pulseEdge.from.x + (pulseEdge.to.x - pulseEdge.from.x) * (pulse % 1);
  const pulseY = pulseEdge.from.y + (pulseEdge.to.y - pulseEdge.from.y) * (pulse % 1);
  const opacity = state.active ? 0.55 + state.energy * 0.45 : 0.18 + state.energy * 0.16;

  return (
    <svg aria-hidden="true" viewBox="0 0 720 580" style={{position: 'absolute', right: 76, top: 150, width: 'min(42vw, 760px)', height: 'min(62vh, 620px)', overflow: 'visible', opacity}}>
      <defs>
        <radialGradient id="nodeAura"><stop stopColor={LIME} stopOpacity=".62"/><stop offset="1" stopColor={LIME} stopOpacity="0"/></radialGradient>
        <filter id="limeBloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="360" cy="290" r={180 + state.energy * 34} fill="none" stroke={LIME} strokeOpacity=".1" strokeDasharray={`${2 + state.energy * 5} 12`} strokeWidth="1" transform={`rotate(${state.frame * (0.09 + state.energy * 0.12)} 360 290)`}/>
      {links.map((link, index) => <line key={`e${index}`} x1={link.from.x} y1={link.from.y} x2={link.to.x} y2={link.to.y} stroke={link.major ? LIME : WHITE} strokeOpacity={link.major ? 0.42 + state.energy * 0.3 : 0.13 + state.energy * 0.16} strokeWidth={link.major ? 1.25 : 0.7} />)}
      {nodes.map((node, index) => <g key={`n${index}`}>
        <circle cx={node.x} cy={node.y} r={node.radius * (1 + state.energy * 0.35)} fill={index % 4 === 0 ? LIME : WHITE} opacity={0.42 + state.energy * 0.55}/>
        {index % 4 === 0 && <circle cx={node.x} cy={node.y} r={node.radius * 4} fill="url(#nodeAura)" opacity=".32"/>}
      </g>)}
      {state.active && <g filter="url(#limeBloom)"><circle cx={pulseX} cy={pulseY} r={5 + state.energy * 5} fill={LIME}/><circle cx={pulseX} cy={pulseY} r={14 + state.energy * 15} fill="none" stroke={LIME} strokeOpacity=".68" strokeWidth="1.2"/></g>}
      <path d="M24 290H148M572 290H696M360 16V124M360 456V564" fill="none" stroke={WHITE} strokeOpacity=".12" strokeDasharray="2 9"/>
    </svg>
  );
};

const RecentTranscript: React.FC<{words: TimedWord[]; active: TimedWord | null}> = ({words, active}) => (
  <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px', maxWidth: 860, minHeight: 36, fontFamily: 'Arial, Helvetica, sans-serif'}}>
    {words.map((word) => {
      const isActive = word.globalIndex === active?.globalIndex;
      return <span key={word.globalIndex} style={{fontSize: isActive ? 22 : 18, fontWeight: isActive ? 800 : 500, color: isActive ? LIME : 'rgba(244,247,241,.52)', textShadow: isActive ? `0 0 ${8 + active!.text.length}px ${LIME}55` : 'none'}}>{word.text}</span>;
    })}
  </div>
);

export const KineticLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const state = playbackAt(frame);
  const cue = state.active;
  const word = cue?.text ?? '';
  const textSize = clamp(252 - Math.max(0, clean(word).length - 4) * 10.5, 112, 252);
  const localCueFrame = cue ? Math.floor(cue.startFrame) : frame;
  const entrance = cue ? spring({frame: frame - localCueFrame, fps, config: {damping: 13, stiffness: 235, mass: 0.62}}) : 0;
  const scale = interpolate(clamp(entrance), [0, 1], [0.52, 1]) * (0.985 + state.energy * 0.105);
  const lift = interpolate(clamp(entrance), [0, 1], [34, 0]);
  const seconds = (frame / fps).toFixed(2).padStart(5, '0');
  const wordNumber = cue ? cue.globalIndex + 1 : Math.max(0, state.recentWords[state.recentWords.length - 1]?.globalIndex ?? 0);
  const backgroundEnergy = audioEnergyAt(frame);
  const captionOpacity = cue ? 1 : 0;
  const ink = cue ? 1 : 0;
  const progress = frame / (TOTAL_FRAMES - 1);

  return (
    <div aria-hidden="true" style={{position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden', pointerEvents: 'none', color: WHITE, fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 73% 43%, rgba(199,255,0,.055), transparent 38%), linear-gradient(90deg, rgba(3,5,6,.32), transparent 76%), linear-gradient(0deg, rgba(3,5,6,.85), transparent 37%)'}}/>
      <div style={{position: 'absolute', inset: 0, opacity: 0.18, background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 5px, rgba(244,247,241,.16) 6px, transparent 7px)', mixBlendMode: 'screen'}}/>

      <header style={{position: 'absolute', top: 36, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 4, color: 'rgba(244,247,241,.76)', fontSize: 10, fontWeight: 800, letterSpacing: 3.2}}>
        <span>NOKIA&nbsp; / &nbsp;WORD-SYNC ENGINE</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 12}}><i style={{width: 6, height: 6, borderRadius: '50%', background: cue ? LIME : 'rgba(244,247,241,.28)', boxShadow: cue ? `0 0 13px ${LIME}` : 'none'}}/>WORD {String(wordNumber).padStart(2, '0')} / {TOTAL_WORDS}&nbsp;&nbsp;·&nbsp;&nbsp;{seconds} SEC</span>
      </header>

      <section style={{position: 'absolute', left: 74, top: '31%', width: '65%', minHeight: 330, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 5}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, color: LIME, fontSize: 11, fontWeight: 900, letterSpacing: 4.2, opacity: cue ? 0.8 : 0.24}}>
          <span style={{width: 40, height: 2, background: LIME, boxShadow: `0 0 ${6 + backgroundEnergy * 12}px ${LIME}`}}/>{cue ? `WORD ${String(cue.globalIndex + 1).padStart(2, '0')}` : 'SIGNAL HOLD'}
        </div>
        <div style={{position: 'relative', minHeight: 245, display: 'flex', alignItems: 'center', opacity: captionOpacity, transform: `translate3d(0,${lift}px,0) scale(${scale})`, transformOrigin: 'left center'}}>
          {cue && <>
            <div style={{position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%) scale(1.025)', fontSize: textSize, lineHeight: 0.9, letterSpacing: -Math.min(8, textSize * 0.04), fontWeight: 900, whiteSpace: 'nowrap', color: LIME, opacity: 0.12 + state.energy * 0.12, filter: 'blur(1px)'}}>{word}</div>
            <div style={{position: 'relative', fontSize: textSize, lineHeight: 0.9, letterSpacing: -Math.min(8, textSize * 0.04), fontWeight: 900, whiteSpace: 'nowrap', color: WHITE, textShadow: `0 0 ${12 + state.energy * 28}px rgba(199,255,0,${0.12 + state.energy * 0.3})`}}>
              {word.split('').map((character, index) => <span key={`${cue.globalIndex}-${index}`} style={{display: 'inline-block', color: index === word.length - 1 || /[,.:!?]/.test(character) ? LIME : WHITE, transform: `translateY(${Math.sin(frame * 0.24 + index * 1.8) * (2 + state.energy * 9)}px)`}}>{character}</span>)}
            </div>
          </>}
        </div>
        <div style={{marginTop: 5, minHeight: 48, opacity: cue ? 0.92 : 0, transform: `translateY(${cue ? 0 : 6}px)`}}>
          <RecentTranscript words={state.recentWords} active={cue}/>
        </div>
      </section>

      <GraphOverlay state={state}/>

      <div style={{position: 'absolute', left: 72, right: 72, bottom: 51, zIndex: 4}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, color: 'rgba(244,247,241,.48)', fontSize: 9, fontWeight: 800, letterSpacing: 2.7}}>
          <span>{cue ? `AUDIO LOCK / ${cue.trackIndex + 1}` : 'BREATH / PAUSE'}</span>
          <span>{Math.round(backgroundEnergy * 100)}% ENERGY</span>
        </div>
        <div style={{height: 2, background: 'rgba(244,247,241,.14)', position: 'relative'}}>
          <div style={{position: 'absolute', inset: '0 auto 0 0', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${WHITE}, ${LIME})`, boxShadow: `0 0 ${4 + backgroundEnergy * 17}px ${LIME}`}}/>
          <div style={{position: 'absolute', left: `${progress * 100}%`, top: '50%', width: 5 + backgroundEnergy * 4, height: 5 + backgroundEnergy * 4, borderRadius: '50%', background: LIME, transform: 'translate(-50%, -50%)'}}/>
        </div>
      </div>
    </div>
  );
};

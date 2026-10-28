import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CONCEPT_COPY, ConceptId, getNarrativeState, TIMED_TRACKS, TOTAL_FRAMES} from '../story/semanticEngine';

const C = {paper: '#edf5f2', cyan: '#76e4e8', amber: '#f5b765', dim: '#a3b7bc', ink: '#080d14'};
const CONCEPT_ORDER: ConceptId[] = ['origin', 'material', 'industry', 'network', 'device'];
const clamp = (value: number, low = 0, high = 1): number => Math.max(low, Math.min(high, value));

const EnergyLine: React.FC<{frame: number; energy: number; momentum: number}> = ({frame, energy, momentum}) => {
  const points = Array.from({length: 92}, (_, index) => {
    const x = 2 + index * 4.7;
    const wave = Math.sin(index * 0.31 + frame * 0.095) * 2.3 + Math.sin(index * 0.13 - frame * 0.037) * 1.4;
    const pulse = Math.sin((index / 91) * Math.PI * 4 - frame * 0.11) * (2 + energy * 13 + momentum * 8);
    const y = 21 + wave + pulse;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 432 44" preserveAspectRatio="none" style={{display: 'block', width: 432, height: 44, overflow: 'visible'}} aria-hidden="true">
      <path d="M2 22H430" stroke="rgba(118,228,232,.18)" strokeDasharray="2 8" />
      <path d={points} fill="none" stroke="rgba(118,228,232,.78)" strokeWidth="1.35" />
      <circle cx={2 + (frame / (TOTAL_FRAMES - 1)) * 428} cy={21 + Math.sin(frame * 0.09) * (2 + energy * 9)} r={2.7 + energy * 2} fill={C.amber} />
    </svg>
  );
};

const ConceptConstellation: React.FC<{active: ConceptId; weights: Record<ConceptId, number>; energy: number}> = ({active, weights, energy}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 0, marginTop: 28, maxWidth: 705}}>
    {CONCEPT_ORDER.map((concept, index) => {
      const copy = CONCEPT_COPY[concept];
      const isActive = concept === active;
      const amount = clamp(weights[concept]);
      return (
        <React.Fragment key={concept}>
          <div style={{minWidth: 92, opacity: 0.38 + amount * 0.62, transition: 'none'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
              <span style={{width: 6 + amount * 3, height: 6 + amount * 3, borderRadius: '50%', background: isActive ? C.amber : C.cyan, boxShadow: isActive ? `0 0 ${8 + energy * 14}px ${C.amber}` : 'none'}} />
              <span style={{fontSize: 8, fontWeight: 800, letterSpacing: 1.6, color: isActive ? C.paper : C.dim}}>{copy.index.split(' / ')[1]}</span>
            </div>
            <div style={{height: 1, marginTop: 9, width: `${Math.max(24, 76 * Math.max(amount, isActive ? 0.44 : 0))}px`, background: isActive ? `linear-gradient(90deg, ${C.amber}, rgba(245,183,101,.08))` : 'rgba(118,228,232,.3)'}} />
          </div>
          {index < CONCEPT_ORDER.length - 1 && <div style={{height: 1, width: 27, margin: '0 3px 10px', background: 'rgba(118,228,232,.16)'}} />}
        </React.Fragment>
      );
    })}
  </div>
);

export const EditorialLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const state = getNarrativeState(frame);
  const copy = CONCEPT_COPY[state.dominant];
  const activeWeight = state.concepts[state.dominant];
  const track = TIMED_TRACKS.find((candidate) => frame >= candidate.from && frame < candidate.to) ?? TIMED_TRACKS[TIMED_TRACKS.length - 1];
  const intro = spring({frame, fps, config: {damping: 15, stiffness: 70}});
  const headlineProgress = spring({frame: frame - track.from, fps, config: {damping: 14, stiffness: 86}});
  const headOpacity = clamp(headlineProgress) * (0.64 + activeWeight * 0.36);
  const tracking = 2.4 - state.energy * 1.25;
  const scale = 0.985 + activeWeight * 0.017 + state.energy * 0.025;
  const progress = frame / (TOTAL_FRAMES - 1);
  const elapsed = (frame / fps).toFixed(1).padStart(4, '0');
  const accent = copy.tint;

  return (
    <div aria-hidden="true" style={{position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden', pointerEvents: 'none', color: C.paper, fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,8,14,.76) 0%, rgba(3,8,14,.36) 40%, transparent 74%), linear-gradient(0deg, rgba(3,8,14,.76) 0%, transparent 43%), radial-gradient(ellipse at 72% 36%, rgba(34,143,155,.12), transparent 38%)'}} />
      <div style={{position: 'absolute', inset: 0, opacity: 0.32, background: 'radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,.55) 100%)'}} />

      <header style={{position: 'absolute', left: 76, right: 76, top: 42, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: clamp(intro), transform: `translateY(${(1 - clamp(intro)) * -10}px)`, color: 'rgba(221,239,236,.76)', fontSize: 10, fontWeight: 800, letterSpacing: 3.4}}>
        <span>FIELD STUDY&nbsp; / &nbsp;NOKIA</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 13}}><i style={{width: 5, height: 5, borderRadius: '50%', background: accent, boxShadow: `0 0 11px ${accent}`}} />{track.id.replace(/-/g, ' ').toUpperCase()}&nbsp;&nbsp;·&nbsp;&nbsp;{elapsed} SEC</span>
      </header>

      <section style={{position: 'absolute', left: 76, top: 189, width: 760, opacity: headOpacity, transform: `translateY(${(1 - clamp(headlineProgress)) * 18}px) scale(${scale})`, transformOrigin: 'left center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 13, color: accent, fontSize: 11, fontWeight: 900, letterSpacing: 4.6}}>
          <span style={{width: 36, height: 1, background: accent, boxShadow: `0 0 ${state.energy * 12}px ${accent}`}} />{copy.index}
        </div>
        <div style={{marginTop: 21, color: C.paper, fontSize: state.dominant === 'industry' ? 86 : 104, lineHeight: 0.88, letterSpacing: tracking - 5.4, fontWeight: 900, textShadow: '0 8px 48px rgba(0,0,0,.68)'}}>{copy.word}</div>
        <div style={{width: 490, marginTop: 22, color: '#c0d0d0', font: '400 21px/1.38 Georgia, serif', letterSpacing: 0.12}}>{copy.phrase}</div>
        <ConceptConstellation active={state.dominant} weights={state.concepts} energy={state.energy} />
      </section>

      <aside style={{position: 'absolute', right: 76, top: 282, width: 344, padding: '21px 23px 20px', border: '1px solid rgba(118,228,232,.35)', borderRadius: '18px 18px 18px 4px', background: 'linear-gradient(140deg, rgba(13,32,42,.82), rgba(6,14,23,.72) 68%, rgba(14,32,39,.78))', boxShadow: 'inset 0 1px 0 rgba(235,250,247,.12), 0 25px 64px rgba(0,0,0,.38), 0 0 30px rgba(51,190,201,.1)', backdropFilter: 'blur(14px) saturate(135%)', WebkitBackdropFilter: 'blur(14px) saturate(135%)', opacity: 0.72 + activeWeight * 0.28, transform: `translateY(${(1 - activeWeight) * 8}px)`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: accent, fontSize: 9, fontWeight: 900, letterSpacing: 3}}>
          <span>SEMANTIC SIGNAL / {String(CONCEPT_ORDER.indexOf(state.dominant) + 1).padStart(2, '0')}</span><span>{Math.round(activeWeight * 100)}%</span>
        </div>
        <div style={{marginTop: 14, font: '400 27px/1.08 Georgia, serif', letterSpacing: -0.5}}>{copy.word.charAt(0) + copy.word.slice(1).toLowerCase()}</div>
        <div style={{marginTop: 17, height: 1, background: 'linear-gradient(90deg, rgba(118,228,232,.48), rgba(118,228,232,.03))'}} />
        <div style={{display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 10, marginTop: 17}}>
          {CONCEPT_ORDER.map((concept) => {
            const selected = concept === state.dominant;
            const value = state.concepts[concept];
            return <React.Fragment key={concept}>
              <span style={{fontSize: 9, fontWeight: 800, letterSpacing: 1.9, color: selected ? C.paper : C.dim, opacity: 0.56 + value * 0.44}}>{CONCEPT_COPY[concept].word}</span>
              <span style={{fontVariantNumeric: 'tabular-nums', color: selected ? accent : 'rgba(163,183,188,.58)', fontSize: 9, fontWeight: 800}}>{String(Math.round(value * 100)).padStart(2, '0')}</span>
            </React.Fragment>;
          })}
        </div>
        <div style={{marginTop: 21}}><EnergyLine frame={frame} energy={state.energy} momentum={state.momentum} /></div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 5, color: 'rgba(183,203,205,.48)', fontSize: 8, fontWeight: 800, letterSpacing: 1.7}}><span>AUDIO MOMENTUM</span><span>{Math.round(state.motion * 100)} / 100</span></div>
      </aside>

      <div style={{position: 'absolute', left: 76, right: 76, bottom: 55, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 19, color: 'rgba(207,225,223,.67)', fontSize: 9, fontWeight: 800, letterSpacing: 2.8}}>
          <span>NOKIA&nbsp; / &nbsp;FINLAND&nbsp; / &nbsp;1865—TODAY</span>
          <span style={{width: 52, height: 1, background: 'rgba(118,228,232,.42)'}} />
          <span>FROM MATERIAL TO NETWORK</span>
        </div>
        <div style={{width: 300, height: 2, background: 'rgba(225,240,237,.15)', position: 'relative'}}>
          <div style={{position: 'absolute', inset: '0 auto 0 0', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${accent})`, boxShadow: `0 0 ${4 + state.energy * 13}px ${accent}`}} />
          <div style={{position: 'absolute', left: `${progress * 100}%`, top: '50%', width: 5 + state.energy * 3, height: 5 + state.energy * 3, borderRadius: '50%', background: accent, transform: 'translate(-50%, -50%)'}} />
        </div>
      </div>
    </div>
  );
};

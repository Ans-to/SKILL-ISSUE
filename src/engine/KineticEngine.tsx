import React from 'react';
import {spring, useVideoConfig} from 'remotion';
import {ORANGE, SCRIPT_CUES, WHITE, currentSection, findCue, hashText, sectionIndices, type ScriptCue} from './agentEngineModel';

/** Absolute-frame kinetic word hit. The parent mounts it only during the cue interval. */
export const KineticText: React.FC<{cue: ScriptCue; section: number; frame: number}> = ({cue, section, frame}) => {
  const {fps} = useVideoConfig();
  const elapsed = frame - cue.startFrame;
  const reveal = spring({frame: elapsed, fps, config: {damping: 10, stiffness: 180}});
  const hook = section === 0;
  const color = hook ? WHITE : cue.globalIndex % 5 === 0 ? ORANGE : WHITE;
  return <div aria-hidden="true" style={{
    position: 'absolute', zIndex: 12, left: '31%', right: '3%', top: hook ? '47%' : '67%',
    transform: `translateY(-50%) scale(${.9 + reveal * .1})`,
    transformOrigin: 'left center', opacity: 1,
    fontSize: hook ? 116 : 96, fontWeight: 950, letterSpacing: -3, lineHeight: .9,
    whiteSpace: 'nowrap', color, fontFamily: 'Arial, Helvetica, sans-serif',
    textShadow: '0 0 28px rgba(255,69,0,.3), 6px 0 0 rgba(255,69,0,.28)',
  }}>{cue.text}</div>;
};

/** Spoken-word graph: future cues are excluded; the active node follows the exact frame cue. */
export const SemanticFlow: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const section = currentSection(frame);
  const start = sectionIndices[section] ?? 0;
  const spoken = SCRIPT_CUES.filter((cue) => cue.globalIndex >= start && cue.startFrame <= frame).slice(-13);
  const activeCue = findCue(frame);
  const points = spoken.map((cue, index) => {
    const seed = hashText(`${cue.text}:${cue.globalIndex}`);
    return {
      cue,
      x: 36 + index / Math.max(1, spoken.length - 1) * 880,
      y: 250 + ((seed % 230) - 115) * .6 + Math.sin(frame * .023 + index) * energy * 8,
    };
  });
  return <svg aria-hidden="true" viewBox="0 0 950 500" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', right: 52, top: 130, width: '46vw', height: '58vh', opacity: .24 + energy * .28, overflow: 'visible'}}>
    <defs><filter id="cue-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M20 250H930" stroke={WHITE} strokeOpacity=".1" strokeDasharray="2 12"/>
    {points.slice(1).map((point, index) => <line key={`edge-${point.cue.globalIndex}`} x1={points[index].x} y1={points[index].y} x2={point.x} y2={point.y} stroke={index % 3 ? WHITE : ORANGE} strokeOpacity={.14 + energy * .25} strokeWidth={index % 3 ? 1 : 1.5}/>)}
    {points.map((point) => {
      const active = point.cue.globalIndex === activeCue?.globalIndex;
      return <circle key={`node-${point.cue.globalIndex}`} cx={point.x} cy={point.y} r={active ? 7 + energy * 3 : 3} fill={active ? ORANGE : WHITE} filter={active ? 'url(#cue-glow)' : undefined}/>;
    })}
  </svg>;
};

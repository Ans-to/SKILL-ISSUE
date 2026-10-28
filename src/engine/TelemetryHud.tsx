import React from 'react';
import {KineticText, SemanticFlow} from './KineticEngine';
import {DURATION_FRAMES, FPS, MUTED, ORANGE, OUTRO_CUT_FRAME, SCRIPT_CUES, WHITE, cueAfter, envelope, lastStartedCue, sectionIndices, type ScriptCue} from './agentEngineModel';

export const Panel: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => <div style={{background: 'linear-gradient(145deg, rgba(18,24,38,.96), rgba(8,11,19,.9))', border: '1px solid rgba(244,247,255,.13)', boxShadow: '0 24px 90px rgba(0,0,0,.4)', backdropFilter: 'blur(12px)', ...style}}>{children}</div>;
export const Micro: React.FC<{children: React.ReactNode; accent?: boolean}> = ({children, accent = false}) => <span style={{fontSize: 10, fontWeight: 900, letterSpacing: 2.4, color: accent ? ORANGE : 'rgba(244,247,255,.52)', textTransform: 'uppercase'}}>{children}</span>;

export const TelemetryRail: React.FC<{frame: number; section: number; energy: number; activeCue: ScriptCue | null}> = ({frame, section, energy, activeCue}) => {
  if (section === 5 && frame >= OUTRO_CUT_FRAME) return null;
  const latest = lastStartedCue(frame);
  const history = SCRIPT_CUES.filter((cue) => cue.startFrame <= frame).slice(-8);
  const sectionName = ['HOOK', 'TWIST', 'SHIFT', 'MECHANISM', 'PAYOFF', 'OUTRO'][section];
  const samples = envelope.slice(Math.max(0, Math.floor(frame) - 34), Math.floor(frame) + 1);
  const points = samples.map((value, index) => `${index * 10},${58 - value * 42}`).join(' ');
  const cueNumber = latest ? String(latest.globalIndex + 1).padStart(2, '0') : '00';
  return <div data-active-cue={activeCue?.globalIndex ?? -1} style={{position: 'absolute', zIndex: 12, left: '2%', top: 92, bottom: 96, width: '26vw', minWidth: 360, maxWidth: 480, pointerEvents: 'none'}}>
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
        <div style={{paddingTop: 8, color: 'rgba(244,247,255,.43)', fontSize: 10, letterSpacing: 1.2}}>OUTPUT / ACTIVE TOKEN</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 8, minHeight: 35, paddingTop: 8, color: activeCue ? WHITE : MUTED, fontSize: 19, fontWeight: 800}}><span style={{color: ORANGE}}>&gt;</span><span data-current-token="true">{activeCue?.text ?? '—'}</span><span style={{marginLeft: 'auto', fontSize: 10, color: MUTED}}>{activeCue ? `F${String(activeCue.startFrame).padStart(4, '0')}` : 'HOLD'}</span></div>
        <div style={{paddingTop: 12, color: 'rgba(244,247,255,.43)', fontSize: 10, letterSpacing: 1.2}}>FRAME HISTORY / NO BUFFER</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', paddingTop: 10}}>{history.slice(-6).map((cue) => <div key={cue.globalIndex} style={{display: 'flex', gap: 8, alignItems: 'center', color: cue.globalIndex === latest?.globalIndex ? WHITE : 'rgba(244,247,255,.38)', fontSize: 11}}><span style={{color: cue.globalIndex === latest?.globalIndex ? ORANGE : MUTED}}>{String(cue.globalIndex + 1).padStart(2, '0')}</span><span>F{String(cue.startFrame).padStart(4, '0')}–{String(cue.endFrame).padStart(4, '0')}</span><i style={{height: 3, marginLeft: 'auto', width: `${18 + (cue.globalIndex * 17) % 45}%`, background: cue.globalIndex === activeCue?.globalIndex ? ORANGE : 'rgba(244,247,255,.16)'}}/></div>)}</div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(244,247,255,.1)'}}><Micro>SEQUENCE {String(section + 1).padStart(2, '0')} / 06</Micro><Micro accent>{activeCue ? 'WORD-LOCKED' : 'STANDBY'}</Micro></div>
      </div>
    </Panel>
  </div>;
};

export const AtmosphericOverlays: React.FC<{frame: number; section: number; energy: number; activeCue: ScriptCue | null}> = ({frame, section, energy, activeCue}) => {
  if (section === 5 && frame >= OUTRO_CUT_FRAME) return null;
  const trackX = 30 + ((frame * .07) % 38);
  const graphNodes = [[610,290],[820,180],[1035,350],[1240,220],[1490,340],[1780,225],[700,620],[960,760],[1195,590],[1440,760],[1660,610],[1840,850],[620,885],[1040,900]];
  const graphEdges = [[0,1],[0,6],[1,2],[1,3],[2,3],[2,7],[3,4],[3,8],[4,5],[4,8],[4,9],[5,10],[6,7],[6,12],[7,8],[7,12],[8,9],[8,13],[9,10],[9,13],[10,11],[11,13]];
  const hotNode = activeCue ? activeCue.globalIndex % graphNodes.length : -1;
  const hit = activeCue ? Math.max(0, 1 - (frame - activeCue.startFrame) / 6) : 0;
  return <svg data-active-cue={activeCue?.globalIndex ?? -1} data-hot-node={hotNode} aria-hidden="true" viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none', opacity: .52}}>
    <path d="M552 92V982" stroke={WHITE} strokeOpacity=".17" strokeWidth="1" strokeDasharray="2 10"/>
    <path d="M585 140H1850M585 940H1850" stroke={WHITE} strokeOpacity=".08" strokeWidth="1"/>
    <path d={`M${trackX * 19.2} 110V948`} stroke={ORANGE} strokeOpacity=".16" strokeWidth="1" strokeDasharray="2 18"/>
    <g>{graphEdges.map(([a,b],index) => {const active = a === hotNode || b === hotNode; return <line key={`graph-edge-${index}`} x1={graphNodes[a][0]} y1={graphNodes[a][1]} x2={graphNodes[b][0]} y2={graphNodes[b][1]} stroke={active ? ORANGE : WHITE} strokeOpacity={active ? .28 + energy * .2 + hit * .18 : .09} strokeWidth={active ? 1.7 : 1}/>;})}
    {graphNodes.map(([x,y],index) => <g key={`graph-node-${index}`} transform={`translate(${x} ${y + Math.sin(frame * .025 + index) * 3})`}><circle r={index === hotNode ? 9 + energy * 3 + hit * 4 : 4 + energy * 1.5} fill={index === hotNode ? ORANGE : WHITE} fillOpacity={index === hotNode ? .8 : .22}/><circle r={index === hotNode ? 18 + hit * 12 : 10} fill="none" stroke={index === hotNode ? ORANGE : WHITE} strokeOpacity={index === hotNode ? .4 : .08}/></g>)}</g>
    {[ [585,140], [1845,140], [585,940], [1845,940], [552,540] ].map(([x,y],i) => <g key={i} transform={`translate(${x} ${y})`} stroke={i === 4 ? ORANGE : WHITE} strokeOpacity={i === 4 ? .48 : .26} strokeWidth="1"><path d="M-12 0H12M0-12V12"/><circle r="4" fill="none"/></g>)}
    <text x="570" y="120" fill={WHITE} fillOpacity=".35" fontSize="10" letterSpacing="3">X / 0300</text>
    <text x="1815" y="965" fill={ORANGE} fillOpacity=".55" fontSize="10" letterSpacing="3">TRACE / {String(Math.floor(frame)).padStart(4, '0')}</text>
    <path d="M560 360h14m-14 90h8m-8 90h14m-14 90h8m-8 90h14" stroke={WHITE} strokeOpacity=".36"/>
  </svg>;
};

export const HUD: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => {
  if (section === 5 && frame >= OUTRO_CUT_FRAME) return null;
  const progress = frame / (DURATION_FRAMES - 1);
  const displayCue = activeCue;
  const labels = ['01 / HOOK', '02 / TWIST', '03 / SHIFT', '04 / MECHANISM', '05 / PAYOFF', '06 / OUTRO'];
  return <div style={{position: 'absolute', inset: 0, zIndex: 13, color: WHITE, pointerEvents: 'none', fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <header style={{position: 'absolute', left: '31%', right: '3%', top: 34, display: 'flex', justifyContent: 'space-between', color: 'rgba(244,247,255,.72)', fontSize: 10, fontWeight: 900, letterSpacing: 3.1}}><span>LIVE / MOTION RUNTIME</span><span style={{display: 'flex', alignItems: 'center', gap: 12}}><i style={{width: 6, height: 6, borderRadius: '50%', background: activeCue ? ORANGE : MUTED, boxShadow: activeCue ? `0 0 12px ${ORANGE}` : 'none'}}/>{labels[section]} &nbsp;·&nbsp; {(frame / FPS).toFixed(2)} SEC</span></header>
    {(section === 0 || section === 3 || (section === 1 && frame >= cueAfter('break.', sectionIndices[1]).endFrame)) && <SemanticFlow frame={frame} energy={energy}/>}

    {activeCue && <KineticText key={activeCue.globalIndex} cue={activeCue} section={section} frame={frame}/>}
    <div style={{position: 'absolute', left: 72, right: 72, bottom: 40}}><div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 9, color: 'rgba(244,247,255,.44)', fontSize: 9, fontWeight: 900, letterSpacing: 2.2}}><span>{displayCue ? `WORD / ${String(displayCue.globalIndex + 1).padStart(2, '0')}` : 'BREATH / CUT'}</span><span>{Math.round(energy * 100)}% AUDIO</span></div><div style={{height: 2, background: 'rgba(244,247,255,.14)', position: 'relative'}}><div style={{position: 'absolute', inset: '0 auto 0 0', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${WHITE}, ${ORANGE})`, boxShadow: `0 0 ${6 + energy * 12}px ${ORANGE}`}}/><i style={{position: 'absolute', left: `${progress * 100}%`, top: '50%', width: 6 + energy * 4, height: 6 + energy * 4, borderRadius: '50%', background: ORANGE, transform: 'translate(-50%,-50%)'}}/></div></div>
  </div>;
};

import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {spring} from 'remotion';
import * as THREE from 'three';
import {Micro, Panel} from './TelemetryHud';
import {TimelineGrid} from './TimelineGrid';
import {FPS, MUTED, OBSIDIAN, ORANGE, OUTRO_BUILD_INDEX, OUTRO_CUT_FRAME, SCRIPT_CUES, SECTION_STARTS, WHITE, clamp, cueAfter, cueIndexFor, findCue, hashText, sectionIndices, type ScriptCue} from './agentEngineModel';

export const BackgroundLayer: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
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

export const ShockVector: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const x = ((frame * 38) % 2380) - 170;
  return <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .32 + energy * .48}} aria-hidden="true">
    <defs><filter id="vector-glow" x="-40%" y="-400%" width="180%" height="900%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d={`M${x - 450} 520H${x + 230}`} stroke={ORANGE} strokeWidth={2 + energy * 2} filter="url(#vector-glow)"/>
    <path d={`M${x - 120} 520H${x + 460}`} stroke={WHITE} strokeOpacity=".48" strokeWidth=".8"/>
    <circle cx={x + 230} cy="520" r={4 + energy * 5} fill={ORANGE}/>
  </svg>;
};


const DashboardSlash: React.FC<{frame: number; energy: number}> = ({frame, energy}) => {
  const start = SECTION_STARTS[1];
  const breakCue = cueAfter('break.', sectionIndices[1]);
  const broken = frame >= breakCue.startFrame;
  const slash = spring({frame: Math.max(0, frame - breakCue.startFrame), fps: FPS, config: {damping: 10, stiffness: 180}});
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
  const activeCue = findCue(frame);
  const chatWords = activeCue && activeCue.globalIndex >= chatStart && activeCue.globalIndex < terminalStart ? [activeCue] : [];
  const terminalWords = activeCue && activeCue.globalIndex >= terminalStart ? [activeCue] : [];
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
      {words.map((item) => {
        const cue = SCRIPT_CUES[item.cue];
        const visible = frame >= cue.startFrame && frame < cue.endFrame;
        const scale = spring({frame: Math.max(0, frame - cue.startFrame), fps: FPS, config: {damping: 10, stiffness: 180}});
        return <div key={item.label} style={{width: '32%', height: 260, display: 'grid', placeItems: 'center', border: `1px solid ${visible ? (item.accent ? ORANGE : 'rgba(244,247,255,.44)') : 'rgba(244,247,255,.04)'}`, background: visible ? (item.accent ? 'rgba(255,69,0,.1)' : 'rgba(244,247,255,.035)') : 'transparent', boxShadow: visible && item.accent ? `0 0 ${35 + energy * 30}px rgba(255,69,0,.16)` : 'none', opacity: visible ? 1 : 0, transform: `scale(${visible ? .9 + scale * .1 : .92})`, color: item.accent ? ORANGE : WHITE, fontSize: 66, fontWeight: 950, letterSpacing: -3, textTransform: 'uppercase'}}>{cue.text}</div>;
      })}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 92, display: 'flex', justifyContent: 'center', gap: 22}}>{detailWords.map(({word, cue}) => {const timed = SCRIPT_CUES[cue]; const visible = frame >= timed.startFrame && frame < timed.endFrame; return <span key={word} style={{opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 12}px)`, padding: '10px 16px', border: '1px solid rgba(244,247,255,.16)', color: WHITE, background: 'rgba(244,247,255,.025)', fontFamily: 'monospace', fontSize: 15, letterSpacing: 1.4}}>{timed.text}</span>;})}</div>
    <div style={{position: 'absolute', left: '50%', bottom: 2, transform: 'translateX(-50%)', display: 'flex', gap: 18, alignItems: 'center'}}>
      {[sameInputs, sameInputs + 1, sameFrames, sameFrames + 1].map((index) => {
        const cue = SCRIPT_CUES[index];
        const visible = frame >= cue.startFrame && frame < cue.endFrame;
        if (!visible) return null;
        const accent = index >= sameFrames;
        return <div key={index} style={{padding: '12px 22px', color: accent ? ORANGE : WHITE, border: `1px solid ${accent ? ORANGE : 'rgba(244,247,255,.28)'}`, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', boxShadow: accent ? '0 0 22px rgba(255,69,0,.13)' : 'none'}}>{cue.text}</div>;
      })}
    </div>
    <div style={{position: 'absolute', inset: '50% auto auto 0', width: `${progress * 100}%`, height: 1, background: `linear-gradient(90deg, transparent, rgba(255,69,0,${.2 + energy * .6}), transparent)`}}/>
  </div>;
};


const OutroPunch: React.FC<{frame: number}> = ({frame}) => {
  if (frame >= OUTRO_CUT_FRAME) return <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,69,0,.055), transparent 13%), radial-gradient(ellipse at center, transparent 15%, rgba(0,0,0,.99) 75%)'}}/>;
  const buildCue = SCRIPT_CUES[OUTRO_BUILD_INDEX];
  const buildNotStarted = frame < buildCue.startFrame;
  return <div style={{position: 'absolute', inset: '0 2% 0 29.5%', display: 'grid', placeItems: 'center'}}>
    {buildNotStarted && <svg viewBox="0 0 420 120" style={{position: 'absolute', top: '20%', left: '50%', width: 680, transform: `translateX(-50%) scale(${.82 + Math.sin(frame * .06) * .035})`, opacity: .34}}><path d="M18 85L104 34L190 85L104 111Z M104 34V72 M190 85V111 M104 72L18 120 M104 72L190 120" fill="none" stroke={ORANGE} strokeWidth="2"/><path d="M230 38H400M230 62H360M230 86H390" stroke={WHITE} strokeOpacity=".3" strokeWidth="3"/></svg>}
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

export const ThreeLayer: React.FC<{frame: number; section: number; activeCue: ScriptCue | null; energy: number}> = ({frame, section, activeCue, energy}) => <ThreeCanvas width={1920} height={1080} dpr={1} camera={{position: [0, 0, 13], fov: 38, near: .1, far: 60}} gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: section === 5 ? (frame < OUTRO_CUT_FRAME ? .2 : 0) : .44}}><CameraRig frame={frame} energy={energy} section={section}/><ambientLight intensity={.7}/><pointLight position={[0, 2, 5]} color={ORANGE} intensity={.8 + energy}/><ThreeVisuals frame={frame} section={section} activeCue={activeCue} energy={energy}/></ThreeCanvas>;

export const StoryVisuals: React.FC<{frame: number; section: number; energy: number}> = ({frame, section, energy}) => {
  if (section === 0) return null;
  if (section === 1) return <DashboardSlash frame={frame} energy={energy}/>;
  if (section === 2) return <AgentShiftScene frame={frame} energy={energy}/>;
  if (section === 3) return <MechanicsScene frame={frame} energy={energy}/>;
  if (section === 4) return <TimelineGrid frame={frame} energy={energy}/>;
  return <OutroPunch frame={frame}/>;
};

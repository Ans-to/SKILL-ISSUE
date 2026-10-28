import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {
  AbsoluteFill,
  Audio,
  Sequence,
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
const FPS = 30;
const PLAYBACK_RATE = 1;
const NARRATION_TRACKS = [
  {audio: 'audio/scene-1.mp3', durationSeconds: 10.87},
  {audio: 'audio/scene-2.mp3', durationSeconds: 11.08},
  {audio: 'audio/scene-3.mp3', durationSeconds: 9.04},
] as const;

type RawWord = {text: string; start: number; end: number};
type RawCueTrack = {audio: string; words: RawWord[]; text: string};
type ScriptCue = RawWord & {
  globalIndex: number;
  trackIndex: number;
  startFrame: number;
  endFrame: number;
};
type TrackTiming = {audio: string; from: number; durationInFrames: number};

const rawTracks = wordCueData.tracks as RawCueTrack[];
let cursor = 0;
export const MOTION_ENGINE_TRACKS: TrackTiming[] = NARRATION_TRACKS.map((track) => {
  const durationInFrames = Math.ceil(track.durationSeconds * FPS);
  const timing = {audio: track.audio, from: cursor, durationInFrames};
  cursor += durationInFrames;
  return timing;
});
export const MOTION_ENGINE_DURATION_FRAMES = cursor;

let cueIndex = 0;
const SCRIPT_CUES: ScriptCue[] = rawTracks.flatMap((track, trackIndex) => {
  const trackOffset = MOTION_ENGINE_TRACKS[trackIndex].from;
  return track.words.map((word) => ({
    ...word,
    globalIndex: cueIndex++,
    trackIndex,
    startFrame: trackOffset + word.start * FPS,
    endFrame: trackOffset + word.end * FPS,
  }));
});

const envelope = audioEnvelope.energy as number[];
const energyAt = (frame: number): number => envelope[Math.max(0, Math.min(MOTION_ENGINE_DURATION_FRAMES - 1, Math.round(frame)))] ?? 0;
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const hashText = (text: string): number => {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};

/** One exact, aligned spoken word per kinetic reveal. */
export const KineticText: React.FC<{text: string; startFrame?: number}> = ({text, startFrame = 0}) => {
  const frame = useCurrentFrame() - startFrame;
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 12, stiffness: 120}});
  if (!text) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        zIndex: 10,
        left: 76,
        top: '39%',
        transform: `translateY(${(1 - reveal) * 28}px) scale(${0.78 + reveal * 0.22})`,
        transformOrigin: 'left center',
        opacity: 0.78 + clamp(reveal, 0, 1) * 0.22,
        fontSize: '96px',
        fontWeight: 900,
        letterSpacing: '-2px',
        lineHeight: 0.98,
        whiteSpace: 'nowrap',
        color: WHITE,
        textShadow: `5px 0 0 ${ORANGE}, 0 0 28px rgba(255,69,0,.3)`,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {text.split('').map((character, index) => (
        <span key={`${index}-${character}`} style={{color: index >= Math.ceil(text.length * 0.66) ? ORANGE : WHITE}}>{character}</span>
      ))}
    </div>
  );
};

/** The three compositing planes are isolated and ordered; 2D typography cannot enter the 3D camera. */
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

/** A cue-driven, unlabeled flow graph: only already-spoken word events can populate its nodes. */
export const SemanticFlow: React.FC<{
  cues: ScriptCue[];
  frame: number;
  activeCue: ScriptCue | null;
  energy: number;
}> = ({cues, frame, activeCue, energy}) => {
  const past = cues.filter((cue) => cue.startFrame <= frame).slice(-12);
  const points = past.map((cue, index) => {
    const seed = hashText(`${cue.text}:${cue.globalIndex}`);
    const lane = (index / Math.max(past.length - 1, 1)) * 790;
    return {
      cue,
      x: 82 + lane,
      y: 285 + ((seed % 241) - 120) * 0.72 + Math.sin(frame * 0.025 + index) * energy * 8,
      radius: cue.globalIndex === activeCue?.globalIndex ? 7 + energy * 3 : 3.2 + (seed % 3),
    };
  });
  const activeIndex = points.findIndex((point) => point.cue.globalIndex === activeCue?.globalIndex);
  const activePoint = points[activeIndex];
  const priorPoint = activeIndex > 0 ? points[activeIndex - 1] : activePoint;
  const progress = activeCue ? clamp((frame - activeCue.startFrame) / Math.max(1, activeCue.endFrame - activeCue.startFrame), 0, 1) : 0;
  const pulseX = activePoint && priorPoint ? priorPoint.x + (activePoint.x - priorPoint.x) * progress : 0;
  const pulseY = activePoint && priorPoint ? priorPoint.y + (activePoint.y - priorPoint.y) * progress : 0;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 580"
      preserveAspectRatio="xMidYMid meet"
      style={{position: 'absolute', right: 65, top: '12%', width: '49vw', height: '67vh', overflow: 'visible', opacity: 0.38 + energy * 0.54}}
    >
      <defs>
        <filter id="motion-orange-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="motion-node-aura"><stop stopColor={ORANGE} stopOpacity=".68"/><stop offset="1" stopColor={ORANGE} stopOpacity="0"/></radialGradient>
      </defs>
      <path d="M42 290H958" stroke={WHITE} strokeOpacity=".11" strokeDasharray="2 10"/>
      {points.slice(1).map((point, index) => {
        const previous = points[index];
        return <g key={`link-${point.cue.globalIndex}`}>
          <line x1={previous.x} y1={previous.y} x2={point.x} y2={point.y} stroke={index % 3 === 1 ? ORANGE : WHITE} strokeOpacity={0.14 + energy * (index % 3 === 1 ? 0.38 : 0.2)} strokeWidth={index % 3 === 1 ? 1.5 : 0.8}/>
          {index > 2 && index % 3 === 0 && <line x1={points[index - 2].x} y1={points[index - 2].y} x2={point.x} y2={point.y} stroke={ORANGE} strokeOpacity={0.08 + energy * 0.16} strokeWidth=".8"/>}
        </g>;
      })}
      {points.map((point) => {
        const isActive = point.cue.globalIndex === activeCue?.globalIndex;
        return <g key={`node-${point.cue.globalIndex}`}>
          {isActive && <circle cx={point.x} cy={point.y} r={point.radius * 4.5} fill="url(#motion-node-aura)" opacity=".64"/>}
          <circle cx={point.x} cy={point.y} r={point.radius} fill={isActive ? ORANGE : WHITE} opacity={isActive ? 1 : 0.48}/>
          {isActive && <circle cx={point.x} cy={point.y} r={point.radius + 8 + energy * 9} fill="none" stroke={ORANGE} strokeWidth="1.3" strokeOpacity=".72"/>}
        </g>;
      })}
      {activeCue && activePoint && <g filter="url(#motion-orange-glow)"><circle cx={pulseX} cy={pulseY} r={5 + energy * 4} fill={ORANGE}/><circle cx={pulseX} cy={pulseY} r={13 + energy * 10} fill="none" stroke={ORANGE} strokeWidth="1.3"/></g>}
      <path d="M82 70V500M918 70V500" stroke={WHITE} strokeOpacity=".07" strokeDasharray="1 9"/>
    </svg>
  );
};

const BackgroundLayer: React.FC<{energy: number}> = ({energy}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: OBSIDIAN}}>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 73% 47%, rgba(255,69,0,${0.035 + energy * 0.1}), transparent 42%), linear-gradient(105deg, rgba(11,15,25,.98) 0%, rgba(11,15,25,.7) 46%, rgba(11,15,25,.24) 100%)`}}/>
    <div style={{position: 'absolute', inset: 0, opacity: 0.13, background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 7px, rgba(244,247,255,.19) 8px, transparent 9px)'}}/>
    <div style={{position: 'absolute', inset: 'auto 0 0', height: '34%', background: 'linear-gradient(0deg, rgba(3,5,9,.8), transparent)'}}/>
  </div>
);

const CameraRig: React.FC<{energy: number}> = ({energy}) => {
  const camera = useThree((state) => state.camera);
  const depth = clamp(15.7 - energy * 3.2, 9.6, 17.2);
  camera.position.set(0, 0, depth);
  camera.lookAt(0, 0, 0);
  return null;
};

const ThreeDimensionalFlow: React.FC<{cues: ScriptCue[]; frame: number; activeCue: ScriptCue | null; energy: number}> = ({cues, frame, activeCue, energy}) => {
  const past = cues.filter((cue) => cue.startFrame <= frame).slice(-24);
  const signature = past.map((cue) => cue.globalIndex).join(',');
  const data = useMemo(() => past.map((cue, index) => {
    const seed = hashText(`${cue.text}:${cue.globalIndex}`);
    const angle = index * 2.399963 + seed * 0.000013;
    const radius = 1.2 + (seed % 100) / 100 * 2.5;
    return {
      cue,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle * 1.17) * (0.7 + (seed % 43) / 45),
      z: Math.sin(angle) * 1.6,
    };
  }), [signature]);
  const lineGeometry = useMemo(() => {
    const vertices: THREE.Vector3[] = [];
    data.slice(1).forEach((point, index) => {
      const previous = data[index];
      vertices.push(new THREE.Vector3(previous.x, previous.y, previous.z), new THREE.Vector3(point.x, point.y, point.z));
      if (index > 2 && index % 3 === 0) {
        const cross = data[index - 2];
        vertices.push(new THREE.Vector3(cross.x, cross.y, cross.z), new THREE.Vector3(point.x, point.y, point.z));
      }
    });
    return new THREE.BufferGeometry().setFromPoints(vertices);
  }, [signature]);
  const rotation = frame * (0.0025 + energy * 0.009);

  return (
    <group rotation={[0.12, rotation, -0.05]}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={ORANGE} transparent opacity={0.2 + energy * 0.5}/>
      </lineSegments>
      {data.map((point, index) => {
        const active = point.cue.globalIndex === activeCue?.globalIndex;
        const pulse = 1 + Math.sin(frame * 0.08 + index * 1.8) * (0.08 + energy * 0.22);
        return <mesh key={point.cue.globalIndex} position={[point.x, point.y + Math.sin(frame * 0.018 + index) * energy * 0.11, point.z]} scale={pulse * (active ? 1.6 : 1)}>
          <sphereGeometry args={[active ? 0.085 : 0.045, 14, 12]}/>
          <meshBasicMaterial color={active ? ORANGE : WHITE} transparent opacity={active ? 0.95 : 0.38 + energy * 0.35}/>
        </mesh>;
      })}
      <mesh rotation={[0.5, 0.2, rotation]}>
        <torusGeometry args={[3.65 + energy * 0.16, 0.008 + energy * 0.008, 6, 128]}/>
        <meshBasicMaterial color={WHITE} transparent opacity={0.11 + energy * 0.2}/>
      </mesh>
      <mesh rotation={[0.2, -0.4, -rotation * 1.3]}>
        <torusGeometry args={[2.75, 0.012, 6, 112]}/>
        <meshBasicMaterial color={ORANGE} transparent opacity={0.12 + energy * 0.24}/>
      </mesh>
    </group>
  );
};

const ThreeLayer: React.FC<{cues: ScriptCue[]; frame: number; activeCue: ScriptCue | null; energy: number}> = ({cues, frame, activeCue, energy}) => (
  <ThreeCanvas
    width={1920}
    height={1080}
    dpr={1}
    camera={{position: [0, 0, 15.7], fov: 38, near: 0.1, far: 60}}
    gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
  >
    <CameraRig energy={energy}/>
    <ambientLight intensity={0.7}/>
    <pointLight position={[0, 2, 5]} color={ORANGE} intensity={1.1 + energy}/>
    <ThreeDimensionalFlow cues={cues} frame={frame} activeCue={activeCue} energy={energy}/>
  </ThreeCanvas>
);

const TypographyLayer: React.FC<{frame: number; cues: ScriptCue[]; activeCue: ScriptCue | null; energy: number}> = ({frame, cues, activeCue, energy}) => {
  const totalWords = cues.length;
  const lastCue = cues.filter((cue) => cue.startFrame <= frame).slice(-1)[0];
  const wordNo = activeCue ? activeCue.globalIndex + 1 : lastCue ? lastCue.globalIndex + 1 : 0;
  const seconds = (frame / FPS).toFixed(2).padStart(5, '0');
  const progress = frame / Math.max(1, MOTION_ENGINE_DURATION_FRAMES - 1);

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 10, color: WHITE, fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <header style={{position: 'absolute', top: 34, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(244,247,255,.76)', fontSize: 10, fontWeight: 800, letterSpacing: 3.1}}>
        <span>NOKIA&nbsp; / &nbsp;MOTION ENGINE</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 12}}><i style={{width: 6, height: 6, borderRadius: '50%', background: activeCue ? ORANGE : 'rgba(244,247,255,.35)', boxShadow: activeCue ? `0 0 13px ${ORANGE}` : 'none'}}/>{activeCue ? 'WORD' : 'PAUSE'} {String(wordNo).padStart(2, '0')} / {totalWords}&nbsp;&nbsp;·&nbsp;&nbsp;{seconds} SEC</span>
      </header>
      <SemanticFlow cues={cues} frame={frame} activeCue={activeCue} energy={energy}/>
      {activeCue && <KineticText key={activeCue.globalIndex} text={activeCue.text} startFrame={activeCue.startFrame}/>}
      <div style={{position: 'absolute', left: 72, right: 72, bottom: 48}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'rgba(244,247,255,.46)', fontSize: 9, fontWeight: 800, letterSpacing: 2.5}}>
          <span>{activeCue ? `SCRIPT CUE / ${String(activeCue.globalIndex + 1).padStart(2, '0')}` : 'BREATH / PAUSE'}</span>
          <span>{Math.round(energy * 100)}% ENERGY</span>
        </div>
        <div style={{height: 2, background: 'rgba(244,247,255,.16)', position: 'relative'}}>
          <div style={{position: 'absolute', inset: '0 auto 0 0', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${WHITE}, ${ORANGE})`, boxShadow: `0 0 ${5 + energy * 14}px ${ORANGE}`}}/>
          <div style={{position: 'absolute', left: `${progress * 100}%`, top: '50%', width: 5 + energy * 4, height: 5 + energy * 4, borderRadius: '50%', background: ORANGE, transform: 'translate(-50%, -50%)'}}/>
        </div>
      </div>
    </div>
  );
};

const Narration: React.FC = () => (
  <>
    {MOTION_ENGINE_TRACKS.map((track) => (
      <Sequence key={track.audio} from={track.from} durationInFrames={track.durationInFrames} layout="none">
        <Audio src={staticFile(track.audio)} playbackRate={PLAYBACK_RATE}/>
      </Sequence>
    ))}
  </>
);

export const MotionEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const activeCue = SCRIPT_CUES.find((cue) => frame >= cue.startFrame && frame < cue.endFrame) ?? null;
  const energy = energyAt(frame);
  const typography = <TypographyLayer frame={frame} cues={SCRIPT_CUES} activeCue={activeCue} energy={energy}/>;

  return (
    <AbsoluteFill style={{backgroundColor: OBSIDIAN, overflow: 'hidden'}}>
      <CinematicStack
        background={<BackgroundLayer energy={energy}/>}
        threeD={<ThreeLayer cues={SCRIPT_CUES} frame={frame} activeCue={activeCue} energy={energy}/>}
        typography={typography}
      />
      <Narration/>
    </AbsoluteFill>
  );
};

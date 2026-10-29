import React, {useContext} from 'react';
import {Internals, spring, useCurrentFrame} from 'remotion';
import {
  DURATION_FRAMES,
  FPS,
  MUTED,
  ORANGE,
  OUTRO_CUT_FRAME,
  WHITE,
  clamp,
  energyAt,
  findSceneCue,
  isSceneCleared,
  sceneForFrame,
  type SceneSpec,
  type ScriptCue,
} from './engine/agentEngineModel';

export const Micro: React.FC<{
  children: React.ReactNode;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({children, accent, style}) => (
  <span
    style={{
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 12,
      letterSpacing: 2.4,
      textTransform: 'uppercase',
      color: accent ? ORANGE : MUTED,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Panel: React.FC<{
  children: React.ReactNode;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({children, accent, style}) => (
  <div
    style={{
      border: `1px solid ${accent ? ORANGE : 'rgba(244,247,255,.16)'}`,
      background: 'rgba(11,15,25,.58)',
      ...style,
    }}
  >
    {children}
  </div>
);

export type TelemetryHudProps = {
  scene: SceneSpec;
  localFrame: number;
  energy: number;
  activeCue: ScriptCue | null;
};

export const getHudLifecycle = (scene: SceneSpec, localFrame: number): number => {
  if (isSceneCleared(scene, localFrame)) return 0;
  const activeFrames =
    scene.id === 'outro'
      ? Math.max(1, OUTRO_CUT_FRAME - scene.from)
      : Math.max(1, scene.durationInFrames - scene.clearFrames);
  const enter = spring({
    frame: Math.max(0, localFrame),
    fps: FPS,
    config: {damping: 14, stiffness: 190},
  });
  const exit = clamp((activeFrames - 1 - localFrame) / 9, 0, 1);
  return clamp(enter * exit, 0, 1);
};

/**
 * Minimal, clutter-free corner calibration marks (zero random floating nodes,
 * zero spiderweb constellations, zero unscripted geometric loops).
 */
export const AtmosphericOverlays: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  activeCue,
}) => {
  const activeCueId = activeCue?.globalIndex ?? -1;
  const hotNode = activeCueId >= 0 ? activeCueId % 14 : -1;
  const reveal = getHudLifecycle(scene, localFrame);

  return (
    <svg
      data-scene-graph={scene.id}
      data-active-cue={activeCueId}
      data-hot-node={hotNode}
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: reveal * 0.24,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <path d="M56 108 V94 H70" fill="none" stroke={WHITE} strokeOpacity="0.28" strokeWidth="1" />
      <path d="M1024 108 V94 H1010" fill="none" stroke={WHITE} strokeOpacity="0.28" strokeWidth="1" />
      <path d="M56 1812 V1826 H70" fill="none" stroke={WHITE} strokeOpacity="0.28" strokeWidth="1" />
      <path d="M1024 1812 V1826 H1010" fill="none" stroke={WHITE} strokeOpacity="0.28" strokeWidth="1" />
    </svg>
  );
};

/**
 * Whisper-minimal, frameless corner telemetry (zero heavy boxes, zero circle dots,
 * zero bouncing bars, zero visual clutter) that animates cleanly per scene.
 */
const TelemetryHudView: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  activeCue,
}) => {
  const globalFrame = scene.from + localFrame;
  const activeCueId = activeCue?.globalIndex ?? -1;
  const reveal = getHudLifecycle(scene, localFrame);

  return (
    <div
      data-scene-telemetry={scene.id}
      data-active-cue={activeCueId}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: WHITE,
        opacity: reveal,
      }}
    >
      {/* Top-Left Minimal Coordinate Label */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: 0.68,
          transform: `translate3d(0, ${(1 - reveal) * -14}px, 0)`,
        }}
      >
        <span style={{fontSize: 11, fontWeight: 700, letterSpacing: 2.2, color: ORANGE}}>
          {scene.code}
        </span>
      </div>

      {/* Top-Right Minimal Frame Timecode */}
      <div
        style={{
          position: 'absolute',
          right: 56,
          top: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: 0.56,
          fontVariantNumeric: 'tabular-nums',
          transform: `translate3d(0, ${(1 - reveal) * -14}px, 0)`,
        }}
      >
        <span style={{fontSize: 11, letterSpacing: 1.8, color: MUTED}}>
          F{String(globalFrame).padStart(4, '0')} · {(globalFrame / FPS).toFixed(2)}S
        </span>
      </div>

      {/* Bottom Minimal Token Coordinate Readout (frameless, non-distracting) */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          bottom: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: 0.56,
          transform: `translate3d(0, ${(1 - reveal) * 14}px, 0)`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontSize: 11, letterSpacing: 2, color: ORANGE}}>CUE</span>
          <span
            data-current-token="true"
            style={{fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: activeCue ? WHITE : MUTED}}
          >
            {activeCue ? activeCue.text : '—'}
          </span>
        </div>
        <span style={{fontSize: 11, letterSpacing: 1.8, color: MUTED}}>
          1080×1920 · 30FPS
        </span>
      </div>
    </div>
  );
};

const ConnectedTelemetryHud: React.FC = () => {
  const localFrame = useCurrentFrame();
  const sequenceContext = useContext(Internals.SequenceContext);
  const seqOffset = sequenceContext
    ? sequenceContext.cumulatedFrom + sequenceContext.relativeFrom
    : 0;
  const playbackRate = sequenceContext?.playbackRate ?? 1;
  const globalFrame = clamp(
    Math.round(localFrame / playbackRate + seqOffset),
    0,
    DURATION_FRAMES - 1,
  );
  const scene = sceneForFrame(globalFrame);
  const sceneLocalFrame = clamp(globalFrame - scene.from, 0, scene.durationInFrames - 1);
  const activeCue = findSceneCue(scene, sceneLocalFrame);
  const energy = energyAt(globalFrame);

  return (
    <TelemetryHudView
      scene={scene}
      localFrame={sceneLocalFrame}
      energy={energy}
      activeCue={activeCue}
    />
  );
};

export const TelemetryHud: React.FC<Partial<TelemetryHudProps>> = (props) => {
  if (props.scene !== undefined && props.localFrame !== undefined) {
    const globalFrame = props.scene.from + props.localFrame;
    return (
      <TelemetryHudView
        scene={props.scene}
        localFrame={props.localFrame}
        energy={props.energy ?? energyAt(globalFrame)}
        activeCue={
          props.activeCue !== undefined
            ? props.activeCue
            : findSceneCue(props.scene, props.localFrame)
        }
      />
    );
  }
  return <ConnectedTelemetryHud />;
};

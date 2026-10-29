import React, {useContext} from 'react';
import {Easing, Internals, interpolate, spring, useCurrentFrame} from 'remotion';
import {getActiveUiSimulation} from './ContextualUiSimulation';
import {CRIMSON} from './EmotionalPacing';
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
  type SceneKey,
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

export const HUD_TRANSITION_FRAMES = 12;

export type SceneHudMotionSpec = {
  mode: 'digital-flicker' | 'terminal-slide-x' | 'spring-pop' | 'aperture-glide' | 'cascade-lock' | 'monolith-snap';
  damping: number;
  stiffness: number;
  slideX: number;
  slideY: number;
};

/**
 * Distinct HUD motion & physics per scene — consecutive scenes never reuse the same
 * entrance animation, transition vector, or spring config.
 */
export const SCENE_HUD_PROFILES: Readonly<Record<SceneKey, SceneHudMotionSpec>> = {
  hook: {mode: 'spring-pop', damping: 9, stiffness: 310, slideX: 0, slideY: -18},
  twist: {mode: 'terminal-slide-x', damping: 17, stiffness: 205, slideX: -32, slideY: 0},
  shift: {mode: 'digital-flicker', damping: 24, stiffness: 260, slideX: 0, slideY: -10},
  mechanism: {mode: 'aperture-glide', damping: 28, stiffness: 145, slideX: 24, slideY: -14},
  payoff: {mode: 'cascade-lock', damping: 14, stiffness: 245, slideX: -28, slideY: 0},
  outro: {mode: 'monolith-snap', damping: 10, stiffness: 355, slideX: 0, slideY: -22},
};

export type HudEnvelope = {
  mode: SceneHudMotionSpec['mode'];
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
};

const DIGITAL_HUD_STEPS = [
  0, 0.25, 0.14, 0.42, 0.30, 0.56, 0.46, 0.72, 0.64, 0.88, 0.94, 0.98, 1.0,
] as const;

export const getHudEnvelope = (scene: SceneSpec, localFrame: number): HudEnvelope => {
  const spec = SCENE_HUD_PROFILES[scene.id];
  if (localFrame < 0 || isSceneCleared(scene, localFrame)) {
    return {
      mode: spec.mode,
      opacity: 0,
      scale: 0.95,
      translateX: spec.slideX,
      translateY: spec.slideY || -16,
    };
  }
  const activeFrames =
    scene.id === 'outro'
      ? Math.max(1, OUTRO_CUT_FRAME - scene.from)
      : Math.max(1, scene.durationInFrames - scene.clearFrames);

  const enterSpring = clamp(
    spring({
      frame: Math.max(0, localFrame),
      fps: FPS,
      config: {damping: spec.damping, stiffness: spec.stiffness, overshootClamping: true},
    }),
    0,
    1,
  );

  const enterFade =
    spec.mode === 'digital-flicker' && localFrame < DIGITAL_HUD_STEPS.length
      ? DIGITAL_HUD_STEPS[Math.max(0, Math.floor(localFrame))]
      : interpolate(localFrame, [0, HUD_TRANSITION_FRAMES], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const enterBlend =
    localFrame === 0
      ? 0
      : spec.mode === 'digital-flicker'
        ? enterFade
        : clamp(enterSpring * 0.32 + enterFade * 0.68, 0, 1);

  const exitStart = Math.max(0, activeFrames - HUD_TRANSITION_FRAMES);
  const exitProgress =
    localFrame >= exitStart
      ? interpolate(localFrame - exitStart, [0, Math.max(1, activeFrames - exitStart)], [1, 0], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  const opacity = Number(clamp(Math.min(enterBlend, exitProgress), 0, 1).toFixed(4));
  const scale = Number((0.95 + 0.05 * opacity).toFixed(4));
  const translateX = Number(((1 - opacity) * spec.slideX).toFixed(2));
  const translateY = Number(((1 - opacity) * (spec.slideY || -16)).toFixed(2));
  return {mode: spec.mode, opacity, scale, translateX, translateY};
};

export const getHudLifecycle = (scene: SceneSpec, localFrame: number): number =>
  getHudEnvelope(scene, localFrame).opacity;

export const AtmosphericOverlays: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  activeCue,
}) => {
  const activeCueId = activeCue?.globalIndex ?? -1;
  const hotNode = activeCueId >= 0 ? activeCueId % 14 : -1;
  const env = getHudEnvelope(scene, localFrame);

  return (
    <svg
      data-scene-graph={scene.id}
      data-hud-motion={env.mode}
      data-active-cue={activeCueId}
      data-hot-node={hotNode}
      viewBox="0 0 1080 1920"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: env.opacity * 0.28,
        transform: `scale(${env.scale.toFixed(4)})`,
        transformOrigin: '540px 960px',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <path d="M44 106 V90 H60" fill="none" stroke={WHITE} strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M1036 106 V90 H1020" fill="none" stroke={WHITE} strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M44 1814 V1830 H60" fill="none" stroke={WHITE} strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M1036 1814 V1830 H1020" fill="none" stroke={WHITE} strokeOpacity="0.35" strokeWidth="1.2" />
    </svg>
  );
};

export const ConnectedAtmosphericOverlays: React.FC<{
  scene: SceneSpec;
  energy: number;
  activeCue: ScriptCue | null;
}> = ({scene, energy, activeCue}) => {
  const localFrame = useCurrentFrame();
  return (
    <AtmosphericOverlays
      scene={scene}
      localFrame={localFrame}
      energy={energy}
      activeCue={activeCue}
    />
  );
};

const TelemetryHudView: React.FC<TelemetryHudProps> = ({
  scene,
  localFrame,
  activeCue,
}) => {
  const globalFrame = scene.from + localFrame;
  const activeCueId = activeCue?.globalIndex ?? -1;
  const env = getHudEnvelope(scene, localFrame);
  const activeSim = getActiveUiSimulation(scene, localFrame);
  const isAlert = activeSim?.kind === 'error-diagnostic';
  const accent = isAlert ? CRIMSON : ORANGE;

  // Sharp digital telemetry flicker on new active token onset
  const cueElapsed = activeCue ? Math.max(0, globalFrame - activeCue.startFrame) : 99;
  const tokenDigitalFlicker =
    cueElapsed === 0 ? 0.54 : cueElapsed === 1 ? 0.94 : cueElapsed === 2 ? 0.72 : 1.0;

  return (
    <div
      data-scene-telemetry={scene.id}
      data-hud-motion={env.mode}
      data-active-cue={activeCueId}
      data-hud-opacity={env.opacity}
      data-hud-scale={env.scale.toFixed(4)}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: WHITE,
        opacity: env.opacity,
      }}
    >
      {/* Top Viewport Telemetry Header */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottom: '1px solid rgba(244,247,255,0.10)',
          transform: `translate3d(${env.translateX}px, ${env.translateY}px, 0) scale(${env.scale.toFixed(4)})`,
          transformOrigin: '50% 0%',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{fontSize: 12, fontWeight: 700, letterSpacing: 2.2, color: accent}}>
            {scene.code}
          </span>
          {activeSim && (
            <span style={{fontSize: 11, letterSpacing: 1.8, color: MUTED}}>
              // {activeSim.moduleCode}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 11.5,
            letterSpacing: 1.8,
            color: WHITE,
            opacity: 0.78,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          F{String(globalFrame).padStart(4, '0')} · {(globalFrame / FPS).toFixed(2)}S
        </span>
      </div>

      {/* Bottom Viewport Telemetry Footer */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          bottom: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid rgba(244,247,255,0.10)',
          transform: `translate3d(${(-env.translateX).toFixed(2)}px, ${(-env.translateY).toFixed(2)}px, 0) scale(${env.scale.toFixed(4)})`,
          transformOrigin: '50% 100%',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontSize: 11, letterSpacing: 2, color: accent, fontWeight: 700}}>CUE</span>
          <span
            data-current-token="true"
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: activeCue ? WHITE : MUTED,
              opacity: tokenDigitalFlicker,
            }}
          >
            {activeCue ? activeCue.text : '—'}
          </span>
        </div>
        <span style={{fontSize: 11, letterSpacing: 1.8, color: MUTED}}>
          1080×1920 · 30FPS · ENGINE_TELEMETRY
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

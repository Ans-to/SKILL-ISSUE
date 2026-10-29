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

export type HudEnvelope = {
  opacity: number;
  scale: number;
  translateY: number;
};

/**
 * Smooth 12-frame spring + cubic entrance (opacity 0 -> 1, scale 0.95 -> 1.0, translateY)
 * paired with a reversed 12-frame cubic exit before scene unmount.
 */
export const getHudEnvelope = (scene: SceneSpec, localFrame: number): HudEnvelope => {
  if (localFrame < 0 || isSceneCleared(scene, localFrame)) {
    return {opacity: 0, scale: 0.95, translateY: -18};
  }
  const activeFrames =
    scene.id === 'outro'
      ? Math.max(1, OUTRO_CUT_FRAME - scene.from)
      : Math.max(1, scene.durationInFrames - scene.clearFrames);
  const enterSpring = clamp(
    spring({
      frame: Math.max(0, localFrame),
      fps: FPS,
      config: {damping: 20, stiffness: 120, mass: 0.9, overshootClamping: true},
    }),
    0,
    1,
  );
  const enterFade = interpolate(localFrame, [0, HUD_TRANSITION_FRAMES], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const enterBlend =
    localFrame === 0 ? 0 : clamp(enterSpring * 0.35 + enterFade * 0.65, 0, 1);

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
  const translateY = Number(((1 - opacity) * -18).toFixed(2));
  return {opacity, scale, translateY};
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
  const reveal = getHudLifecycle(scene, localFrame);
  const hudScale = 0.95 + 0.05 * reveal;
  const activeSim = getActiveUiSimulation(scene, localFrame);
  const isAlert = activeSim?.kind === 'error-diagnostic';
  const accent = isAlert ? CRIMSON : ORANGE;

  return (
    <div
      data-scene-telemetry={scene.id}
      data-active-cue={activeCueId}
      data-hud-opacity={reveal}
      data-hud-scale={hudScale.toFixed(4)}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: WHITE,
        opacity: reveal,
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
          transform: `translate3d(0, ${((1 - reveal) * -18).toFixed(2)}px, 0) scale(${hudScale.toFixed(4)})`,
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
            opacity: 0.72,
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
          transform: `translate3d(0, ${((1 - reveal) * 18).toFixed(2)}px, 0) scale(${hudScale.toFixed(4)})`,
          transformOrigin: '50% 100%',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontSize: 11, letterSpacing: 2, color: accent, fontWeight: 700}}>CUE</span>
          <span
            data-current-token="true"
            style={{fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: activeCue ? WHITE : MUTED}}
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

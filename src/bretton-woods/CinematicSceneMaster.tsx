// ----------------------------------------------------------------------
// MASTER ENGINE: "THE CINEMATIC ENGINE" (CinematicSceneMaster)
// Locks in decoupled absolute positioning, smooth 3D isometric camera drift,
// ambient lighting glow, kinetic hero typography, and frosted glassmorphic
// data cards across both 16:9 Landscape (1920x1080) and 9:16 Vertical (1080x1920).
// ----------------------------------------------------------------------

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {StaggeredTextItem, type TextMotionProfile} from '../StaggeredTextItem';
import {
  BRETTON_Z_LAYERS,
  BW_DURATION_FRAMES,
  BW_FPS,
  BW_OBSIDIAN,
  getBrettonLayout,
  getContinuousCameraRig,
  type SpatialSceneEnvelope,
} from './brettonWoodsModel';

export type CinematicSceneMasterProps = {
  title: string;
  subtitle: string;
  metric?: string;
  metricLabel?: string;
  accentColor?: string;
  secondaryColor?: string;
  motionProfile?: TextMotionProfile;
  variantSeed?: number;
  beatStartFrame?: number;
  globalFrameOverride?: number;
  widthOverride?: number;
  heightOverride?: number;
  spatialEnvelope?: SpatialSceneEnvelope;
  renderBackground?: boolean;
  visualIllustration?: React.ReactNode;
  spokenSubtitle?: React.ReactNode;
};

/**
 * Layer 1 + Layer 2 Background Plane of "THE CINEMATIC ENGINE":
 * - Smooth continuous 3D camera zoom (1 -> 1.08) + isometric perspective drift
 * - Deep #0b0f19 obsidian canvas (zero #000000 static black)
 * - Animated 3D isometric grid (perspective + rotateX(60deg) rotateZ(-45deg))
 * - Soft radial ambient lighting glow (blur(60px))
 */
export const CinematicIsometricBackdropView: React.FC<{
  globalFrame: number;
  width: number;
  height: number;
  accentColor?: string;
}> = ({globalFrame, width, height, accentColor = '#f59e0b'}) => {
  const layout = getBrettonLayout(width, height);
  const rig = getContinuousCameraRig(globalFrame);

  const cameraZoom = interpolate(
    globalFrame,
    [0, BW_DURATION_FRAMES],
    [1, 1.08],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const gridPanX = interpolate(globalFrame, [0, BW_DURATION_FRAMES], [0, -72]);
  const gridPanY = interpolate(globalFrame, [0, BW_DURATION_FRAMES], [0, -54]);
  const cellSize = Math.round(60 * layout.scale);
  const majorSize = cellSize * 4;

  const glowOffsetX = Math.sin(globalFrame * 0.012) * 36;

  return (
    <div
      data-canvas-layer="coordinate-grid"
      data-layer-z={BRETTON_Z_LAYERS.coordinateGrid}
      data-bw-background="obsidian-gold-emerald-grid"
      data-cinematic-engine="backdrop"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: BRETTON_Z_LAYERS.coordinateGrid,
        backgroundColor: BW_OBSIDIAN,
        overflow: 'hidden',
        transform: `scale(${cameraZoom.toFixed(4)})`,
        transformOrigin: '50% 50%',
        pointerEvents: 'none',
      }}
    >
      {/* LAYER 1: Animated 3D Isometric Perspective Grid */}
      <div
        data-drifting-minor-grid="true"
        style={{
          position: 'absolute',
          inset: '-55%',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.042) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.042) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          transform: `perspective(1100px) rotateX(60deg) rotateZ(-45deg) translate3d(${(gridPanX + rig.gridDriftX * 0.18).toFixed(2)}px, ${(gridPanY + rig.gridDriftY * 0.18).toFixed(2)}px, 0)`,
          transformOrigin: '50% 52%',
          zIndex: 1,
        }}
      />

      {/* Subtle Gold & Emerald Isometric Major Grid Accent */}
      <div
        data-drifting-major-grid="true"
        style={{
          position: 'absolute',
          inset: '-55%',
          backgroundImage: `
            linear-gradient(to right, rgba(245, 158, 11, 0.085) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.075) 1px, transparent 1px)
          `,
          backgroundSize: `${majorSize}px ${majorSize}px`,
          transform: `perspective(1100px) rotateX(60deg) rotateZ(-45deg) translate3d(${(gridPanX * 1.15).toFixed(2)}px, ${(gridPanY * 1.15).toFixed(2)}px, 0)`,
          transformOrigin: '50% 52%',
          zIndex: 1,
        }}
      />

      {/* LAYER 2: Ambient Lighting Glow */}
      <div
        data-cinematic-glow="ambient"
        style={{
          position: 'absolute',
          top: layout.isVertical ? '24%' : '22%',
          left: `calc(50% + ${glowOffsetX.toFixed(1)}px)`,
          transform: 'translate(-50%, -50%)',
          width: layout.isVertical ? '640px' : '760px',
          height: layout.isVertical ? '340px' : '340px',
          background: `radial-gradient(circle, ${accentColor}22 0%, rgba(245, 158, 11, 0.10) 38%, rgba(11, 15, 25, 0) 72%)`,
          filter: 'blur(60px)',
          zIndex: 2,
        }}
      />

      {/* Secondary Lower Stage Emerald/Gold Rim Glow behind Glassmorphic Card */}
      <div
        style={{
          position: 'absolute',
          top: layout.isVertical ? '62%' : '66%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: layout.isVertical ? '680px' : '860px',
          height: '300px',
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.09) 0%, rgba(245, 158, 11, 0.06) 44%, rgba(11, 15, 25, 0) 74%)',
          filter: 'blur(56px)',
          zIndex: 2,
        }}
      />

      {/* Soft Obsidian Vignette preserving crisp edge contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 85% 78% at 50% 48%, rgba(11,15,25,0) 45%, rgba(11,15,25,0.72) 100%)',
          zIndex: 3,
        }}
      />
    </div>
  );
};

export const CinematicSceneMasterView: React.FC<{
  title: string;
  subtitle: string;
  metric?: string;
  metricLabel?: string;
  accentColor: string;
  motionProfile: TextMotionProfile;
  variantSeed: number;
  beatStartFrame: number;
  globalFrame: number;
  fps: number;
  width: number;
  height: number;
  spatialEnvelope: SpatialSceneEnvelope;
  renderBackground: boolean;
  visualIllustration?: React.ReactNode;
  spokenSubtitle?: React.ReactNode;
}> = ({
  title,
  subtitle,
  metric,
  metricLabel,
  accentColor,
  motionProfile,
  variantSeed,
  beatStartFrame,
  globalFrame,
  fps,
  width,
  height,
  spatialEnvelope,
  renderBackground,
  visualIllustration,
  spokenSubtitle,
}) => {
  const layout = getBrettonLayout(width, height);
  const beatLocalFrame = Math.max(0, globalFrame - beatStartFrame);

  // High-end spring entrance for typography & glassmorphic card
  const textSpring = spring({
    frame: beatLocalFrame,
    fps,
    config: {damping: 20, stiffness: 120},
  });

  const cardSpring = spring({
    frame: Math.max(0, beatLocalFrame - 4),
    fps,
    config: {damping: 22, stiffness: 115},
  });

  const cameraZoom = interpolate(
    globalFrame,
    [0, BW_DURATION_FRAMES],
    [1, 1.045],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const tokens = title.split(/\s+/).filter(Boolean);
  const isCompactStat = title.length <= 5;
  const isLongTitle = title.length >= 18;
  const heroFontSize = isCompactStat
    ? Math.round((layout.isVertical ? 112 : 108) * layout.scale)
    : isLongTitle
      ? Math.round((layout.isVertical ? 56 : 68) * layout.scale)
      : Math.round((layout.isVertical ? 70 : 78) * layout.scale);

  return (
    <AbsoluteFill
      data-cinematic-scene-master="true"
      style={{
        backgroundColor: renderBackground ? BW_OBSIDIAN : 'transparent',
        overflow: 'hidden',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {renderBackground && (
        <CinematicIsometricBackdropView
          globalFrame={globalFrame}
          width={width}
          height={height}
          accentColor={accentColor}
        />
      )}

      {/* LAYER z=55: Upper Hero Editorial Block (Category Pill + Staggered Hero Title) */}
      <div
        data-canvas-layer="hero-kinetic-text"
        data-layer-z={BRETTON_Z_LAYERS.heroKineticText}
        data-bw-hero-profile={motionProfile}
        style={{
          position: 'absolute',
          left: layout.heroLeft,
          top: layout.heroTop,
          width: layout.heroWidth,
          zIndex: BRETTON_Z_LAYERS.heroKineticText,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          opacity: Number((spatialEnvelope.opacity * textSpring).toFixed(4)),
          transform: `translate3d(${(spatialEnvelope.translateX * 0.45).toFixed(2)}px, ${((1 - textSpring) * 26 + spatialEnvelope.translateY * 0.4).toFixed(2)}px, 0) scale(${(spatialEnvelope.scale * (0.985 + 0.015 * cameraZoom)).toFixed(4)})`,
          pointerEvents: 'none',
        }}
      >
        {/* Category Pill / Chapter Subtitle */}
        <div
          style={{
            fontSize: `${Math.round(13 * layout.scale)}px`,
            letterSpacing: '4px',
            color: accentColor,
            textTransform: 'uppercase',
            marginBottom: `${Math.round(16 * layout.scale)}px`,
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.62)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {subtitle}
        </div>

        {/* Hero Kinetic Title with clean staggered word entrance */}
        <h1
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: `0 ${Math.round(heroFontSize * 0.24)}px`,
            fontSize: `${heroFontSize}px`,
            fontWeight: 800,
            color: '#f8fafc',
            textAlign: 'center',
            lineHeight: 1.08,
            margin: 0,
            letterSpacing: isCompactStat ? '-2px' : '-1.2px',
            textShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
          }}
        >
          {tokens.map((word, idx) => (
            <StaggeredTextItem
              key={`${title}-${idx}`}
              text={word}
              delay={idx * 3}
              frameOverride={beatLocalFrame}
              fpsOverride={fps}
              profile={motionProfile}
              variantSeed={variantSeed + idx}
              style={{
                color:
                  tokens.length > 1 && idx === tokens.length - 1
                    ? accentColor
                    : '#f8fafc',
              }}
            />
          ))}
        </h1>
      </div>

      {/* LAYER z=20: Lower Stage Frosted Glassmorphic Data & Thematic Visual Card */}
      {(metric || visualIllustration) && (
        <div
          data-canvas-layer="purposeful-visual"
          data-layer-z={BRETTON_Z_LAYERS.purposefulVisual}
          style={{
            position: 'absolute',
            left: layout.visualLeft,
            top: layout.visualTop,
            width: layout.visualWidth,
            height: layout.visualHeight,
            zIndex: BRETTON_Z_LAYERS.purposefulVisual,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Number((spatialEnvelope.opacity * cardSpring).toFixed(4)),
            transform: `translate3d(${(spatialEnvelope.translateX * 0.5).toFixed(2)}px, ${((1 - cardSpring) * 24 + spatialEnvelope.translateY * 0.45).toFixed(2)}px, 0) scale(${spatialEnvelope.scale.toFixed(4)})`,
            pointerEvents: 'none',
          }}
        >
          <div
            data-glassmorphic-card="true"
            style={{
              width: layout.isVertical ? '100%' : '960px',
              maxWidth: '100%',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '20px',
              padding: layout.isVertical ? '32px 36px' : '28px 48px',
              display: 'flex',
              flexDirection: layout.isVertical ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: visualIllustration ? 'space-between' : 'center',
              gap: layout.isVertical ? '28px' : '44px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.72)',
            }}
          >
            {/* Purposeful Thematic Vector Visual Slot */}
            {visualIllustration && (
              <div
                style={{
                  width: layout.isVertical ? '100%' : '430px',
                  height: layout.isVertical ? '320px' : '250px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {visualIllustration}
              </div>
            )}

            {/* Frosted Metric Readout */}
            {metric && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: layout.isVertical || !visualIllustration ? 'center' : 'flex-start',
                  textAlign: layout.isVertical || !visualIllustration ? 'center' : 'left',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '3px',
                    borderRadius: '999px',
                    background: accentColor,
                    marginBottom: '16px',
                    opacity: 0.9,
                  }}
                />
                <div
                  style={{
                    fontSize: `${Math.round(
                      (metric.length > 16
                        ? layout.isVertical
                          ? 38
                          : 34
                        : layout.isVertical
                          ? 46
                          : 44) * layout.scale,
                    )}px`,
                    fontWeight: 700,
                    color: '#f8fafc',
                    letterSpacing: '-0.8px',
                    lineHeight: 1.15,
                  }}
                >
                  {metric}
                </div>
                {metricLabel && (
                  <div
                    style={{
                      fontSize: `${Math.round(13.5 * layout.scale)}px`,
                      color: '#94a3b8',
                      letterSpacing: '1.6px',
                      lineHeight: 1.5,
                      marginTop: '10px',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}
                  >
                    {metricLabel}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Spoken-Word Subtitle Layer (z=42) */}
      {spokenSubtitle}
    </AbsoluteFill>
  );
};

const ConnectedCinematicSceneMaster: React.FC<CinematicSceneMasterProps> = ({
  title,
  subtitle,
  metric,
  metricLabel,
  accentColor = '#f59e0b',
  motionProfile = 'hook-pop',
  variantSeed = 0,
  beatStartFrame = 0,
  globalFrameOverride,
  spatialEnvelope = {opacity: 1, translateX: 0, translateY: 0, scale: 1},
  renderBackground = true,
  visualIllustration,
  spokenSubtitle,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return (
    <CinematicSceneMasterView
      title={title}
      subtitle={subtitle}
      metric={metric}
      metricLabel={metricLabel}
      accentColor={accentColor}
      motionProfile={motionProfile}
      variantSeed={variantSeed}
      beatStartFrame={beatStartFrame}
      globalFrame={globalFrameOverride ?? frame}
      fps={fps}
      width={width}
      height={height}
      spatialEnvelope={spatialEnvelope}
      renderBackground={renderBackground}
      visualIllustration={visualIllustration}
      spokenSubtitle={spokenSubtitle}
    />
  );
};

export const CinematicSceneMaster: React.FC<CinematicSceneMasterProps> = (props) => {
  if (
    props.widthOverride !== undefined &&
    props.heightOverride !== undefined &&
    props.globalFrameOverride !== undefined
  ) {
    return (
      <CinematicSceneMasterView
        title={props.title}
        subtitle={props.subtitle}
        metric={props.metric}
        metricLabel={props.metricLabel}
        accentColor={props.accentColor ?? '#f59e0b'}
        motionProfile={props.motionProfile ?? 'hook-pop'}
        variantSeed={props.variantSeed ?? 0}
        beatStartFrame={props.beatStartFrame ?? 0}
        globalFrame={props.globalFrameOverride}
        fps={BW_FPS}
        width={props.widthOverride}
        height={props.heightOverride}
        spatialEnvelope={
          props.spatialEnvelope ?? {opacity: 1, translateX: 0, translateY: 0, scale: 1}
        }
        renderBackground={props.renderBackground ?? true}
        visualIllustration={props.visualIllustration}
        spokenSubtitle={props.spokenSubtitle}
      />
    );
  }
  return <ConnectedCinematicSceneMaster {...props} />;
};

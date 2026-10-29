import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {BrettonWoodsAudioLayer} from './BrettonWoodsAudio';
import {
  ContinuousAtmosphericGridPlane,
  ContinuousWorldThreeStage,
  GeodeticCalibrationOverlay,
} from './ContinuousWorldBackground';
import {BrettonWoodsFloatingHud} from './BrettonWoodsHud';
import {
  BW_HEIGHT,
  BW_NAVY_DEEP,
  BW_ORANGE,
  BW_SCENES,
  BW_WIDTH,
} from './brettonWoodsModel';
import {BrettonWoodsOriginScene} from './scenes/BrettonWoodsOriginScene';
import {GlobalStandardScene} from './scenes/GlobalStandardScene';
import {HeavyCrownConclusionScene} from './scenes/HeavyCrownConclusionScene';
import {LiquidityPowerEngineScene} from './scenes/LiquidityPowerEngineScene';

export type BrettonWoodsProps = {
  title?: string;
  compositionId?: string;
  backgroundColor?: string;
  accentColor?: string;
  voiceoverFile?: string;
  muted?: boolean;
};

export const DEFAULT_BRETTON_WOODS_PROPS: Required<BrettonWoodsProps> = {
  title: 'Bretton Woods & The Global Dollar Standard',
  compositionId: 'Root',
  backgroundColor: BW_NAVY_DEEP,
  accentColor: BW_ORANGE,
  voiceoverFile: 'bretton-woods/voiceover.wav',
  muted: false,
};

/**
 * 16:9 YouTube Long-Form Documentary (1920x1080, 30 fps, 1,800 frames / 60.0s).
 * Mounts continuous moving 3D background + drifting coordinate grid (z=1, z=10)
 * across all 60 seconds with fluid spatial scene handoffs (zero hard cuts, zero #000000 black)
 * and decoupled z-indexed foreground UI & polymorphic kinetic typography planes.
 */
export const BrettonWoodsDocumentary: React.FC<BrettonWoodsProps> = ({
  title = DEFAULT_BRETTON_WOODS_PROPS.title,
  backgroundColor = DEFAULT_BRETTON_WOODS_PROPS.backgroundColor,
  voiceoverFile = DEFAULT_BRETTON_WOODS_PROPS.voiceoverFile,
  muted = DEFAULT_BRETTON_WOODS_PROPS.muted,
}) => {
  const globalFrame = useCurrentFrame();
  // Guard against accidental #000000 black override
  const safeBackground =
    backgroundColor.toLowerCase() === '#000000' || backgroundColor.toLowerCase() === '#000'
      ? BW_NAVY_DEEP
      : backgroundColor;

  return (
    <AbsoluteFill
      data-root-title={title}
      data-canvas-root="1920x1080"
      data-layer-architecture="decoupled-absolute-z-continuous-3d"
      style={{
        position: 'relative',
        width: BW_WIDTH,
        height: BW_HEIGHT,
        backgroundColor: safeBackground,
        overflow: 'hidden',
      }}
    >
      {/* Layer z=1: Unbroken Continuous Drifting Geodetic Coordinate Grid */}
      <ContinuousAtmosphericGridPlane globalFrame={globalFrame} />

      {/* Layer z=10: Unbroken Continuous 3D Panning & Zooming World Stage */}
      <ContinuousWorldThreeStage globalFrame={globalFrame} />

      {/* Layer z=36: Unbroken Cartographic Calibration Reticle */}
      <GeodeticCalibrationOverlay globalFrame={globalFrame} />

      {/* Fluid Spatial Scene Sequences (`layout="none"` preserves single root Z-stack!) */}
      <Sequence
        from={BW_SCENES[0].sequenceFrom}
        durationInFrames={BW_SCENES[0].sequenceDuration}
        layout="none"
        name="BW-01-Global-Standard"
      >
        <GlobalStandardScene />
      </Sequence>

      <Sequence
        from={BW_SCENES[1].sequenceFrom}
        durationInFrames={BW_SCENES[1].sequenceDuration}
        layout="none"
        name="BW-02-Bretton-Woods-Origin"
      >
        <BrettonWoodsOriginScene />
      </Sequence>

      <Sequence
        from={BW_SCENES[2].sequenceFrom}
        durationInFrames={BW_SCENES[2].sequenceDuration}
        layout="none"
        name="BW-03-Liquidity-Power-Engine"
      >
        <LiquidityPowerEngineScene />
      </Sequence>

      <Sequence
        from={BW_SCENES[3].sequenceFrom}
        durationInFrames={BW_SCENES[3].sequenceDuration}
        layout="none"
        name="BW-04-Heavy-Crown-Conclusion"
      >
        <HeavyCrownConclusionScene />
      </Sequence>

      {/* Layers z=65, z=75, z=76: Independent Floating Geodetic HUD & 4-Chapter Progress */}
      <BrettonWoodsFloatingHud globalFrame={globalFrame} />

      {/* Frame-Exact Voiceover & Spatial SFX Audio Layer */}
      <BrettonWoodsAudioLayer voiceoverFile={voiceoverFile} muted={muted} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrettonWoodsAudioLayer} from './BrettonWoodsAudio';
import {ContinuousAtmosphericGridPlane} from './ContinuousWorldBackground';
import {BrettonWoodsFloatingHud} from './BrettonWoodsHud';
import {
  BW_OBSIDIAN,
  BW_SCENES,
  bwSceneForFrame,
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
  backgroundColor: BW_OBSIDIAN,
  accentColor: '#f59e0b',
  voiceoverFile: 'bretton-woods/voiceover.wav',
  muted: false,
};

/**
 * "THE CINEMATIC ENGINE" Documentary Master Assembly
 * Supports both 16:9 Landscape (1920x1080) and 9:16 Vertical (1080x1920).
 * Every scene runs through CinematicSceneMaster with decoupled absolute layers,
 * continuous 3D isometric perspective drift, ambient lighting glow, kinetic titles,
 * and frosted glassmorphic data/visual cards.
 */
export const BrettonWoodsDocumentary: React.FC<BrettonWoodsProps> = ({
  title = DEFAULT_BRETTON_WOODS_PROPS.title,
  backgroundColor = DEFAULT_BRETTON_WOODS_PROPS.backgroundColor,
  voiceoverFile = DEFAULT_BRETTON_WOODS_PROPS.voiceoverFile,
  muted = DEFAULT_BRETTON_WOODS_PROPS.muted,
}) => {
  const globalFrame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const activeScene = bwSceneForFrame(globalFrame);

  const safeBackground =
    backgroundColor.toLowerCase() === '#000000' || backgroundColor.toLowerCase() === '#000'
      ? BW_OBSIDIAN
      : backgroundColor;

  return (
    <AbsoluteFill
      data-root-title={title}
      data-canvas-root={`${width}x${height}`}
      data-layer-architecture="the-cinematic-engine"
      style={{
        position: 'relative',
        width,
        height,
        backgroundColor: safeBackground,
        overflow: 'hidden',
      }}
    >
      {/* Layer z=1..3: Continuous 3D Isometric Perspective Grid + Ambient Lighting Glow */}
      <ContinuousAtmosphericGridPlane
        globalFrame={globalFrame}
        accentColor={activeScene.accentColor}
      />

      {/* Overlapping CinematicSceneMaster Sequences (Smooth Sinusoidal Cross-Glides) */}
      <Sequence
        from={BW_SCENES[0].sequenceFrom}
        durationInFrames={BW_SCENES[0].sequenceDuration}
        layout="none"
        name="01-Global-Standard"
      >
        <GlobalStandardScene />
      </Sequence>

      <Sequence
        from={BW_SCENES[1].sequenceFrom}
        durationInFrames={BW_SCENES[1].sequenceDuration}
        layout="none"
        name="02-Bretton-Woods-Origin"
      >
        <BrettonWoodsOriginScene />
      </Sequence>

      <Sequence
        from={BW_SCENES[2].sequenceFrom}
        durationInFrames={BW_SCENES[2].sequenceDuration}
        layout="none"
        name="03-Liquidity-And-Trust"
      >
        <LiquidityPowerEngineScene />
      </Sequence>

      <Sequence
        from={BW_SCENES[3].sequenceFrom}
        durationInFrames={BW_SCENES[3].sequenceDuration}
        layout="none"
        name="04-Heavy-Crown-Conclusion"
      >
        <HeavyCrownConclusionScene />
      </Sequence>

      {/* Layers z=75 & z=76: Minimal Editorial Chapter Header & Hairline Progress */}
      <BrettonWoodsFloatingHud globalFrame={globalFrame} />

      {/* Frame-Exact Voiceover & Gentle Cinematic Audio Layer */}
      <BrettonWoodsAudioLayer voiceoverFile={voiceoverFile} muted={muted} />
    </AbsoluteFill>
  );
};

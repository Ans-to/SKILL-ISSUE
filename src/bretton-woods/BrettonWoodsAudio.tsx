import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {SFX_PATHS} from '../SceneAudio';
import {BW_DURATION_FRAMES, bwEnergyAt} from './brettonWoodsModel';
import {BW_HERO_WINDOWS} from './BrettonWoodsKineticEngine';

const SPATIAL_GLIDE_WHOOSH_FRAMES = [292, 742, 1342] as const;
const CLIMAX_SUB_DROP_FRAMES = [190, 312, 851, 1163, 1529] as const;

export const BrettonWoodsAudioLayer: React.FC<{
  voiceoverFile: string;
  muted: boolean;
}> = ({voiceoverFile, muted}) => {
  if (muted) return null;

  return (
    <>
      {/* Primary 1.0x Natural Speed Documentary Voiceover */}
      <Sequence from={0} durationInFrames={BW_DURATION_FRAMES} layout="none" name="BW-Voiceover">
        <Audio src={staticFile(voiceoverFile)} volume={1} />
      </Sequence>

      {/* Ducked Continuous Ambient Monetary Telemetry Bed */}
      <Sequence
        from={0}
        durationInFrames={BW_DURATION_FRAMES}
        layout="none"
        name="BW-AmbientHum"
      >
        <Audio
          src={staticFile(SFX_PATHS.telemetryHum)}
          loop
          loopVolumeCurveBehavior="extend"
          volume={(f) => {
            const vo = bwEnergyAt(f);
            // Duck softly beneath voiceover; swell gently during dramatic beats
            return vo > 0.08 ? 0.042 : 0.085;
          }}
        />
      </Sequence>

      {/* Fluid Spatial Camera Glide Whooshes (0:10, 0:25, 0:45 — No Hard Cuts) */}
      {SPATIAL_GLIDE_WHOOSH_FRAMES.map((frame) => (
        <Sequence
          key={`bw-whoosh-${frame}`}
          from={frame}
          durationInFrames={28}
          layout="none"
          name={`BW-SpatialGlide-${frame}`}
        >
          <Audio src={staticFile(SFX_PATHS.whoosh)} volume={0.2} />
        </Sequence>
      ))}

      {/* Polymorphic Hero Kinetic Entrance Ticks */}
      {BW_HERO_WINDOWS.map((win, idx) => (
        <Sequence
          key={`bw-hero-sfx-${win.id}`}
          from={win.startFrame}
          durationInFrames={14}
          layout="none"
          name={`BW-HeroTick-${win.id}`}
        >
          <Audio
            src={staticFile(idx % 2 === 0 ? SFX_PATHS.clickAccent : SFX_PATHS.click)}
            volume={0.14}
          />
        </Sequence>
      ))}

      {/* Sub-Bass Drops on Major Documentary Climax Callouts */}
      {CLIMAX_SUB_DROP_FRAMES.map((frame) => (
        <Sequence
          key={`bw-subdrop-${frame}`}
          from={frame}
          durationInFrames={42}
          layout="none"
          name={`BW-ClimaxSubDrop-${frame}`}
        >
          <Audio src={staticFile(SFX_PATHS.subDrop)} volume={0.24} />
        </Sequence>
      ))}
    </>
  );
};

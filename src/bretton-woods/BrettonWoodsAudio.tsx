import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {SFX_PATHS} from '../SceneAudio';
import {BW_DURATION_FRAMES, bwEnergyAt} from './brettonWoodsModel';
import {BW_HERO_WINDOWS} from './BrettonWoodsKineticEngine';

const GENTLE_TRANSITION_WHOOSH_FRAMES = [288, 738, 1338] as const;
const CLIMAX_SUB_DROP_FRAMES = [189, 302, 851, 1163, 1529] as const;

export const BrettonWoodsAudioLayer: React.FC<{
  voiceoverFile: string;
  muted: boolean;
}> = ({voiceoverFile, muted}) => {
  if (muted) return null;

  return (
    <>
      {/* 1.0x Natural Documentary Voiceover */}
      <Sequence from={0} durationInFrames={BW_DURATION_FRAMES} layout="none" name="BW-Voiceover">
        <Audio src={staticFile(voiceoverFile)} volume={1} />
      </Sequence>

      {/* Subtle Ambient Bed Ducked Gently Beneath Voiceover */}
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
            return vo > 0.08 ? 0.032 : 0.068;
          }}
        />
      </Sequence>

      {/* Gentle Spatial Scene Glide Whooshes */}
      {GENTLE_TRANSITION_WHOOSH_FRAMES.map((frame) => (
        <Sequence
          key={`bw-whoosh-${frame}`}
          from={frame}
          durationInFrames={28}
          layout="none"
          name={`BW-SceneGlide-${frame}`}
        >
          <Audio src={staticFile(SFX_PATHS.whoosh)} volume={0.14} />
        </Sequence>
      ))}

      {/* Subtle Editorial Title Accents */}
      {BW_HERO_WINDOWS.map((win, idx) => (
        <Sequence
          key={`bw-hero-sfx-${win.id}`}
          from={win.startFrame}
          durationInFrames={14}
          layout="none"
          name={`BW-TitleAccent-${win.id}`}
        >
          <Audio
            src={staticFile(idx % 2 === 0 ? SFX_PATHS.clickAccent : SFX_PATHS.click)}
            volume={0.09}
          />
        </Sequence>
      ))}

      {/* Warm Sub-Bass Accents on Key Documentary Milestones */}
      {CLIMAX_SUB_DROP_FRAMES.map((frame) => (
        <Sequence
          key={`bw-subdrop-${frame}`}
          from={frame}
          durationInFrames={42}
          layout="none"
          name={`BW-MilestoneDrop-${frame}`}
        >
          <Audio src={staticFile(SFX_PATHS.subDrop)} volume={0.2} />
        </Sequence>
      ))}
    </>
  );
};

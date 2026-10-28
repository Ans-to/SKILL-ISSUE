import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {KineticLayer} from './KineticLayer';
import {ProceduralWorld} from './ProceduralWorld';
import {PLAYBACK_RATE, TRACK_TIMINGS} from './timing';

const Narration: React.FC = () => (
  <>
    {TRACK_TIMINGS.map((track) => (
      <Sequence key={track.audio} from={track.from} durationInFrames={track.durationInFrames} layout="none">
        <Audio src={staticFile(track.audio)} playbackRate={PLAYBACK_RATE} />
      </Sequence>
    ))}
  </>
);

export const KineticFilm: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#07090a', overflow: 'hidden'}}>
    <ProceduralWorld />
    <KineticLayer />
    <Narration />
  </AbsoluteFill>
);

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {EditorialLayer} from './EditorialLayer';
import {World} from './World';
import {PLAYBACK_RATE, TIMED_TRACKS} from '../story/semanticEngine';

const Narration: React.FC = () => (
  <>
    {TIMED_TRACKS.map((track) => (
      <Sequence key={track.id} from={track.from} durationInFrames={track.durationInFrames} layout="none">
        <Audio src={staticFile(track.src)} playbackRate={PLAYBACK_RATE} />
      </Sequence>
    ))}
  </>
);

export const NokiaFilm: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#080d14', overflow: 'hidden'}}>
    <World />
    <EditorialLayer />
    <Narration />
  </AbsoluteFill>
);

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {EditorialOverlay} from './film/Editorial';
import {NokiaWorld} from './film/World';

const WIDTH = 1920;
const HEIGHT = 1080;
const DARK = '#0b0f19';

/** Fresh film composition: full-frame 3D world behind an independent editorial DOM layer. */
export const NokiaEditorialFilm: React.FC = () => (
  <AbsoluteFill style={{background: DARK, overflow: 'hidden'}}>
    <ThreeCanvas
      width={WIDTH}
      height={HEIGHT}
      dpr={1}
      camera={{position: [0, 0, 18], fov: 42, near: 0.1, far: 100}}
      gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
      shadows
      style={{position: 'absolute', inset: 0, zIndex: 0}}
    >
      <NokiaWorld />
    </ThreeCanvas>
    <EditorialOverlay />
    <Sequence from={0} durationInFrames={180}>
      <Audio src={staticFile('audio/scene-1.mp3')} volume={1} playbackRate={0.92} />
    </Sequence>
    <Sequence from={180} durationInFrames={270}>
      <Audio src={staticFile('audio/scene-2.mp3')} volume={1} playbackRate={0.68} />
    </Sequence>
    <Sequence from={450} durationInFrames={450}>
      <Audio src={staticFile('audio/scene-3.mp3')} volume={1} playbackRate={0.56} />
    </Sequence>
  </AbsoluteFill>
);

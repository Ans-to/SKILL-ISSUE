import React from 'react';
import {Composition} from 'remotion';
import {KineticFilm} from './kinetic/KineticFilm';
import {TOTAL_FRAMES} from './kinetic/timing';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NokiaDocumentary"
    component={KineticFilm}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);

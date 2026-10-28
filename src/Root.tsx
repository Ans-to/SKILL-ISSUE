import React from 'react';
import {Composition} from 'remotion';
import {NokiaFilm} from './cinema/NokiaFilm';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NokiaDocumentary"
    component={NokiaFilm}
    durationInFrames={932}
    fps={30}
    width={1920}
    height={1080}
  />
);

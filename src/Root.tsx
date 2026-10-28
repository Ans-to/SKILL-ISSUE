import React from 'react';
import {Composition} from 'remotion';
import {NokiaEditorialFilm} from './NokiaEditorialFilm';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NokiaDocumentary"
    component={NokiaEditorialFilm}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
);

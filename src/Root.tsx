import React from 'react';
import {Composition} from 'remotion';
import {NokiaDocumentary} from './NokiaDocumentary';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NokiaDocumentary"
    component={NokiaDocumentary}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
);

import React from 'react';
import {Composition} from 'remotion';
import {NokiaRebuilt} from './NokiaRebuilt';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NokiaDocumentary"
    component={NokiaRebuilt}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
);

import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {audioEnergyAt, categoryForWord, TimedWord, WordCategory, WORDS} from './timing';

const LIME = '#c7ff00';
const WHITE = '#f4f7f1';
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const clean = (word: string): string => word.toLowerCase().replace(/[^a-z0-9]/g, '');

const wordHash = (word: string): number => {
  let hash = 2166136261;
  for (const character of word) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
};

const depthFor = (frame: number): number => {
  const word = WORDS.find((cue) => frame / 30 >= cue.globalStart && frame / 30 < cue.globalEnd) ?? null;
  const energy = audioEnergyAt(frame);
  const length = word ? clean(word.text).length : 0;
  return clamp(16.4 - energy * 2.1 - Math.min(length, 13) * 0.045, 10.6, 17.4);
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((state) => state.camera);
  camera.position.set(0, 0, depthFor(frame));
  camera.lookAt(0, 0, 0);
  return null;
};

const Lighting: React.FC = () => {
  const frame = useCurrentFrame();
  const energy = audioEnergyAt(frame);
  return (
    <>
      <color attach="background" args={['#07090a']} />
      <fog attach="fog" args={['#07090a', 15, 36]} />
      <ambientLight intensity={0.84} color="#d9e4cf" />
      <directionalLight position={[-5, 6, 8]} intensity={1.55} color="#f4f7f1" />
      <pointLight position={[4, 2, 1]} color={LIME} intensity={1.1 + energy * 2.1} distance={20} />
      <pointLight position={[-4, -1, -5]} color={WHITE} intensity={0.5 + energy} distance={18} />
    </>
  );
};

const activeCueAt = (frame: number): TimedWord | null => {
  const seconds = frame / 30;
  return WORDS.find((cue) => seconds >= cue.globalStart && seconds < cue.globalEnd) ?? null;
};

const GraphField: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = activeCueAt(frame);
  const energy = audioEnergyAt(frame);
  const currentWord = cue?.text ?? '';
  const seed = cue?.globalIndex ?? 0;
  const hash = wordHash(currentWord || 'pause');
  const category: WordCategory = cue ? categoryForWord(cue) : 'signal';
  const count = clamp(9 + clean(currentWord).length, 9, 22);
  const age = cue ? Math.max(0, frame - cue.startFrame) : 0;
  const nodeData = useMemo(() => Array.from({length: count}, (_, index) => {
    const angle = index * 2.399963 + (hash % 719) * 0.003;
    const ring = 0.72 + ((index * 7 + hash) % 11) * 0.105;
    const vertical = Math.sin(index * 1.91 + hash * 0.0001) * 0.9;
    const depth = Math.cos(index * 2.23 + hash * 0.0002) * 0.72;
    return {angle, ring, vertical, depth, major: index % 4 === 0};
  }), [count, hash]);
  const edgeGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index < nodeData.length; index++) {
      const next = (index + 1 + (hash % 3)) % nodeData.length;
      const skip = (index + 3 + ((hash >>> (index % 16)) % 5)) % nodeData.length;
      for (const target of [next, skip]) {
        const a = nodeData[index];
        const b = nodeData[target];
        points.push(
          new THREE.Vector3(Math.cos(a.angle) * a.ring, a.vertical, a.depth),
          new THREE.Vector3(Math.cos(b.angle) * b.ring, b.vertical, b.depth),
        );
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [hash, nodeData]);
  const motifScale = cue ? 0.2 + Math.min(age / 5, 1) * 0.8 : 0.12 + energy * 0.12;
  const hueColor = category === 'signal' ? WHITE : LIME;
  const spin = frame * (0.006 + energy * 0.014) + (seed % 37) * 0.04;

  return (
    <group rotation={[0.08 + Math.sin(frame * 0.013) * 0.025, spin, -0.07]} scale={motifScale}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={LIME} transparent opacity={0.24 + energy * 0.55} />
      </lineSegments>
      {nodeData.map((node, index) => {
        const pulse = 1 + Math.sin(frame * (0.08 + energy * 0.05) + index * 1.7 + seed) * (0.08 + energy * 0.24);
        const position: [number, number, number] = [Math.cos(node.angle + spin * 0.36) * node.ring, node.vertical + Math.sin(frame * 0.023 + index) * energy * 0.13, node.depth];
        return <mesh key={`${seed}-${index}`} position={position} scale={pulse}>
          <sphereGeometry args={[node.major ? 0.052 : 0.027, 12, 10]} />
          <meshBasicMaterial color={node.major ? WHITE : hueColor} transparent opacity={0.5 + energy * 0.48} />
        </mesh>;
      })}
      <mesh>
        {category === 'geography' && <sphereGeometry args={[1.22, 24, 16]} />}
        {category === 'material' && <boxGeometry args={[1.85, 1.3, 0.16, 1, 1, 1]} />}
        {category === 'industry' && <torusKnotGeometry args={[0.78, 0.19, 96, 14, 2, 3]} />}
        {category === 'network' && <icosahedronGeometry args={[1.13, 1]} />}
        {category === 'device' && <boxGeometry args={[0.95, 1.8, 0.14, 1, 1, 1]} />}
        {category === 'signal' && <torusGeometry args={[1.08, 0.012, 8, 96]} />}
        <meshBasicMaterial color={WHITE} wireframe transparent opacity={category === 'signal' ? 0.12 + energy * 0.2 : 0.24 + energy * 0.5} />
      </mesh>
      {category === 'device' && <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[0.72, 1.35]} />
        <meshBasicMaterial color={LIME} wireframe transparent opacity={0.25 + energy * 0.48} />
      </mesh>}
      {category === 'material' && Array.from({length: 5}, (_, index) => <mesh key={`slab-${index}`} position={[-1.1 + index * 0.55, -1.02 - (index % 2) * 0.13, 0.2]} rotation={[0, 0, (index % 2 ? -1 : 1) * 0.05]}>
        <boxGeometry args={[0.44, 0.06, 0.25]} />
        <meshBasicMaterial color={index % 2 ? LIME : WHITE} transparent opacity={0.42 + energy * 0.44} />
      </mesh>)}
      <mesh rotation={[0.4, -0.3, 0.6]}>
        <torusGeometry args={[1.68 + energy * 0.12, 0.008 + energy * 0.008, 6, 120]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.14 + energy * 0.42} />
      </mesh>
    </group>
  );
};

const FloorGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const energy = audioEnergyAt(frame);
  return (
    <group position={[0, -2.25, -1.2]}>
      <gridHelper args={[32, 36, '#526b2a', '#26301e']} position={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <planeGeometry args={[42, 42]} />
        <meshBasicMaterial color="#07090a" transparent opacity={0.56 + energy * 0.1} />
      </mesh>
    </group>
  );
};

export const ProceduralWorld: React.FC = () => (
  <ThreeCanvas
    width={1920}
    height={1080}
    dpr={1}
    camera={{position: [0, 0, 16], fov: 38, near: 0.1, far: 80}}
    gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
  >
    <CameraRig />
    <Lighting />
    <FloorGrid />
    <GraphField />
  </ThreeCanvas>
);

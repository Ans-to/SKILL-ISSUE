import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {Stars} from '@react-three/drei';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {getNarrativeState} from '../story/semanticEngine';
import * as THREE from 'three';

const COLORS = {ice: '#c9f6f0', cyan: '#51dce4', amber: '#f6af60', ink: '#08111a'};
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

const CameraMove: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const camera = useThree((state) => state.camera);
  const state = getNarrativeState(frame);
  const weights = state.concepts;
  const weightSum = Math.max(0.001, weights.origin + weights.material + weights.industry + weights.network + weights.device);
  const focusZ = (weights.origin * 15.8 + weights.material * 13.8 + weights.industry * 13.1 + weights.network * 11.4 + weights.device * 9.6) / weightSum;
  const targetZ = clamp(focusZ - state.energy * 0.42 + Math.sin(frame / (fps * 3.8)) * 0.09, 8.7, 18);
  camera.position.set(0, 0, targetZ);
  camera.lookAt(0, 0, 0);
  return null;
};

const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const state = getNarrativeState(frame);
  return (
    <>
      <color attach="background" args={['#080d14']} />
      <fog attach="fog" args={['#080d14', 17, 37]} />
      <ambientLight intensity={0.65} color="#a9d8de" />
      <directionalLight position={[-6, 8, 8]} intensity={2.1} color="#c9f6f0" />
      <pointLight position={[5, 2, -4]} intensity={2.6 + state.energy * 1.2} color={COLORS.cyan} distance={24} />
      <pointLight position={[-4, -3, 2]} intensity={0.9} color={COLORS.amber} distance={18} />
      <Stars radius={42} depth={22} count={500} factor={3.5 + state.motion * 2.4} saturation={0.22} fade speed={0.18 + state.energy * 0.4} />
    </>
  );
};

const WorldGlobe: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const state = getNarrativeState(frame);
  const w = Math.max(state.concepts.origin * 0.96, state.concepts.network * 0.78);
  const spin = frame / fps * (0.07 + state.energy * 0.045);
  return (
    <group position={[-0.25, 0.04, -3.4]} rotation={[0.12, spin, -0.08]} scale={w * 1.06}>
      <mesh>
        <sphereGeometry args={[2.05, 72, 48]} />
        <meshPhysicalMaterial color="#11313c" roughness={0.46} metalness={0.34} transparent opacity={0.34 + w * 0.35} clearcoat={0.72} clearcoatRoughness={0.16} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.09, 72, 48]} />
        <meshBasicMaterial color={COLORS.cyan} wireframe transparent opacity={0.12 + w * 0.17} />
      </mesh>
      <mesh rotation={[0.8, 0.2, 0.42]}>
        <torusGeometry args={[2.18, 0.012, 8, 180]} />
        <meshBasicMaterial color={COLORS.amber} transparent opacity={0.58 * w} />
      </mesh>
      <mesh rotation={[1.43, -0.15, -0.35]}>
        <torusGeometry args={[1.83, 0.009, 8, 160]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.38 * w} />
      </mesh>
      {Array.from({length: 18}, (_, index) => {
        const latitude = -1.17 + (index % 6) * 0.46;
        const longitude = Math.floor(index / 6) * 1.73 + (index % 2) * 0.12;
        const radius = 2.065;
        const x = Math.cos(latitude) * Math.cos(longitude) * radius;
        const y = Math.sin(latitude) * radius;
        const z = Math.cos(latitude) * Math.sin(longitude) * radius;
        return <mesh key={index} position={[x, y, z]}><sphereGeometry args={[index % 5 === 0 ? 0.035 : 0.018, 10, 8]} /><meshBasicMaterial color={index % 5 === 0 ? COLORS.amber : COLORS.ice} transparent opacity={0.18 + w * 0.7} /></mesh>;
      })}
      <mesh position={[0.2, 0.4 + Math.sin(frame / 33) * 0.035, 2.08]}>
        <sphereGeometry args={[0.055 + state.energy * 0.025, 20, 16]} />
        <meshBasicMaterial color={COLORS.amber} />
      </mesh>
    </group>
  );
};

const TimberMill: React.FC = () => {
  const frame = useCurrentFrame();
  const state = getNarrativeState(frame);
  const strength = state.concepts.material;
  const rotation = Math.sin(frame / 30) * 0.012;
  return (
    <group position={[0.32, -0.35, 0.1]} rotation={[0, -0.18 + rotation, 0]} scale={strength * 1.02}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[3.3, 1.6, 1.55]} />
        <meshStandardMaterial color="#182a31" roughness={0.64} metalness={0.26} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <coneGeometry args={[1.34, 0.88, 4]} />
        <meshStandardMaterial color="#20333a" roughness={0.58} metalness={0.22} />
      </mesh>
      <mesh position={[-0.9, 1.48, 0.79]}>
        <boxGeometry args={[0.48, 0.48, 0.045]} />
        <meshPhysicalMaterial color="#d9a96d" roughness={0.22} emissive="#a25f29" emissiveIntensity={0.55 * strength} />
      </mesh>
      <mesh position={[0.03, 1.07, 0.79]}>
        <boxGeometry args={[0.7, 0.52, 0.05]} />
        <meshBasicMaterial color="#88d9dc" transparent opacity={0.2 + strength * 0.3} />
      </mesh>
      <mesh position={[-1.24, -0.08, 0.9]}>
        <boxGeometry args={[0.12, 0.52, 0.14]} />
        <meshStandardMaterial color="#0c151a" roughness={0.45} />
      </mesh>
      <group position={[0.25, 0.16, 0.88]}>
        <mesh>
          <boxGeometry args={[1.9, 0.11, 0.06]} />
          <meshStandardMaterial color="#936b49" roughness={0.74} />
        </mesh>
        {Array.from({length: 10}, (_, index) => {
          const x = (index % 5) * 0.27 - 0.54;
          const y = Math.floor(index / 5) * 0.17 - 0.08 + Math.sin(frame / 18 + index) * state.energy * 0.018;
          return <mesh key={index} position={[x, y, 0.08]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.085, 0.68, 14]} />
          <meshStandardMaterial color={index % 2 ? '#bc8e60' : '#7d5c42'} roughness={0.84} />
          </mesh>;
        })}
      </group>
      <mesh position={[0, -0.65, 0.12]}>
        <boxGeometry args={[3.9, 0.13, 1.85]} />
        <meshStandardMaterial color="#26373a" roughness={0.72} metalness={0.26} />
      </mesh>
      <mesh position={[1.24, 0.22, 0.85]} rotation={[0, 0, frame * 0.008]}>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 32]} />
        <meshStandardMaterial color="#eab16e" metalness={0.72} roughness={0.3} emissive="#7c4620" emissiveIntensity={0.45 * strength} />
      </mesh>
    </group>
  );
};

const IndustryArtifacts: React.FC = () => {
  const frame = useCurrentFrame();
  const state = getNarrativeState(frame);
  const strength = state.concepts.industry;
  const pulse = 1 + Math.sin(frame / 5) * state.energy * 0.08;
  return (
    <group position={[0.12, -0.32, 0.22]} scale={strength * 1.12}>
      <group position={[-1.1, 0.05, 0.1]} rotation={[0.08, -0.12, -0.11]}>
        <mesh castShadow position={[0, 0.18, 0]}>
          <capsuleGeometry args={[0.37, 0.82, 8, 20]} />
          <meshPhysicalMaterial color="#6d4b38" roughness={0.3} metalness={0.05} clearcoat={0.5} />
        </mesh>
        <mesh position={[0.08, -0.25, 0.02]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.58, 0.11, 0.64]} />
          <meshStandardMaterial color="#d2a167" roughness={0.62} />
        </mesh>
        <mesh position={[0.01, -0.18, 0.08]}>
          <torusGeometry args={[0.32, 0.035, 10, 48]} />
          <meshStandardMaterial color="#b68654" metalness={0.24} roughness={0.4} />
        </mesh>
      </group>
      <group position={[0.36, 0.08, 0.22]} rotation={[0.18, 0.2, -0.08]} scale={pulse}>
        <mesh>
          <torusGeometry args={[0.72, 0.15, 22, 96]} />
          <meshPhysicalMaterial color="#b66f48" roughness={0.24} metalness={0.32} clearcoat={0.8} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.48, 0.014, 8, 96]} />
          <meshBasicMaterial color={COLORS.amber} transparent opacity={0.72 * strength} />
        </mesh>
      </group>
      <group position={[1.23, 0.1, -0.02]}>
        <mesh rotation={[0, 0, 0.17]}>
          <cylinderGeometry args={[0.17, 0.17, 1.8, 32, 1, true]} />
          <meshStandardMaterial color="#52616a" metalness={0.82} roughness={0.28} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, 0.17]}>
          <cylinderGeometry args={[0.19, 0.19, 1.82, 32, 1, true]} />
          <meshBasicMaterial color={COLORS.cyan} wireframe transparent opacity={0.23 * strength} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <torusGeometry args={[0.17, 0.035, 10, 36]} />
          <meshStandardMaterial color="#d9bb89" metalness={0.74} roughness={0.25} />
        </mesh>
      </group>
      <mesh position={[0.32, -0.92, 0]}>
        <boxGeometry args={[3.8, 0.08, 1.1]} />
        <meshStandardMaterial color="#22343b" roughness={0.58} metalness={0.45} />
      </mesh>
    </group>
  );
};

const MobileDevice: React.FC = () => {
  const frame = useCurrentFrame();
  const state = getNarrativeState(frame);
  const strength = state.concepts.device;
  const tilt = Math.sin(frame / 90) * 0.035;
  return (
    <group position={[0.12, -0.2, 0.15]} rotation={[0.04, -0.12 + tilt, 0.02]} scale={strength * 1.18}>
      <mesh castShadow>
        <boxGeometry args={[1.13, 2.2, 0.22, 4, 8, 2]} />
        <meshPhysicalMaterial color="#202b31" roughness={0.2} metalness={0.78} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[0, 0.02, 0.118]}>
        <boxGeometry args={[0.91, 1.62, 0.022]} />
        <meshPhysicalMaterial color="#102c34" roughness={0.18} metalness={0.24} emissive="#0c7580" emissiveIntensity={0.35 + state.energy * 0.5} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.02, 0.132]}>
        <planeGeometry args={[0.78, 1.46]} />
        <meshBasicMaterial color="#3b9da2" transparent opacity={0.08 + state.energy * 0.1} />
      </mesh>
      <mesh position={[0, -0.91, 0.123]}>
        <circleGeometry args={[0.055, 32]} />
        <meshStandardMaterial color="#b8c5c5" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.105, 0]}>
        <boxGeometry args={[0.21, 0.025, 0.035]} />
        <meshStandardMaterial color="#839597" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.68, 0.14]} rotation={[0, 0, frame * 0.025]}>
        <ringGeometry args={[0.12, 0.15, 40]} />
        <meshBasicMaterial color={COLORS.amber} transparent opacity={strength * (0.45 + state.energy * 0.55)} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[1.13, 2.2, 0.06]} />
        <meshStandardMaterial color="#6a7d80" metalness={0.86} roughness={0.31} />
      </mesh>
    </group>
  );
};

const SignalRoutes: React.FC = () => {
  const frame = useCurrentFrame();
  const state = getNarrativeState(frame);
  const strength = Math.max(state.concepts.network, state.concepts.device * 0.62);
  const routeMaterial = useMemo(() => new THREE.LineBasicMaterial({color: COLORS.cyan, transparent: true, opacity: 0.34}), []);
  const points = useMemo(() => [
    new THREE.Vector3(-3.7, 0.1, -2.7), new THREE.Vector3(-2.15, 1.0, -1.35), new THREE.Vector3(-0.45, 0.18, -0.15), new THREE.Vector3(1.0, 0.8, -1.5), new THREE.Vector3(3.15, 0.02, -3.1),
  ], []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const line = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)), [curve]);
  const routeObject = useMemo(() => new THREE.Line(line, routeMaterial), [line, routeMaterial]);
  const pulsePosition = curve.getPoint((frame * (0.0016 + state.energy * 0.0022)) % 1);
  return (
    <group>
      <primitive object={routeObject} scale={0.72 + strength * 0.28} />
      {Array.from({length: 14}, (_, index) => {
        const point = curve.getPoint((index / 14 + frame * (0.0002 + state.energy * 0.00028)) % 1);
        return <mesh key={index} position={point} scale={0.42 + strength * 0.58}><sphereGeometry args={[index % 4 === 0 ? 0.045 : 0.022, 12, 8]} /><meshBasicMaterial color={index % 4 === 0 ? COLORS.amber : COLORS.cyan} transparent opacity={strength * (0.28 + state.energy * 0.55)} /></mesh>;
      })}
      <mesh position={pulsePosition}>
        <sphereGeometry args={[0.07 + state.energy * 0.035, 16, 12]} />
        <meshBasicMaterial color={COLORS.amber} />
      </mesh>
    </group>
  );
};

const Floor: React.FC = () => (
  <group position={[0, -2.4, -1]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[42, 42]} />
      <meshStandardMaterial color="#0a1219" roughness={0.8} metalness={0.12} />
    </mesh>
    <gridHelper args={[36, 44, '#2a6a70', '#18333a']} position={[0, 0.012, 0]} />
  </group>
);

export const World: React.FC = () => (
  <ThreeCanvas
    width={1920}
    height={1080}
    dpr={1}
    camera={{position: [0, 0, 17], fov: 39, near: 0.1, far: 80}}
    gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
    shadows
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
  >
    <CameraMove />
    <Atmosphere />
    <Floor />
    <WorldGlobe />
    <TimberMill />
    <IndustryArtifacts />
    <SignalRoutes />
    <MobileDevice />
  </ThreeCanvas>
);

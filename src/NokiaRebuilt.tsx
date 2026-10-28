import React, {useMemo, useRef} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {RoundedBox} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  Float32BufferAttribute,
  PerspectiveCamera,
  Quaternion,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const COLORS = {
  ink: '#0b0f19',
  navy: '#10232e',
  cyan: '#70e9f2',
  pale: '#e5f5f2',
  amber: '#ffc36f',
  forest: '#17483d',
  snow: '#d9e9e8',
};
const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const SMOOTH = {...CLAMP, easing: Easing.inOut(Easing.cubic)};

const progress = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], SMOOTH);

const springIn = (frame: number, fps: number, from: number) =>
  Math.max(0, Math.min(1, spring({frame: frame - from, fps, config: {damping: 12, stiffness: 100}})));

const makeGlobeGrid = () => {
  const coordinates: number[] = [];
  const addLine = (points: Vector3[]) => {
    for (let index = 0; index < points.length - 1; index++) {
      coordinates.push(...points[index].toArray(), ...points[index + 1].toArray());
    }
  };

  for (let latitude = -75; latitude <= 75; latitude += 15) {
    const ring: Vector3[] = [];
    for (let longitude = -180; longitude <= 180; longitude += 5) {
      ring.push(pointOnEarth(latitude, longitude, 4.012));
    }
    addLine(ring);
  }
  for (let longitude = -180; longitude < 180; longitude += 15) {
    const meridian: Vector3[] = [];
    for (let latitude = -88; latitude <= 88; latitude += 4) {
      meridian.push(pointOnEarth(latitude, longitude, 4.012));
    }
    addLine(meridian);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(coordinates, 3));
  return geometry;
};

const EARTH_RADIUS = 4;
const NOKIA = {latitude: 61.46, longitude: 23.5};
const rawEarthPoint = (latitude: number, longitude: number, radius: number) => {
  const lat = (latitude * Math.PI) / 180;
  const lon = (longitude * Math.PI) / 180;
  return new Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
};
const EARTH_ROTATION = new Quaternion().setFromUnitVectors(
  rawEarthPoint(NOKIA.latitude, NOKIA.longitude, 1).normalize(),
  new Vector3(0, 0, 1),
);
const pointOnEarth = (latitude: number, longitude: number, radius = EARTH_RADIUS) =>
  rawEarthPoint(latitude, longitude, radius).applyQuaternion(EARTH_ROTATION);
const FINLAND_POINT = pointOnEarth(NOKIA.latitude, NOKIA.longitude, EARTH_RADIUS + 0.05);

const routeCities = [
  {name: 'London', latitude: 51.507, longitude: -0.128, delay: 0},
  {name: 'New York', latitude: 40.713, longitude: -74.006, delay: 12},
  {name: 'Tokyo', latitude: 35.676, longitude: 139.65, delay: 24},
] as const;

const makeCage = () => {
  const points: number[] = [];
  const addEdge = (start: Vector3, end: Vector3) => points.push(...start.toArray(), ...end.toArray());
  for (let y = -2.8; y <= 2.8; y += 1.4) {
    for (let z = -2.4; z <= 2.4; z += 2.4) addEdge(new Vector3(-6.8, y, z), new Vector3(6.8, y, z));
  }
  for (let x = -6.8; x <= 6.8; x += 3.4) {
    for (let z = -2.4; z <= 2.4; z += 2.4) addEdge(new Vector3(x, -2.8, z), new Vector3(x, 2.8, z));
    for (let y = -2.8; y <= 2.8; y += 1.4) addEdge(new Vector3(x, y, -2.4), new Vector3(x, y, 2.4));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  return geometry;
};

const tube = (points: Vector3[], radius: number, segments = 64) =>
  new TubeGeometry(new CatmullRomCurve3(points), segments, radius, 8, false);

type CoordinateRing = {core: TubeGeometry; halo: TubeGeometry};

const makeCoordinateRings = (): CoordinateRing[] => {
  const paths: Vector3[][] = [];
  for (const latitude of [-55, -20, 0, 23.5, 61.46]) {
    paths.push(Array.from({length: 97}, (_, index) => pointOnEarth(latitude, -180 + index * (360 / 96), 4.035)));
  }
  for (const longitude of [-90, -30, 30, 90, 150]) {
    paths.push(Array.from({length: 89}, (_, index) => pointOnEarth(-88 + index * 2, longitude, 4.035)));
  }
  return paths.map((points) => ({
    halo: tube(points, 0.034, 120),
    core: tube(points, 0.012, 120),
  }));
};

const makeVectorNodes = () => {
  const positions: number[] = [];
  const colors: number[] = [];
  let index = 0;
  for (let latitude = -68; latitude <= 68; latitude += 17) {
    for (let longitude = -180; longitude < 180; longitude += 17) {
      if ((index * 7) % 5 === 0) {
        index++;
        continue;
      }
      const jitterLat = ((index * 13) % 7 - 3) * 0.8;
      const jitterLon = ((index * 11) % 9 - 4) * 0.8;
      const point = pointOnEarth(latitude + jitterLat, longitude + jitterLon, 4.052);
      positions.push(...point.toArray());
      const color = new Color(index % 13 === 0 ? COLORS.amber : COLORS.cyan);
      colors.push(color.r, color.g, color.b);
      index++;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
};

const CameraSetup: React.FC = () => {
  const {camera} = useThree();
  useFrame(() => {
    const perspective = camera as PerspectiveCamera;
    perspective.position.set(0, 0, 16.5);
    perspective.up.set(0, 1, 0);
    perspective.lookAt(0, 0, 0);
  });
  return null;
};

const Globe: React.FC<{frame: number}> = ({frame}) => {
  const grid = useMemo(makeGlobeGrid, []);
  const coordinateRings = useMemo(makeCoordinateRings, []);
  const nodeGeometry = useMemo(makeVectorNodes, []);
  const glow = 0.5 + 0.12 * Math.sin(frame / 9);
  const scale = frame < 48 ? 1 : frame < 78 ? 1 - progress(frame, 48, 78) : frame < 450 ? 0 : frame < 480 ? springIn(frame, FPS, 450) : frame < 690 ? 1 : frame < 720 ? 1 - progress(frame, 690, 720) : 0;
  const cities = useMemo(() => routeCities.map((city) => {
    const end = pointOnEarth(city.latitude, city.longitude, EARTH_RADIUS + 0.11);
    const curve = new CatmullRomCurve3([
      FINLAND_POINT.clone(),
      FINLAND_POINT.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS + 1.05),
      end,
    ]);
    return {...city, end, curve, geometry: tube(curve.getPoints(48), 0.018, 48)};
  }), []);

  return (
    <group scale={scale} rotation={[0, frame * 0.00045, 0]} position={[0, 0.2, -2.3]}>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 48, 36]} />
        <meshStandardMaterial color={COLORS.navy} roughness={0.78} metalness={0.18} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#3f9da9" transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
      {coordinateRings.map(({core, halo}, index) => (
        <group key={index}>
          <mesh geometry={halo}>
            <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.09 + 0.025 * Math.sin(frame / 14 + index)} depthWrite={false} />
          </mesh>
          <mesh geometry={core}>
            <meshBasicMaterial color={index === 4 ? COLORS.amber : COLORS.cyan} transparent opacity={0.54 + 0.08 * Math.sin(frame / 14 + index)} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <points geometry={nodeGeometry}>
        <pointsMaterial size={0.044} sizeAttenuation vertexColors transparent opacity={0.88} depthWrite={false} />
      </points>
      <mesh position={FINLAND_POINT.toArray()}>
        <sphereGeometry args={[0.105 + glow * 0.025, 16, 12]} />
        <meshBasicMaterial color={COLORS.amber} />
      </mesh>
      <mesh position={FINLAND_POINT.toArray()} scale={1 + (frame % 30) / 24}>
        <torusGeometry args={[0.22, 0.012, 8, 48]} />
        <meshBasicMaterial color={COLORS.amber} transparent opacity={0.65 - (frame % 30) / 65} />
      </mesh>
      {frame >= 558 && frame < 690 && cities.map(({name, end, curve, geometry, delay}) => {
        const appear = springIn(frame, FPS, 558 + delay);
        const packetPosition = curve.getPointAt(Math.max(0, Math.min(1, (frame - 558 - delay) / 50)));
        return (
          <group key={name}>
            <mesh geometry={geometry}>
              <meshBasicMaterial color={name === 'London' ? COLORS.amber : COLORS.cyan} transparent opacity={0.72 * appear} />
            </mesh>
            <mesh position={end.toArray()}>
              <sphereGeometry args={[0.075, 12, 10]} />
              <meshBasicMaterial color={COLORS.pale} />
            </mesh>
            <mesh position={packetPosition.toArray()}>
              <sphereGeometry args={[0.062, 10, 8]} />
              <meshBasicMaterial color={COLORS.amber} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const PineTree: React.FC<{x: number; z: number; size: number}> = ({x, z, size}) => (
  <group position={[x, -1.65, z]} scale={size}>
    <mesh position={[0, 0.42, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.1, 0.9, 8]} />
      <meshStandardMaterial color="#4a392c" roughness={0.95} />
    </mesh>
    {[0, 1, 2].map((tier) => (
      <group key={tier} position={[0, 0.65 + tier * 0.44, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.49 - tier * 0.08, 1.02 - tier * 0.12, 9]} />
          <meshStandardMaterial color={tier === 2 ? '#28584b' : COLORS.forest} roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.31 - tier * 0.04, 0.52, 9]} />
          <meshStandardMaterial color={COLORS.snow} roughness={0.82} />
        </mesh>
      </group>
    ))}
  </group>
);

const SnowParticles: React.FC<{frame: number}> = ({frame}) => (
  <group>
    {Array.from({length: 32}, (_, index) => {
      const x = ((index * 1.73) % 8) - 4;
      const y = ((index * 2.39 + frame * 0.025) % 5.2) - 2.6;
      const z = ((index * 0.87) % 2.4) - 1.2;
      return (
        <mesh key={index} position={[x + Math.sin(frame / 18 + index) * 0.08, y, z]}>
          <sphereGeometry args={[0.022 + (index % 3) * 0.007, 6, 6]} />
          <meshBasicMaterial color="#e9f8f6" transparent opacity={0.42 + (index % 3) * 0.14} />
        </mesh>
      );
    })}
  </group>
);

const MillDiorama: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const enter = springIn(frame, fps, 45);
  const leave = progress(frame, 180, 210);
  const scale = enter * (1 - leave);
  const lamps = 0.8 + Math.sin(frame / 8) * 0.14;
  return (
    <group scale={scale} position={[0, -0.1, 0.6]}>
      <RoundedBox args={[8.6, 0.34, 4.7]} radius={0.12} smoothness={3} position={[0, -1.56, -0.1]} receiveShadow>
        <meshStandardMaterial color="#dce8e5" roughness={0.94} />
      </RoundedBox>
      {Array.from({length: 13}, (_, index) => (
        <PineTree key={index} x={-3.55 + (index % 7) * 1.18} z={-1.15 + Math.floor(index / 7) * 0.82} size={0.62 + (index % 3) * 0.09} />
      ))}
      <group position={[0, -0.12, 0.72]}>
        <mesh position={[0, -0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 1.72, 1.68]} />
          <meshStandardMaterial color="#51372b" roughness={0.84} />
        </mesh>
        <mesh position={[0, -0.3, 0.86]}>
          <boxGeometry args={[2.36, 1.22, 0.06]} />
          <meshStandardMaterial color="#825337" roughness={0.8} />
        </mesh>
        {[-0.9, -0.6, -0.3, 0, 0.3, 0.6].map((y) => (
          <mesh key={y} position={[0, y - 0.3, 0.91]} castShadow>
            <boxGeometry args={[2.52, 0.045, 0.055]} />
            <meshStandardMaterial color={y % 0.6 === 0 ? '#68432f' : '#965d3a'} roughness={0.82} />
          </mesh>
        ))}
        {[-1.23, -0.72, 0.72, 1.23].map((x) => (
          <mesh key={x} position={[x, -0.3, 0.96]} castShadow>
            <boxGeometry args={[0.09, 1.58, 0.08]} />
            <meshStandardMaterial color="#4c342a" roughness={0.84} />
          </mesh>
        ))}
        <mesh position={[-0.46, 0.67, 0]} rotation={[0, 0, 0.48]} castShadow>
          <boxGeometry args={[1.78, 0.16, 2.12]} />
          <meshStandardMaterial color="#283b42" metalness={0.25} roughness={0.48} />
        </mesh>
        <mesh position={[0.46, 0.67, 0]} rotation={[0, 0, -0.48]} castShadow>
          <boxGeometry args={[1.78, 0.16, 2.12]} />
          <meshStandardMaterial color="#314a50" metalness={0.22} roughness={0.48} />
        </mesh>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} position={[-0.82 + index * 0.55, -0.16, 0.92]}>
            <boxGeometry args={[0.16, 0.38, 0.04]} />
            <meshStandardMaterial color="#f6c982" emissive="#f6a34d" emissiveIntensity={lamps} />
          </mesh>
        ))}
        <mesh position={[0, -1.08, 0.96]}>
          <boxGeometry args={[3.22, 0.14, 2.1]} />
          <meshStandardMaterial color="#252e31" metalness={0.36} roughness={0.52} />
        </mesh>
        {[-1.6, 1.6].map((x) => (
          <mesh key={x} position={[x, -0.72, 1.1]}>
            <cylinderGeometry args={[0.37, 0.37, 0.5, 24]} />
            <meshStandardMaterial color="#276377" metalness={0.4} roughness={0.36} />
          </mesh>
        ))}
        <pointLight position={[0, 0.2, 2.2]} color={COLORS.amber} intensity={3.2} distance={5} />
      </group>
      <SnowParticles frame={frame} />
    </group>
  );
};

const makeBootBody = () => {
  const profile = new Shape();
  profile.moveTo(-0.54, -0.46);
  profile.lineTo(0.48, -0.46);
  profile.quadraticCurveTo(0.74, -0.44, 0.78, -0.2);
  profile.quadraticCurveTo(0.8, -0.08, 0.65, -0.02);
  profile.lineTo(0.18, 0.12);
  profile.lineTo(0.04, 0.25);
  profile.lineTo(0.02, 0.83);
  profile.quadraticCurveTo(0.01, 0.95, -0.13, 0.96);
  profile.lineTo(-0.44, 0.96);
  profile.quadraticCurveTo(-0.57, 0.94, -0.57, 0.8);
  profile.lineTo(-0.54, -0.46);
  const geometry = new ExtrudeGeometry(profile, {depth: 0.42, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.045, bevelThickness: 0.045});
  geometry.computeVertexNormals();
  return geometry;
};

const makeBootSole = () => {
  const profile = new Shape();
  profile.moveTo(-0.56, -0.47);
  profile.lineTo(0.5, -0.47);
  profile.quadraticCurveTo(0.74, -0.45, 0.79, -0.24);
  profile.lineTo(0.75, -0.17);
  profile.quadraticCurveTo(0.5, -0.27, 0.2, -0.25);
  profile.lineTo(-0.52, -0.29);
  profile.closePath();
  return new ExtrudeGeometry(profile, {depth: 0.44, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.025, bevelThickness: 0.02});
};

const IndustryStage: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const enter = springIn(frame, fps, 180);
  const leave = progress(frame, 450, 480);
  const scale = enter * (1 - leave);
  const cage = useMemo(makeCage, []);
  const bootIn = springIn(frame, fps, 240);
  const bootBody = useMemo(makeBootBody, []);
  const bootSole = useMemo(makeBootSole, []);
  const bootSeam = useMemo(() => tube([
    new Vector3(-0.3, 0.83, 0.46),
    new Vector3(-0.26, 0.44, 0.46),
    new Vector3(-0.22, 0.14, 0.46),
    new Vector3(0.1, -0.02, 0.46),
    new Vector3(0.55, -0.16, 0.46),
  ], 0.012, 24), []);
  const cableIn = springIn(frame, fps, 300);
  const electricityIn = springIn(frame, fps, 345);
  const graphIn = springIn(frame, fps, 390);
  const cableCurve = useMemo(() => new CatmullRomCurve3([
    new Vector3(-4.4, -0.8, 0.2),
    new Vector3(-2.6, 0.2, 0.65),
    new Vector3(0, -0.35, 0.45),
    new Vector3(2.2, 0.5, 0.7),
    new Vector3(4.4, -0.12, 0.25),
  ]), []);
  const cableGeometry = useMemo(() => tube(cableCurve.getPoints(80), 0.042, 80), [cableCurve]);
  const packet = cableCurve.getPointAt((Math.max(0, frame - 300) * 0.018) % 1);
  const bars = [0.4, 0.7, 0.9, 1.2, 1.55, 1.8];
  return (
    <group scale={scale} position={[0, -0.12, 0.25]}>
      <lineSegments geometry={cage}>
        <lineBasicMaterial color="#2b7481" transparent opacity={0.18} />
      </lineSegments>
      <RoundedBox args={[9.2, 0.26, 4.8]} radius={0.08} smoothness={2} position={[0, -1.62, 0]} receiveShadow>
        <meshStandardMaterial color="#192a32" metalness={0.42} roughness={0.64} />
      </RoundedBox>
      <group position={[-2.35, -0.5, 0.62]} scale={bootIn} rotation={[0, -0.12, 0]}>
        <mesh geometry={bootSole} position={[0, 0, -0.01]} castShadow receiveShadow>
          <meshStandardMaterial color="#242625" roughness={0.9} />
        </mesh>
        <mesh geometry={bootBody} castShadow>
          <meshStandardMaterial color="#cb8842" roughness={0.48} metalness={0.04} emissive="#542c10" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[-0.27, 0.91, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.045, 8, 32]} />
          <meshStandardMaterial color="#e2aa63" metalness={0.18} roughness={0.42} />
        </mesh>
        <mesh geometry={bootSeam}>
          <meshBasicMaterial color="#f2c277" transparent opacity={0.82} />
        </mesh>
        <mesh position={[-0.3, 0.6, 0.47]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshBasicMaterial color={COLORS.amber} />
        </mesh>
      </group>
      <group scale={cableIn}>
        <mesh geometry={cableGeometry}>
          <meshStandardMaterial color="#243a43" metalness={0.72} roughness={0.28} emissive="#123c49" emissiveIntensity={0.25} />
        </mesh>
        {[0, 1].map((index) => (
          <mesh key={index} position={[index ? 4.4 : -4.4, index ? -0.12 : -0.8, 0.25]}>
            <cylinderGeometry args={[0.14, 0.14, 0.38, 16]} />
            <meshStandardMaterial color="#be633d" metalness={0.42} roughness={0.46} />
          </mesh>
        ))}
        <mesh position={packet.toArray()} scale={cableIn}>
          <sphereGeometry args={[0.095, 12, 10]} />
          <meshBasicMaterial color={COLORS.amber} />
        </mesh>
      </group>
      <group scale={electricityIn}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[0.45 + index * 0.58, 0.08 + index * 0.22, 0.2]} rotation={[0.16, 0.1, 0.3]}>
            <torusGeometry args={[0.28, 0.025, 8, 48]} />
            <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      <group position={[2.75, -0.78, 0.82]} scale={graphIn}>
        {bars.map((height, index) => (
          <mesh key={index} position={[-0.9 + index * 0.36, height / 2, 0]}>
            <boxGeometry args={[0.2, height, 0.18]} />
            <meshStandardMaterial color={index < 3 ? '#397681' : COLORS.cyan} emissive={COLORS.cyan} emissiveIntensity={0.2 + index * 0.06} metalness={0.22} roughness={0.48} />
          </mesh>
        ))}
        <RoundedBox args={[2.55, 0.08, 0.24]} radius={0.03} smoothness={2} position={[0, -0.08, 0]}>
          <meshStandardMaterial color="#46636a" />
        </RoundedBox>
        <pointLight position={[0.15, 1, 0.6]} color={COLORS.cyan} intensity={1.5} distance={3} />
      </group>
    </group>
  );
};

const PhoneStage: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const appear = springIn(frame, fps, 678);
  const pulse = 0.35 + 0.12 * Math.sin(frame / 8);
  const sweep = (Math.max(0, frame - 678) * 5) % 360;
  const radarRay = useMemo(() => tube([
    new Vector3(0, 0, 0),
    new Vector3(0.3, 0.32, 0.02),
    new Vector3(0.1, 0.62, 0.03),
    new Vector3(-0.26, 0.82, 0.04),
  ], 0.014, 20), []);
  return (
    <group position={[0, -0.08, 0.15]} scale={appear} rotation={[0.015 * Math.sin(frame / 17), 0.09 * Math.sin(frame / 21), 0]}>
      <mesh position={[0, -2.79, -0.05]} castShadow receiveShadow>
        <cylinderGeometry args={[1.82, 2.08, 0.28, 64]} />
        <meshStandardMaterial color="#15242c" metalness={0.7} roughness={0.34} />
      </mesh>
      <mesh position={[0, -2.64, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.86, 0.024, 8, 64]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.54} />
      </mesh>
      <RoundedBox args={[2.75, 5.3, 0.38]} radius={0.28} smoothness={8} castShadow>
        <meshStandardMaterial color="#111a24" metalness={0.9} roughness={0.2} emissive="#163d49" emissiveIntensity={pulse} />
      </RoundedBox>
      <RoundedBox args={[2.48, 5.02, 0.13]} radius={0.22} smoothness={8} position={[0, 0, 0.22]}>
        <meshStandardMaterial color="#07141e" metalness={0.4} roughness={0.28} />
      </RoundedBox>
      <RoundedBox args={[2.24, 4.74, 0.06]} radius={0.17} smoothness={6} position={[0, 0, 0.32]}>
        <meshPhysicalMaterial color="#0e2631" metalness={0.22} roughness={0.24} clearcoat={0.85} clearcoatRoughness={0.12} emissive="#0d3d4b" emissiveIntensity={0.48} />
      </RoundedBox>
      <RoundedBox args={[0.54, 0.055, 0.025]} radius={0.025} smoothness={4} position={[-0.06, 2.28, 0.375]}>
        <meshStandardMaterial color="#071019" metalness={0.62} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0.43, 2.28, 0.38]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshPhysicalMaterial color="#1d3a48" metalness={0.76} roughness={0.18} clearcoat={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <RoundedBox args={[0.09, 0.62, 0.12]} radius={0.035} smoothness={4} position={[side * 1.38, 0.72, -0.015]} castShadow>
            <meshStandardMaterial color="#8a9da0" metalness={0.86} roughness={0.24} />
          </RoundedBox>
          <RoundedBox args={[0.09, 0.34, 0.12]} radius={0.035} smoothness={4} position={[side * 1.38, -0.22, -0.015]} castShadow>
            <meshStandardMaterial color="#73888d" metalness={0.8} roughness={0.26} />
          </RoundedBox>
        </group>
      ))}
      {[0.94, 0.7, 0.46, 0.24].map((radius) => (
        <mesh key={radius} position={[0, 0.08, 0.37]}>
          <torusGeometry args={[radius, 0.014, 8, 64]} />
          <meshBasicMaterial color={radius < 0.3 ? COLORS.amber : COLORS.cyan} transparent opacity={0.54} />
        </mesh>
      ))}
      <group position={[0, 0.08, 0.4]} rotation={[0, 0, -sweep * Math.PI / 180]}>
        <mesh geometry={radarRay}>
          <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.92} />
        </mesh>
      </group>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh key={index} position={[-0.72 + index * 0.29, -1.63, 0.37]}>
          <boxGeometry args={[0.16, 0.02, 0.015]} />
          <meshBasicMaterial color={index < Math.floor(((frame - 678) / 12) % 6) ? COLORS.amber : COLORS.cyan} />
        </mesh>
      ))}
      <pointLight position={[0, 0.1, 1.2]} color={COLORS.cyan} intensity={3.6 + pulse * 4} distance={5} />
    </group>
  );
};

const DustField: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => Array.from({length: 150}, (_, index) => ({
    x: ((index * 73) % 101) / 101 * 19 - 9.5,
    y: ((index * 37) % 97) / 97 * 10 - 5,
    z: -7 + ((index * 19) % 113) / 113 * 12,
    phase: index * 0.71,
    speed: 0.18 + (index % 7) * 0.035,
  })), []);
  const geometry = useMemo(() => {
    const points = new BufferGeometry();
    points.setAttribute('position', new Float32BufferAttribute(new Float32Array(particles.length * 3), 3));
    const colors = new Float32Array(particles.length * 3);
    particles.forEach((particle, index) => {
      const color = new Color(index % 9 === 0 ? '#e8b47a' : '#6ddce8');
      colors.set([color.r, color.g, color.b], index * 3);
    });
    points.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return points;
  }, [particles]);

  useFrame(() => {
    const attribute = geometry.getAttribute('position') as Float32BufferAttribute;
    particles.forEach((particle, index) => {
      const drift = (frame * particle.speed) % 10;
      const y = ((particle.y + drift + 5) % 10) - 5;
      attribute.setXYZ(index, particle.x + Math.sin(frame / 32 + particle.phase) * 0.14, y, particle.z);
    });
    attribute.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial size={0.045} sizeAttenuation vertexColors transparent opacity={0.46} depthWrite={false} blending={AdditiveBlending} />
    </points>
  );
};

const World: React.FC<{frame: number}> = ({frame}) => (
  <>
    <color attach="background" args={[COLORS.ink]} />
    <fog attach="fog" args={[COLORS.ink, 19, 42]} />
    <ambientLight intensity={0.48} />
    <directionalLight
      position={[-5, 8, 10]}
      intensity={2.1}
      color="#d3efeb"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-camera-far={36}
      shadow-radius={6}
      shadow-bias={-0.00012}
    />
    <pointLight position={[0, 1, 8]} intensity={1.8} color="#23869a" distance={22} />
    <pointLight position={[-6, 1, 6]} intensity={1.25} color={COLORS.amber} distance={18} />
    <CameraSetup />
    <Globe frame={frame} />
    <MillDiorama frame={frame} />
    <IndustryStage frame={frame} />
    <PhoneStage frame={frame} />
    <DustField />
  </>
);

const captions = [
  {start: 0, end: 51, text: 'In 1865, deep in the frozen forests of Finland,'},
  {start: 51, end: 92, text: 'a quiet timber mill was born.'},
  {start: 92, end: 180, text: 'No one knew it yet... but this small paper company would change history.'},
  {start: 180, end: 240, text: 'Decades before cell phones, Nokia evolved into an industrial powerhouse—'},
  {start: 240, end: 300, text: 'manufacturing rubber boots,'},
  {start: 300, end: 365, text: 'cables, and electricity'},
  {start: 365, end: 450, text: 'for a rapidly modernizing nation.'},
  {start: 450, end: 558, text: 'When the digital age arrived, Nokia pivoted once more—'},
  {start: 558, end: 684, text: 'connecting billions of people'},
  {start: 684, end: 900, text: 'and redefining what a mobile phone could be.'},
] as const;

const chapterAt = (frame: number) => {
  if (frame < 180) return {eyebrow: 'NOKIA · FINLAND · 1865', title: 'A timber mill in the frozen north', detail: 'From forest and river to paper and possibility'};
  if (frame < 450) return {eyebrow: 'INDUSTRIAL TRANSFORMATION', title: 'Boots. Cables. Electricity.', detail: 'A Finnish mill becomes a modern industrial force'};
  if (frame < 690) return {eyebrow: 'A WORLD CONNECTED', title: 'Signals from Finland', detail: 'London · New York · Tokyo'};
  return {eyebrow: 'THE MOBILE ERA', title: 'A world in your hand', detail: 'Nokia connects billions'};
};

const TechnicalSchematic: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const globeIn = springIn(frame, fps, 0);
  const globeOut = progress(frame, 48, 78);
  const globeReturn = springIn(frame, fps, 450);
  const globeLeave = progress(frame, 690, 720);
  const globeOpacity = frame < 48 ? globeIn : frame < 78 ? 1 - globeOut : frame < 450 ? 0 : frame < 480 ? globeReturn : frame < 690 ? 1 : 1 - globeLeave;
  const industryOpacity = springIn(frame, fps, 180) * (1 - progress(frame, 450, 480));
  const networkOpacity = springIn(frame, fps, 450) * (1 - progress(frame, 690, 720));
  const phoneOpacity = springIn(frame, fps, 678);
  const sweep = (frame * 2.4) % 360;
  const pulse = 0.55 + 0.35 * Math.sin(frame / 8);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none'}}
    >
      <defs>
        <radialGradient id="radarFade" cx="0" cy="0" r="1" gradientTransform="translate(0.5 0.5) rotate(90) scale(0.5)">
          <stop offset="0" stopColor="#70e9f2" stopOpacity="0.02" />
          <stop offset="1" stopColor="#70e9f2" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id="schematicSweep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#70e9f2" stopOpacity="0.38" />
          <stop offset="1" stopColor="#70e9f2" stopOpacity="0" />
        </linearGradient>
        <filter id="schematicGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="soft" />
          <feMerge><feMergeNode in="soft" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g opacity={globeOpacity} fill="none" stroke="#70e9f2" strokeWidth="1.2">
        <circle cx="1515" cy="492" r="174" strokeOpacity="0.34" />
        <circle cx="1515" cy="492" r="140" strokeOpacity="0.18" strokeDasharray="2 9" />
        <circle cx="1515" cy="492" r="91" strokeOpacity="0.26" />
        <ellipse cx="1515" cy="492" rx="174" ry="66" strokeOpacity="0.32" />
        <ellipse cx="1515" cy="492" rx="66" ry="174" strokeOpacity="0.28" />
        <path d="M1335 492H1695M1515 310V674" strokeOpacity="0.18" strokeDasharray="4 8" />
        <g transform={`rotate(${sweep} 1515 492)`} filter="url(#schematicGlow)">
          <path d="M1515 492L1689 492A174 174 0 0 0 1627 359Z" fill="url(#schematicSweep)" stroke="none" />
          <path d="M1515 492L1688 492" strokeWidth="2" strokeOpacity="0.9" />
        </g>
        {[[1394,412],[1431,555],[1476,354],[1549,385],[1621,443],[1584,579],[1460,610],[1650,527],[1538,550]].map(([x,y], index) => (
          <g key={index} filter={index % 3 === 0 ? 'url(#schematicGlow)' : undefined}>
            <circle cx={x} cy={y} r={index % 3 === 0 ? 4.2 : 2.5} fill={index % 3 === 0 ? '#ffc36f' : '#70e9f2'} stroke="none" opacity={pulse} />
            <circle cx={x} cy={y} r={index % 3 === 0 ? 10 : 6} strokeOpacity="0.32" />
          </g>
        ))}
        <path d="M1332 296h42m-42 0v42M1698 296h-42m42 0v42M1332 688h42m-42 0v-42M1698 688h-42m42 0v-42" stroke="#ffc36f" strokeOpacity="0.75" />
        <text x="1340" y="724" fill="#b6c8cc" stroke="none" fontFamily="Arial,sans-serif" fontSize="12" letterSpacing="3">FINLAND / 61° 28′ N</text>
        <text x="1594" y="724" fill="#70e9f2" stroke="none" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">LAT / LON · LIVE</text>
      </g>

      <g opacity={industryOpacity} fill="none" stroke="#70e9f2" strokeWidth="1.3" filter="url(#schematicGlow)">
        <path d="M1336 356h64l15 22v97l-24 26h-52l-17-20v-96z" strokeOpacity="0.72" />
        <path d="M1354 378v79m18-80v67m-38 0h64m-64 9h59" strokeOpacity="0.42" />
        <path d="M1423 480c44 0 44-80 88-80s44 80 88 80 44-80 88-80" stroke="#ffc36f" strokeOpacity="0.72" />
        <circle cx="1511" cy="400" r="5" fill="#ffc36f" />
        <circle cx="1599" cy="480" r="5" fill="#ffc36f" />
        <circle cx="1687" cy="400" r="5" fill="#ffc36f" />
        <path d="M1430 572h275M1430 572v-83m35 83v-22m40 22v-39m40 39v-56m40 56v-68m40 68v-79m40 79v-96" strokeOpacity="0.48" />
        <path d="M1430 539l35-8 40-7 40-12 40-15 40-13 40-20" stroke="#ffc36f" strokeWidth="2.1" />
        <text x="1338" y="625" fill="#b6c8cc" stroke="none" fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="3">RUBBER / COPPER / POWER</text>
        <text x="1630" y="625" fill="#70e9f2" stroke="none" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">OUTPUT + 1865—1920</text>
      </g>

      <g opacity={networkOpacity} fill="none" stroke="#70e9f2" strokeWidth="1.3">
        <path d="M1300 468C1370 390 1436 397 1490 452S1605 525 1714 386" strokeOpacity="0.42" />
        <path d="M1300 468C1380 550 1455 573 1510 496S1630 397 1714 386" stroke="#ffc36f" strokeOpacity="0.6" />
        <path d="M1300 468C1390 456 1440 453 1510 496S1618 571 1714 386" strokeOpacity="0.24" strokeDasharray="5 8" />
        {[[1300,468],[1408,423],[1510,496],[1615,450],[1714,386],[1604,558]].map(([x,y], index) => (
          <g key={index} filter={index === 2 ? 'url(#schematicGlow)' : undefined}>
            <circle cx={x} cy={y} r={index === 2 ? 8 : 5} fill={index === 2 ? '#ffc36f' : '#70e9f2'} stroke="none" />
            <circle cx={x} cy={y} r={index === 2 ? 20 : 12} strokeOpacity="0.38" />
          </g>
        ))}
        <text x="1280" y="606" fill="#b6c8cc" stroke="none" fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="3">NOKIA → LONDON → NEW YORK → TOKYO</text>
      </g>

      <g opacity={phoneOpacity} fill="none" stroke="#70e9f2" strokeWidth="1.4">
        <circle cx="1515" cy="492" r="170" strokeOpacity="0.28" />
        <circle cx="1515" cy="492" r="124" strokeOpacity="0.4" />
        <circle cx="1515" cy="492" r="80" strokeOpacity="0.54" />
        <circle cx="1515" cy="492" r="34" stroke="#ffc36f" strokeOpacity="0.8" />
        <g transform={`rotate(${sweep * 1.35} 1515 492)`} filter="url(#schematicGlow)">
          <path d="M1515 492L1685 492A170 170 0 0 0 1630 374Z" fill="url(#schematicSweep)" stroke="none" />
          <path d="M1515 492L1685 492" strokeWidth="2" />
        </g>
        <path d="M1340 492h350m-175-175v350" strokeOpacity="0.2" strokeDasharray="3 8" />
        <circle cx="1435" cy="432" r="4" fill="#ffc36f" /><circle cx="1608" cy="530" r="4" fill="#70e9f2" />
        <text x="1350" y="710" fill="#b6c8cc" stroke="none" fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="3">MOBILE SIGNAL / 360°</text>
      </g>
    </svg>
  );
};

/**
 * DOM-only editorial layer. It is a sibling above the WebGL canvas, not a 3D scene object.
 * The layer stays in CSS space; descendants use no perspective or 3D rotation (the caption uses a 2D scale only).
 */
const EditorialOverlay: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const caption = captions.find(({start, end}) => frame >= start && frame < end) ?? captions[captions.length - 1];
  const chapter = chapterAt(frame);
  const chapterStart = frame < 180 ? 0 : frame < 450 ? 180 : frame < 690 ? 450 : 690;
  const titleSpring = springIn(frame, fps, 0);
  const titleOpacity = frame < 126 ? titleSpring * (1 - progress(frame, 108, 126)) : 0;
  const captionOpacity = springIn(frame, fps, caption.start);
  const chapterOpacity = springIn(frame, fps, chapterStart);
  const networkOpacity = springIn(frame, fps, 450);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        color: COLORS.pale,
        fontFamily: 'Arial, Helvetica, sans-serif',
        isolation: 'isolate',
      }}
    >
      <div style={{position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(90deg, rgba(5,10,17,.7), transparent 58%), linear-gradient(0deg, rgba(5,10,17,.82), transparent 48%)'}} />
      <div style={{position: 'absolute', inset: 0, zIndex: 1, opacity: 0.82, mixBlendMode: 'screen', background: 'radial-gradient(ellipse at 76% 43%, rgba(35,147,165,.19), transparent 42%), radial-gradient(ellipse at 19% 70%, rgba(216,150,86,.11), transparent 38%), radial-gradient(ellipse at 50% 48%, transparent 25%, rgba(0,0,0,.28) 100%)'}} />
      <TechnicalSchematic frame={frame} />
      {titleOpacity > 0 && (
        <header style={{position: 'absolute', zIndex: 5, left: 120, top: 104, width: 690, opacity: titleOpacity, transform: `translateY(${(1 - titleSpring) * 18}px)`, textShadow: '0 2px 24px rgba(0,0,0,.75)'}}>
          <div style={{color: COLORS.cyan, fontSize: 15, fontWeight: 700, letterSpacing: 5.5}}>A FINNISH STORY · 1865—TODAY</div>
          <div style={{marginTop: 18, font: '400 70px/1.02 Georgia, serif', letterSpacing: -1.8}}>The Empire of<br /><span style={{color: COLORS.amber, fontWeight: 600}}>Timber &amp; Tech</span></div>
          <div style={{marginTop: 18, color: '#b1c3c5', fontSize: 17, letterSpacing: 2}}>THE COMPANY THAT CONNECTED THE WORLD</div>
        </header>
      )}
      <section style={{position: 'absolute', zIndex: 5, top: 86, right: 110, width: 470, textAlign: 'right', opacity: chapterOpacity, transform: `translateY(${(1 - chapterOpacity) * 12}px)`}}>
        <div style={{color: COLORS.cyan, fontSize: 12, fontWeight: 800, letterSpacing: 4.2}}>{chapter.eyebrow}</div>
        <div style={{marginTop: 12, font: '400 36px/1.08 Georgia, serif', letterSpacing: -0.6, textShadow: '0 2px 18px rgba(0,0,0,.8)'}}>{chapter.title}</div>
        <div style={{marginTop: 10, color: '#b5c5c6', fontSize: 16, letterSpacing: 0.5}}>{chapter.detail}</div>
      </section>
      <div style={{position: 'absolute', zIndex: 6, left: 120, right: 120, bottom: 86, minHeight: 132, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: 'min(1260px, 100%)', display: 'grid', gridTemplateColumns: '175px minmax(0, 1fr) 110px', alignItems: 'center', gap: 24, padding: '24px 30px', border: `1px solid rgba(112,233,242,${0.2 + 0.3 * captionOpacity})`, borderRadius: 18, background: `linear-gradient(112deg, rgba(10,22,34,${0.76 + 0.12 * captionOpacity}), rgba(7,16,27,${0.68 + 0.16 * captionOpacity}) 55%, rgba(13,31,41,${0.7 + 0.12 * captionOpacity}))`, boxShadow: `inset 0 1px 0 rgba(226,250,249,${0.1 + 0.12 * captionOpacity}), 0 18px 54px rgba(0,0,0,.46), 0 0 34px rgba(56,198,214,${0.08 + 0.18 * captionOpacity})`, backdropFilter: 'blur(12px) saturate(145%)', WebkitBackdropFilter: 'blur(12px) saturate(145%)', opacity: captionOpacity, transform: `scale(${0.965 + 0.035 * captionOpacity}) translateY(${(1 - captionOpacity) * 8}px)`, overflow: 'hidden'}}>
          <svg aria-hidden="true" viewBox="0 0 1260 140" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0}}>
            <path d="M20 2h45M2 20v28M1240 2h-45m53 18v28M20 138h45M2 120V92m1238 46h-45m53-18V92" fill="none" stroke="#70e9f2" strokeOpacity=".52" strokeWidth="1.2" />
            <path d="M210 20h62M988 120h66" fill="none" stroke="#ffc36f" strokeOpacity=".5" strokeWidth="1" />
            <circle cx="112" cy="70" r="3" fill="#ffc36f" /><circle cx="112" cy="70" r="12" fill="none" stroke="#ffc36f" strokeOpacity=".38" />
            <circle cx="1150" cy="70" r="2.5" fill="#70e9f2" /><circle cx="1150" cy="70" r="10" fill="none" stroke="#70e9f2" strokeOpacity=".34" />
          </svg>
          <div style={{position: 'relative', zIndex: 1, paddingLeft: 8, color: '#9fb6bc', fontSize: 10, fontWeight: 800, letterSpacing: 3.2, lineHeight: 1.8}}>
            <span style={{color: COLORS.amber}}>VOICE / ARCHIVE</span><br />NOKIA · FINLAND<br /><span style={{color: '#6f929b'}}>FRAME {String(frame).padStart(3, '0')}</span>
          </div>
          <div style={{position: 'relative', zIndex: 1, textAlign: 'center', font: '500 29px/1.32 Georgia, serif', letterSpacing: 0.05, textShadow: '0 1px 12px rgba(0,0,0,.72)'}}>{caption.text}</div>
          <div style={{position: 'relative', zIndex: 1, textAlign: 'right', color: COLORS.cyan, fontSize: 10, fontWeight: 700, letterSpacing: 2.4, lineHeight: 1.8}}>STORY<br />{String(Math.floor(frame / FPS)).padStart(2, '0')} SEC</div>
        </div>
      </div>
      {frame >= 450 && frame < 690 && (
        <aside style={{position: 'absolute', zIndex: 6, left: 120, top: 300, width: 316, padding: '22px 25px 24px', border: '1px solid rgba(112,233,242,.52)', borderRadius: '18px 18px 18px 6px', background: 'linear-gradient(138deg, rgba(13,31,43,.84), rgba(7,15,25,.72) 68%, rgba(16,37,47,.78))', boxShadow: 'inset 0 1px 0 rgba(228,250,248,.14), 0 22px 54px rgba(0,0,0,.38), 0 0 30px rgba(73,201,219,.16)', backdropFilter: 'blur(12px) saturate(150%)', WebkitBackdropFilter: 'blur(12px) saturate(150%)', opacity: networkOpacity, transform: `translateY(${(1 - networkOpacity) * 14}px)`, overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 0, left: 24, width: 86, height: 1, background: 'linear-gradient(90deg, #ffc36f, transparent)'}} />
          <div style={{color: COLORS.amber, fontSize: 10, fontWeight: 800, letterSpacing: 3.6}}>NETWORK ORIGIN / 01</div>
          <div style={{marginTop: 13, font: '400 28px/1.1 Georgia, serif', letterSpacing: -0.3}}>Nokia, Finland</div>
          <svg aria-hidden="true" viewBox="0 0 260 48" style={{display: 'block', width: '100%', height: 48, marginTop: 14}}>
            <path d="M5 24C38 24 38 8 71 8s33 32 66 32 33-28 66-28 33 12 52 12" fill="none" stroke="#70e9f2" strokeOpacity=".52" strokeWidth="1.2" />
            <path d="M5 24H255" fill="none" stroke="#70e9f2" strokeOpacity=".16" strokeDasharray="2 6" />
            {[5,71,137,203,255].map((x, index) => <g key={x}><circle cx={x} cy={index === 1 ? 8 : index === 2 ? 40 : index === 3 ? 12 : 24} r={index === 0 ? 4 : 3} fill={index === 0 ? '#ffc36f' : '#70e9f2'} /><circle cx={x} cy={index === 1 ? 8 : index === 2 ? 40 : index === 3 ? 12 : 24} r="8" fill="none" stroke="#70e9f2" strokeOpacity=".28" /></g>)}
          </svg>
          <div style={{display: 'flex', justifyContent: 'space-between', color: '#b1c6c8', fontSize: 10, fontWeight: 700, letterSpacing: 1.6}}><span>LONDON</span><span>NEW YORK</span><span>TOKYO</span></div>
        </aside>
      )}
      <footer style={{position: 'absolute', zIndex: 5, left: 120, right: 120, top: 38, display: 'flex', justifyContent: 'space-between', color: 'rgba(211,232,231,.72)', fontSize: 11, fontWeight: 800, letterSpacing: 3.5}}>
        <span>DOCUMENTARY · 01</span>
        <span>FINLAND&nbsp;&nbsp; / &nbsp;&nbsp;WORLD</span>
      </footer>
    </div>
  );
};

/** A decoupled 3D world plus a flat, front-facing DOM title and HUD layer. */
export const NokiaRebuilt: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: COLORS.ink, overflow: 'hidden'}}>
      <ThreeCanvas
        width={WIDTH}
        height={HEIGHT}
        dpr={1}
        camera={{position: [0, 0, 16.5], fov: 42, near: 0.1, far: 100}}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        shadows
        style={{position: 'absolute', inset: 0, zIndex: 0}}
      >
        <World frame={frame} />
      </ThreeCanvas>
      <EditorialOverlay frame={frame} />
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
};

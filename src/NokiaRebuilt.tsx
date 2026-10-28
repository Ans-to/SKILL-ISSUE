import React, {useMemo} from 'react';
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
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  PerspectiveCamera,
  Quaternion,
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

const LandBulge: React.FC<{latitude: number; longitude: number; scale: [number, number, number]; color: string}> = ({latitude, longitude, scale, color}) => {
  const normal = useMemo(() => pointOnEarth(latitude, longitude, 1).normalize(), [latitude, longitude]);
  const orientation = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal),
    [normal],
  );
  const position = useMemo(() => normal.clone().multiplyScalar(EARTH_RADIUS + 0.035), [normal]);
  return (
    <mesh position={position} quaternion={orientation} scale={scale}>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial color={color} roughness={0.92} metalness={0.02} />
    </mesh>
  );
};

const Globe: React.FC<{frame: number}> = ({frame}) => {
  const grid = useMemo(makeGlobeGrid, []);
  const glow = 0.5 + 0.12 * Math.sin(frame / 9);
  const scale = frame < 150 ? 1 : frame < 180 ? 1 - progress(frame, 150, 180) : frame < 450 ? 0 : frame < 480 ? springIn(frame, FPS, 450) : frame < 690 ? 1 : frame < 720 ? 1 - progress(frame, 690, 720) : 0;
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
        <lineBasicMaterial color={COLORS.cyan} transparent opacity={0.32} />
      </lineSegments>
      <LandBulge latitude={52} longitude={15} scale={[1.45, 1.9, 0.08]} color="#547d72" />
      <LandBulge latitude={39} longitude={-101} scale={[1.65, 1.5, 0.08]} color="#476e6a" />
      <LandBulge latitude={-17} longitude={-61} scale={[0.95, 1.85, 0.08]} color="#547d72" />
      <LandBulge latitude={5} longitude={22} scale={[0.85, 1.65, 0.08]} color="#55786b" />
      <LandBulge latitude={44} longitude={92} scale={[1.8, 1.75, 0.08]} color="#547d72" />
      <LandBulge latitude={-25} longitude={134} scale={[1.05, 0.82, 0.08]} color="#66897c" />
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
  const enter = springIn(frame, fps, 138);
  const leave = progress(frame, 235, 265);
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

const IndustryStage: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const enter = springIn(frame, fps, 198);
  const leave = progress(frame, 450, 480);
  const scale = enter * (1 - leave);
  const cage = useMemo(makeCage, []);
  const bootIn = springIn(frame, fps, 240);
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
      <RoundedBox args={[9.2, 0.26, 4.8]} radius={0.08} smoothness={2} position={[0, -1.62, 0]}>
        <meshStandardMaterial color="#192a32" metalness={0.42} roughness={0.64} />
      </RoundedBox>
      <group position={[-2.35, -0.5, 0.62]} scale={bootIn} rotation={[0, -0.12, 0]}>
        <RoundedBox args={[0.48, 0.86, 0.44]} radius={0.12} smoothness={4} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#d69a42" roughness={0.62} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[0.92, 0.38, 0.52]} radius={0.12} smoothness={5} position={[0.2, -0.32, 0.16]} castShadow>
          <meshStandardMaterial color="#bd7d36" roughness={0.72} />
        </RoundedBox>
        <mesh position={[0.2, -0.51, 0.16]}>
          <boxGeometry args={[0.84, 0.05, 0.46]} />
          <meshStandardMaterial color="#302b26" roughness={0.92} />
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
  const appear = springIn(frame, fps, 690);
  const pulse = 0.35 + 0.12 * Math.sin(frame / 8);
  const sweep = ((frame - 690) * 5) % 360;
  const radarRay = useMemo(() => tube([
    new Vector3(0, 0, 0),
    new Vector3(0.3, 0.32, 0.02),
    new Vector3(0.1, 0.62, 0.03),
    new Vector3(-0.26, 0.82, 0.04),
  ], 0.014, 20), []);
  return (
    <group position={[0, -0.08, 0.15]} scale={appear} rotation={[0.015 * Math.sin(frame / 17), 0.09 * Math.sin(frame / 21), 0]}>
      <RoundedBox args={[2.75, 5.3, 0.38]} radius={0.28} smoothness={8} castShadow>
        <meshStandardMaterial color="#111a24" metalness={0.9} roughness={0.2} emissive="#163d49" emissiveIntensity={pulse} />
      </RoundedBox>
      <RoundedBox args={[2.48, 5.02, 0.13]} radius={0.22} smoothness={8} position={[0, 0, 0.22]}>
        <meshStandardMaterial color="#07141e" metalness={0.4} roughness={0.28} />
      </RoundedBox>
      <RoundedBox args={[2.24, 4.74, 0.06]} radius={0.17} smoothness={6} position={[0, 0, 0.32]}>
        <meshStandardMaterial color="#0e2631" metalness={0.22} roughness={0.38} emissive="#0d3d4b" emissiveIntensity={0.48} />
      </RoundedBox>
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
          <meshBasicMaterial color={index < Math.floor(((frame - 690) / 12) % 6) ? COLORS.amber : COLORS.cyan} />
        </mesh>
      ))}
      <pointLight position={[0, 0.1, 1.2]} color={COLORS.cyan} intensity={3.6 + pulse * 4} distance={5} />
    </group>
  );
};

const World: React.FC<{frame: number}> = ({frame}) => (
  <>
    <color attach="background" args={[COLORS.ink]} />
    <fog attach="fog" args={[COLORS.ink, 19, 42]} />
    <ambientLight intensity={0.48} />
    <directionalLight position={[-5, 8, 10]} intensity={2.1} color="#d3efeb" />
    <pointLight position={[0, 1, 8]} intensity={1.8} color="#23869a" distance={22} />
    <pointLight position={[-6, 1, 6]} intensity={1.25} color={COLORS.amber} distance={18} />
    <CameraSetup />
    <Globe frame={frame} />
    <MillDiorama frame={frame} />
    <IndustryStage frame={frame} />
    <PhoneStage frame={frame} />
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

/**
 * DOM-only editorial layer. It is a sibling above the WebGL canvas, not a 3D scene object.
 * The layer and its descendants use no perspective, rotate, or transform properties.
 */
const EditorialOverlay: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const caption = captions.find(({start, end}) => frame >= start && frame < end) ?? captions[captions.length - 1];
  const chapter = chapterAt(frame);
  const chapterStart = frame < 180 ? 0 : frame < 450 ? 180 : frame < 690 ? 450 : 690;
  const titleOpacity = frame < 126 ? springIn(frame, fps, 0) * (1 - progress(frame, 108, 126)) : 0;
  const captionOpacity = springIn(frame, fps, caption.start);
  const chapterOpacity = springIn(frame, fps, chapterStart);

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
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,10,17,.72), transparent 62%), linear-gradient(0deg, rgba(5,10,17,.8), transparent 43%)'}} />
      {titleOpacity > 0 && (
        <header style={{position: 'absolute', left: 120, top: 104, width: 690, opacity: titleOpacity, textShadow: '0 2px 24px rgba(0,0,0,.75)'}}>
          <div style={{color: COLORS.cyan, fontSize: 16, fontWeight: 700, letterSpacing: 5}}>A FINNISH STORY · 1865—TODAY</div>
          <div style={{marginTop: 18, font: '500 68px/1.04 Georgia, serif'}}>The Empire of<br /><span style={{color: COLORS.amber}}>Timber &amp; Tech</span></div>
          <div style={{marginTop: 18, color: '#b1c3c5', fontSize: 17, letterSpacing: 2}}>THE COMPANY THAT CONNECTED THE WORLD</div>
        </header>
      )}
      <section style={{position: 'absolute', top: 86, right: 110, width: 470, textAlign: 'right', opacity: chapterOpacity}}>
        <div style={{color: COLORS.cyan, fontSize: 14, fontWeight: 700, letterSpacing: 3.5}}>{chapter.eyebrow}</div>
        <div style={{marginTop: 12, font: '500 34px/1.12 Georgia, serif', textShadow: '0 2px 18px rgba(0,0,0,.8)'}}>{chapter.title}</div>
        <div style={{marginTop: 10, color: '#b5c5c6', fontSize: 16, letterSpacing: 0.5}}>{chapter.detail}</div>
      </section>
      <div style={{position: 'absolute', left: 120, right: 120, bottom: 96, minHeight: 116, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: captionOpacity}}>
        <div style={{maxWidth: 1260, padding: '22px 34px', border: '1px solid rgba(112,233,242,.38)', borderRadius: 16, background: 'rgba(7,15,25,.72)', boxShadow: '0 12px 42px rgba(0,0,0,.4), 0 0 24px rgba(44,174,193,.12)', backdropFilter: 'blur(12px)', textAlign: 'center', font: '500 29px/1.35 Georgia, serif', textShadow: '0 1px 12px rgba(0,0,0,.65)'}}>
          {caption.text}
        </div>
      </div>
      {frame >= 450 && frame < 690 && (
        <aside style={{position: 'absolute', left: 120, top: 300, width: 290, padding: '20px 24px', border: '1px solid rgba(112,233,242,.58)', borderRadius: 14, background: 'rgba(7,15,25,.76)', boxShadow: '0 0 30px rgba(73,201,219,.17)', backdropFilter: 'blur(12px)'}}>
          <div style={{color: COLORS.amber, fontSize: 12, fontWeight: 700, letterSpacing: 3}}>NETWORK ORIGIN</div>
          <div style={{marginTop: 10, font: '26px Georgia, serif'}}>Nokia, Finland</div>
          <div style={{marginTop: 10, color: '#a9bdc1', fontSize: 15, lineHeight: 1.6}}>Connecting London,<br />New York and Tokyo</div>
        </aside>
      )}
      <footer style={{position: 'absolute', left: 120, right: 120, top: 38, display: 'flex', justifyContent: 'space-between', color: 'rgba(211,232,231,.72)', fontSize: 12, fontWeight: 700, letterSpacing: 3}}>
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

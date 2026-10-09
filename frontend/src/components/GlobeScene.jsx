import { useRef, useMemo, Component } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- Coordinates on a radius R=2.4 sphere ---
// Stage 0: Client Stub (London / Local)
// Stage 1: Anycast Root (Frankfurt / Central Europe)
// Stage 2: TLD Registry (Verisign / Virginia, USA)
// Stage 3: Authoritative (Mountain View / West Coast)
const STAGES = [
  { id: "client", name: "Client Stub", label: "01 // Stub Resolver", pos: [0.3, 1.8, 1.5], color: "#00E5FF", pulseColor: "#FFFFFF" },
  { id: "root", name: "Root Zone", label: "02 // IANA Root Anycast", pos: [1.8, 1.2, 0.8], color: "#FF5722", pulseColor: "#FF7A00" },
  { id: "tld", name: "TLD Registry", label: "03 // .com Registry", pos: [-1.4, 0.5, 1.8], color: "#FF5722", pulseColor: "#FFA726" },
  { id: "auth", name: "Authoritative", label: "04 // Zone Authority", pos: [-1.9, -0.8, 1.2], color: "#10B981", pulseColor: "#FFFFFF" },
];

// Arcs connecting the 4 stages
const ARCS = [
  { start: STAGES[0].pos, end: STAGES[1].pos, color: "#FF5722", speed: 1.2 },
  { start: STAGES[1].pos, end: STAGES[2].pos, color: "#FF5722", speed: 1.0 },
  { start: STAGES[2].pos, end: STAGES[3].pos, color: "#10B981", speed: 1.3 },
  // Return path: Authoritative -> Client
  { start: STAGES[3].pos, end: STAGES[0].pos, color: "#00E5FF", speed: 1.5 },
];

// --- 3D Bezier Arc with Travelling Photon Pulse ---
function PhotonicArc({ start, end, color, speed = 1, isActive = true }) {
  const particleRef = useRef();

  const curve = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
    // Arc outwards from center
    const midLength = mid.length();
    if (midLength > 0.001) {
      mid.normalize().multiplyScalar(midLength * 1.35);
    }
    return new THREE.QuadraticBezierCurve3(vStart, mid, vEnd);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(40), [curve]);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame((state) => {
    if (particleRef.current) {
      const t = (state.clock.elapsedTime * speed * 0.4) % 1;
      const point = curve.getPoint(t);
      particleRef.current.position.copy(point);
    }
  });

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={isActive ? 0.35 : 0.12} />
      </line>

      {isActive && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      )}
    </group>
  );
}

// --- Orbital Node Beacon ---
function NodeBeacon({ pos, color, pulseColor, isFocused }) {
  const coreRef = useRef();
  const auraRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime * 2.2;
    const pulse = 1 + Math.sin(t) * 0.18;
    if (coreRef.current) coreRef.current.scale.setScalar(isFocused ? pulse * 1.3 : pulse);
    if (auraRef.current) {
      auraRef.current.scale.setScalar(pulse * 2.6);
      auraRef.current.material.opacity = isFocused ? 0.22 + Math.sin(t) * 0.08 : 0.1 + Math.sin(t) * 0.04;
    }
  });

  return (
    <group position={pos}>
      {/* Outer aura */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={pulseColor} transparent opacity={0.12} />
      </mesh>
      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// --- Point Cloud Earth Sphere ---
function PointCloudGlobe() {
  const pointsRef = useRef();

  const { positions, colors } = useMemo(() => {
    const count = 1400;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const radius = 2.4;
    const baseColor = new THREE.Color("#8A909E");
    const warmColor = new THREE.Color("#FF5722");

    // Fibonacci sphere distribution
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      pos[i * 3] = x * radius;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = z * radius;

      // Color variation: mostly subtle zinc, occasional amber dust
      const isWarm = (i % 23 === 0);
      const c = isWarm ? warmColor : baseColor;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.035;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.026}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// --- Delicate Equatorial & Meridian Hairline Rings ---
function GeodesicRings() {
  const ringRef1 = useRef();
  const ringRef2 = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef1.current) ringRef1.current.rotation.z = t * 0.02;
    if (ringRef2.current) ringRef2.current.rotation.y = -t * 0.015;
  });

  return (
    <group>
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.55, 0.005, 12, 80]} />
        <meshBasicMaterial color="#FF5722" transparent opacity={0.15} />
      </mesh>
      <mesh ref={ringRef2} rotation={[-Math.PI / 5, Math.PI / 6, 0]}>
        <torusGeometry args={[2.7, 0.004, 12, 80]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// --- Master Interactive World ---
function InteractiveDnsWorld({ activeStageIndex = 0 }) {
  const worldRef = useRef();

  useFrame((state) => {
    if (worldRef.current) {
      // Damped mouse parallax
      const targetRotY = state.pointer.x * 0.35 + (activeStageIndex * 0.4);
      const targetRotX = -state.pointer.y * 0.25;

      worldRef.current.rotation.y = THREE.MathUtils.lerp(
        worldRef.current.rotation.y,
        targetRotY,
        0.04
      );
      worldRef.current.rotation.x = THREE.MathUtils.lerp(
        worldRef.current.rotation.x,
        targetRotX,
        0.04
      );
    }
  });

  return (
    <group ref={worldRef}>
      <PointCloudGlobe />
      <GeodesicRings />

      {/* 4 Infrastructure Nodes */}
      {STAGES.map((st, idx) => (
        <NodeBeacon
          key={st.id}
          pos={st.pos}
          color={st.color}
          pulseColor={st.pulseColor}
          label={st.label}
          isFocused={activeStageIndex === idx}
        />
      ))}

      {/* Arcs with travelling photons */}
      {ARCS.map((arc, idx) => (
        <PhotonicArc
          key={idx}
          start={arc.start}
          end={arc.end}
          color={arc.color}
          speed={arc.speed}
          isActive={true}
        />
      ))}
    </group>
  );
}

// --- Fallback Error Boundary ---
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-xs p-6 text-center">
          WebGL hardware acceleration paused. Interactive diagram active below.
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Exported Component ---
export default function GlobeScene({ activeStageIndex = 0 }) {
  return (
    <div className="w-full h-full relative pointer-events-none select-none">
      <WebGLErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 42 }}
          dpr={[1, 2]} // Capped at 2 for silky 60fps performance
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <InteractiveDnsWorld activeStageIndex={activeStageIndex} />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

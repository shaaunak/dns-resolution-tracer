import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'
import * as THREE from 'three'

// === Animated DNS network node sphere ===
function DnsNode({ position, color, size = 0.12, pulseSpeed = 1.5 }) {
  const ref = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime * pulseSpeed
    const scale = 1 + Math.sin(t) * 0.15
    if (ref.current) ref.current.scale.setScalar(scale)
    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * 2.5)
      glowRef.current.material.opacity = 0.08 + Math.sin(t) * 0.04
    }
  })

  return (
    <group position={position}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      {/* Core node */}
      <mesh ref={ref}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
    </group>
  )
}

// === Animated beam connecting two nodes ===
function ConnectionBeam({ start, end, color, speed = 1 }) {
  const lineRef = useRef()
  const particleRef = useRef()

  const curve = useMemo(() => {
    const mid = new THREE.Vector3()
      .addVectors(
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
      )
      .multiplyScalar(0.5)
    // Add slight curve outward
    mid.x += (Math.sin(mid.y * 2) * 0.3)
    mid.z += 0.2
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      mid,
      new THREE.Vector3(...end)
    )
  }, [start, end])

  const points = useMemo(() => curve.getPoints(30), [curve])
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  useFrame((state) => {
    if (particleRef.current) {
      const t = (state.clock.elapsedTime * speed * 0.4) % 1
      const point = curve.getPoint(t)
      particleRef.current.position.copy(point)
    }
  })

  return (
    <group>
      {/* Hairline connecting rail */}
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.2} />
      </line>

      {/* Travelling data packet photon */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// Static deterministic particles
const PARTICLE_COUNT = 200
const PARTICLE_POSITIONS = new Float32Array(PARTICLE_COUNT * 3)
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const s1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  const s2 = Math.sin(i * 39.346 + 11.135) * 43758.5453
  const s3 = Math.sin(i * 73.156 + 54.512) * 43758.5453
  PARTICLE_POSITIONS[i * 3] = ((s1 - Math.floor(s1)) - 0.5) * 20
  PARTICLE_POSITIONS[i * 3 + 1] = ((s2 - Math.floor(s2)) - 0.5) * 12
  PARTICLE_POSITIONS[i * 3 + 2] = ((s3 - Math.floor(s3)) - 0.5) * 15
}

// === Floating particles background ===
function FloatingParticles() {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.05
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={PARTICLE_POSITIONS}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38bdf8"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

// === Rotating wireframe globe/radar ring in center ===
function WireframeGlobe() {
  const ref = useRef()
  const ringRef1 = useRef()
  const ringRef2 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.y = t * 0.05
      ref.current.rotation.x = t * 0.02
    }
    if (ringRef1.current) ringRef1.current.rotation.z = t * 0.08
    if (ringRef2.current) ringRef2.current.rotation.y = -t * 0.06
  })

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.6, 20, 20]} />
        <meshBasicMaterial
          color="#1e293b"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>
      {/* Outer orbital rings */}
      <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.01, 16, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ringRef2} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.5, 0.008, 16, 64]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

// === The full DNS network 3D scene ===
function DnsNetworkScene() {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04
    }
  })

  // DNS hierarchy nodes with pre-assigned speeds
  const nodes = [
    // Client (you)
    { pos: [0, 2.2, 0], color: '#22d3ee', size: 0.18, floatSpeed: 1.4, pulseSpeed: 1.2 },
    // Root servers
    { pos: [-1.8, 0.8, 0.5], color: '#a78bfa', size: 0.14, floatSpeed: 1.2, pulseSpeed: 1.3 },
    { pos: [1.6, 0.9, -0.8], color: '#a78bfa', size: 0.12, floatSpeed: 1.6, pulseSpeed: 1.1 },
    { pos: [0.2, 1.0, 1.5], color: '#a78bfa', size: 0.1, floatSpeed: 1.1, pulseSpeed: 1.4 },
    // TLD servers
    { pos: [-1.2, -0.4, -1.2], color: '#38bdf8', size: 0.13, floatSpeed: 1.5, pulseSpeed: 1.2 },
    { pos: [1.5, -0.3, 0.8], color: '#38bdf8', size: 0.11, floatSpeed: 1.3, pulseSpeed: 1.5 },
    { pos: [-0.3, -0.5, 1.8], color: '#38bdf8', size: 0.12, floatSpeed: 1.7, pulseSpeed: 1.1 },
    // Authoritative servers
    { pos: [-0.6, -1.8, 0.3], color: '#34d399', size: 0.14, floatSpeed: 1.2, pulseSpeed: 1.3 },
    { pos: [0.8, -1.6, -0.6], color: '#34d399', size: 0.12, floatSpeed: 1.4, pulseSpeed: 1.2 },
    // Final answer
    { pos: [0, -2.5, 0], color: '#fbbf24', size: 0.16, floatSpeed: 1.3, pulseSpeed: 1.4 },
  ]

  // Connections showing DNS resolution path
  const connections = [
    // Client -> Root
    { start: nodes[0].pos, end: nodes[1].pos, color: '#a78bfa', speed: 1.2 },
    { start: nodes[0].pos, end: nodes[2].pos, color: '#a78bfa', speed: 0.9 },
    { start: nodes[0].pos, end: nodes[3].pos, color: '#a78bfa', speed: 1.5 },
    // Root -> TLD
    { start: nodes[1].pos, end: nodes[4].pos, color: '#38bdf8', speed: 1.1 },
    { start: nodes[2].pos, end: nodes[5].pos, color: '#38bdf8', speed: 1.3 },
    { start: nodes[3].pos, end: nodes[6].pos, color: '#38bdf8', speed: 0.8 },
    // TLD -> Auth
    { start: nodes[4].pos, end: nodes[7].pos, color: '#34d399', speed: 1.4 },
    { start: nodes[5].pos, end: nodes[8].pos, color: '#34d399', speed: 1.0 },
    // Auth -> Answer
    { start: nodes[7].pos, end: nodes[9].pos, color: '#fbbf24', speed: 1.6 },
    { start: nodes[8].pos, end: nodes[9].pos, color: '#fbbf24', speed: 1.2 },
    // Cross connections for depth
    { start: nodes[1].pos, end: nodes[5].pos, color: '#38bdf8', speed: 0.7 },
    { start: nodes[6].pos, end: nodes[8].pos, color: '#34d399', speed: 1.1 },
  ]

  return (
    <group ref={groupRef}>
      <WireframeGlobe />

      {nodes.map((node, i) => (
        <Float key={i} speed={node.floatSpeed} floatIntensity={0.3} rotationIntensity={0}>
          <DnsNode
            position={node.pos}
            color={node.color}
            size={node.size}
            pulseSpeed={node.pulseSpeed}
          />
        </Float>
      ))}

      {connections.map((conn, i) => (
        <ConnectionBeam
          key={i}
          start={conn.start}
          end={conn.end}
          color={conn.color}
          speed={conn.speed}
        />
      ))}
    </group>
  )
}

// === Main exported component ===
export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 45 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[-5, -5, -5]} intensity={0.8} color="#a78bfa" />
      <directionalLight position={[0, 4, 3]} intensity={0.8} />

      <Stars radius={40} depth={40} count={1200} factor={3} saturation={0.5} fade speed={0.8} />
      <FloatingParticles />
      <DnsNetworkScene />
    </Canvas>
  )
}

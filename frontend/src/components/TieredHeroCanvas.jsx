import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 13 IANA Root Nameservers
const ROOT_SERVERS = [
  { id: "a-root", label: "a.root-servers.net", ip: "198.41.0.4" },
  { id: "b-root", label: "b.root-servers.net", ip: "170.247.170.2" },
  { id: "c-root", label: "c.root-servers.net", ip: "192.33.4.12" },
  { id: "d-root", label: "d.root-servers.net", ip: "199.7.91.13" },
  { id: "e-root", label: "e.root-servers.net", ip: "192.203.230.10" },
  { id: "f-root", label: "f.root-servers.net", ip: "192.5.5.241" },
  { id: "g-root", label: "g.root-servers.net", ip: "192.112.36.4" },
  { id: "h-root", label: "h.root-servers.net", ip: "198.97.190.53" },
  { id: "i-root", label: "i.root-servers.net", ip: "192.36.148.17" },
  { id: "j-root", label: "j.root-servers.net", ip: "192.58.128.30" },
  { id: "k-root", label: "k.root-servers.net", ip: "193.0.14.129" },
  { id: "l-root", label: "l.root-servers.net", ip: "199.7.83.42" },
  { id: "m-root", label: "m.root-servers.net", ip: "202.12.27.33" },
];

// 13 .com TLD Nameservers
const TLD_SERVERS = Array.from({ length: 13 }, (_, i) => {
  const letter = String.fromCharCode(97 + i);
  return {
    id: `${letter}-tld`,
    label: `${letter}.gtld-servers.net`,
    ip: `192.${letter.charCodeAt(0) % 50}.6.30`,
  };
});

// 4 Authoritative Nameservers (Default / Google or domain)
const AUTH_SERVERS = [
  { id: "ns1", label: "ns1.google.com", ip: "216.239.32.10" },
  { id: "ns2", label: "ns2.google.com", ip: "216.239.34.10" },
  { id: "ns3", label: "ns3.google.com", ip: "216.239.36.10" },
  { id: "ns4", label: "ns4.google.com", ip: "216.239.38.10" },
];

function SceneContent({ activeTrace, onHoverNode }) {
  const groupRef = useRef();
  const packetRef = useRef();

  // Find actual hit servers from activeTrace if available
  const hitServers = useMemo(() => {
    if (!activeTrace || !activeTrace.steps) {
      return {
        root: "e.root-servers.net",
        tld: "a.gtld-servers.net",
        auth: "ns2.google.com",
      };
    }
    const rootStep = activeTrace.steps.find((s) => s.server_type === "ROOT");
    const tldStep = activeTrace.steps.find((s) => s.server_type === "TLD");
    const authStep = activeTrace.steps.find((s) => s.server_type === "AUTHORITATIVE");
    return {
      root: rootStep?.server_name || rootStep?.server || "e.root-servers.net",
      tld: tldStep?.server_name || tldStep?.server || "a.gtld-servers.net",
      auth: authStep?.server_name || authStep?.server || "ns2.google.com",
    };
  }, [activeTrace]);

  // Compute 3D node positions
  // Tier 1 (Root, y = 1.9): cluster in a soft curved arc
  const rootNodes = useMemo(() => {
    return ROOT_SERVERS.map((server, i) => {
      const angle = (i / (ROOT_SERVERS.length - 1) - 0.5) * Math.PI * 0.7;
      const x = Math.sin(angle) * 3.4;
      const z = (Math.cos(angle) - 1) * 1.0;
      const isHit =
        server.label.toLowerCase() === hitServers.root.toLowerCase() ||
        server.ip === hitServers.root;
      return { ...server, position: [x, 1.9, z], tier: "ROOT", isHit };
    });
  }, [hitServers.root]);

  // Tier 2 (TLD, y = 0.0): ring of 13 nodes
  const tldNodes = useMemo(() => {
    return TLD_SERVERS.map((server, i) => {
      const angle = (i / TLD_SERVERS.length) * Math.PI * 2;
      const radiusX = 2.8;
      const radiusZ = 1.4;
      const x = Math.cos(angle) * radiusX;
      const z = Math.sin(angle) * radiusZ;
      const isHit =
        server.label.toLowerCase() === hitServers.tld.toLowerCase() ||
        server.ip === hitServers.tld;
      return { ...server, position: [x, 0.0, z], tier: "TLD", isHit };
    });
  }, [hitServers.tld]);

  // Tier 3 (Authoritative, y = -1.9): 4 nodes
  const authNodes = useMemo(() => {
    return AUTH_SERVERS.map((server, i) => {
      const x = (i - 1.5) * 1.5;
      const z = (Math.abs(i - 1.5) - 0.75) * 0.5;
      const isHit =
        server.label.toLowerCase() === hitServers.auth.toLowerCase() ||
        server.ip === hitServers.auth;
      return { ...server, position: [x, -1.9, z], tier: "AUTH", isHit };
    });
  }, [hitServers.auth]);

  // Find the exact positions of the 3 active hops to construct the trajectory
  const activePathPoints = useMemo(() => {
    const rNode = rootNodes.find((n) => n.isHit) || rootNodes[4]; // e-root
    const tNode = tldNodes.find((n) => n.isHit) || tldNodes[0];  // a-tld
    const aNode = authNodes.find((n) => n.isHit) || authNodes[1]; // ns2

    const p0 = new THREE.Vector3(...rNode.position);
    const p1 = new THREE.Vector3(
      (rNode.position[0] + tNode.position[0]) * 0.5 + 0.3,
      1.0,
      (rNode.position[2] + tNode.position[2]) * 0.5 + 0.4
    );
    const p2 = new THREE.Vector3(...tNode.position);
    const p3 = new THREE.Vector3(
      (tNode.position[0] + aNode.position[0]) * 0.5 - 0.2,
      -1.0,
      (tNode.position[2] + aNode.position[2]) * 0.5 + 0.3
    );
    const p4 = new THREE.Vector3(...aNode.position);

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
    return {
      curve,
      points: curve.getPoints(50),
    };
  }, [rootNodes, tldNodes, authNodes]);

  // Packet animation loop
  useFrame((state) => {
    const t = (state.clock.getElapsedTime() * 0.35) % 1;
    if (packetRef.current && activePathPoints.curve) {
      const pos = activePathPoints.curve.getPointAt(t);
      packetRef.current.position.copy(pos);
    }
  });

  // Palette colors
  const maroon = useMemo(() => new THREE.Color("#5b0015"), []);
  const periwinkle = useMemo(() => new THREE.Color("#80aee8"), []);
  const ivoryBase = useMemo(() => new THREE.Color("#ede8d6"), []);
  const hairline = useMemo(() => new THREE.Color("#d4ccb6"), []);

  return (
    <group ref={groupRef}>
      {/* Ambient and directional studio lights */}
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, -4, -3]} intensity={0.5} />

      {/* Trajectory Tube */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                activePathPoints.points.flatMap((p) => [p.x, p.y, p.z])
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={periwinkle} linewidth={2} transparent opacity={0.85} />
      </line>

      {/* Travelling Packet */}
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={maroon}
          emissive={maroon}
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Tier 1: Root Nodes */}
      {rootNodes.map((node) => (
        <group
          key={node.id}
          position={node.position}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverNode(node);
          }}
          onPointerOut={() => onHoverNode(null)}
        >
          <mesh>
            <sphereGeometry args={[node.isHit ? 0.14 : 0.09, 16, 16]} />
            <meshStandardMaterial
              color={node.isHit ? maroon : ivoryBase}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
          {node.isHit && (
            <mesh>
              <ringGeometry args={[0.18, 0.22, 24]} />
              <meshBasicMaterial color={periwinkle} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      {/* Tier 2: TLD Nodes */}
      {tldNodes.map((node) => (
        <group
          key={node.id}
          position={node.position}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverNode(node);
          }}
          onPointerOut={() => onHoverNode(null)}
        >
          <mesh>
            <sphereGeometry args={[node.isHit ? 0.14 : 0.08, 16, 16]} />
            <meshStandardMaterial
              color={node.isHit ? maroon : ivoryBase}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
          {node.isHit && (
            <mesh>
              <ringGeometry args={[0.18, 0.22, 24]} />
              <meshBasicMaterial color={periwinkle} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      {/* Tier 3: Authoritative Nodes */}
      {authNodes.map((node) => (
        <group
          key={node.id}
          position={node.position}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverNode(node);
          }}
          onPointerOut={() => onHoverNode(null)}
        >
          <mesh>
            <sphereGeometry args={[node.isHit ? 0.15 : 0.1, 16, 16]} />
            <meshStandardMaterial
              color={node.isHit ? maroon : ivoryBase}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
          {node.isHit && (
            <mesh>
              <ringGeometry args={[0.2, 0.24, 24]} />
              <meshBasicMaterial color={periwinkle} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

import BlueprintPoster from "./BlueprintPoster";

export default function TieredHeroCanvas({ activeTrace }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);

    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!hasWebGL || prefersReducedMotion) {
    return <BlueprintPoster activeTrace={activeTrace} />;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "320px" }}>
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 46 }}
        dpr={Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)}
        gl={{ alpha: true, antialias: true }}
      >
        <SceneContent activeTrace={activeTrace} onHoverNode={setHoveredNode} />
      </Canvas>

      {/* Floating Node Hover Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#ffffff",
            border: "1px solid #e3dcc6",
            borderRadius: "4px",
            padding: "4px 10px",
            boxShadow: "0 2px 8px rgba(91, 0, 21, 0.08)",
            pointerEvents: "none",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "#7b6267", fontWeight: 600 }}>{hoveredNode.tier}:</span>
          <span style={{ color: "#5b0015", fontWeight: 700 }}>{hoveredNode.label}</span>
          <span style={{ color: "#381018" }}>[{hoveredNode.ip}]</span>
        </div>
      )}
    </div>
  );
}


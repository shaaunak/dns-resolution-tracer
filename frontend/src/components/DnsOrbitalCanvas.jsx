import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ROOT_SERVERS } from "../constants/rootServers";

export default function DnsOrbitalCanvas({ onSelectRoot }) {
  const containerRef = useRef(null);
  const [hoveredServer, setHoveredServer] = useState(null);
  const [viewAngle, setViewAngle] = useState({ rotX: 18, rotY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup: Bone Canvas Warm Off-White (#fcfbf8) ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4.2, 13.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xfcfbf8, 1);
    container.appendChild(renderer.domElement);

    // --- Studio Architectural Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 12, 8);
    scene.add(keyLight);

    const emberPoint = new THREE.PointLight(0xfd5321, 3.5, 25);
    emberPoint.position.set(0, 0, 0);
    scene.add(emberPoint);

    const fillLight = new THREE.DirectionalLight(0xededea, 0.8);
    fillLight.position.set(-6, -4, -6);
    scene.add(fillLight);

    // Master Rotation Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);
    masterGroup.rotation.x = THREE.MathUtils.degToRad(18);

    // --- Hairline Geometric Blueprint Rings (#c1c4c2) ---
    const ringsGroup = new THREE.Group();
    masterGroup.add(ringsGroup);

    [2.2, 3.8, 5.2, 6.4, 7.8].forEach((radius, idx) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.018, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 3 ? 0xfd5321 : 0xc1c4c2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: idx === 3 ? 0.65 : 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ringsGroup.add(ring);
    });

    // Crosshair axis lines
    const crosshairGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0),
      new THREE.Vector3(0, 0, -8), new THREE.Vector3(0, 0, 8),
    ]);
    const crosshairMat = new THREE.LineBasicMaterial({
      color: 0xc1c4c2,
      transparent: true,
      opacity: 0.5,
    });
    const crosshair = new THREE.LineSegments(crosshairGeo, crosshairMat);
    ringsGroup.add(crosshair);

    // --- Central Resolver Core (Chrome Sculpture with Ember Accent) ---
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    // Sculptural metallic Charcoal core
    const innerGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x001011,
      roughness: 0.15,
      metalness: 0.9,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerCore);

    // Ember Equatorial Ring
    const haloGeo = new THREE.RingGeometry(1.05, 1.15, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfd5321,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    coreGroup.add(haloMesh);

    // Delicate wireframe dodecahedron envelope
    const shellGeo = new THREE.DodecahedronGeometry(1.25);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x001011,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    coreGroup.add(shellMesh);

    // --- 13 Root Server Clusters on Radius 6.4 ---
    const rootRadius = 6.4;
    const nodeGroup = new THREE.Group();
    masterGroup.add(nodeGroup);

    const nodeMeshes = [];
    const bezierCurves = [];

    ROOT_SERVERS.forEach((srv, i) => {
      const angle = (i / ROOT_SERVERS.length) * Math.PI * 2;
      const x = Math.cos(angle) * rootRadius;
      const z = Math.sin(angle) * rootRadius;
      const y = Math.sin(angle * 3) * 0.35;

      const pos = new THREE.Vector3(x, y, z);

      // Node Group
      const singleNode = new THREE.Group();
      singleNode.position.copy(pos);
      singleNode.userData = { server: srv, index: i, angle };

      // Node Body: Polished metallic chrome bead
      const sphereGeo = new THREE.SphereGeometry(0.32, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x001011,
        roughness: 0.2,
        metalness: 0.85,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      singleNode.add(sphere);

      // Outer Ember accent ring
      const markerGeo = new THREE.RingGeometry(0.42, 0.48, 32);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0xfd5321,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.rotation.x = Math.PI / 2;
      singleNode.add(marker);

      // Vertical Stanchion Line to Radar Floor
      const dropLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -y, 0),
      ]);
      const dropLineMat = new THREE.LineBasicMaterial({
        color: 0xc1c4c2,
        transparent: true,
        opacity: 0.6,
      });
      const dropLine = new THREE.Line(dropLineGeo, dropLineMat);
      singleNode.add(dropLine);

      nodeGroup.add(singleNode);
      nodeMeshes.push(singleNode);

      // Bezier curve from Resolver Center (0,0,0) to Root Node
      const midPoint = new THREE.Vector3()
        .addVectors(new THREE.Vector3(0, 0, 0), pos)
        .multiplyScalar(0.5);
      midPoint.y += 1.5;
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), midPoint, pos);
      bezierCurves.push(curve);

      // Visible hairline spline in Mist Border (#c1c4c2)
      const pts = curve.getPoints(36);
      const splineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const splineMat = new THREE.LineBasicMaterial({
        color: 0xc1c4c2,
        transparent: true,
        opacity: 0.45,
      });
      const spline = new THREE.Line(splineGeo, splineMat);
      masterGroup.add(spline);
    });

    // --- Emitted Photonic Data Sparks (Travelling along curves in Ember #fd5321) ---
    const packetCount = 26;
    const packetGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xfd5321 });
    const packets = [];

    for (let p = 0; p < packetCount; p++) {
      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      pMesh.userData = {
        targetIdx: p % 13,
        progress: (p / packetCount),
        speed: 0.0035 + (p % 3) * 0.001,
      };
      masterGroup.add(pMesh);
      packets.push(pMesh);
    }

    // --- Mouse Drag Orbit Controls ---
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let targetRotation = { x: 0.32, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Drag to rotate
      if (isDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        prevMouse = { x: e.clientX, y: e.clientY };

        targetRotation.y += deltaX * 0.008;
        targetRotation.x = Math.max(-0.2, Math.min(1.2, targetRotation.x + deltaY * 0.008));
      }

      // Raycaster for hover
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.server) hit = hit.parent;
        if (hit?.userData?.server) {
          setHoveredServer(hit.userData.server);
          container.style.cursor = "pointer";
          hit.scale.setScalar(1.5);
        }
      } else {
        setHoveredServer(null);
        nodeMeshes.forEach((nm) => nm.scale.setScalar(1.0));
        container.style.cursor = isDragging ? "grabbing" : "grab";
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = "grab";
    };

    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.server) hit = hit.parent;
        if (hit?.userData?.server && onSelectRoot) {
          onSelectRoot(hit.userData.server);
        }
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("click", onClick);

    // Zoom on wheel
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(7, Math.min(20, camera.position.z + e.deltaY * 0.01));
    };
    container.addEventListener("wheel", onWheel, { passive: false });

    // Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // --- Render Loop (60 FPS) ---
    let frameId;
    const startTime = performance.now();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Inertial damping for rotation
      masterGroup.rotation.y += (targetRotation.y - masterGroup.rotation.y) * 0.08;
      masterGroup.rotation.x += (targetRotation.x - masterGroup.rotation.x) * 0.08;

      // Subtle passive drift
      if (!isDragging) {
        targetRotation.y += 0.0012;
      }

      setViewAngle({
        rotX: Math.round(THREE.MathUtils.radToDeg(masterGroup.rotation.x)),
        rotY: Math.round(THREE.MathUtils.radToDeg(masterGroup.rotation.y) % 360),
      });

      // Core rotation
      coreGroup.rotation.y = elapsed * 0.35;
      shellMesh.rotation.x = elapsed * 0.2;
      haloMesh.rotation.z = elapsed * 0.3;

      // Photons travelling along splines
      packets.forEach((p) => {
        p.userData.progress += p.userData.speed;
        if (p.userData.progress >= 1.0) {
          p.userData.progress = 0;
          p.userData.targetIdx = (p.userData.targetIdx + 1) % 13;
        }
        const curve = bezierCurves[p.userData.targetIdx];
        if (curve) {
          const pt = curve.getPoint(p.userData.progress);
          p.position.copy(pt);
          const s = Math.sin(p.userData.progress * Math.PI) * 1.3;
          p.scale.setScalar(Math.max(0.3, s));
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("click", onClick);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectRoot]);

  return (
    <div className="relative w-full h-[480px] bg-[#fcfbf8] border-b border-[#c1c4c2] select-none overflow-hidden cursor-grab active:cursor-grabbing" ref={containerRef}>
      {/* Swiss Monospace Architectural HUD Overlays */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none flex items-center gap-2.5 font-mono text-[11px] text-[#001011]">
        <span className="w-2 h-2 rounded-full bg-[#fd5321]" />
        <span className="font-semibold uppercase tracking-wider">ROOT NAMESERVER ORBITAL MESH</span>
        <span className="text-[#717674]">// RFC 1034 ANYCAST</span>
      </div>

      <div className="absolute top-4 right-5 z-10 pointer-events-none font-mono text-[11px] text-[#717674] flex items-center gap-3">
        <span>ORBIT: <strong className="text-[#001011] tabular-nums font-medium">{viewAngle.rotY}°</strong></span>
        <span>ELEVATION: <strong className="text-[#001011] tabular-nums font-medium">{viewAngle.rotX}°</strong></span>
        <span className="text-[#fd5321] font-medium">[ DRAG TO ORBIT ]</span>
      </div>

      {/* Hover Inspection HUD Card */}
      {hoveredServer && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-150">
          <div className="bg-[#fcfbf8]/95 backdrop-blur-md border border-[#001011] rounded-[14px] px-5 py-3 text-center text-xs font-mono shadow-[0_8px_30px_rgba(0,16,17,0.12)]">
            <div className="flex items-center justify-center gap-2 text-[#fd5321] font-semibold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fd5321] inline-block" />
              ROOT CLUSTER [{hoveredServer.id.toUpperCase()}]
            </div>
            <div className="text-[#001011] font-semibold text-sm mt-0.5">{hoveredServer.name}</div>
            <div className="text-[#717674] text-[11px] mt-0.5">
              IPv4: <span className="text-[#001011] font-medium">{hoveredServer.ip}</span> · {hoveredServer.operator}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Legend */}
      <div className="absolute bottom-4 left-5 right-5 z-10 pointer-events-none flex items-center justify-between text-[11px] font-mono text-[#717674]">
        <div className="flex items-center gap-3">
          <span>RESOLVER CORE: <strong className="text-[#fd5321] font-medium">127.0.0.1:53</strong></span>
          <span className="text-[#c1c4c2]">/</span>
          <span>PERIPHERY: <strong className="text-[#001011] font-medium">13 IANA ANYCAST CLUSTERS</strong></span>
        </div>
        <div className="hidden sm:block text-[#717674]">
          SCROLL TO ZOOM · CLICK NODE TO PIN
        </div>
      </div>
    </div>
  );
}

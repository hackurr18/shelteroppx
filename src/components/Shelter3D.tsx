import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, EyeOff, RotateCcw, Compass } from 'lucide-react';
import { ShelterConfig } from '../state/shelterConfig';

interface Shelter3DProps {
  config: ShelterConfig;
  compact?: boolean;
}

const MATERIAL_COLORS: Record<string, number> = {
  Adobe: 0xb87d56,
  Brick: 0xb84a39,
  Concrete: 0x7c8796,
  Stone: 0x64748b,
  Insulation: 0xf59e0b,
  'Aerogel Blanket': 0x06b6d4,
  Wood: 0x9c6b43,
  Glass: 0x38bdf8
};

export const Shelter3D: React.FC<Shelter3DProps> = ({ config, compact = false }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cutawayMode, setCutawayMode] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<boolean>(false);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    shelterGroup: THREE.Group;
    solarArrow: THREE.ArrowHelper;
  } | null>(null);

  const totalWallThickness = Math.max(
    0.08,
    config.walls.layers.reduce((acc, l) => acc + l.thickness, 0)
  );

  const primaryWindow = config.windows[0] || {
    id: 'win-1',
    area: 2.4,
    orientationAzimuth: 180,
    type: 'double_glazed',
    louver: { enabled: false, angle: 30, depth: 0.2, spacing: 0.2 }
  };

  // Initialize Three.js Scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x090d16, 1);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090d16, 0.025);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(11.0, 8.5, 12.0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 4;
    controls.maxDistance = 35;
    controls.target.set(0, 1.5, 0);

    // Three-point studio & solar lighting
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    sunLight.position.set(10, 16, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    rimLight.position.set(-12, 8, -10);
    scene.add(rimLight);

    // Ground Grid & Base Pad
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1320,
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(28, 28, 0x1e293b, 0x151e2e);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Compass Ring (+Z = South 180°, -Z = North 0°, +X = East 90°, -X = West 270°)
    const ringGeo = new THREE.RingGeometry(6.4, 6.55, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.01;
    scene.add(ringMesh);

    // Solar Direction Vector Arrow
    const arrowDir = new THREE.Vector3(0, -0.45, -0.89).normalize();
    const solarArrow = new THREE.ArrowHelper(
      arrowDir,
      new THREE.Vector3(0, 5.5, 7.5),
      2.6,
      0xfbbf24,
      0.45,
      0.28
    );
    scene.add(solarArrow);

    const shelterGroup = new THREE.Group();
    scene.add(shelterGroup);

    sceneRef.current = { scene, camera, renderer, controls, shelterGroup, solarArrow };

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D Shelter Mesh whenever configuration or cutaway mode changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const { shelterGroup, solarArrow } = ctx;

    while (shelterGroup.children.length > 0) {
      const child = shelterGroup.children[0];
      shelterGroup.remove(child);
    }

    const L = config.geometry.length;
    const W = config.geometry.width;
    const H = config.geometry.height;
    const shape = config.geometry.shape || 'rectangular';
    const wallT = totalWallThickness;

    const outerMatName = config.walls.layers[0]?.material || 'Adobe';
    const outerColor = MATERIAL_COLORS[outerMatName] || 0xb87d56;
    const roofColor = MATERIAL_COLORS[config.roof.material] || 0x9a6b43;
    const floorColor = MATERIAL_COLORS[config.floor.material] || 0x64748b;

    // Azimuth Rotation for entire shelter orientation
    const azimuthDeg = config.geometry.orientationAzimuth ?? 180;
    // Azimuth 180 = South (no rotation offset). Azimuth in radians:
    const azimuthRad = ((azimuthDeg - 180) * Math.PI) / 180;
    shelterGroup.rotation.y = azimuthRad;

    // Update solar arrow vector direction
    solarArrow.position.set(0, 5.5, 7.5);

    // 1. Floor Slab
    const floorT = Math.max(0.1, config.floor.thickness);
    if (shape === 'cylindrical' || shape === 'dome') {
      const r = Math.sqrt((L * W) / Math.PI);
      const floorGeo = new THREE.CylinderGeometry(r + wallT, r + wallT, floorT, 40);
      const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.85 });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = floorT / 2;
      floorMesh.receiveShadow = true;
      shelterGroup.add(floorMesh);
    } else {
      const floorGeo = new THREE.BoxGeometry(L + wallT * 2, floorT, W + wallT * 2);
      const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.85 });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = floorT / 2;
      floorMesh.receiveShadow = true;
      shelterGroup.add(floorMesh);
    }

    // 2. Walls & Multi-Layer Composite Representation
    if (shape === 'cylindrical') {
      const r = Math.sqrt((L * W) / Math.PI);
      let cumulativeR = r;
      const layersReversed = [...config.walls.layers].reverse();
      layersReversed.forEach((layer) => {
        const outerR = cumulativeR + layer.thickness;
        const thetaLength = cutawayMode ? Math.PI * 1.45 : Math.PI * 2;
        const cylGeo = new THREE.CylinderGeometry(outerR, outerR, H, 36, 1, false, 0, thetaLength);
        const matColor = MATERIAL_COLORS[layer.material] || outerColor;
        const cylMat = new THREE.MeshStandardMaterial({
          color: matColor,
          roughness: 0.75,
          side: THREE.DoubleSide
        });
        const cylMesh = new THREE.Mesh(cylGeo, cylMat);
        cylMesh.position.y = floorT + H / 2;
        cylMesh.castShadow = true;
        shelterGroup.add(cylMesh);
        cumulativeR = outerR;
      });
    } else if (shape === 'dome') {
      const r = Math.sqrt((L * W) / Math.PI) + wallT;
      const phiLength = cutawayMode ? Math.PI * 1.45 : Math.PI * 2;
      const domeGeo = new THREE.SphereGeometry(r, 36, 24, 0, phiLength, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: outerColor,
        roughness: 0.75,
        side: THREE.DoubleSide
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.scale.set(1, H / r, 1);
      domeMesh.position.y = floorT;
      domeMesh.castShadow = true;
      shelterGroup.add(domeMesh);
    } else {
      // Rectangular or A-Frame multi-layered composite walls
      let currentHalfL = L / 2;
      let currentHalfW = W / 2;
      const layersInsideToOut = [...config.walls.layers].reverse();

      layersInsideToOut.forEach((layer, idx) => {
        const t = Math.max(0.02, layer.thickness);
        const layerColor = MATERIAL_COLORS[layer.material] || outerColor;
        const mat = new THREE.MeshStandardMaterial({
          color: layerColor,
          roughness: 0.78,
          metalness: 0.06
        });

        const layerHeight = cutawayMode ? H - idx * 0.08 : H;
        const centerY = floorT + layerHeight / 2;
        const spanL = (currentHalfL + t) * 2;
        const spanW = currentHalfW * 2;

        // North Wall (-Z)
        const northWall = new THREE.Mesh(new THREE.BoxGeometry(spanL, layerHeight, t), mat);
        northWall.position.set(0, centerY, -(currentHalfW + t / 2));
        northWall.castShadow = true;
        shelterGroup.add(northWall);

        // South Wall (+Z)
        const southWall = new THREE.Mesh(new THREE.BoxGeometry(spanL, layerHeight, t), mat);
        southWall.position.set(0, centerY, currentHalfW + t / 2);
        southWall.castShadow = true;
        shelterGroup.add(southWall);

        // West Wall (-X)
        const westWall = new THREE.Mesh(new THREE.BoxGeometry(t, layerHeight, spanW), mat);
        westWall.position.set(-(currentHalfL + t / 2), centerY, 0);
        westWall.castShadow = true;
        shelterGroup.add(westWall);

        // East Wall (+X)
        const eastHeight = cutawayMode ? layerHeight * 0.42 : layerHeight;
        const eastWall = new THREE.Mesh(new THREE.BoxGeometry(t, eastHeight, spanW), mat);
        eastWall.position.set(currentHalfL + t / 2, floorT + eastHeight / 2, 0);
        eastWall.castShadow = true;
        shelterGroup.add(eastWall);

        currentHalfL += t;
        currentHalfW += t;
      });
    }

    // 3. Roof Assembly
    if (!cutawayMode && shape !== 'dome') {
      const roofT = Math.max(0.1, config.roof.thickness);
      const roofMat = new THREE.MeshStandardMaterial({
        color: roofColor,
        roughness: 0.8
      });

      if (shape === 'cylindrical') {
        const r = Math.sqrt((L * W) / Math.PI) + wallT + 0.15;
        const roofGeo = new THREE.CylinderGeometry(r, r, roofT, 40);
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.y = floorT + H + roofT / 2;
        roofMesh.castShadow = true;
        shelterGroup.add(roofMesh);
      } else if (shape === 'a_frame') {
        const coneGeo = new THREE.ConeGeometry(Math.max(L, W) * 0.75, H * 0.65, 4);
        const roofMesh = new THREE.Mesh(coneGeo, roofMat);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = floorT + H + (H * 0.65) / 2;
        shelterGroup.add(roofMesh);
      } else {
        const roofGeo = new THREE.BoxGeometry(L + wallT * 2 + 0.3, roofT, W + wallT * 2 + 0.3);
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.y = floorT + H + roofT / 2;
        roofMesh.castShadow = true;
        shelterGroup.add(roofMesh);
      }
    }

    // 4. Glazed Window & Adjustable Louver Blades
    const winArea = Math.max(0.4, primaryWindow.area);
    const winAspect = 1.45;
    const winWidth = Math.min(L * 0.75, Math.sqrt(winArea * winAspect));
    const winHeight = Math.min(H * 0.7, winArea / Math.max(winWidth, 0.5));

    const windowGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.15,
      metalness: 0.1
    });

    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.14, winHeight + 0.14, 0.08), frameMat);
    const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(winWidth, winHeight, 0.1), glassMat);
    windowGroup.add(frameMesh);
    windowGroup.add(glassMesh);

    // Louver Blades if enabled
    if (primaryWindow.louver?.enabled) {
      const bladeDepth = Math.max(0.08, primaryWindow.louver.depth);
      const bladeSpacing = Math.max(0.08, primaryWindow.louver.spacing);
      const bladeAngleRad = ((primaryWindow.louver.angle || 30) * Math.PI) / 180;
      const numBlades = Math.min(18, Math.max(2, Math.floor(winHeight / bladeSpacing)));
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.4,
        metalness: 0.3
      });

      for (let i = 0; i < numBlades; i++) {
        const yOffset = winHeight / 2 - (i + 0.5) * (winHeight / numBlades);
        const bladeGeo = new THREE.BoxGeometry(winWidth + 0.1, 0.025, bladeDepth);
        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
        bladeMesh.position.set(0, yOffset, bladeDepth / 2 + 0.04);
        bladeMesh.rotation.x = bladeAngleRad;
        windowGroup.add(bladeMesh);
      }
    }

    const outerHalfL = L / 2 + wallT;
    const outerHalfW = W / 2 + wallT;
    const winCenterY = floorT + H * 0.55;

    // Window mounted on South (+Z face of shelter)
    windowGroup.position.set(0, winCenterY, outerHalfW + 0.02);
    shelterGroup.add(windowGroup);

    // 5. Airlock Door (West wall)
    const doorArea = Math.max(1.2, config.door.area);
    const doorHeight = Math.min(H * 0.78, 2.05);
    const doorWidth = Math.min(W * 0.5, doorArea / doorHeight);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x784b2a, roughness: 0.75 });
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, doorHeight, doorWidth), doorMat);
    doorMesh.position.set(-(outerHalfL + 0.02), floorT + doorHeight / 2, 0);
    shelterGroup.add(doorMesh);

    // 6. Interior PCM Thermal Pods
    if (config.thermalStorage.pcmEnabled && config.thermalStorage.mass > 0) {
      const pcmMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.25,
        roughness: 0.3,
        metalness: 0.2
      });
      const podCount = Math.min(6, Math.max(2, Math.ceil(config.thermalStorage.mass / 100)));
      for (let i = 0; i < podCount; i++) {
        const pod = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.22), pcmMat);
        const xPos = -L * 0.3 + (i * (L * 0.6)) / Math.max(1, podCount - 1);
        pod.position.set(xPos, floorT + 0.45, -W / 2 + 0.25);
        shelterGroup.add(pod);
      }
    }
  }, [config, cutawayMode, totalWallThickness, primaryWindow]);

  const resetCamera = () => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.camera.position.set(11.0, 8.5, 12.0);
    ctx.controls.target.set(0, 1.5, 0);
    ctx.controls.update();
  };

  return (
    <div className={`relative w-full ${compact ? 'h-72' : 'h-[480px]'} bg-[#090D16] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col`}>
      {/* Top Overlay HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg pointer-events-auto flex items-center gap-3 text-xs text-slate-300">
          <span className="font-semibold text-white">3D Bioclimatic Digital Twin</span>
          <span>•</span>
          <span className="font-mono tabular-nums">
            {config.geometry.length}m × {config.geometry.width}m × {config.geometry.height}m ({config.geometry.shape})
          </span>
          <span>•</span>
          <span className="font-mono text-cyan-300 tabular-nums">
            Wall {Math.round(totalWallThickness * 1000)} mm
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setCutawayMode(!cutawayMode)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              cutawayMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            {cutawayMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{cutawayMode ? 'Full Enclosure' : 'Wall Cutaway'}</span>
          </button>
          <button
            type="button"
            onClick={resetCamera}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
            title="Reset 3D Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Mount */}
      {!webglError ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#090D16]">
          <svg className="w-48 h-36 stroke-cyan-400" viewBox="0 0 200 150" fill="none">
            <polygon points="100,20 170,55 170,115 100,150 30,115 30,55" strokeWidth="2" className="fill-slate-900/80" />
            <line x1="100" y1="20" x2="100" y2="90" strokeWidth="1.5" strokeDasharray="4 4" />
            <rect x="115" y="70" width="32" height="24" className="fill-cyan-500/30 stroke-cyan-300" strokeWidth="1.5" />
          </svg>
          <p className="mt-2 text-xs font-mono text-slate-300">
            Isometric Parametric Preview ({config.geometry.length}m × {config.geometry.width}m × {config.geometry.height}m)
          </p>
        </div>
      )}

      {/* Bottom Legend Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="px-3 py-1.5 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-300">
            <Compass className="w-3.5 h-3.5" />
            <span>Azimuth: {config.geometry.orientationAzimuth}° ({config.geometry.orientationLabel || 'South'})</span>
          </span>
          <span>•</span>
          <span>Shape: {config.geometry.shape}</span>
          {primaryWindow.louver.enabled && (
            <>
              <span>•</span>
              <span className="text-amber-300">Louver: {primaryWindow.louver.angle}°</span>
            </>
          )}
          {config.thermalStorage.pcmEnabled && (
            <>
              <span>•</span>
              <span className="text-cyan-300">PCM: {config.thermalStorage.mass} kg</span>
            </>
          )}
        </div>
        <div className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg text-[11px] text-slate-400">
          Rotate: Drag • Zoom: Scroll • Pan: Right-Click
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Plus, Minus, RotateCcw, Compass } from 'lucide-react';
import { 
  SatelliteData, 
  SatelliteTelemetry, 
  FilterOptions, 
  TimeState, 
  GroundStation 
} from '../../types/satellite';
import { 
  propagateSatellite, 
  generateOrbitPath, 
  geodeticToVector3, 
  THREE_EARTH_RADIUS,
  SCALE_FACTOR
} from '../../services/orbitalEngine';
import { 
  AtmosphereShader, 
  PhotorealisticEarthShader,
  createEarthDayTexture, 
  createEarthNightTexture, 
  createEarthCloudTexture 
} from './EarthShaders';
import { audio } from '../../services/audioService';
import { calculateSubsolarVector, INDIA_CAMERA_VIEW } from '../../services/timeSync';

interface EarthCanvasProps {
  satellites: SatelliteData[];
  selectedSatellite: SatelliteData | null;
  onSelectSatellite: (sat: SatelliteData | null) => void;
  filters: FilterOptions;
  timeState: TimeState;
  groundStations: GroundStation[];
  followMode: boolean;
  onToggleFollowMode: () => void;
  isCinematic: boolean;
  onEnterExperience?: () => void;
  comparisonSatellites?: SatelliteData[];
  focusRegion?: 'INDIA' | 'GLOBAL' | null;
  onClearFocusRegion?: () => void;
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  satellites,
  selectedSatellite,
  onSelectSatellite,
  filters,
  timeState,
  groundStations,
  followMode,
  isCinematic,
  comparisonSatellites = [],
  focusRegion = null,
  onClearFocusRegion
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSatellite, setHoveredSatellite] = useState<{ sat: SatelliteData; x: number; y: number } | null>(null);

  // References to mutable Three.js objects across render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitLinesGroupRef = useRef<THREE.Group | null>(null);
  const groundTrackGroupRef = useRef<THREE.Group | null>(null);
  const coverageGroupRef = useRef<THREE.Group | null>(null);
  const commsGroupRef = useRef<THREE.Group | null>(null);
  const satellitesMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const earthMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const atmosphereMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const darkSideFillLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Filtered satellite dataset
  const filteredSatellites = useMemo(() => {
    return satellites.filter(sat => {
      // Regime
      if (filters.regimes.length > 0 && !filters.regimes.includes(sat.regime)) return false;
      // Status
      if (filters.statuses.length > 0 && !filters.statuses.includes(sat.status)) return false;
      // Category
      if (filters.categories.length > 0 && !filters.categories.includes(sat.category)) return false;
      // Constellation
      if (filters.constellation && sat.constellation !== filters.constellation) return false;
      // Country
      if (filters.country && sat.country !== filters.country) return false;
      // Search term
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchesName = sat.name.toLowerCase().includes(query);
        const matchesId = sat.id.includes(query);
        const matchesOperator = sat.operator.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesOperator) return false;
      }
      return true;
    });
  }, [satellites, filters]);

  // Active telemetries map for fast lookup in animation frame
  const telemetriesRef = useRef<Map<string, SatelliteTelemetry>>(new Map());

  // OrbitControls and camera animation references
  const controlsRef = useRef<OrbitControls | null>(null);
  const isTargetAnimatingRef = useRef(false);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);

  // Quick navigation functions (Zoom In, Zoom Out, Reset Camera)
  const handleZoomIn = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    if (isTargetAnimatingRef.current) {
      isTargetAnimatingRef.current = false;
      onClearFocusRegion?.();
    }
    const dir = new THREE.Vector3().subVectors(cameraRef.current.position, controlsRef.current.target);
    const newLen = Math.max(controlsRef.current.minDistance, dir.length() * 0.8);
    dir.setLength(newLen);
    cameraRef.current.position.copy(controlsRef.current.target).add(dir);
    controlsRef.current.update();
  };

  const handleZoomOut = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    if (isTargetAnimatingRef.current) {
      isTargetAnimatingRef.current = false;
      onClearFocusRegion?.();
    }
    const dir = new THREE.Vector3().subVectors(cameraRef.current.position, controlsRef.current.target);
    const newLen = Math.min(controlsRef.current.maxDistance, dir.length() * 1.25);
    dir.setLength(newLen);
    cameraRef.current.position.copy(controlsRef.current.target).add(dir);
    controlsRef.current.update();
  };

  const handleResetCamera = () => {
    const targetSpherical = new THREE.Spherical(
      INDIA_CAMERA_VIEW.radius,
      INDIA_CAMERA_VIEW.phi,
      INDIA_CAMERA_VIEW.theta
    );
    targetCamPosRef.current = new THREE.Vector3().setFromSpherical(targetSpherical);
    isTargetAnimatingRef.current = true;
  };

  // Listen for focus region changes to trigger smooth swoop
  useEffect(() => {
    if (focusRegion === 'INDIA') {
      const targetSpherical = new THREE.Spherical(
        INDIA_CAMERA_VIEW.radius,
        INDIA_CAMERA_VIEW.phi,
        INDIA_CAMERA_VIEW.theta
      );
      targetCamPosRef.current = new THREE.Vector3().setFromSpherical(targetSpherical);
      isTargetAnimatingRef.current = true;
    } else if (focusRegion === 'GLOBAL') {
      const targetSpherical = new THREE.Spherical(420, Math.PI / 2.5, 0);
      targetCamPosRef.current = new THREE.Vector3().setFromSpherical(targetSpherical);
      isTargetAnimatingRef.current = true;
    } else {
      isTargetAnimatingRef.current = false;
    }
  }, [focusRegion]);

  // Sync cinematic auto-rotation with OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isCinematic;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  }, [isCinematic]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    const initialSpherical = new THREE.Spherical(
      INDIA_CAMERA_VIEW.radius,
      INDIA_CAMERA_VIEW.phi,
      INDIA_CAMERA_VIEW.theta
    );
    camera.position.setFromSpherical(initialSpherical);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- ORBIT CONTROLS SETUP ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false; // Always keep Earth locked at origin (0, 0, 0)
    controls.minDistance = THREE_EARTH_RADIUS * 1.12; // Prevent clipping into Earth
    controls.maxDistance = 850; // Allow broad view of GEO belt & constellations
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.autoRotate = isCinematic;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    renderer.domElement.style.touchAction = 'none';

    // --- DEEP SPACE STARFIELD ---
    const starCount = 4500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 2500 + Math.random() * 1500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const colorVariance = Math.random();
      if (colorVariance > 0.8) {
        // Cyan / Blue tint
        starColors[i * 3] = 0.6;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else if (colorVariance < 0.15) {
        // Warm gold tint
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 0.7;
      } else {
        // Pure crisp white
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 0.95;
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // --- LIGHTING ---
    // Dynamic solar direction vector computed for current simulation time
    const initialSunDir = calculateSubsolarVector(timeState.currentSimTime);

    // Sun light (Directional light positioned at dynamic subsolar point)
    const sunLight = new THREE.DirectionalLight(0xffffff, 3.4);
    sunLight.position.copy(initialSunDir).multiplyScalar(600);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Opposite-side starlight / earthshine fill light (illuminates the night hemisphere)
    const darkSideFillLight = new THREE.DirectionalLight(0x7aa5e2, 1.9);
    darkSideFillLight.position.copy(initialSunDir).multiplyScalar(-600);
    scene.add(darkSideFillLight);
    darkSideFillLightRef.current = darkSideFillLight;

    // Ambient space light (crisp starlight fill)
    const ambientLight = new THREE.AmbientLight(0x55739c, 1.45);
    scene.add(ambientLight);

    // --- PHOTOREALISTIC REAL EARTH SETUP ---
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Fixed geographic orientation aligning 1:1 with geodetic latitude & longitude
    // (Prime Meridian 0° along +X, India 82.5°E along (-Z, +X), Americas along +Z, North Pole along +Y)
    earthGroup.rotation.y = 0;

    const textureLoader = new THREE.TextureLoader();

    // Real NASA Blue Marble Day Texture
    const dayTexture = textureLoader.load('/textures/earth_day.jpg');
    dayTexture.colorSpace = THREE.SRGBColorSpace;

    // Real NASA Topographic Normal Map
    const normalTexture = textureLoader.load('/textures/earth_normal.jpg');

    // Real Ocean Specular Map (ocean reflects sunlight, continents remain matte)
    const specularTexture = textureLoader.load('/textures/earth_specular.jpg');

    // Real NASA Black Marble Night Lights
    const nightTexture = textureLoader.load('/textures/earth_night.png');
    nightTexture.colorSpace = THREE.SRGBColorSpace;

    // Real Atmospheric Cloud Formations
    const cloudTexture = textureLoader.load('/textures/earth_clouds.png');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;

    // Photorealistic Earth Surface Shader (Day + Night Lights + Ocean Specular + Horizon Limb)
    const earthGeo = new THREE.SphereGeometry(THREE_EARTH_RADIUS, 96, 96);
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: PhotorealisticEarthShader.vertexShader,
      fragmentShader: PhotorealisticEarthShader.fragmentShader,
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        specularTexture: { value: specularTexture },
        sunDirection: { value: initialSunDir },
        atmosphereColor: { value: new THREE.Color(0xa0d4ff) },
        nightIntensity: { value: 2.2 },
        earthBrightness: { value: filters.earthBrightness ?? 1.45 }
      }
    });
    earthMatRef.current = earthMat;
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Real Clouds Sphere (floating 1.2% above Earth with realistic transparency)
    const cloudsGeo = new THREE.SphereGeometry(THREE_EARTH_RADIUS * 1.012, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
      depthWrite: false,
      roughness: 0.8,
      emissive: new THREE.Color(0x355075),
      emissiveIntensity: 0.45
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // Razor-thin Atmospheric Fresnel Outer Glow (hugging limb at 1.022)
    const atmosphereGeo = new THREE.SphereGeometry(THREE_EARTH_RADIUS * 1.022, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(0x78c5ff) },
        coefficient: { value: 0.84 },
        power: { value: 3.5 }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphereMatRef.current = atmosphereMat;
    earthGroup.add(atmosphereMesh);

    // --- GROUND STATIONS ---
    const groundStationsGroup = new THREE.Group();
    earthGroup.add(groundStationsGroup);

    groundStations.forEach(st => {
      const [gx, gy, gz] = geodeticToVector3(st.lat, st.lng, 0);
      const dotGeo = new THREE.SphereGeometry(1.4, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(gx, gy, gz);
      groundStationsGroup.add(dotMesh);

      // Station beacon ring
      const ringGeo = new THREE.RingGeometry(1.8, 2.6, 24);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0x10b981, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.7 
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(gx * 1.002, gy * 1.002, gz * 1.002);
      ringMesh.lookAt(gx * 2, gy * 2, gz * 2);
      groundStationsGroup.add(ringMesh);
    });

    // --- GROUPS FOR DYNAMIC VISUALIZATIONS ---
    const orbitLinesGroup = new THREE.Group();
    scene.add(orbitLinesGroup);
    orbitLinesGroupRef.current = orbitLinesGroup;

    const groundTrackGroup = new THREE.Group();
    earthGroup.add(groundTrackGroup);
    groundTrackGroupRef.current = groundTrackGroup;

    const coverageGroup = new THREE.Group();
    earthGroup.add(coverageGroup);
    coverageGroupRef.current = coverageGroup;

    const commsGroup = new THREE.Group();
    scene.add(commsGroup);
    commsGroupRef.current = commsGroup;

    // --- INSTANCED SATELLITES MESH ---
    const maxSatellites = 300;
    const satGeo = new THREE.SphereGeometry(1.5, 12, 12);
    const satMat = new THREE.MeshBasicMaterial();
    const instancedMesh = new THREE.InstancedMesh(satGeo, satMat, maxSatellites);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);
    satellitesMeshRef.current = instancedMesh;

    // --- INTERACTION & SATELLITE RAYCASTING ---
    // When user starts interacting with the globe, cancel any automated region lock
    const cancelTargetAnimation = () => {
      if (isTargetAnimatingRef.current) {
        isTargetAnimatingRef.current = false;
        if (onClearFocusRegion) onClearFocusRegion();
      }
    };
    controls.addEventListener('start', cancelTargetAnimation);

    // Track pointerdown position to differentiate between orbital drag and satellite selection click
    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    const handlePointerDown = (e: PointerEvent) => {
      cancelTargetAnimation();
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownTime = performance.now();
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      const elapsed = performance.now() - pointerDownTime;

      // Only select satellite if it was a distinct click, not a rotate drag
      if (dist < 6 && elapsed < 500 && cameraRef.current && rendererRef.current) {
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let closestSat: SatelliteData | null = null;
        let minDistance = 22;

        telemetriesRef.current.forEach((telem, satId) => {
          const satPos = new THREE.Vector3(telem.x, telem.y, telem.z);
          const screenPos = satPos.clone().project(cameraRef.current!);
          const screenX = ((screenPos.x + 1) / 2) * rect.width;
          const screenY = ((-screenPos.y + 1) / 2) * rect.height;

          if (screenPos.z < 1) {
            const d = Math.hypot(screenX - mouseX, screenY - mouseY);
            if (d < minDistance) {
              minDistance = d;
              const found = filteredSatellites.find(s => s.id === satId);
              if (found) closestSat = found;
            }
          }
        });

        if (closestSat) {
          audio.playSelect();
          onSelectSatellite(closestSat);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!cameraRef.current || !rendererRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const ndcX = (mouseX / rect.width) * 2 - 1;
      const ndcY = -(mouseY / rect.height) * 2 + 1;

      let closestSat: SatelliteData | null = null;
      let minDistance = 18;

      telemetriesRef.current.forEach((telem, satId) => {
        const satPos = new THREE.Vector3(telem.x, telem.y, telem.z);
        const screenPos = satPos.clone().project(cameraRef.current!);
        const screenX = ((screenPos.x + 1) / 2) * rect.width;
        const screenY = ((-screenPos.y + 1) / 2) * rect.height;

        if (screenPos.z < 1) {
          const dist = Math.hypot(screenX - mouseX, screenY - mouseY);
          if (dist < minDistance) {
            minDistance = dist;
            const found = filteredSatellites.find(s => s.id === satId);
            if (found) closestSat = found;
          }
        }
      });

      if (closestSat) {
        setHoveredSatellite({ sat: closestSat, x: mouseX + 15, y: mouseY + 15 });
        rendererRef.current.domElement.style.cursor = 'pointer';
      } else {
        setHoveredSatellite(null);
        rendererRef.current.domElement.style.cursor = 'grab';
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointermove', handlePointerMove);

    // Keyboard navigation (+/- to zoom, R to reset)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetCamera();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // --- WINDOW RESIZE ---
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // --- ANIMATION & PROPAGATION LOOP ---
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let startTime = performance.now();

    const renderLoop = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      // Atmospheric clouds slow rotation
      if (cloudsMeshRef.current && filters.showClouds) {
        cloudsMeshRef.current.visible = true;
        cloudsMeshRef.current.rotation.y += delta * 0.012;
      } else if (cloudsMeshRef.current) {
        cloudsMeshRef.current.visible = false;
      }

      // Dynamic Sun & Illumination sync with simulation time (IST / UTC)
      const currentTime = timeState.currentSimTime;
      const currentSunDir = calculateSubsolarVector(currentTime);

      if (earthMatRef.current) {
        earthMatRef.current.uniforms.sunDirection.value.copy(currentSunDir);
        earthMatRef.current.uniforms.earthBrightness.value = filters.earthBrightness ?? 1.45;
      }
      if (sunLightRef.current) {
        sunLightRef.current.position.copy(currentSunDir).multiplyScalar(600);
      }
      if (darkSideFillLightRef.current) {
        darkSideFillLightRef.current.position.copy(currentSunDir).multiplyScalar(-600);
      }

      // Atmospheric clouds slow rotation
      if (cloudsMeshRef.current && filters.showClouds) {
        cloudsMeshRef.current.visible = true;
        cloudsMeshRef.current.rotation.y += delta * 0.012;
      } else if (cloudsMeshRef.current) {
        cloudsMeshRef.current.visible = false;
      }

      // Smooth camera orientation transition when requested
      if (isTargetAnimatingRef.current && targetCamPosRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.05);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();

        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 1.5) {
          isTargetAnimatingRef.current = false;
          onClearFocusRegion?.();
        }
      } else if (followMode && selectedSatellite && controlsRef.current) {
        const telem = telemetriesRef.current.get(selectedSatellite.id);
        if (telem) {
          const satPos = new THREE.Vector3(telem.x, telem.y, telem.z);
          controlsRef.current.target.lerp(satPos, 0.06);
          controlsRef.current.update();
        }
      } else if (controlsRef.current) {
        if (!followMode && controlsRef.current.target.lengthSq() > 0.001) {
          controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.06);
        }
        controlsRef.current.update();
      }

      // --- SATELLITE PROPAGATION & INSTANCE UPDATES ---
      const matrix = new THREE.Matrix4();
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      const instancedMesh = satellitesMeshRef.current;
      if (instancedMesh) {
        let count = 0;
        telemetriesRef.current.clear();

        filteredSatellites.forEach((sat, idx) => {
          if (idx >= 300) return;
          const telem = propagateSatellite(sat, currentTime, groundStations);
          if (telem) {
            telemetriesRef.current.set(sat.id, telem);
            dummy.position.set(telem.x, telem.y, telem.z);

            // Size adjustments
            const isSelected = selectedSatellite?.id === sat.id;
            const isHovered = hoveredSatellite?.sat.id === sat.id;
            const scale = isSelected ? 2.8 : (isHovered ? 2.2 : 1.2);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();

            instancedMesh.setMatrixAt(count, dummy.matrix);

            // Color coding
            if (isSelected) {
              color.setHex(0xffffff);
            } else if (sat.status === 'DEBRIS' || sat.objectType === 'DEBRIS') {
              color.setHex(0xef4444); // Red debris
            } else if (sat.category === 'SPACE_STATION') {
              color.setHex(0x10b981); // Emerald space station
            } else if (sat.category === 'NAVIGATION') {
              color.setHex(0x3b82f6); // Royal blue GPS
            } else if (sat.category === 'WEATHER') {
              color.setHex(0xf59e0b); // Amber weather
            } else if (sat.regime === 'GEO') {
              color.setHex(0xa855f7); // Purple GEO
            } else {
              color.setHex(0x00f0ff); // Electric cyan active
            }

            instancedMesh.setColorAt(count, color);
            count++;
          }
        });

        instancedMesh.count = count;
        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) {
          instancedMesh.instanceColor.needsUpdate = true;
        }
      }

      // --- FOLLOW SATELLITE CAMERA INTERPOLATION ---
      if (followMode && selectedSatellite && cameraRef.current) {
        const telem = telemetriesRef.current.get(selectedSatellite.id);
        if (telem) {
          const satPos = new THREE.Vector3(telem.x, telem.y, telem.z);
          // Camera placed offset from satellite facing Earth center
          const camOffset = satPos.clone().normalize().multiplyScalar(satPos.length() + 45);
          camOffset.y += 18;

          cameraRef.current.position.lerp(camOffset, 0.08);
          cameraRef.current.lookAt(satPos);
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [filteredSatellites, selectedSatellite, timeState, followMode, isCinematic, filters, focusRegion]);

  // --- REBUILD 3D ORBITS, GROUND TRACK, & COVERAGE CONE ON SELECTION ---
  useEffect(() => {
    if (!orbitLinesGroupRef.current || !groundTrackGroupRef.current || !coverageGroupRef.current || !commsGroupRef.current) return;

    // Clear old lines
    while (orbitLinesGroupRef.current.children.length > 0) {
      orbitLinesGroupRef.current.remove(orbitLinesGroupRef.current.children[0]);
    }
    while (groundTrackGroupRef.current.children.length > 0) {
      groundTrackGroupRef.current.remove(groundTrackGroupRef.current.children[0]);
    }
    while (coverageGroupRef.current.children.length > 0) {
      coverageGroupRef.current.remove(coverageGroupRef.current.children[0]);
    }
    while (commsGroupRef.current.children.length > 0) {
      commsGroupRef.current.remove(commsGroupRef.current.children[0]);
    }

    const satellitesToTrace = [
      selectedSatellite,
      ...comparisonSatellites
    ].filter(Boolean) as SatelliteData[];

    satellitesToTrace.forEach((sat, idx) => {
      // 1. 3D Orbit Trajectory Line
      if (filters.showOrbits) {
        const orbitPoints = generateOrbitPath(sat, timeState.currentSimTime, 140);
        if (orbitPoints.length > 1) {
          const positions = new Float32Array(orbitPoints.length * 3);
          orbitPoints.forEach((pt, pIdx) => {
            positions[pIdx * 3] = pt[0];
            positions[pIdx * 3 + 1] = pt[1];
            positions[pIdx * 3 + 2] = pt[2];
          });
          const orbitGeo = new THREE.BufferGeometry();
          orbitGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const orbitColor = idx === 0 ? 0x00f0ff : 0xf59e0b;
          const orbitMat = new THREE.LineBasicMaterial({
            color: orbitColor,
            transparent: true,
            opacity: 0.85,
            linewidth: 2
          });
          const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
          orbitLinesGroupRef.current?.add(orbitLine);
        }
      }

      // 2. Selected Satellite Specific (Ground Track & Coverage Footprint)
      if (idx === 0 && sat) {
        const telem = telemetriesRef.current.get(sat.id) || propagateSatellite(sat, timeState.currentSimTime);
        if (telem) {
          // Coverage Cone Footprint Circle on Earth
          if (filters.showFootprints) {
            const footprintRadiusKm = telem.footprintRadiusKm;
            const angularRadiusRad = footprintRadiusKm / 6371.0;
            const diskGeo = new THREE.RingGeometry(0, Math.sin(angularRadiusRad) * THREE_EARTH_RADIUS, 32);
            const diskMat = new THREE.MeshBasicMaterial({
              color: 0x00f0ff,
              transparent: true,
              opacity: 0.18,
              side: THREE.DoubleSide
            });
            const diskMesh = new THREE.Mesh(diskGeo, diskMat);
            const [gx, gy, gz] = geodeticToVector3(telem.lat, telem.lng, 0.4);
            diskMesh.position.set(gx, gy, gz);
            diskMesh.lookAt(gx * 2, gy * 2, gz * 2);
            coverageGroupRef.current?.add(diskMesh);
          }

          // Ground Station Active Laser/Radio Telemetry Links
          if (filters.showCommsLinks && telem.inRangeGroundStations && telem.inRangeGroundStations.length > 0) {
            telem.inRangeGroundStations.forEach(stId => {
              const station = groundStations.find(g => g.id === stId);
              if (station) {
                const [sx, sy, sz] = geodeticToVector3(station.lat, station.lng, 0.5);
                const linkGeo = new THREE.BufferGeometry().setFromPoints([
                  new THREE.Vector3(telem.x, telem.y, telem.z),
                  new THREE.Vector3(sx, sy, sz)
                ]);
                const linkMat = new THREE.LineDashedMaterial({
                  color: 0x10b981,
                  dashSize: 3,
                  gapSize: 1.5,
                  transparent: true,
                  opacity: 0.9
                });
                const linkLine = new THREE.Line(linkGeo, linkMat);
                linkLine.computeLineDistances();
                commsGroupRef.current?.add(linkLine);
              }
            });
          }
        }
      }
    });
  }, [selectedSatellite, comparisonSatellites, filters, timeState]);

  // --- PROFESSIONAL COLOR GRADING DYNAMICS ---
  useEffect(() => {
    if (!rendererRef.current) return;
    const mode = filters.colorGrade || 'ACES_FILMIC';

    let exposure = 1.35;
    let atmoColor = new THREE.Color(0xa0d4ff);
    let glowColor = new THREE.Color(0x78c5ff);
    let nightIntensity = 2.2;

    switch (mode) {
      case 'DEEP_SPACE':
        exposure = 1.55;
        atmoColor = new THREE.Color(0x38bdf8);
        glowColor = new THREE.Color(0x1e40af);
        nightIntensity = 2.6;
        break;
      case 'INFRARED_RECON':
        exposure = 1.45;
        atmoColor = new THREE.Color(0xf59e0b);
        glowColor = new THREE.Color(0xd97706);
        nightIntensity = 3.4;
        break;
      case 'ORBITAL_DAWN':
        exposure = 1.55;
        atmoColor = new THREE.Color(0xfb923c);
        glowColor = new THREE.Color(0xea580c);
        nightIntensity = 2.4;
        break;
      case 'CYBERPUNK':
        exposure = 1.60;
        atmoColor = new THREE.Color(0xd946ef);
        glowColor = new THREE.Color(0x06b6d4);
        nightIntensity = 3.0;
        break;
      case 'ACES_FILMIC':
      default:
        exposure = 1.35;
        atmoColor = new THREE.Color(0xa0d4ff);
        glowColor = new THREE.Color(0x78c5ff);
        nightIntensity = 2.2;
        break;
    }

    rendererRef.current.toneMappingExposure = exposure;
    if (earthMatRef.current) {
      earthMatRef.current.uniforms.atmosphereColor.value = atmoColor;
      earthMatRef.current.uniforms.nightIntensity.value = nightIntensity;
      earthMatRef.current.uniforms.earthBrightness.value = filters.earthBrightness ?? 1.45;
    }
    if (atmosphereMatRef.current) {
      atmosphereMatRef.current.uniforms.glowColor.value = glowColor;
    }
  }, [filters.colorGrade, filters.earthBrightness]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden color-grade-${filters.colorGrade || 'ACES_FILMIC'}`}>
      <div className="w-full h-full" ref={containerRef} />
      
      {/* Cinematic Vignette Frame */}
      <div className="cinematic-vignette" />

      {/* Satellite Hover Tooltip */}
      {hoveredSatellite && !isCinematic && (
        <div
          className="absolute z-20 pointer-events-none glass-panel p-2.5 shadow-2xl transition-transform"
          style={{
            left: `${hoveredSatellite.x}px`,
            top: `${hoveredSatellite.y}px`,
            transform: 'translate(4px, 4px)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-ping bg-cyan-400" />
            <div className="font-display font-bold text-xs text-white tracking-wider">
              {hoveredSatellite.sat.name}
            </div>
            <span className={`badge-regime ${hoveredSatellite.sat.regime}`}>
              {hoveredSatellite.sat.regime}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono flex gap-3">
            <span>NORAD: #{hoveredSatellite.sat.id}</span>
            <span>{hoveredSatellite.sat.operator}</span>
          </div>
        </div>
      )}

      {/* 3D Orbit Navigation Quick Controls Widget */}
      <div className="absolute right-3 sm:right-4 bottom-28 sm:bottom-32 z-20 flex flex-col gap-1.5 pointer-events-auto select-none">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 sm:w-9 sm:h-9 glass-panel flex items-center justify-center text-slate-200 hover:text-cyan-400 hover:border-cyan-400/60 transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Zoom In (Scroll Up / Pinch Out / +)"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="w-8 h-8 sm:w-9 sm:h-9 glass-panel flex items-center justify-center text-slate-200 hover:text-cyan-400 hover:border-cyan-400/60 transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Zoom Out (Scroll Down / Pinch In / -)"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const targetSpherical = new THREE.Spherical(
              INDIA_CAMERA_VIEW.radius,
              INDIA_CAMERA_VIEW.phi,
              INDIA_CAMERA_VIEW.theta
            );
            targetCamPosRef.current = new THREE.Vector3().setFromSpherical(targetSpherical);
            isTargetAnimatingRef.current = true;
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 glass-panel flex items-center justify-center text-amber-300 hover:text-amber-200 hover:border-amber-400/60 transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Focus India & Indian Ocean (IST Meridian 82.5°E)"
          aria-label="Focus India"
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetCamera}
          className="w-8 h-8 sm:w-9 sm:h-9 glass-panel flex items-center justify-center text-slate-200 hover:text-white hover:border-cyan-400/60 transition-all shadow-lg active:scale-95 cursor-pointer"
          title="Reset Camera View (R)"
          aria-label="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

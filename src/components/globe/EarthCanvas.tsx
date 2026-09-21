import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
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
  comparisonSatellites = []
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

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef(new THREE.Spherical(320, Math.PI / 2.5, Math.PI / 4));

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    camera.position.setFromSpherical(sphericalRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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
    // Sun light (Directional light positioned at upper-left to match reference image)
    const sunDir = new THREE.Vector3(-450, 220, 320).normalize();
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(-450, 220, 320);
    scene.add(sunLight);

    // Opposite-side starlight / earthshine fill light (illuminates the night hemisphere)
    const darkSideFillLight = new THREE.DirectionalLight(0x5285c5, 1.4);
    darkSideFillLight.position.set(450, -220, -320);
    scene.add(darkSideFillLight);

    // Ambient space light (subtle starlight)
    const ambientLight = new THREE.AmbientLight(0x354e75, 1.15);
    scene.add(ambientLight);

    // --- PHOTOREALISTIC REAL EARTH SETUP ---
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Initial orientation so Americas & Atlantic city lights face viewer
    earthGroup.rotation.y = 1.25;

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
        sunDirection: { value: sunDir },
        atmosphereColor: { value: new THREE.Color(0xa0d4ff) },
        nightIntensity: { value: 1.95 }
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
      roughness: 0.9,
      emissive: new THREE.Color(0x182c44),
      emissiveIntensity: 0.36
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
        glowColor: { value: new THREE.Color(0x8bcbf8) },
        coefficient: { value: 0.82 },
        power: { value: 3.8 }
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

    // --- MOUSE & TOUCH CONTROLS ---
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        sphericalRef.current.theta -= deltaX * 0.005;
        sphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, sphericalRef.current.phi - deltaY * 0.005)
        );

        camera.position.setFromSpherical(sphericalRef.current);
        camera.lookAt(0, 0, 0);

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting for hover tooltip
        const ndcX = (mouseX / width) * 2 - 1;
        const ndcY = -(mouseY / height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        let closestSat: SatelliteData | null = null;
        let minDistance = 18; // screen pixel tolerance

        // Check against current telemetries
        telemetriesRef.current.forEach((telem, satId) => {
          const satPos = new THREE.Vector3(telem.x, telem.y, telem.z);
          const screenPos = satPos.clone().project(camera);
          const screenX = ((screenPos.x + 1) / 2) * width;
          const screenY = ((-screenPos.y + 1) / 2) * height;

          // Check if satellite is in front of camera
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
          container.style.cursor = 'pointer';
        } else {
          setHoveredSatellite(null);
          container.style.cursor = isDraggingRef.current ? 'grabbing' : 'default';
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closestSat: SatelliteData | null = null;
      let minDistance = 22;

      telemetriesRef.current.forEach((telem, satId) => {
        const satPos = new THREE.Vector3(telem.x, telem.y, telem.z);
        const screenPos = satPos.clone().project(camera);
        const screenX = ((screenPos.x + 1) / 2) * width;
        const screenY = ((-screenPos.y + 1) / 2) * height;

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
        audio.playSelect();
        onSelectSatellite(closestSat);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.25;
      sphericalRef.current.radius = Math.max(
        THREE_EARTH_RADIUS * 1.15,
        Math.min(850, sphericalRef.current.radius + zoomFactor)
      );
      camera.position.setFromSpherical(sphericalRef.current);
      camera.lookAt(0, 0, 0);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });

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
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
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

      // Earth rotation and camera in Cinematic Showcase vs Interactive Mode
      if (isCinematic && cameraRef.current && !isDraggingRef.current) {
        // Slow majestic Earth diurnal rotation
        if (earthGroupRef.current) {
          earthGroupRef.current.rotation.y += delta * 0.014;
        }
        // Camera steady and centered so Earth sits right under the hero title
        const camDistance = 250;
        const camX = Math.sin(elapsed * 0.02) * 4;
        const camY = 3 + Math.cos(elapsed * 0.02) * 2;
        cameraRef.current.position.set(camX, camY, camDistance);
        cameraRef.current.lookAt(0, -12, 0);
      } else if (earthGroupRef.current && !followMode && !isDraggingRef.current) {
        earthGroupRef.current.rotation.y += delta * 0.008;
      }

      // --- SATELLITE PROPAGATION & INSTANCE UPDATES ---
      const currentTime = timeState.currentSimTime;
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
  }, [filteredSatellites, selectedSatellite, timeState, followMode, isCinematic, filters]);

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

    let exposure = 1.15;
    let atmoColor = new THREE.Color(0xa0d4ff);
    let glowColor = new THREE.Color(0x8bcbf8);
    let nightIntensity = 1.95;

    switch (mode) {
      case 'DEEP_SPACE':
        exposure = 1.35;
        atmoColor = new THREE.Color(0x38bdf8);
        glowColor = new THREE.Color(0x1e40af);
        nightIntensity = 2.4;
        break;
      case 'INFRARED_RECON':
        exposure = 1.25;
        atmoColor = new THREE.Color(0xf59e0b);
        glowColor = new THREE.Color(0xd97706);
        nightIntensity = 3.2;
        break;
      case 'ORBITAL_DAWN':
        exposure = 1.35;
        atmoColor = new THREE.Color(0xfb923c);
        glowColor = new THREE.Color(0xea580c);
        nightIntensity = 2.2;
        break;
      case 'CYBERPUNK':
        exposure = 1.45;
        atmoColor = new THREE.Color(0xd946ef);
        glowColor = new THREE.Color(0x06b6d4);
        nightIntensity = 2.8;
        break;
      case 'ACES_FILMIC':
      default:
        exposure = 1.15;
        atmoColor = new THREE.Color(0xa0d4ff);
        glowColor = new THREE.Color(0x8bcbf8);
        nightIntensity = 1.95;
        break;
    }

    rendererRef.current.toneMappingExposure = exposure;
    if (earthMatRef.current) {
      earthMatRef.current.uniforms.atmosphereColor.value = atmoColor;
      earthMatRef.current.uniforms.nightIntensity.value = nightIntensity;
    }
    if (atmosphereMatRef.current) {
      atmosphereMatRef.current.uniforms.glowColor.value = glowColor;
    }
  }, [filters.colorGrade]);

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
    </div>
  );
};

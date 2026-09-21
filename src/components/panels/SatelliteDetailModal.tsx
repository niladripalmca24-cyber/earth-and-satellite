import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Orbit, 
  Radio, 
  Compass, 
  Activity, 
  Layers, 
  Copy, 
  Check, 
  ArrowLeft,
  Calendar,
  Weight,
  Cpu,
  Zap,
  Rocket,
  Clock,
  Sparkles,
  ShieldAlert,
  Flame,
  Maximize2,
  FileText,
  Camera,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import * as THREE from 'three';
import { SatelliteData, TimeState } from '../../types/satellite';
import { propagateSatellite } from '../../services/orbitalEngine';
import { audio } from '../../services/audioService';

interface SatelliteDetailModalProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  timeState: TimeState;
}

type ModalTab = 'blueprint' | 'photo' | 'engineering' | 'timeline' | 'ephemeris';

export const getSatellitePhoto = (sat: SatelliteData) => {
  if (sat.imageUrl) {
    return {
      url: sat.imageUrl,
      caption: sat.imageCaption || `Authentic high-resolution orbital photograph of ${sat.name} in flight.`,
      credit: sat.imageCredit || `${sat.operator} / Space Operations`,
      date: sat.imageDate || `${sat.launchYear}`
    };
  }

  // Category fallback authentic flight photography
  switch (sat.category) {
    case 'SPACE_STATION':
      return {
        url: '/images/satellites/iss.jpg',
        caption: `Orbital photograph of ${sat.name} modular space station complex operating in Low Earth Orbit.`,
        credit: 'NASA / International Space Station Partner Archive',
        date: 'Expedition Flight Photography'
      };
    case 'SCIENCE':
      return {
        url: '/images/satellites/hubble.jpg',
        caption: `Space astronomy optical observatory and precision instrumentation in vacuum flight.`,
        credit: 'NASA / ESA Space Science Imaging Archive',
        date: 'Orbital Photometry'
      };
    case 'NAVIGATION':
      return {
        url: '/images/satellites/gps.jpg',
        caption: `Precision navigation spacecraft in Medium Earth Orbit broadcasting global positioning signals.`,
        credit: 'US Space Force SSC / Aerospace Photography',
        date: 'Constellation Operations'
      };
    case 'EARTH_OBSERVATION':
    case 'WEATHER':
      return {
        url: '/images/satellites/landsat.jpg',
        caption: `Multispectral Earth observation satellite capturing land, coastal, and oceanic ecosystems.`,
        credit: 'NASA / USGS / NOAA Operational Remote Sensing',
        date: 'Earth Observation Flight Archive'
      };
    case 'COMMUNICATION':
      return {
        url: '/images/satellites/starlink.jpg',
        caption: `Broadband communications spacecraft with phased array antennas and solar array.`,
        credit: 'Commercial Communications Fleet Operations',
        date: 'Constellation Telemetry'
      };
    default:
      return {
        url: '/images/satellites/swot.jpg',
        caption: `Earth orbit mission spacecraft with high-gain antennas deployed in vacuum.`,
        credit: 'Aerospace Engineering Flight Archive',
        date: 'Flight Archive'
      };
  }
};

export const SatelliteDetailModal: React.FC<SatelliteDetailModalProps> = ({
  satellite,
  onClose,
  timeState
}) => {
  const modelCanvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('blueprint');
  const [schematicMode, setSchematicMode] = useState<'3d' | 'photo'>('3d');
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [copiedTLE, setCopiedTLE] = useState(false);

  // 3D Spacecraft Wireframe Inspector Canvas
  useEffect(() => {
    if (!satellite || !modelCanvasRef.current) return;
    const container = modelCanvasRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const craftGroup = new THREE.Group();
    scene.add(craftGroup);

    // Color definitions
    const primaryColor = satellite.category === 'DEBRIS' ? 0xef4444 : 
                         satellite.category === 'SCIENCE' ? 0xa855f7 :
                         satellite.category === 'WEATHER' ? 0x06b6d4 :
                         satellite.category === 'NAVIGATION' ? 0x10b981 : 0x00f0ff;

    const accentColor = 0x38bdf8;

    // PROCEDURAL 3D CRAFT MODELS BY CATEGORY
    if (satellite.category === 'SPACE_STATION') {
      // Modular Space Station (Tianhe / ISS style)
      // Central Habitation & Lab Cylinders
      const moduleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
      const wireMat = new THREE.LineBasicMaterial({ color: primaryColor, linewidth: 1.5 });

      const coreCyl = new THREE.CylinderGeometry(0.8, 0.8, 3.2, 16);
      const coreMesh = new THREE.Mesh(coreCyl, moduleMat);
      coreMesh.rotation.z = Math.PI / 2;
      craftGroup.add(coreMesh);
      craftGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(coreCyl), wireMat));

      // Cross Truss
      const trussGeo = new THREE.BoxGeometry(6.5, 0.25, 0.25);
      const trussMesh = new THREE.Mesh(trussGeo, new THREE.MeshBasicMaterial({ color: 0x64748b, wireframe: true }));
      craftGroup.add(trussMesh);

      // Huge Multi-Tier Solar Wings
      const wingGeo = new THREE.BoxGeometry(2.4, 0.04, 1.2);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });

      const w1 = new THREE.Mesh(wingGeo, wingMat);
      w1.position.set(-3.2, 0.8, 0);
      craftGroup.add(w1);
      const w2 = new THREE.Mesh(wingGeo, wingMat);
      w2.position.set(-3.2, -0.8, 0);
      craftGroup.add(w2);

      const w3 = new THREE.Mesh(wingGeo, wingMat);
      w3.position.set(3.2, 0.8, 0);
      craftGroup.add(w3);
      const w4 = new THREE.Mesh(wingGeo, wingMat);
      w4.position.set(3.2, -0.8, 0);
      craftGroup.add(w4);

      // Docking Sphere Node
      const nodeGeo = new THREE.SphereGeometry(0.65, 12, 12);
      const nodeMesh = new THREE.Mesh(nodeGeo, moduleMat);
      nodeMesh.position.set(1.9, 0, 0);
      craftGroup.add(nodeMesh);

    } else if (satellite.category === 'SCIENCE') {
      // Space Telescope / High-Energy Observatory (Hubble / Chandra / Swift style)
      const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
      const goldFoilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.15 });

      // Telescope Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.4, 20, 1, true);
      const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
      barrelMesh.rotation.z = Math.PI / 2;
      craftGroup.add(barrelMesh);
      craftGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(barrelGeo), new THREE.LineBasicMaterial({ color: primaryColor })));

      // Gold Foil Equipment Bus Section
      const busGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.2, 16);
      const busMesh = new THREE.Mesh(busGeo, goldFoilMat);
      busMesh.rotation.z = Math.PI / 2;
      busMesh.position.set(-1.4, 0, 0);
      craftGroup.add(busMesh);

      // Open Aperture Sunshade Door
      const doorGeo = new THREE.CircleGeometry(0.9, 16);
      const doorMesh = new THREE.Mesh(doorGeo, barrelMat);
      doorMesh.position.set(1.7, 0.7, 0);
      doorMesh.rotation.y = -Math.PI / 2;
      doorMesh.rotation.x = -Math.PI / 4;
      craftGroup.add(doorMesh);

      // Solar Wings
      const wingGeo = new THREE.BoxGeometry(0.8, 0.05, 2.5);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 });
      const wing1 = new THREE.Mesh(wingGeo, wingMat);
      wing1.position.set(-0.8, 0, 1.8);
      craftGroup.add(wing1);
      const wing2 = new THREE.Mesh(wingGeo, wingMat);
      wing2.position.set(-0.8, 0, -1.8);
      craftGroup.add(wing2);

      // High Gain Antenna Dish
      const dishGeo = new THREE.ConeGeometry(0.5, 0.25, 14, 1, true);
      const dishMesh = new THREE.Mesh(dishGeo, goldFoilMat);
      dishMesh.rotation.x = Math.PI;
      dishMesh.position.set(-1.2, 1.1, 0);
      craftGroup.add(dishMesh);

    } else if (satellite.category === 'EARTH_OBSERVATION' || satellite.category === 'WEATHER') {
      // Remote Sensing / Radar / Weather Satellite (SWOT, Landsat, Sentinel, GOES)
      const busGeo = new THREE.BoxGeometry(1.6, 1.5, 2.0);
      const busMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const busMesh = new THREE.Mesh(busGeo, busMat);
      craftGroup.add(busMesh);
      craftGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(busGeo), new THREE.LineBasicMaterial({ color: primaryColor })));

      // Asymmetric or Dual Solar Arrays
      const wingGeo = new THREE.BoxGeometry(3.5, 0.06, 1.4);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
      const wing1 = new THREE.Mesh(wingGeo, wingMat);
      wing1.position.set(-2.8, 0, 0);
      craftGroup.add(wing1);

      // Earth-facing Instrument Deck Apertures
      const sensorLensGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
      const sensorLensMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9 });
      const lens1 = new THREE.Mesh(sensorLensGeo, sensorLensMat);
      lens1.position.set(0.3, -0.85, 0.4);
      craftGroup.add(lens1);
      const lens2 = new THREE.Mesh(sensorLensGeo, sensorLensMat);
      lens2.position.set(-0.3, -0.85, -0.3);
      craftGroup.add(lens2);

      // Radar Altimeter or KaRIn Mast Boom (for SWOT / Sentinel radar missions)
      const boomGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
      const boomMesh = new THREE.Mesh(boomGeo, new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
      boomMesh.rotation.z = Math.PI / 2;
      boomMesh.position.set(0, 1.0, 0);
      craftGroup.add(boomMesh);

      const ant1 = new THREE.BoxGeometry(0.2, 0.5, 0.8);
      const antMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
      const antMesh1 = new THREE.Mesh(ant1, antMat);
      antMesh1.position.set(1.6, 1.0, 0);
      craftGroup.add(antMesh1);
      const antMesh2 = new THREE.Mesh(ant1, antMat);
      antMesh2.position.set(-1.6, 1.0, 0);
      craftGroup.add(antMesh2);

    } else if (satellite.category === 'NAVIGATION') {
      // Global Navigation Satellite (GPS, Galileo, BeiDou)
      const busGeo = new THREE.BoxGeometry(1.5, 1.4, 1.6);
      const busMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      craftGroup.add(new THREE.Mesh(busGeo, busMat));
      craftGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(busGeo), new THREE.LineBasicMaterial({ color: primaryColor })));

      // Helical L-Band Phased Array Antenna Disc
      const lBandGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 16);
      const lBandMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 });
      const lBandMesh = new THREE.Mesh(lBandGeo, lBandMat);
      lBandMesh.position.set(0, -0.8, 0);
      craftGroup.add(lBandMesh);

      // Angled Solar Wings
      const wingGeo = new THREE.BoxGeometry(3.2, 0.05, 1.1);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-2.6, 0, 0);
      craftGroup.add(leftWing);
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(2.6, 0, 0);
      craftGroup.add(rightWing);

    } else if (satellite.category === 'DEBRIS') {
      // Tumbled Fragment / Derelict Rocket Body
      const bodyGeo = new THREE.CylinderGeometry(0.8, 1.1, 2.8, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, metalness: 0.6, roughness: 0.5 });
      craftGroup.add(new THREE.Mesh(bodyGeo, bodyMat));
      craftGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(bodyGeo), new THREE.LineBasicMaterial({ color: 0xef4444 })));

      // Bell Nozzle
      const nozzleGeo = new THREE.ConeGeometry(0.7, 0.8, 12, 1, true);
      const nozzleMesh = new THREE.Mesh(nozzleGeo, new THREE.MeshBasicMaterial({ color: 0x991b1b, wireframe: true }));
      nozzleMesh.position.set(0, -1.6, 0);
      craftGroup.add(nozzleMesh);

      // Fragmented Shards
      for (let i = 0; i < 6; i++) {
        const shardGeo = new THREE.TetrahedronGeometry(0.25 + Math.random() * 0.2);
        const shardMesh = new THREE.Mesh(shardGeo, new THREE.MeshBasicMaterial({ color: 0xf87171, wireframe: true }));
        shardMesh.position.set(
          (Math.random() - 0.5) * 3.0,
          (Math.random() - 0.5) * 3.0,
          (Math.random() - 0.5) * 3.0
        );
        craftGroup.add(shardMesh);
      }

    } else {
      // Commercial Comms / Starlink / Broadband
      const busGeo = new THREE.BoxGeometry(1.6, 1.4, 2.0);
      const busMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      craftGroup.add(new THREE.Mesh(busGeo, busMat));
      craftGroup.add(new THREE.LineSegments(new THREE.WireframeGeometry(busGeo), new THREE.LineBasicMaterial({ color: accentColor })));

      const panelGeo = new THREE.BoxGeometry(3.5, 0.08, 1.2);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
      const leftPanel = new THREE.Mesh(panelGeo, panelMat);
      leftPanel.position.set(-2.8, 0, 0);
      craftGroup.add(leftPanel);
      const rightPanel = new THREE.Mesh(panelGeo, panelMat);
      rightPanel.position.set(2.8, 0, 0);
      craftGroup.add(rightPanel);

      const dishGeo = new THREE.ConeGeometry(0.8, 0.4, 16, 1, true);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
      const dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = Math.PI;
      dishMesh.position.set(0, 1.1, 0.5);
      craftGroup.add(dishMesh);
    }

    // Lighting
    const pointLight = new THREE.PointLight(primaryColor, 2, 20);
    pointLight.position.set(3, 4, 3);
    scene.add(pointLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(-3, 3, 5);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambLight);

    // Subtle background grid particles
    const starCount = 60;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 20;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.08, transparent: true, opacity: 0.5 });
    const starsMesh = new THREE.Points(starGeo, starMat);
    scene.add(starsMesh);

    // Continuous Inspection Animation
    let animId: number;
    const animate = () => {
      craftGroup.rotation.y += 0.012;
      craftGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.12;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [satellite]);

  if (!satellite) return null;

  const telem = propagateSatellite(satellite, timeState.currentSimTime);

  const copyTLE = () => {
    audio.playSelect();
    navigator.clipboard.writeText(`${satellite.name}\n${satellite.tleLine1}\n${satellite.tleLine2}`);
    setCopiedTLE(true);
    setTimeout(() => setCopiedTLE(false), 2000);
  };

  // Dynamic time in space calculation
  const calculateMissionAge = () => {
    if (!satellite.launchDate) return `${new Date().getFullYear() - satellite.launchYear} years in orbit`;
    const launch = new Date(satellite.launchDate);
    const now = timeState.currentSimTime;
    const diffYears = (now.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears < 1) {
      const diffMonths = Math.floor(diffYears * 12);
      return `${diffMonths} months active`;
    }
    const years = Math.floor(diffYears);
    const months = Math.floor((diffYears - years) * 12);
    return `${years}y ${months}m in service`;
  };

  const formatLat = (lat: number) => {
    const dir = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(3)}° ${dir}`;
  };

  const formatLng = (lng: number) => {
    const dir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lng).toFixed(3)}° ${dir}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] glass-panel border-cyan-500/40 shadow-[0_0_80px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden">
        {/* Corner HUD brackets */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Modal Top Header */}
        <div className="p-4 md:px-6 md:py-4 border-b border-cyan-500/20 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                audio.playHover();
                onClose();
              }}
              className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 font-display text-xs"
              title="Return to 3D Globe"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">RETURN TO GLOBE</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-2xl font-display font-black text-white tracking-wide">
                  {satellite.name}
                </h1>
                <span className={`badge-regime ${satellite.regime}`}>
                  {satellite.regime}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  {satellite.category.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                NORAD #{satellite.id} • {satellite.intlDes} • {satellite.operator} ({satellite.country})
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playHover();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 px-4 md:px-6 border-b border-cyan-500/20 bg-slate-950/60 font-display text-xs overflow-x-auto">
          {[
            { id: 'blueprint' as ModalTab, label: '3D SCHEMATIC & ORBIT', icon: Cpu },
            { id: 'photo' as ModalTab, label: 'REAL SATELLITE PHOTO', icon: Camera },
            { id: 'engineering' as ModalTab, label: 'PAYLOAD & SPECS', icon: Zap },
            { id: 'timeline' as ModalTab, label: 'LAUNCH & ACHIEVEMENTS', icon: Calendar },
            { id: 'ephemeris' as ModalTab, label: 'SGP4 EPHEMERIS / TLE', icon: Orbit },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  audio.playHover();
                  setActiveTab(tab.id);
                }}
                className={`py-3 px-3.5 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.id === 'photo' && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    HD
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* TAB 1: 3D SCHEMATIC & ORBITAL DYNAMICS */}
          {activeTab === 'blueprint' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3D Wireframe / Real Photo Viewer Card */}
                <div className="p-4 rounded-lg bg-black/60 border border-cyan-500/30 flex flex-col relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                      {schematicMode === '3d' ? <Cpu className="w-4 h-4" /> : <Camera className="w-4 h-4 text-cyan-400" />}
                      {schematicMode === '3d' ? 'SPACECRAFT SCHEMATIC' : 'AUTHENTIC FLIGHT PHOTO'}
                    </span>

                    {/* In-Card View Mode Toggle: 3D vs Real Photo */}
                    <div className="flex items-center gap-1 bg-black/80 p-0.5 rounded border border-slate-700">
                      <button
                        onClick={() => {
                          audio.playSelect();
                          setSchematicMode('3d');
                        }}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                          schematicMode === '3d'
                            ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        3D WIREFRAME
                      </button>
                      <button
                        onClick={() => {
                          audio.playSelect();
                          setSchematicMode('photo');
                        }}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition-all cursor-pointer ${
                          schematicMode === 'photo'
                            ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Camera className="w-3 h-3 text-cyan-400" />
                        <span>REAL PHOTO</span>
                      </button>
                    </div>
                  </div>

                  {schematicMode === '3d' ? (
                    <>
                      <div 
                        ref={modelCanvasRef} 
                        className="w-full h-64 md:h-72 rounded bg-slate-950/80 flex items-center justify-center overflow-hidden border border-slate-800" 
                      />
                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Model: {satellite.spacecraftModel || `${satellite.name} Dedicated Bus`}</span>
                        <span className="text-cyan-400">Continuous 3-Axis Yaw/Pitch Simulation</span>
                      </div>
                    </>
                  ) : (
                    <div className="relative w-full h-64 md:h-72 rounded bg-black flex flex-col overflow-hidden border border-cyan-500/30 group">
                      <img
                        src={getSatellitePhoto(satellite).url}
                        alt={satellite.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* HUD Crosshairs & Telemetry Overlay */}
                      <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-300 bg-black/75 px-2 py-0.5 rounded border border-cyan-500/30 pointer-events-none">
                        ┌── 4K FLIGHT PHOTOMETRY
                      </div>

                      <button
                        onClick={() => {
                          audio.playSelect();
                          setIsPhotoLightboxOpen(true);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded bg-black/75 hover:bg-cyan-500/30 text-slate-300 hover:text-white border border-cyan-500/30 transition-all cursor-pointer"
                        title="Expand Image Lightbox"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5 font-mono">
                        <div className="text-[10px] text-cyan-200 line-clamp-1">
                          {getSatellitePhoto(satellite).caption}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                          <span className="text-amber-300/90">{getSatellitePhoto(satellite).credit}</span>
                          <span>{getSatellitePhoto(satellite).date}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time SGP4 Dynamics Card */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/30 font-mono">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-display font-bold text-xs text-cyan-300 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                        REAL-TIME PROPAGATED DYNAMICS
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                        SGP4 LIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2 rounded bg-black/50 border border-cyan-500/10">
                        <span className="text-slate-400 block text-[10px]">ALTITUDE</span>
                        <span className="text-base font-bold text-white">
                          {telem ? `${Math.round(telem.alt).toLocaleString()} km` : '---'}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-black/50 border border-cyan-500/10">
                        <span className="text-slate-400 block text-[10px]">ORBITAL VELOCITY</span>
                        <span className="text-base font-bold text-cyan-300">
                          {telem ? `${telem.velocity} km/s` : '---'}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {telem ? `(${Math.round(telem.velocity * 3600).toLocaleString()} km/h)` : ''}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-black/50 border border-cyan-500/10">
                        <span className="text-slate-400 block text-[10px]">SUB-SATELLITE POSITION</span>
                        <span className="text-xs font-bold text-white block">
                          {telem ? `${formatLat(telem.lat)}` : '---'}
                        </span>
                        <span className="text-xs font-bold text-white block">
                          {telem ? `${formatLng(telem.lng)}` : '---'}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-black/50 border border-cyan-500/10">
                        <span className="text-slate-400 block text-[10px]">ORBIT PERIOD</span>
                        <span className="text-base font-bold text-emerald-400">
                          {satellite.periodMin ?? 92.5} min
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {(1440 / (satellite.periodMin || 92.5)).toFixed(1)} revs / 24h
                        </span>
                      </div>

                      <div className="p-2 rounded bg-black/50 border border-cyan-500/10">
                        <span className="text-slate-400 block text-[10px]">APOGEE / PERIGEE</span>
                        <span className="text-xs font-bold text-white">
                          {satellite.apogeeKm?.toLocaleString()} / {satellite.perigeeKm?.toLocaleString()} km
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Eccentricity: {satellite.apogeeKm && satellite.perigeeKm ? (((satellite.apogeeKm - satellite.perigeeKm) / (satellite.apogeeKm + satellite.perigeeKm + 12742)).toFixed(4)) : '0.001'}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-black/50 border border-cyan-500/10">
                        <span className="text-slate-400 block text-[10px]">FOOTPRINT COVERAGE</span>
                        <span className="text-xs font-bold text-amber-400">
                          {telem ? `${Math.round(telem.footprintRadiusKm).toLocaleString()} km radius` : '---'}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Ground track visibility horizon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mission Summary Banner */}
                  <div className="p-3.5 rounded-lg bg-black/40 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                      Mission Profile
                    </span>
                    <p className="text-slate-200 text-xs font-sans leading-relaxed">
                      {satellite.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUTHENTIC REAL SATELLITE PHOTOMETRY */}
          {activeTab === 'photo' && (
            <div className="space-y-6">
              {/* Full-width High-Definition Spacecraft Photograph Card */}
              <div className="p-4 md:p-6 rounded-xl bg-black/70 border border-cyan-500/30 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-sm font-bold text-cyan-300">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>AUTHENTIC HIGH-RESOLUTION SPACE PHOTOMETRY</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      OFFICIAL FLIGHT ARCHIVE
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      audio.playSelect();
                      setIsPhotoLightboxOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>EXPAND FULLSCREEN LIGHTBOX</span>
                  </button>
                </div>

                {/* Hero Photo Container with Aerospace HUD Frame */}
                <div 
                  onClick={() => {
                    audio.playSelect();
                    setIsPhotoLightboxOpen(true);
                  }}
                  className="relative w-full h-80 sm:h-96 rounded-lg bg-black overflow-hidden border border-cyan-500/40 cursor-pointer group flex items-center justify-center shadow-2xl"
                >
                  <img
                    src={getSatellitePhoto(satellite).url}
                    alt={satellite.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Corner Target Marks */}
                  <div className="absolute top-3 left-3 text-cyan-400/80 font-mono text-[10px] pointer-events-none bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20">
                    TARGET: {satellite.name} [{satellite.id}]
                  </div>
                  <div className="absolute top-3 right-3 text-cyan-400/80 font-mono text-[10px] pointer-events-none bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20">
                    RESOLVED: 4K HIGH DYNAMIC RANGE
                  </div>
                  <div className="absolute bottom-3 right-3 text-cyan-400/80 font-mono text-[10px] pointer-events-none bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20">
                    CLICK TO ZOOM / LIGHTBOX 🔍
                  </div>
                </div>

                {/* Photo Description & Official Credit Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="md:col-span-2 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase text-cyan-400 font-bold block mb-1">
                      Photometric Description & Orbital Context
                    </span>
                    <p className="text-slate-200 text-xs font-sans leading-relaxed">
                      {getSatellitePhoto(satellite).caption}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">OFFICIAL IMAGE CREDIT</span>
                      <span className="text-xs font-bold text-amber-300 block">
                        {getSatellitePhoto(satellite).credit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 block">CAPTURE TIMESTAMP</span>
                      <span className="text-xs text-slate-300 block">
                        {getSatellitePhoto(satellite).date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENGINEERING & PAYLOAD SPECIFICATIONS */}
          {activeTab === 'engineering' && (
            <div className="space-y-6 font-mono text-xs">
              {/* Engineering Hardware Specs Matrix */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyan-500/20">
                <div className="font-display font-bold text-xs text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>BUS & POWER SUBSYSTEM SPECIFICATIONS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">TOTAL SPACECRAFT MASS</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {satellite.massKg ? `${satellite.massKg.toLocaleString()} kg` : 'Classified / N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {satellite.massKg && satellite.massKg > 1000 ? `${(satellite.massKg / 1000).toFixed(2)} metric tons` : 'Lightweight Smallsat'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">ELECTRICAL POWER GENERATION</span>
                    <span className="text-sm font-bold text-amber-300 mt-1 block">
                      {satellite.powerWatts ? `${(satellite.powerWatts / 1000).toFixed(1)} kW (${satellite.powerWatts.toLocaleString()} W)` : 'N/A'}
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded mt-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(5, ((satellite.powerWatts || 1000) / 30000) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">PROPULSION SYSTEM</span>
                    <span className="text-xs font-bold text-cyan-300 mt-1 block">
                      {satellite.propulsionType || 'Hydrazine Monopropellant / Cold Gas'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">PHYSICAL DIMENSIONS</span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {satellite.dimensionsMeters || 'Classified / Unspecified'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">COMMUNICATION FREQUENCIES</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block">
                      {satellite.frequenciesBands || 'S-band, X-band, Ka-band'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">BUS PLATFORM ARCHITECTURE</span>
                    <span className="text-xs font-bold text-slate-300 mt-1 block">
                      {satellite.spacecraftModel || `${satellite.operator} Dedicated Platform`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payload Instruments Breakdown */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyan-500/20">
                <div className="font-display font-bold text-xs text-white mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>INTEGRATED SENSOR PAYLOADS & CAPABILITIES</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {satellite.payloadInstruments ? `${satellite.payloadInstruments.length} SUBSYSTEMS` : 'STANDARD PAYLOAD'}
                  </span>
                </div>

                {satellite.payloadInstruments && satellite.payloadInstruments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {satellite.payloadInstruments.map((instrument, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 rounded bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5"
                      >
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-400/20 text-cyan-300 font-bold">
                          #{idx + 1}
                        </span>
                        <div className="text-xs text-slate-200 font-mono">
                          {instrument}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded bg-slate-950/40 text-slate-400 text-xs">
                    Payload consists of specialized aerospace transponders and telemetry packages.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LAUNCH & MISSION ACHIEVEMENTS */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 font-mono text-xs">
              {/* Launch Credentials Card */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyan-500/20">
                <div className="font-display font-bold text-xs text-white mb-4 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-rose-400" />
                  <span>LAUNCH MISSION RECORD & LOGISTICS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">LAUNCH DATE</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {satellite.launchDate || `${satellite.launchYear}`}
                    </span>
                    <span className="text-[10px] text-cyan-400">{calculateMissionAge()}</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">LAUNCH VEHICLE / ROCKET</span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {satellite.launchVehicle || 'Orbital Launch Vehicle'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">LAUNCH SITE COMPLEX</span>
                    <span className="text-xs font-bold text-white mt-1 block">
                      {satellite.launchSite || 'Spaceport Facility'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">DESIGN LIFETIME</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block">
                      {satellite.expectedLifetimeYears ? `${satellite.expectedLifetimeYears} Years` : 'Classified'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950/70 border border-slate-800 col-span-1 sm:col-span-2">
                    <span className="text-slate-500 text-[10px] block">ORBITAL DECAY & DISPOSAL TRAJECTORY</span>
                    <span className="text-xs font-bold text-amber-300 mt-1 block">
                      {satellite.orbitalDecayEstimate || 'Natural orbital decay according to atmospheric drag models'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mission Highlights & Historical Achievements */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyan-500/20">
                <div className="font-display font-bold text-xs text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>KEY SCIENTIFIC & OPERATIONAL ACHIEVEMENTS</span>
                </div>

                {satellite.missionHighlights && satellite.missionHighlights.length > 0 ? (
                  <div className="space-y-2">
                    {satellite.missionHighlights.map((highlight, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded bg-slate-950/80 border border-slate-800/80 flex items-start gap-3"
                      >
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-200 text-xs font-sans leading-relaxed">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded bg-slate-950/40 text-slate-400 text-xs font-sans">
                    Routine active orbital operations maintained within expected mission tolerances.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SGP4 EPHEMERIS & TLE DATA */}
          {activeTab === 'ephemeris' && (
            <div className="space-y-6 font-mono text-xs">
              {/* Keplerian Elements Matrix */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyan-500/20">
                <div className="font-display font-bold text-xs text-cyan-400 mb-3 flex items-center gap-2">
                  <Orbit className="w-4 h-4" />
                  <span>KEPLERIAN ORBITAL STATE VECTOR</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">INCLINATION (i)</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{satellite.inclinationDeg ?? 51.64}°</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">ORBITAL PERIOD (T)</span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block">{satellite.periodMin ?? 92.9} min</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">APOGEE ALTITUDE</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{satellite.apogeeKm?.toLocaleString()} km</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">PERIGEE ALTITUDE</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{satellite.perigeeKm?.toLocaleString()} km</span>
                  </div>
                </div>
              </div>

              {/* Raw TLE Ephemeris Viewer */}
              <div className="p-4 rounded-lg bg-slate-950 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-xs text-cyan-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    RAW TWO-LINE ELEMENT SET (TLE / SGP4 FORMAT)
                  </span>
                  <button
                    onClick={copyTLE}
                    className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    {copiedTLE ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTLE ? 'COPIED TO CLIPBOARD' : 'COPY TLE'}</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-black/80 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto select-all leading-relaxed shadow-inner">
                  {`${satellite.name}\n${satellite.tleLine1}\n${satellite.tleLine2}`}
                </pre>

                <div className="mt-2.5 text-[10px] font-mono text-slate-500 flex flex-col sm:flex-row justify-between gap-1">
                  <span>Source: CelesTrak / Space-Track NORAD Ephemerides</span>
                  <span>Coordinate Frame: True Equator Mean Equinox (TEME) / WGS84</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 md:px-6 md:py-3 border-t border-cyan-500/20 bg-black/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ORBITAL TRACKING ACTIVE</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">VELOCITY: {telem ? `${telem.velocity} KM/S` : '---'}</span>
          </div>

          <button
            onClick={() => {
              audio.playSelect();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-display text-xs transition-colors cursor-pointer"
          >
            DISMISS DOSSIER
          </button>
        </div>

      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {isPhotoLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsPhotoLightboxOpen(false)}
        >
          <div 
            className="relative max-w-6xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                audio.playHover();
                setIsPhotoLightboxOpen(false);
              }}
              className="absolute -top-10 right-0 text-slate-300 hover:text-white p-2 rounded hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5 font-mono text-xs"
            >
              <span>CLOSE [ESC]</span>
              <X className="w-5 h-5" />
            </button>

            <div className="relative rounded-lg overflow-hidden border border-cyan-500/50 shadow-[0_0_70px_rgba(0,240,255,0.35)] bg-black">
              <img
                src={getSatellitePhoto(satellite).url}
                alt={satellite.name}
                className="max-h-[78vh] w-auto object-contain"
              />

              <div className="p-3.5 bg-black/95 border-t border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="text-cyan-300 font-bold block">{satellite.name} [{satellite.intlDes}]</span>
                  <span className="text-slate-300 text-[11px] block">{getSatellitePhoto(satellite).caption}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-amber-300 text-[11px] font-bold block">{getSatellitePhoto(satellite).credit}</span>
                  <span className="text-slate-500 text-[10px] block">{getSatellitePhoto(satellite).date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

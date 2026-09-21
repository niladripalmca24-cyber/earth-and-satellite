export type OrbitRegime = 'LEO' | 'MEO' | 'GEO' | 'HEO';

export type ObjectType = 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN';

export type ObjectStatus = 'ACTIVE' | 'INACTIVE' | 'DEBRIS';

export type MissionCategory = 
  | 'COMMUNICATION'
  | 'NAVIGATION'
  | 'EARTH_OBSERVATION'
  | 'WEATHER'
  | 'SCIENCE'
  | 'SPACE_STATION'
  | 'SURVEILLANCE'
  | 'DEBRIS';

export interface SatelliteData {
  id: string; // NORAD ID
  name: string;
  intlDes: string;
  regime: OrbitRegime;
  objectType: ObjectType;
  status: ObjectStatus;
  category: MissionCategory;
  constellation?: string;
  country: string;
  operator: string;
  launchYear: number;
  launchDate?: string;          // e.g. "1998-11-20"
  launchSite?: string;          // e.g. "Baikonur Cosmodrome Site 1/5"
  launchVehicle?: string;       // e.g. "Falcon 9 Block 5", "Proton-K"
  expectedLifetimeYears?: number; // e.g. 15
  spacecraftModel?: string;     // e.g. "Zarya FGB / ISS Module"
  powerWatts?: number;          // e.g. 120000 (120 kW)
  dimensionsMeters?: string;    // e.g. "108.5m x 72.8m x 20m"
  propulsionType?: string;      // e.g. "Hydrazine / Krypton Hall Thrusters"
  frequenciesBands?: string;    // e.g. "Ka-band, Ku-band, S-band"
  payloadInstruments?: string[]; // e.g. ["Canadarm2", "AMS-02", "Columbus Lab"]
  missionHighlights?: string[]; // Key operational facts or scientific discoveries
  orbitalDecayEstimate?: string;// e.g. "Controlled de-orbit ~2031 (Point Nemo)"
  imageUrl?: string;            // e.g. "/images/satellites/iss.jpg"
  imageCaption?: string;        // Descriptive caption of the real photograph
  imageCredit?: string;         // e.g. "NASA / Expedition 56 Crew", "SpaceX", "ESA"
  imageDate?: string;           // Date of photograph capture
  tleLine1: string;
  tleLine2: string;
  description?: string;
  massKg?: number;
  apogeeKm?: number;
  perigeeKm?: number;
  periodMin?: number;
  inclinationDeg?: number;
  color?: string;
}

export interface SatelliteTelemetry {
  lat: number;
  lng: number;
  alt: number; // km
  velocity: number; // km/s
  heading: number; // deg
  x: number; // 3D Three.js coordinate
  y: number;
  z: number;
  timestamp: Date;
  footprintRadiusKm: number;
  inRangeGroundStations?: string[];
}

export interface GroundStation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  network: string;
}

export type ColorGradeMode = 'ACES_FILMIC' | 'DEEP_SPACE' | 'INFRARED_RECON' | 'ORBITAL_DAWN' | 'CYBERPUNK';

export interface FilterOptions {
  search: string;
  regimes: OrbitRegime[];
  categories: MissionCategory[];
  statuses: ObjectStatus[];
  constellation: string;
  country: string;
  showOrbits: boolean;
  showGroundTracks: boolean;
  showFootprints: boolean;
  showGroundStations: boolean;
  showCommsLinks: boolean;
  showClouds: boolean;
  showNightLights: boolean;
  showAtmosphere: boolean;
  colorGrade: ColorGradeMode;
  earthBrightness?: number; // Real Earth illumination scale (e.g. 1.0 - 2.5)
}

export type ViewMode = '3D' | '2D';

export interface TimeState {
  currentSimTime: Date;
  isPlaying: boolean;
  speedMultiplier: number; // 1, 10, 100, 1000, -10, etc.
  isRealTime: boolean;
  timeZoneMode?: 'IST' | 'UTC'; // Indian Standard Time vs UTC
}

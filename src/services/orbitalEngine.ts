import * as satellite from 'satellite.js';
import { SatelliteData, SatelliteTelemetry, GroundStation } from '../types/satellite';

export const EARTH_RADIUS_KM = 6371.0;
export const THREE_EARTH_RADIUS = 100.0;
export const SCALE_FACTOR = THREE_EARTH_RADIUS / EARTH_RADIUS_KM;

// Cache parsed satrecs to avoid re-parsing TLE strings on every frame
const satrecCache = new Map<string, satellite.SatRec>();

export function getSatRec(sat: SatelliteData): satellite.SatRec | null {
  if (satrecCache.has(sat.id)) {
    return satrecCache.get(sat.id)!;
  }
  try {
    const rec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);
    satrecCache.set(sat.id, rec);
    return rec;
  } catch (err) {
    console.error(`Failed to parse TLE for ${sat.name}:`, err);
    return null;
  }
}

/**
 * Converts Geodetic Coordinates (lat in deg, lng in deg, alt in km)
 * to 3D Cartesian coordinates for Three.js
 */
export function geodeticToVector3(latDeg: number, lngDeg: number, altKm: number = 0): [number, number, number] {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lngDeg + 180) * (Math.PI / 180);
  const r = THREE_EARTH_RADIUS + altKm * SCALE_FACTOR;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return [x, y, z];
}

/**
 * Calculates geometric sensor coverage / visibility radius on Earth surface
 */
export function calculateFootprintRadiusKm(altKm: number): number {
  if (altKm <= 0) return 100;
  // Angular distance theta = acos(R / (R + h))
  const theta = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm));
  return EARTH_RADIUS_KM * theta;
}

/**
 * Propagate satellite to a specific Date using SGP4
 */
export function propagateSatellite(
  sat: SatelliteData,
  date: Date,
  groundStations: GroundStation[] = []
): SatelliteTelemetry | null {
  const satrec = getSatRec(sat);
  if (!satrec) return null;

  try {
    const positionAndVelocity = satellite.propagate(satrec, date);
    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    if (!positionEci || typeof positionEci === 'boolean') {
      return null;
    }

    const gmst = satellite.gstime(date);
    const geodetic = satellite.eciToGeodetic(positionEci as satellite.EciVec3<number>, gmst);

    const lat = satellite.degreesLat(geodetic.latitude);
    const lng = satellite.degreesLong(geodetic.longitude);
    const alt = geodetic.height; // in km

    // Velocity magnitude in km/s
    let velocity = 7.5;
    if (velocityEci && typeof velocityEci !== 'boolean') {
      const v = velocityEci as satellite.EciVec3<number>;
      velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    const [x, y, z] = geodeticToVector3(lat, lng, alt);
    const footprintRadiusKm = calculateFootprintRadiusKm(alt);

    // Check which ground stations are in range
    const inRangeStations: string[] = [];
    groundStations.forEach(st => {
      const dLat = (st.lat - lat) * Math.PI / 180;
      const dLng = (st.lng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(st.lat * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = EARTH_RADIUS_KM * c;
      if (distKm <= footprintRadiusKm) {
        inRangeStations.push(st.id);
      }
    });

    return {
      lat,
      lng,
      alt: Math.max(100, alt),
      velocity: Math.round(velocity * 100) / 100,
      heading: 0,
      x,
      y,
      z,
      timestamp: date,
      footprintRadiusKm,
      inRangeGroundStations: inRangeStations
    };
  } catch (err) {
    return null;
  }
}

/**
 * Generates 3D orbit trajectory line points for a full orbital cycle
 */
export function generateOrbitPath(
  sat: SatelliteData,
  referenceDate: Date,
  pointsCount: number = 120
): Array<[number, number, number]> {
  const periodMinutes = sat.periodMin || 95;
  const stepMs = (periodMinutes * 60 * 1000) / pointsCount;
  const path: Array<[number, number, number]> = [];

  const startTime = referenceDate.getTime();
  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime + i * stepMs);
    const telem = propagateSatellite(sat, time);
    if (telem) {
      path.push([telem.x, telem.y, telem.z]);
    }
  }

  return path;
}

/**
 * Generates 2D Ground Track (lat, lng points) for map visualization
 */
export function generateGroundTrack(
  sat: SatelliteData,
  referenceDate: Date,
  pointsCount: number = 90
): Array<{ lat: number; lng: number }> {
  const periodMinutes = sat.periodMin || 95;
  const stepMs = (periodMinutes * 60 * 1000) / pointsCount;
  const track: Array<{ lat: number; lng: number }> = [];

  const startTime = referenceDate.getTime();
  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime + i * stepMs);
    const telem = propagateSatellite(sat, time);
    if (telem) {
      track.push({ lat: telem.lat, lng: telem.lng });
    }
  }

  return track;
}

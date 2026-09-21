import * as THREE from 'three';
import { geodeticToVector3 } from './orbitalEngine';

/**
 * Time Synchronization & Solar Mechanics Service
 * Designed for real-time Earth illumination syncing with Indian Standard Time (IST, UTC+05:30)
 */

// India reference center (Mirzapur / Prayagraj 82.5°E, standard meridian for IST, 23.5°N)
export const INDIA_STANDARD_MERIDIAN_LNG = 82.5;
export const INDIA_REFERENCE_LAT = 22.0;

// Camera Spherical coordinates to center directly on India & Indian Ocean
// theta: ~3.01 radians (~172.5°), phi: ~1.20 radians (~68.8°), radius: 310
export const INDIA_CAMERA_VIEW = {
  radius: 310,
  phi: Math.PI / 2.6,
  theta: 3.01
};

/**
 * Formats time in Indian Standard Time (IST, UTC+05:30)
 * e.g. "14:35:08"
 */
export function formatISTTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    // Fallback manual UTC+5:30 offset
    const istMs = date.getTime() + (5.5 * 3600 * 1000);
    const istDate = new Date(istMs);
    const h = String(istDate.getUTCHours()).padStart(2, '0');
    const m = String(istDate.getUTCMinutes()).padStart(2, '0');
    const s = String(istDate.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}

/**
 * Formats date in Indian Standard Time (IST)
 * e.g. "22 Sep 2026"
 */
export function formatISTDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    const istMs = date.getTime() + (5.5 * 3600 * 1000);
    const istDate = new Date(istMs);
    return istDate.toUTCString().slice(5, 16);
  }
}

/**
 * Calculates Subsolar Geographic Coordinates (Lat, Lng) for any simulation date
 */
export function calculateSubsolarCoords(date: Date): { lat: number; lng: number } {
  // Fractional UTC hours
  const hours = date.getUTCHours() + 
                date.getUTCMinutes() / 60 + 
                date.getUTCSeconds() / 3600 + 
                date.getUTCMilliseconds() / 3600000;

  // Subsolar longitude:
  // At 12:00:00 UTC, the sun is at the Greenwich Meridian (0° Longitude).
  // At 06:30:00 UTC (12:00:00 IST), the sun is at 82.5° East Longitude (solar noon in India).
  // Earth rotates eastward at 15° per hour, so the subsolar point moves westward.
  let sunLng = -(hours - 12) * 15;
  while (sunLng > 180) sunLng -= 360;
  while (sunLng < -180) sunLng += 360;

  // Solar declination (subsolar latitude):
  // Day of year calculation
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  
  // Approximate solar declination (-23.44° to +23.44°)
  // Day 80 is approximately the Vernal Equinox (March 21)
  const sunLat = 23.44 * Math.sin(((dayOfYear - 80) * 360 / 365.25) * (Math.PI / 180));

  return { lat: sunLat, lng: sunLng };
}

/**
 * Calculates normalized 3D Cartesian vector pointing FROM Earth center TO Sun
 * Perfectly aligned with Three.js Earth geometry coordinates:
 * - Lat 0, Lng 0 is at (+X, 0, 0)
 * - North Pole is at (0, +Y, 0)
 * - Lng +90°E (India/Indian Ocean) is along (-Z, 0, 0)
 */
export function calculateSubsolarVector(date: Date): THREE.Vector3 {
  const { lat, lng } = calculateSubsolarCoords(date);
  const [sx, sy, sz] = geodeticToVector3(lat, lng, 0);
  return new THREE.Vector3(sx, sy, sz).normalize();
}

/**
 * Calculates solar status over India for the current simulation time
 */
export function getIndiaSolarStatus(date: Date): { 
  isDaytime: boolean; 
  sunElevationDeg: number; 
  statusLabel: string;
  description: string;
} {
  const { lat: sunLat, lng: sunLng } = calculateSubsolarCoords(date);
  
  // Great-circle angular distance between subsolar point and India center
  const dLat = (INDIA_REFERENCE_LAT - sunLat) * (Math.PI / 180);
  const dLng = (INDIA_STANDARD_MERIDIAN_LNG - sunLng) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(sunLat * (Math.PI / 180)) * Math.cos(INDIA_REFERENCE_LAT * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const zenithAngleRad = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const elevationDeg = 90 - (zenithAngleRad * 180 / Math.PI);

  const isDaytime = elevationDeg > -6; // includes civil twilight

  let statusLabel = 'NIGHT';
  let description = 'Unlit hemisphere: glowing night city lights active over India';

  if (elevationDeg > 45) {
    statusLabel = 'HIGH NOON';
    description = 'Brilliant direct sunlight overhead in India';
  } else if (elevationDeg > 0) {
    statusLabel = 'DAYLIGHT';
    description = 'Illuminated day hemisphere in India';
  } else if (elevationDeg > -6) {
    statusLabel = 'TWILIGHT';
    description = 'Atmospheric dawn / dusk transition over India';
  }

  return {
    isDaytime,
    sunElevationDeg: Math.round(elevationDeg),
    statusLabel,
    description
  };
}

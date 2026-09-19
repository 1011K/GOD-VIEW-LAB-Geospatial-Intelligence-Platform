import { SatelliteRecord } from '../types';

// Constants for WGS-84 / Earth Gravitational Model
const EARTH_RADIUS_KM = 6378.137;
const EARTH_FLATTENING = 1.0 / 298.257223563;
const EARTH_MU_KM3_S2 = 398600.4418; // Standard gravitational parameter
const J2 = 1.08262668e-3; // Earth J2 oblateness harmonic
const SECONDS_PER_DAY = 86400;
const TWO_PI = 2 * Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export interface ParsedTLE {
  noradId: string;
  epochYear: number;
  epochDay: number;
  epochDate: Date;
  inclinationDeg: number;
  raanDeg: number;
  eccentricity: number;
  argPerigeeDeg: number;
  meanAnomalyDeg: number;
  meanMotionRevPerDay: number;
  bstar: number;
}

export interface GroundTrackPoint {
  latitude: number;
  longitude: number;
  time: Date;
  isPast: boolean;
}

export interface SatellitePass {
  satelliteName: string;
  noradId: string;
  startTime: Date;
  maxElevationTime: Date;
  endTime: Date;
  maxElevationDeg: number;
  durationMinutes: number;
}

export function parseTLE(line1: string, line2: string): ParsedTLE | null {
  try {
    const l1 = line1.trim();
    const l2 = line2.trim();
    if (!l1.startsWith('1 ') || !l2.startsWith('2 ')) return null;

    const noradId = l1.substring(2, 7).trim();
    
    // Parse Epoch
    const rawEpochYear = parseInt(l1.substring(18, 20), 10);
    const epochYear = rawEpochYear < 57 ? 2000 + rawEpochYear : 1900 + rawEpochYear;
    const epochDay = parseFloat(l1.substring(20, 32));

    // Convert epoch to Date
    const startOfYear = new Date(Date.UTC(epochYear, 0, 1));
    const epochDate = new Date(startOfYear.getTime() + (epochDay - 1) * SECONDS_PER_DAY * 1000);

    // Parse BSTAR drag
    let bstarStr = l1.substring(53, 61).trim();
    let bstar = 0;
    if (bstarStr) {
      const mantissa = parseFloat(bstarStr.substring(0, bstarStr.length - 2)) * 1e-5;
      const exp = parseInt(bstarStr.substring(bstarStr.length - 2), 10);
      bstar = mantissa * Math.pow(10, exp);
    }

    // Line 2
    const inclinationDeg = parseFloat(l2.substring(8, 16));
    const raanDeg = parseFloat(l2.substring(17, 25));
    const eccentricity = parseFloat('0.' + l2.substring(26, 33).trim());
    const argPerigeeDeg = parseFloat(l2.substring(34, 42));
    const meanAnomalyDeg = parseFloat(l2.substring(43, 51));
    const meanMotionRevPerDay = parseFloat(l2.substring(52, 63));

    return {
      noradId,
      epochYear,
      epochDay,
      epochDate,
      inclinationDeg,
      raanDeg,
      eccentricity,
      argPerigeeDeg,
      meanAnomalyDeg,
      meanMotionRevPerDay,
      bstar
    };
  } catch (err) {
    return null;
  }
}

// Compute Greenwich Mean Sidereal Time (GMST) in radians for a given Date
function calculateGMST(date: Date): number {
  const jd = (date.getTime() / 86400000) + 2440587.5;
  const d = jd - 2451545.0;
  const gmstHours = 18.697374558 + 24.06570982441908 * d;
  const gmstRad = ((gmstHours % 24) * (Math.PI / 12) + TWO_PI) % TWO_PI;
  return gmstRad;
}

// Solve Kepler's equation for Eccentric Anomaly: E - e*sin(E) = M
function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  let E = meanAnomalyRad;
  for (let i = 0; i < 10; i++) {
    const delta = (E - eccentricity * Math.sin(E) - meanAnomalyRad) / (1 - eccentricity * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }
  return E;
}

export function calculateSatellitePosition(sat: SatelliteRecord, date: Date = new Date()): SatelliteRecord['calculated'] | null {
  try {
    if (!sat.line1 || !sat.line2) return null;
    const tle = parseTLE(sat.line1, sat.line2);
    if (!tle) return null;

    // Time difference from epoch in seconds
    const deltaTSeconds = (date.getTime() - tle.epochDate.getTime()) / 1000;

    // Mean motion n in radians/sec
    const n = (tle.meanMotionRevPerDay * TWO_PI) / SECONDS_PER_DAY;

    // Semi-major axis a (km)
    const a = Math.pow(EARTH_MU_KM3_S2 / Math.pow(n, 2), 1 / 3);

    // Semi-latus rectum p
    const p = a * (1 - Math.pow(tle.eccentricity, 2));

    // Inclination, RAAN, Argument of Perigee in radians
    const incRad = tle.inclinationDeg * DEG_TO_RAD;
    const argPerigeeRad = tle.argPerigeeDeg * DEG_TO_RAD;

    // J2 Nodal Precession of RAAN (rad/s) and apsidal precession of arg perigee
    const dOmega = -1.5 * J2 * Math.pow(EARTH_RADIUS_KM / Math.max(1, p), 2) * n * Math.cos(incRad);
    const dOmegaAps = 0.75 * J2 * Math.pow(EARTH_RADIUS_KM / Math.max(1, p), 2) * n * (5 * Math.pow(Math.cos(incRad), 2) - 1);

    const raanRad = (tle.raanDeg * DEG_TO_RAD + dOmega * deltaTSeconds) % TWO_PI;
    const omegaRad = (argPerigeeRad + dOmegaAps * deltaTSeconds) % TWO_PI;

    // Mean anomaly at target time
    const meanAnomalyRad = ((tle.meanAnomalyDeg * DEG_TO_RAD + n * deltaTSeconds) % TWO_PI + TWO_PI) % TWO_PI;

    // Eccentric Anomaly E
    const E = solveKepler(meanAnomalyRad, tle.eccentricity);

    // True Anomaly nu
    const sinNu = (Math.sqrt(1 - Math.pow(tle.eccentricity, 2)) * Math.sin(E)) / (1 - tle.eccentricity * Math.cos(E));
    const cosNu = (Math.cos(E) - tle.eccentricity) / (1 - tle.eccentricity * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);

    // Radius r (km)
    const r = a * (1 - tle.eccentricity * Math.cos(E));

    // Position in orbital plane
    const u = omegaRad + nu; // Argument of latitude
    const xOrb = r * Math.cos(u);
    const yOrb = r * Math.sin(u);

    // Coordinate conversion to Earth-Centered Inertial (ECI)
    const xEci = xOrb * Math.cos(raanRad) - yOrb * Math.cos(incRad) * Math.sin(raanRad);
    const yEci = xOrb * Math.sin(raanRad) + yOrb * Math.cos(incRad) * Math.cos(raanRad);
    const zEci = yOrb * Math.sin(incRad);

    // Instantaneous Orbital Velocity (vis-viva equation)
    const velocityKmS = Math.sqrt(Math.max(0, EARTH_MU_KM3_S2 * (2 / r - 1 / a)));

    // Greenwich Mean Sidereal Time
    const gmst = calculateGMST(date);

    // Earth-Centered Earth-Fixed (ECEF) rotation
    const xEcef = xEci * Math.cos(gmst) + yEci * Math.sin(gmst);
    const yEcef = -xEci * Math.sin(gmst) + yEci * Math.cos(gmst);
    const zEcef = zEci;

    // Geodetic Latitude, Longitude, Altitude (WGS-84 Bowring algorithm)
    const lonRad = Math.atan2(yEcef, xEcef);
    const pEcef = Math.sqrt(xEcef * xEcef + yEcef * yEcef);
    
    let latRad = Math.atan2(zEcef, pEcef * (1 - Math.pow(1 - EARTH_FLATTENING, 2)));
    for (let i = 0; i < 4; i++) {
      const sinLat = Math.sin(latRad);
      const N = EARTH_RADIUS_KM / Math.sqrt(1 - (2 * EARTH_FLATTENING - Math.pow(EARTH_FLATTENING, 2)) * sinLat * sinLat);
      latRad = Math.atan2(zEcef + (2 * EARTH_FLATTENING - Math.pow(EARTH_FLATTENING, 2)) * N * sinLat, pEcef);
    }

    const sinLatFinal = Math.sin(latRad);
    const NFinal = EARTH_RADIUS_KM / Math.sqrt(1 - (2 * EARTH_FLATTENING - Math.pow(EARTH_FLATTENING, 2)) * sinLatFinal * sinLatFinal);
    const altitudeKm = Math.max(100, pEcef / Math.cos(latRad) - NFinal);

    const latitude = latRad * RAD_TO_DEG;
    let longitude = lonRad * RAD_TO_DEG;
    // Normalize longitude -180 to 180
    while (longitude > 180) longitude -= 360;
    while (longitude < -180) longitude += 360;

    // Ground footprint calculation (geometric visibility horizon radius in km)
    const horizonAngle = Math.acos(Math.min(0.999, EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm)));
    const footprintRadiusKm = EARTH_RADIUS_KM * horizonAngle;

    const periodMinutes = (24 * 60) / tle.meanMotionRevPerDay;

    return {
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
      altitudeKm: Math.round(altitudeKm),
      velocityKmS: Number(velocityKmS.toFixed(2)),
      footprintRadiusKm: Math.round(footprintRadiusKm),
      periodMinutes: Number(periodMinutes.toFixed(1)),
      inclinationDeg: Number(tle.inclinationDeg.toFixed(2))
    };
  } catch (err) {
    console.error(`Error in satellite propagator for ${sat.name}:`, err);
    return null;
  }
}

// Calculate full ground track (segments before and after current time)
export function calculateGroundTrack(
  sat: SatelliteRecord, 
  centerDate: Date = new Date(), 
  pastMinutes: number = 45, 
  futureMinutes: number = 45,
  stepSeconds: number = 60
): GroundTrackPoint[][] {
  const segments: GroundTrackPoint[][] = [];
  let currentSegment: GroundTrackPoint[] = [];

  const startTime = new Date(centerDate.getTime() - pastMinutes * 60000);
  const endTime = new Date(centerDate.getTime() + futureMinutes * 60000);

  let prevLon: number | null = null;

  for (let t = startTime.getTime(); t <= endTime.getTime(); t += stepSeconds * 1000) {
    const d = new Date(t);
    const pos = calculateSatellitePosition(sat, d);
    if (!pos) continue;

    const point: GroundTrackPoint = {
      latitude: pos.latitude,
      longitude: pos.longitude,
      time: d,
      isPast: t < centerDate.getTime()
    };

    // Detect antimeridian crossing (-180 / 180 jump) to break polyline segments cleanly
    if (prevLon !== null && Math.abs(pos.longitude - prevLon) > 180) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }

    currentSegment.push(point);
    prevLon = pos.longitude;
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

// Predict upcoming visual / telemetry passes over an observer ground station
export function calculateUpcomingPasses(
  sat: SatelliteRecord,
  observerLat: number,
  observerLng: number,
  startDate: Date = new Date(),
  lookaheadHours: number = 24
): SatellitePass[] {
  const passes: SatellitePass[] = [];
  const startMs = startDate.getTime();
  const endMs = startMs + lookaheadHours * 3600000;
  const stepMs = 60000; // 1 minute resolution

  let inPass = false;
  let passStart = startDate;
  let maxEl = 0;
  let maxElTime = startDate;

  for (let t = startMs; t <= endMs; t += stepMs) {
    const curDate = new Date(t);
    const pos = calculateSatellitePosition(sat, curDate);
    if (!pos) continue;

    // Approximate elevation angle from observer to satellite
    const dLat = (pos.latitude - observerLat) * DEG_TO_RAD;
    const dLng = (pos.longitude - observerLng) * DEG_TO_RAD;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(observerLat * DEG_TO_RAD) * Math.cos(pos.latitude * DEG_TO_RAD) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distGroundKm = EARTH_RADIUS_KM * centralAngle;

    // Elevation angle
    const elRad = Math.atan2(
      pos.altitudeKm * Math.cos(centralAngle) - EARTH_RADIUS_KM * (1 - Math.cos(centralAngle)),
      (EARTH_RADIUS_KM + pos.altitudeKm) * Math.sin(centralAngle)
    );
    const elevationDeg = elRad * RAD_TO_DEG;

    if (elevationDeg > 10) { // 10 degrees above horizon threshold
      if (!inPass) {
        inPass = true;
        passStart = curDate;
        maxEl = elevationDeg;
        maxElTime = curDate;
      } else {
        if (elevationDeg > maxEl) {
          maxEl = elevationDeg;
          maxElTime = curDate;
        }
      }
    } else {
      if (inPass) {
        inPass = false;
        const durationMin = (curDate.getTime() - passStart.getTime()) / 60000;
        if (durationMin >= 2) {
          passes.push({
            satelliteName: sat.name,
            noradId: sat.noradId,
            startTime: passStart,
            maxElevationTime: maxElTime,
            endTime: curDate,
            maxElevationDeg: Math.round(maxEl),
            durationMinutes: Math.round(durationMin)
          });
        }
      }
    }
  }

  return passes.slice(0, 5);
}

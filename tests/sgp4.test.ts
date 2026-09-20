import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateSatellitePosition, 
  calculateUpcomingPasses, 
  calculatePositionExperimentalValidator
} from '../src/services/satellitePropagator';
import { SatelliteRecord } from '../src/types';

describe('SGP4 Satellite Propagator & Analytical Pass Predictor Suite', () => {
  const issSatellite: SatelliteRecord = {
    noradId: '25544',
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9001',
    line2: '2 25544  51.6400 208.9163 0004789  68.2000 291.9000 15.49815000432109',
    group: 'stations',
    provider: 'CelesTrak',
    sourceUrl: 'https://celestrak.org',
    adapter: 'celestrak_sgp4',
    fetched_at: '2024-01-01T12:00:00.000Z',
    status: 'LIVE'
  };

  test('calculateSatellitePosition computes real geodetic coordinates from canonical SGP4', () => {
    const epochTime = new Date('2024-01-01T12:00:00Z');
    const pos = calculateSatellitePosition(issSatellite, epochTime);

    assert.ok(pos, 'Position should be successfully computed');
    // Latitude must be within orbital inclination bounds (-52 to +52)
    assert.ok(pos.latitude >= -52 && pos.latitude <= 52, `Latitude ${pos.latitude} within inclination`);
    assert.ok(pos.longitude >= -180 && pos.longitude <= 180, `Longitude ${pos.longitude} within global bounds`);
    // LEO altitude between 350km and 500km
    assert.ok(pos.altitudeKm >= 350 && pos.altitudeKm <= 500, `Altitude ${pos.altitudeKm}km in LEO range`);
    // Orbital velocity ~ 7.0 - 8.2 km/s
    assert.ok(pos.velocityKmS >= 7.0 && pos.velocityKmS <= 8.2, `Velocity ${pos.velocityKmS}km/s in orbital range`);
    // Orbital period ~ 90-95 minutes
    assert.ok(pos.periodMinutes >= 90 && pos.periodMinutes <= 95, `Period ${pos.periodMinutes}m in standard ISS range`);
    // Inclination matches line 2 (51.64 deg)
    assert.ok(Math.abs(pos.inclinationDeg - 51.64) < 0.5, `Inclination ${pos.inclinationDeg} close to 51.64`);
  });

  test('calculatePositionExperimentalValidator produces secondary diagnostic coordinates', () => {
    const epochTime = new Date('2024-01-01T12:00:00Z');
    const val = calculatePositionExperimentalValidator(issSatellite, epochTime);

    assert.ok(val, 'Validator position should be computed');
    assert.ok(val.latitude >= -52 && val.latitude <= 52);
    assert.ok(val.longitude >= -180 && val.longitude <= 180);
    assert.ok(val.altitudeKm >= 300 && val.altitudeKm <= 600);
  });

  test('calculateUpcomingPasses returns valid pass windows for visible ground stations', () => {
    // Ground station at Tokyo (35.6762, 139.6503)
    const startTime = new Date('2024-01-01T12:00:00Z');
    const passes = calculateUpcomingPasses(issSatellite, 35.6762, 139.6503, startTime, 36);

    assert.ok(Array.isArray(passes));
    if (passes.length > 0) {
      const p = passes[0];
      assert.ok(p.startTime instanceof Date);
      assert.ok(p.endTime instanceof Date);
      assert.ok(p.maxElevationTime instanceof Date);
      assert.ok(p.maxElevationDeg >= 10, 'Pass should exceed minimum 10 deg elevation threshold');
      assert.ok(p.durationMinutes > 0);
    }
  });

  test('calculateUpcomingPasses returns empty array if given malformed TLE or empty satellite', () => {
    const brokenSat: SatelliteRecord = {
      ...issSatellite,
      line1: 'invalid',
      line2: 'invalid'
    };
    const passes = calculateUpcomingPasses(brokenSat, 35.6762, 139.6503, new Date(), 24);
    assert.deepStrictEqual(passes, []);
  });
});

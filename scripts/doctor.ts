import http from 'node:http';
import { app } from '../server';
import { PUBLIC_CAMERAS_DATA } from '../src/data/publicCamerasData';
import { calculateSatellitePosition } from '../src/services/satellitePropagator';

interface DiagnosticResult {
  category: string;
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
  optional?: boolean;
}

const results: DiagnosticResult[] = [];

function record(category: string, check: string, status: 'PASS' | 'WARN' | 'FAIL', detail: string, optional = false) {
  results.push({ category, check, status, detail, optional });
}

async function runDoctor() {
  console.log('====================================================');
  console.log('   GOD-VIEW-LAB / ASTRA GEOSPATIAL DOCTOR (V2)');
  console.log('====================================================\n');

  // 1. Environment & Node Runtime
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (major >= 20) {
    record('Runtime', 'Node.js Version', 'PASS', `Running on ${nodeVersion} (>= v20 required)`);
  } else {
    record('Runtime', 'Node.js Version', 'FAIL', `Running on ${nodeVersion}. Minimum Node v20 recommended`);
  }

  // 2. SGP4 Orbital Mechanics Propagator
  try {
    const issSatellite = {
      noradId: '25544',
      name: 'ISS (ZARYA)',
      line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9001',
      line2: '2 25544  51.6400 208.9163 0004789  68.2000 291.9000 15.49815000432109',
      group: 'stations' as const,
      provider: 'CelesTrak',
      sourceUrl: 'https://celestrak.org',
      adapter: 'celestrak_sgp4',
      fetched_at: '2024-01-01T12:00:00.000Z',
      status: 'LIVE' as const
    };
    const pos = calculateSatellitePosition(issSatellite, new Date('2024-01-01T12:00:00Z'));
    if (pos && typeof pos.latitude === 'number' && typeof pos.longitude === 'number') {
      record('Astrodynamics', 'SGP4 Analytical Propagator', 'PASS', `ISS geodetic fix calculated at [${pos.latitude.toFixed(2)}°, ${pos.longitude.toFixed(2)}°], alt: ${pos.altitudeKm.toFixed(1)}km, vel: ${pos.velocityKmS.toFixed(2)}km/s`);
    } else {
      record('Astrodynamics', 'SGP4 Analytical Propagator', 'FAIL', 'SGP4 propagator returned invalid position object');
    }
  } catch (err: any) {
    record('Astrodynamics', 'SGP4 Analytical Propagator', 'FAIL', `SGP4 execution error: ${err.message}`);
  }

  // 3. Camera System Catalog & State Machine
  const registeredCams = PUBLIC_CAMERAS_DATA.filter(c => c.status === 'REGISTERED');
  const videoCams = PUBLIC_CAMERAS_DATA.filter(c => c.media_type === 'video');
  if (PUBLIC_CAMERAS_DATA.length >= 20 && registeredCams.length === PUBLIC_CAMERAS_DATA.length) {
    record('Cameras', 'Camera Catalog Initial State', 'PASS', `${PUBLIC_CAMERAS_DATA.length} cameras configured with initial REGISTERED state (${videoCams.length} live video streams)`);
  } else {
    record('Cameras', 'Camera Catalog Initial State', 'WARN', `Found un-registered initial cameras or catalog size < 20`);
  }

  // 4. In-process Server Diagnostics
  let server: http.Server;
  let baseUrl = '';
  try {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    record('Server', 'Express HTTP Listener', 'PASS', `Ephemeral test server booted on ${baseUrl}`);
  } catch (err: any) {
    record('Server', 'Express HTTP Listener', 'FAIL', `Failed to boot test server: ${err.message}`);
  }

  if (baseUrl) {
    // 5. Check AI Capabilities (Keyless Safety)
    try {
      const res = await fetch(`${baseUrl}/api/ai/capabilities`);
      const json = (await res.json()) as any;
      if (json.available) {
        record('AI Intelligence', 'Google Gemini Provider', 'PASS', `AI is configured and operational with model: ${json.model}`, true);
      } else {
        record('AI Intelligence', 'Google Gemini Provider', 'PASS', `AI is optional / not configured. Core app operates 100% keyless.`, true);
      }
    } catch (err: any) {
      record('AI Intelligence', 'Google Gemini Provider', 'WARN', `Failed to query AI capabilities: ${err.message}`, true);
    }

    // 6. Check System Readiness Contract
    try {
      const res = await fetch(`${baseUrl}/api/system/readiness`);
      const json = (await res.json()) as any;
      if (json.overall === 'PASS' || json.overall === 'DEGRADED') {
        record('Health Contract', 'System Readiness Endpoint', 'PASS', `Readiness overall: ${json.overall} (Core Total: ${json.coreTotal}, Optional: ${json.optionalUnavailable}, Commit: ${json.commit})`);
      } else {
        record('Health Contract', 'System Readiness Endpoint', 'WARN', `Readiness overall reported ${json.overall}`);
      }
    } catch (err: any) {
      record('Health Contract', 'System Readiness Endpoint', 'FAIL', `Readiness check failed: ${err.message}`);
    }

    // 7. Check Empirical Observation Store
    try {
      const res = await fetch(`${baseUrl}/api/sources/health`);
      const json = (await res.json()) as any;
      if (json.success && Array.isArray(json.data) && json.data.length >= 10) {
        record('Observability', 'Source Health Telemetry', 'PASS', `${json.data.length} telemetry streams tracked in empirical observation store`);
      } else {
        record('Observability', 'Source Health Telemetry', 'WARN', `Observation store returned fewer than 10 sources`);
      }
    } catch (err: any) {
      record('Observability', 'Source Health Telemetry', 'FAIL', `Health store error: ${err.message}`);
    }

    // 8. Test Carto Dark Matter Keyless Map Tiles
    try {
      const tileRes = await fetch('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/1/1/0.png', {
        headers: { 'User-Agent': 'GOD-VIEW-LAB-Doctor/1.0' }
      });
      if (tileRes.ok) {
        record('Map Tiles', 'Carto Dark Matter (Keyless 2D/3D)', 'PASS', `Raster tile endpoint reachable (HTTP ${tileRes.status}, Content-Type: ${tileRes.headers.get('content-type')})`);
      } else {
        record('Map Tiles', 'Carto Dark Matter (Keyless 2D/3D)', 'WARN', `Tile server returned HTTP ${tileRes.status}`);
      }
    } catch (err: any) {
      record('Map Tiles', 'Carto Dark Matter (Keyless 2D/3D)', 'WARN', `Failed to reach external tile server: ${err.message}`);
    }

    // Close test server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // Print Formatted Report
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const r of results) {
    const symbol = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`${symbol} [${r.category.padEnd(14)}] ${r.check.padEnd(32)}: ${r.detail}`);
    if (r.status === 'PASS') passCount++;
    if (r.status === 'WARN') warnCount++;
    if (r.status === 'FAIL') failCount++;
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passCount} Passed | ${warnCount} Warnings | ${failCount} Failed`);
  if (failCount === 0) {
    console.log('STATUS : SYSTEM FULLY OPERATIONAL (100% KEYLESS READY)');
  } else {
    console.log('STATUS : SYSTEM HAS CRITICAL FAILURES');
  }
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runDoctor().catch((err) => {
  console.error('Doctor fatal error:', err);
  process.exit(1);
});

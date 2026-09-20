import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../server';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('ASTRA God View & Argos Atlas End-to-End Verification Suite', () => {

  // 1. Argos Atlas Benchmark #power=63031 and Power Infrastructure
  describe('1. Power Plant & Energy Infrastructure (#power=63031)', () => {
    test('GET /api/power/63031 resolves Dominion Energy Gloucester Solar with strict static provenance', async () => {
      const res = await fetch(`${baseUrl}/api/power/63031`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.ok(json.data, 'Expected data object');
      assert.strictEqual(json.data.id, 'power-63031');
      assert.strictEqual(json.data.eia_id, '63031');
      assert.strictEqual(json.data.name, 'Dominion Energy Gloucester Solar');
      assert.strictEqual(json.data.capacity_mw, 20);
      assert.strictEqual(json.data.company_id, 'DOMINION');
      assert.strictEqual(json.data.operator, 'Dominion Energy Inc.');
      assert.strictEqual(json.data.status, 'STATIC_REFERENCE');
      assert.strictEqual(json.data.grid_interconnection, 'PJM Interconnection (Queue AB2-085)');
      assert.ok(json.data.provider.includes('EIA-860'));
    });

    test('GET /api/power/power-mundra resolves Tata Power Mundra UMPP', async () => {
      const res = await fetch(`${baseUrl}/api/power/power-mundra`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.id, 'power-mundra');
      assert.strictEqual(json.data.capacity_mw, 4150);
      assert.strictEqual(json.data.company_id, 'TATAPOWER');
      assert.strictEqual(json.data.status, 'STATIC_REFERENCE');
    });

    test('Fail-Closed: GET /api/power/invalid-eia-999999 returns 404', async () => {
      const res = await fetch(`${baseUrl}/api/power/invalid-eia-999999`);
      assert.strictEqual(res.status, 404);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('not found'));
    });
  });

  // 2. Zero-Mock Runtime AIS Marine Stream
  describe('2. Runtime AIS Maritime Adapter (Zero-Mock Stream)', () => {
    test('GET /api/vessels invokes live Digitraffic AIS adapter without synthetic fallback', async () => {
      const res = await fetch(`${baseUrl}/api/vessels`);
      
      // The endpoint must either return 200 (live stream parsed) or 503 (fail closed if upstream unreachable)
      // Never 200 with fake/mock random vessels!
      if (res.status === 200) {
        const json = (await res.json()) as any;
        assert.strictEqual(json.success, true);
        assert.strictEqual(json.status, 'LIVE');
        assert.strictEqual(json.provider, 'Fintraffic / Digitraffic Live Marine AIS (Gulf of Finland & Baltic Sea)');
        assert.ok(Array.isArray(json.data), 'Expected array of vessels');
        assert.ok(json.data.length > 0, 'Expected non-empty live vessel array');

        // Verify transponder fields of first vessel
        const sample = json.data[0];
        assert.ok(typeof sample.mmsi === 'string' && /^\d+$/.test(sample.mmsi), 'Valid numeric string MMSI transponder ID');
        assert.strictEqual(sample.source, 'LIVE_AIS');
        assert.strictEqual(sample.adapter, 'server/digitraffic_ais_adapter');
        assert.ok(typeof sample.latitude === 'number' && sample.latitude >= -90 && sample.latitude <= 90);
        assert.ok(typeof sample.longitude === 'number' && sample.longitude >= -180 && sample.longitude <= 180);
        assert.ok(typeof sample.speed_knots === 'number' && sample.speed_knots >= 0);
        assert.ok(typeof sample.course_deg === 'number' && sample.course_deg >= 0 && sample.course_deg <= 360);
      } else {
        assert.strictEqual(res.status, 503, 'Expected fail-closed 503 when upstream AIS is unreachable');
        const json = (await res.json()) as any;
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.status, 'SOURCE UNAVAILABLE');
        assert.strictEqual(json.data, undefined, 'Zero fallback data permitted on upstream failure');
      }
    });
  });

  // 3. Camera Health Transitions & Provenance
  describe('3. Public Cameras: Initial REGISTERED State & Health Probe Promotion', () => {
    test('GET /api/cameras returns catalog with all cameras initialized to REGISTERED status', async () => {
      const res = await fetch(`${baseUrl}/api/cameras`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.strictEqual(json.status, 'STATIC_REFERENCE');
      assert.ok(Array.isArray(json.data));
      assert.ok(json.data.length > 0);

      // Every camera in the initial static catalog must be REGISTERED until probed
      for (const camera of json.data) {
        assert.strictEqual(
          camera.status,
          'REGISTERED',
          `Camera ${camera.id} must initialize to REGISTERED, but was ${camera.status}`
        );
      }
    });

    test('POST /api/cameras/check-status probes upstream and emits live status timestamp', async () => {
      // Test probing a known public endpoint
      const res = await fetch(`${baseUrl}/api/cameras/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://images.drivebc.ca/bchighwaycam/pub/html/dbc/1.html'
        })
      });

      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, true);
      assert.ok(json.status === 'LIVE' || json.status === 'REACHABLE' || json.status === 'UNAVAILABLE');
      assert.ok(typeof json.checked_at === 'string');
      assert.ok(Date.now() - new Date(json.checked_at).getTime() < 15000, 'Probe timestamp must be fresh (<15s)');
    });

    test('Fail-Closed: POST /api/cameras/check-status requires url payload', async () => {
      const res = await fetch(`${baseUrl}/api/cameras/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, false);
    });

    test('Fail-Closed: GET /api/cameras with invalid viewport coordinates returns 400', async () => {
      const res = await fetch(`${baseUrl}/api/cameras?minLat=abc&maxLat=xyz`);
      assert.strictEqual(res.status, 400);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, false);
      assert.ok(json.error.includes('Invalid bounding box'));
    });
  });

  // 4. Company Intelligence & Canonical Linkage Decoupling
  describe('4. Company Intelligence & Primary Source Verification', () => {
    test('GET /api/companies/RELIANCE returns verified regulatory physical assets with zero fake signals', async () => {
      const res = await fetch(`${baseUrl}/api/companies/RELIANCE`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.company_id, 'RELIANCE');
      assert.strictEqual(json.data.ticker, 'RELIANCE');
      assert.strictEqual(json.data.exchange, 'NSE');
      assert.strictEqual(json.data.status, 'STATIC_REFERENCE');

      // Canonical links to real ASTRA modules
      assert.strictEqual(json.data.fmb_valuation_link, '/fmb/valuation/RELIANCE');
      assert.strictEqual(json.data.technicals_link, '/technicals/chart/NSE:RELIANCE');

      // Physical assets verified against primary sources (DGH, MoEFCC, CIDCO)
      const assets = json.data.physical_assets;
      assert.ok(Array.isArray(assets) && assets.length >= 6);

      const jamnagar = assets.find((a: any) => a.asset_id === 'ril-jamnagar-refinery');
      assert.ok(jamnagar, 'Jamnagar refinery asset exists');
      assert.strictEqual(jamnagar.capacity_value, 1240000);
      assert.strictEqual(jamnagar.capacity_metric, 'Barrels Per Day (BPD)');
      assert.strictEqual(jamnagar.provenance, 'VERIFIED');

      const kgD6 = assets.find((a: any) => a.asset_id === 'ril-kg-d6-terminal');
      assert.ok(kgD6, 'KG-D6 terminal asset exists');
      assert.strictEqual(kgD6.capacity_value, 30);
      assert.strictEqual(kgD6.capacity_metric, 'MMSCMD Gas Flow');
    });

    test('GET /api/companies/DOMINION contains Gloucester Solar (EIA 63031) in physical assets', async () => {
      const res = await fetch(`${baseUrl}/api/companies/DOMINION`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.company_id, 'DOMINION');

      const assets = json.data.physical_assets;
      const gloucester = assets.find((a: any) => a.asset_id === 'power-63031');
      assert.ok(gloucester, 'Gloucester Solar asset exists under Dominion');
      assert.strictEqual(gloucester.eia_id, '63031');
      assert.strictEqual(gloucester.capacity_value, 20);
      assert.strictEqual(gloucester.capacity_metric, 'Megawatts (MW)');
      assert.strictEqual(gloucester.provenance, 'VERIFIED');
    });

    test('Fail-Closed: GET /api/companies/NONEXISTENT returns 404', async () => {
      const res = await fetch(`${baseUrl}/api/companies/NONEXISTENT`);
      assert.strictEqual(res.status, 404);
      const json = (await res.json()) as any;
      assert.strictEqual(json.success, false);
    });
  });

  // 5. Claimed GitHub Integrations Runtime Reachability
  describe('5. Verified GitHub Integrations Runtime Execution Path', () => {
    test('GET /api/audit confirms architectural capabilities and source code integration', async () => {
      const res = await fetch(`${baseUrl}/api/audit`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.verified_repositories));
      assert.ok(json.verified_repositories.length >= 10);
      assert.strictEqual(json.zero_mock_architecture, true);
    });

    test('GET /api/space-weather executes NOAA SWPC live feed (Argus repo integration)', async () => {
      const res = await fetch(`${baseUrl}/api/space-weather`);
      assert.ok(res.status === 200 || res.status === 503);
      const json = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(json.success, true);
        assert.ok(json.provider.includes('NOAA') && json.provider.includes('SWPC'));
      }
    });

    test('GET /api/satellites executes CelesTrak live ephemeris (gods-eye-view integration)', async () => {
      const res = await fetch(`${baseUrl}/api/satellites`);
      assert.ok(res.status === 200 || res.status === 503);
      const json = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(json.success, true);
        assert.ok(json.provider.includes('CelesTrak'));
      }
    });

    test('GET /api/earthquakes executes USGS live seismic feed (gods-eye-view integration)', async () => {
      const res = await fetch(`${baseUrl}/api/earthquakes`);
      assert.ok(res.status === 200 || res.status === 503);
      const json = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(json.success, true);
        assert.ok(json.provider.includes('USGS'));
      }
    });

    test('GET /api/radar/info executes RainViewer live radar feed (worldmonitor integration)', async () => {
      const res = await fetch(`${baseUrl}/api/radar/info`);
      assert.ok(res.status === 200 || res.status === 503);
      const json = (await res.json()) as any;
      if (res.status === 200) {
        assert.strictEqual(json.success, true);
        assert.ok(json.provider.includes('RainViewer'));
      }
    });
  });

  // 6. Standardized Endpoint Contracts & Observation Store Verification
  describe('6. Standardized Endpoint Contracts & Observation Store', () => {
    test('GET /api/sources/health returns empirical observation store with valid statuses', async () => {
      const res = await fetch(`${baseUrl}/api/sources/health`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.sources));
      assert.ok(json.sources.length >= 8);

      const validStatuses = ['LIVE', 'CACHED', 'STALE', 'STATIC_REFERENCE', 'NOT_CHECKED', 'UNAVAILABLE', 'NOT_CONFIGURED'];
      for (const s of json.sources) {
        assert.ok(
          validStatuses.includes(s.status),
          `Source ${s.id} status '${s.status}' must be one of ${validStatuses.join(', ')}`
        );
        // If untouched / NOT_CHECKED, latency must be null (never fake hardcoded)
        if (s.status === 'NOT_CHECKED') {
          assert.strictEqual(s.latency_ms, null);
        }
      }
    });

    test('GET /api/macro never returns fake hardcoded numbers (74.82, 2.38, 2685.40)', async () => {
      const res = await fetch(`${baseUrl}/api/macro`);
      assert.strictEqual(res.status, 200);
      const json = (await res.json()) as any;

      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data));

      const brent = json.data.find((m: any) => m.symbol === 'BRENT');
      const gas = json.data.find((m: any) => m.symbol === 'NG_HENRY');
      const gold = json.data.find((m: any) => m.symbol === 'GOLD_XAU');

      // Unconfigured macro feeds must return UNAVAILABLE with null price, never hardcoded fake values
      if (brent) {
        assert.notStrictEqual(brent.price, 74.82, 'Must not return fake Brent 74.82');
        if (brent.status === 'UNAVAILABLE') {
          assert.strictEqual(brent.price, null);
        }
      }
      if (gas) {
        assert.notStrictEqual(gas.price, 2.38, 'Must not return fake Henry Hub 2.38');
        if (gas.status === 'UNAVAILABLE') {
          assert.strictEqual(gas.price, null);
        }
      }
      if (gold) {
        assert.notStrictEqual(gold.price, 2685.40, 'Must not return fake Gold 2685.40');
        if (gold.status === 'UNAVAILABLE') {
          assert.strictEqual(gold.price, null);
        }
      }
    });

    test('Endpoint contract: Upstream failure never returns HTTP 200 with success:true and empty data array', async () => {
      // Satellites with non-existent group
      const res = await fetch(`${baseUrl}/api/satellites?group=nonexistent_invalid_group_xyz`);
      // It must either be 200 with real data, or 503 fail-closed (never 200 success:true data:[])
      if (res.status === 200) {
        const json = (await res.json()) as any;
        assert.ok(json.data && json.data.length > 0);
      } else {
        assert.strictEqual(res.status, 503);
        const json = (await res.json()) as any;
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.status, 'UNAVAILABLE');
      }
    });
  });
});

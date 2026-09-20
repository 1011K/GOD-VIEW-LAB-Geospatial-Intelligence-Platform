import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../server';

let server: http.Server;
let baseUrl: string;
const originalKey = process.env.GEMINI_API_KEY;

before(async () => {
  // Unset for testing keyless behavior
  delete process.env.GEMINI_API_KEY;

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (originalKey) {
    process.env.GEMINI_API_KEY = originalKey;
  }
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('Keyless Core & System Readiness Verification Suite', () => {
  test('GET /api/ai/capabilities returns accurate status without key requirement', async () => {
    const res = await fetch(`${baseUrl}/api/ai/capabilities`);
    assert.strictEqual(res.status, 200);
    const json = (await res.json()) as any;

    assert.strictEqual(json.available, false);
    assert.strictEqual(json.provider, 'none');
    assert.strictEqual(json.status, 'NOT_CONFIGURED');
    assert.strictEqual(json.message, 'AI ANALYSIS OPTIONAL / NOT CONFIGURED');
  });

  test('Fail-Closed: Gemini briefing without key returns 503 without leaking env var instructions to users', async () => {
    const res = await fetch(`${baseUrl}/api/gemini/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entities: [] })
    });

    assert.strictEqual(res.status, 503);
    const json = (await res.json()) as any;
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.status, 'NOT_CONFIGURED');
    assert.strictEqual(json.optional, true);
    assert.ok(json.model, 'Model name must be dynamically returned');
    assert.ok(json.error.includes('AI intelligence provider is optional'));
    assert.ok(!json.error.includes('Please add GEMINI_API_KEY in your local .env to enable'));
  });

  test('GET /api/system/readiness returns complete core vs optional diagnostics', async () => {
    const res = await fetch(`${baseUrl}/api/system/readiness`);
    assert.strictEqual(res.status, 200);
    const readiness = (await res.json()) as any;

    assert.ok(readiness.overall === 'PASS' || readiness.overall === 'DEGRADED');
    assert.ok(typeof readiness.corePassed === 'number');
    assert.ok(typeof readiness.coreTotal === 'number');
    assert.ok(readiness.coreTotal >= 5, 'Must assess at least 5 core services');
    assert.ok(typeof readiness.optionalUnavailable === 'number');
    assert.ok(typeof readiness.commit === 'string' && readiness.commit.length > 0);
    assert.ok(readiness.checks, 'Must contain individual diagnostic checks');

    // Individual checks must be present
    assert.ok(readiness.checks.opensky);
    assert.ok(readiness.checks.usgs);
    assert.ok(readiness.checks.cameras);
    assert.ok(readiness.checks.gemini_ai);
    assert.strictEqual(readiness.checks.gemini_ai.type, 'optional');
  });

  test('Public Camera health probe promotes REGISTERED -> REACHABLE or UNAVAILABLE', async () => {
    const probeRes = await fetch(`${baseUrl}/api/cameras/check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://images.drivebc.ca/bchighwaycam/pub/html/dbc/1.html' })
    });

    assert.strictEqual(probeRes.status, 200);
    const probeJson = (await probeRes.json()) as any;
    assert.strictEqual(probeJson.success, true);
    assert.ok(probeJson.status === 'REACHABLE' || probeJson.status === 'LIVE' || probeJson.status === 'UNAVAILABLE');
    assert.ok(typeof probeJson.latency_ms === 'number');
    assert.ok(probeJson.checked_at);
  });
});

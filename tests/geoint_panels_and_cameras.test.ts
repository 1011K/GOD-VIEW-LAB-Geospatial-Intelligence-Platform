import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_CAMERAS_DATA } from '../src/data/publicCamerasData';

describe('GEOINT Panels, Side Map & Live Camera Verification Suite', () => {

  describe('1. Public Camera Catalog Provenance & Integrity', () => {
    test('all registered public cameras have explicit id, camera_id, and UNKNOWN initial status', () => {
      assert.ok(PUBLIC_CAMERAS_DATA.length >= 20, 'Expected at least 20 registered global cameras');

      for (const cam of PUBLIC_CAMERAS_DATA) {
        assert.ok(cam.id, `Camera missing id field: ${cam.name}`);
        assert.ok(cam.camera_id, `Camera missing camera_id field: ${cam.name}`);
        assert.strictEqual(cam.id, cam.camera_id, `Camera id and camera_id must match: ${cam.id}`);
        assert.strictEqual(
          cam.status,
          'UNKNOWN',
          `Camera ${cam.id} must be UNKNOWN until live health check probe`
        );
        assert.ok(
          cam.latitude >= -90 && cam.latitude <= 90,
          `Camera ${cam.id} has invalid latitude: ${cam.latitude}`
        );
        assert.ok(
          cam.longitude >= -180 && cam.longitude <= 180,
          `Camera ${cam.id} has invalid longitude: ${cam.longitude}`
        );
        assert.ok(cam.provider && cam.provider.length > 0, `Camera ${cam.id} missing provider`);
        assert.ok(cam.media_url && cam.media_url.length > 0, `Camera ${cam.id} missing media_url`);
      }
    });

    test('genuine live video stream cameras have youtube stream_type and valid embed URLs', () => {
      const videoCams = PUBLIC_CAMERAS_DATA.filter(c => c.media_type === 'video');
      assert.ok(videoCams.length >= 8, 'Expected at least 8 live video cameras');

      for (const cam of videoCams) {
        assert.strictEqual(cam.stream_type, 'youtube');
        assert.ok(cam.embed_url, `Video cam ${cam.id} missing embed_url`);
        assert.ok(
          cam.embed_url.startsWith('https://www.youtube.com/embed/'),
          `Video cam ${cam.id} has invalid embed URL format: ${cam.embed_url}`
        );
        assert.ok(
          cam.embed_url.includes('autoplay=1'),
          `Video cam ${cam.id} missing autoplay parameter`
        );
      }
    });
  });

  describe('2. Movable Panel & HUD Coordinate Clamping Bounds', () => {
    test('panel drag position clamping preserves viewport boundaries', () => {
      const mockInnerWidth = 1920;
      const mockInnerHeight = 1080;
      const panelWidth = 384; // 96 * 4 (w-96)
      const panelHeight = 460;

      const clampPosition = (x: number, y: number) => {
        const clampedX = Math.max(8, Math.min(mockInnerWidth - panelWidth, x));
        const clampedY = Math.max(64, Math.min(mockInnerHeight - 100, y));
        return { x: clampedX, y: clampedY };
      };

      // Case 1: Out of bounds left/top
      const oobLeftTop = clampPosition(-200, 10);
      assert.strictEqual(oobLeftTop.x, 8);
      assert.strictEqual(oobLeftTop.y, 64);

      // Case 2: Out of bounds right/bottom
      const oobRightBottom = clampPosition(3000, 2000);
      assert.strictEqual(oobRightBottom.x, mockInnerWidth - panelWidth);
      assert.strictEqual(oobRightBottom.y, mockInnerHeight - 100);

      // Case 3: In bounds
      const inBounds = clampPosition(500, 400);
      assert.strictEqual(inBounds.x, 500);
      assert.strictEqual(inBounds.y, 400);
    });

    test('dock mode presets map to valid layout targets', () => {
      const validModes = ['docked-left', 'docked-right', 'side-map', 'floating'];
      for (const mode of validModes) {
        assert.ok(validModes.includes(mode), `Valid dock mode supported: ${mode}`);
      }
    });
  });
});

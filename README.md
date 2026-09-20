# GOD-VIEW-LAB — Geospatial Intelligence Platform (ASTRA Core)

A zero-mock, evidence-driven, multi-domain geospatial intelligence platform unifying real-time aerospace tracking, orbital mechanics, seismic dynamics, critical infrastructure, maritime AIS streams, and municipal surveillance.

---

## ⚡ Zero-Key Quickstart

The core geospatial intelligence platform is **100% keyless**. You do **NOT** need an API key to run, browse, inspect, or operate 2D or 3D God View modes.

```bash
# 1. Install dependencies
npm install

# 2. Run the platform
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## 🛰️ Architecture & Capabilities

1. **Keyless Core Architecture**:
   - **Airspace ADS-B**: OpenSky Network state vectors.
   - **Orbital Astrodynamics**: Live NORAD two-line element (TLE) ephemeris via CelesTrak with client-side SGP4 orbital propagation (`satellite.js`).
   - **Seismic Activity**: Real-time USGS earthquake feed.
   - **Thermal & Environmental**: NASA EONET natural hazard vectors.
   - **Weather Doppler Radar**: RainViewer live composite radar tiles.
   - **Maritime AIS**: Live Digitraffic Finnish Transport Agency AIS vessel telemetry.
   - **Space Weather**: NOAA Space Weather Prediction Center (SWPC) planetary K-index telemetry.
   - **Critical Infrastructure**: Curated regulatory physical asset registries (EIA-860, Global Energy Monitor, IAEA PRIS, TeleGeography).
   - **Surveillance Matrix**: Municipal camera registry with automated reachability probes and direct external stream links.

2. **2D & 3D God View Modes**:
   - **2D Tactical Map**: Leaflet with Carto Dark Matter raster tiles.
   - **3D God View**: CesiumJS WGS84 globe running with Carto Dark Matter raster layers without requiring Cesium Ion tokens.
   - Both modes consume the identical normalized data layer via `src/services/providers.ts`.

3. **Optional AI Analyst**:
   - AI synthesis is completely optional and fail-closed.
   - If a Gemini API key is absent, the backend reports `AI ANALYSIS OPTIONAL / NOT CONFIGURED` (`/api/ai/capabilities`).
   - If configured via `GEMINI_API_KEY`, the platform dynamically enables situational briefing and telemetry queries with model identity dynamically retrieved from server capability introspection.

4. **Setup Doctor & Health Verification**:
   - Run `npm run doctor` to perform comprehensive diagnostic checks across runtime, build, SGP4 astrodynamics, camera catalog, HTTP listener, tile endpoints, and health telemetry.
   - Live endpoint `/api/system/readiness` exposes real-time status across all core and optional feeds.

---

## 🛠️ Developer Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Boots local full-stack server (Express + Vite) on port 3000 |
| `npm run doctor` | Comprehensive diagnostic check across runtime, SGP4, tiles, and server |
| `npm run lint` | TypeScript type-checking (`tsc --noEmit`) |
| `npm test` | Complete end-to-end Node.js test suite across all domains and contracts |
| `npm run build` | Builds Vite frontend bundle and esbuild production server |
| `npm start` | Runs production server from `dist/` |

---

## 🔒 Source Truth & Fail-Closed Taxonomy

All endpoints adhere to strict data-truth contracts:
- `LIVE`: Verified fresh data returned directly from upstream source.
- `CACHED`: Fresh cached data within TTL window.
- `STALE`: Upstream temporarily unreachable; clearly labeled stale cache returned.
- `STATIC_REFERENCE`: Verified regulatory static registries (EIA-860, etc.).
- `REGISTERED`: Registered camera catalog item awaiting health probe.
- `REACHABLE`: Camera endpoint verified responsive via HTTP HEAD probe.
- `UNAVAILABLE`: Upstream failed or unconfigured; **never** emits fake mock data or 200 OK with empty datasets.
- `NOT_CONFIGURED`: Optional service not active.

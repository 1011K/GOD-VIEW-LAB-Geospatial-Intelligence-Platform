import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  NewsIntelligenceRecord, 
  VesselRecord, 
  WeatherRadarMetadata, 
  MacroIndicatorRecord, 
  PublicCameraRecord, 
  InfrastructureRecord, 
  SourceStatus, 
  CameraStatus, 
  AiCapabilities, 
  SystemReadiness 
} from '../types';

export interface ProviderEnvelope<T> {
  data: T;
  status: SourceStatus;
  provider: string;
  sourceUrl: string;
  fetchedAt: string;
  lastSuccessAt: string | null;
  latencyMs: number | null;
  freshnessSeconds: number | null;
  error: string | null;
  itemCount: number;
}

async function requestEnvelope<T>(
  url: string, 
  defaultProvider: string, 
  fallbackData: T,
  init?: RequestInit
): Promise<ProviderEnvelope<T>> {
  const start = performance.now();
  try {
    const res = await fetch(url, init);
    const latency = Math.round(performance.now() - start);
    const json = await res.json();

    if (!res.ok || json.success === false) {
      return {
        data: (json.data as T) || fallbackData,
        status: (json.status as SourceStatus) || 'UNAVAILABLE',
        provider: json.provider || defaultProvider,
        sourceUrl: json.sourceUrl || url,
        fetchedAt: json.fetched_at || new Date().toISOString(),
        lastSuccessAt: json.last_success_at || null,
        latencyMs: json.latency_ms ?? latency,
        freshnessSeconds: json.freshness_seconds ?? null,
        error: json.error || `HTTP ${res.status} response from upstream provider`,
        itemCount: Array.isArray(json.data) ? json.data.length : (json.data ? 1 : 0)
      };
    }

    return {
      data: (json.data as T) ?? fallbackData,
      status: (json.status as SourceStatus) || (json.cached ? (json.stale ? 'STALE' : 'CACHED') : 'LIVE'),
      provider: json.provider || defaultProvider,
      sourceUrl: json.sourceUrl || url,
      fetchedAt: json.fetched_at || new Date().toISOString(),
      lastSuccessAt: json.last_success_at || json.fetched_at || new Date().toISOString(),
      latencyMs: json.latency_ms ?? latency,
      freshnessSeconds: json.freshness_seconds ?? null,
      error: null,
      itemCount: Array.isArray(json.data) ? json.data.length : (json.data ? 1 : 0)
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return {
      data: fallbackData,
      status: 'UNAVAILABLE',
      provider: defaultProvider,
      sourceUrl: url,
      fetchedAt: new Date().toISOString(),
      lastSuccessAt: null,
      latencyMs: latency,
      freshnessSeconds: null,
      error: err?.message || String(err),
      itemCount: 0
    };
  }
}

// 1. ADS-B Flights
export async function fetchAircraftProvider(): Promise<ProviderEnvelope<AircraftRecord[]>> {
  return requestEnvelope<AircraftRecord[]>('/api/flights', 'OpenSky Network', []);
}

// 2. NORAD Satellites
export async function fetchSatellitesProvider(group: string = 'stations'): Promise<ProviderEnvelope<SatelliteRecord[]>> {
  return requestEnvelope<SatelliteRecord[]>(
    `/api/satellites?group=${encodeURIComponent(group)}`,
    'CelesTrak (NORAD GP)',
    []
  );
}

// 3. USGS Earthquakes
export async function fetchSeismicProvider(): Promise<ProviderEnvelope<EarthquakeRecord[]>> {
  return requestEnvelope<EarthquakeRecord[]>(
    '/api/earthquakes',
    'USGS Earthquake Hazards Program',
    []
  );
}

// 4. NASA EONET Wildfires & Hazards
export async function fetchHazardsProvider(): Promise<ProviderEnvelope<WildfireRecord[]>> {
  return requestEnvelope<WildfireRecord[]>(
    '/api/wildfires',
    'NASA Earth Observatory (EONET v3)',
    []
  );
}

// 5. GDELT OSINT News
export async function fetchNewsProvider(): Promise<ProviderEnvelope<NewsIntelligenceRecord[]>> {
  return requestEnvelope<NewsIntelligenceRecord[]>(
    '/api/news',
    'GDELT Project 2.0',
    []
  );
}

// 6. Maritime AIS Vessels
export async function fetchVesselsProvider(): Promise<ProviderEnvelope<VesselRecord[]>> {
  return requestEnvelope<VesselRecord[]>(
    '/api/vessels',
    'Digitraffic Finland Live AIS',
    []
  );
}

// 7. RainViewer Weather Radar
export async function fetchRadarProvider(): Promise<ProviderEnvelope<WeatherRadarMetadata | null>> {
  return requestEnvelope<WeatherRadarMetadata | null>(
    '/api/radar/info',
    'RainViewer Weather Radar API',
    null
  );
}

// 8. NOAA SWPC Space Weather
export async function fetchSpaceWeatherProvider(): Promise<ProviderEnvelope<any>> {
  return requestEnvelope<any>(
    '/api/space-weather',
    'NOAA Space Weather Prediction Center (SWPC)',
    null
  );
}

// 9. Macro Financial & Commodity Indicators
export async function fetchMacroProvider(): Promise<ProviderEnvelope<MacroIndicatorRecord[]>> {
  return requestEnvelope<MacroIndicatorRecord[]>(
    '/api/macro',
    'Public Commodity Feeds / CoinGecko',
    []
  );
}

// 10. Public Municipal Surveillance Cameras
export async function fetchCamerasProvider(bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number }): Promise<ProviderEnvelope<PublicCameraRecord[]>> {
  let url = '/api/cameras';
  if (bbox) {
    url += `?minLat=${bbox.minLat}&maxLat=${bbox.maxLat}&minLon=${bbox.minLon}&maxLon=${bbox.maxLon}`;
  }
  return requestEnvelope<PublicCameraRecord[]>(
    url,
    'Government Transport Agencies (Caltrans / NYSDOT / TfL / TfNSW / MLIT / ACP)',
    []
  );
}

// 11. Critical Infrastructure
export async function fetchInfrastructureProvider(): Promise<ProviderEnvelope<InfrastructureRecord[]>> {
  return requestEnvelope<InfrastructureRecord[]>(
    '/api/infrastructure',
    'EIA-860 / Global Energy Monitor / IAEA PRIS / TeleGeography',
    []
  );
}

// 12. Dynamic AI Capabilities Detection (Keyless Safety)
export async function fetchAiCapabilities(): Promise<AiCapabilities> {
  try {
    const res = await fetch('/api/ai/capabilities');
    if (!res.ok) {
      return {
        available: false,
        provider: 'none',
        model: 'none',
        status: 'NOT_CONFIGURED',
        message: 'AI ANALYSIS OPTIONAL / NOT CONFIGURED'
      };
    }
    return await res.json();
  } catch {
    return {
      available: false,
      provider: 'none',
      model: 'none',
      status: 'NOT_CONFIGURED',
      message: 'AI ANALYSIS OPTIONAL / NOT CONFIGURED'
    };
  }
}

// 13. System Readiness
export async function fetchSystemReadiness(): Promise<SystemReadiness> {
  const fallback: SystemReadiness = {
    overall: 'DEGRADED',
    corePassed: 0,
    coreTotal: 9,
    optionalUnavailable: 1,
    failed: 0,
    commit: 'unknown',
    checkedAt: new Date().toISOString(),
    checks: {}
  };
  try {
    const res = await fetch('/api/system/readiness');
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

// 14. Camera Status Health Probe
export async function probeCameraStatus(
  target: { camera_id?: string; url?: string }
): Promise<{ success: boolean; status: CameraStatus; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const res = await fetch('/api/cameras/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    });
    const latency = Math.round(performance.now() - start);
    const json = await res.json();
    return {
      success: json.success ?? false,
      status: (json.status as CameraStatus) || (json.success ? 'REACHABLE' : 'UNAVAILABLE'),
      latencyMs: json.latency_ms ?? latency,
      error: json.error
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'UNAVAILABLE',
      latencyMs: Math.round(performance.now() - start),
      error: err?.message || String(err)
    };
  }
}

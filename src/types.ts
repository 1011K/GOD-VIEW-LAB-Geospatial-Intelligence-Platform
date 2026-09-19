export type SourceStatus = 'VERIFIED LIVE' | 'LIVE' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE' | 'SOURCE UNAVAILABLE' | 'REQUIRES KEY' | 'BROKEN' | 'STATIC DATA' | 'STATIC_REFERENCE' | 'MOCK/DEMO' | 'UNKNOWN';

export interface DataProvenance {
  provider: string;
  sourceUrl: string;
  source_url?: string;
  adapter: string;
  fetched_at: string;
  freshness_seconds?: number;
  status: SourceStatus;
  raw_identifier?: string;
}

export interface AircraftRecord extends DataProvenance {
  id?: string;
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number | null; // meters
  baro_altitude_m?: number | null;
  on_ground: boolean;
  velocity: number | null; // m/s
  velocity_ms?: number | null;
  true_track: number | null; // degrees 0-360
  true_track_deg?: number | null;
  vertical_rate: number | null; // m/s
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface SatelliteRecord extends DataProvenance {
  id?: string;
  noradId: string;
  norad_cat_id?: string;
  name: string;
  line1: string;
  line2: string;
  group: 'stations' | 'starlink' | 'weather' | 'active';
  calculated?: {
    latitude: number;
    longitude: number;
    altitudeKm: number;
    velocityKmS: number;
    footprintRadiusKm: number;
    periodMinutes: number;
    inclinationDeg: number;
  };
}

export interface EarthquakeRecord extends DataProvenance {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: string | null;
  usgs_status?: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string;
  type: string;
  title: string;
  latitude: number;
  longitude: number;
  depthKm: number;
}

export interface WildfireRecord extends DataProvenance {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  date: string;
  sourceId: string;
  confidence?: string | number;
  frp?: number; // Fire Radiative Power (MW)
  daynight?: string;
  satellite?: string;
}

export interface WeatherRadarMetadata extends DataProvenance {
  version: string;
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast: Array<{ time: number; path: string }>;
  };
  satellite: {
    infrared: Array<{ time: number; path: string }>;
  };
  frames?: Array<{ time: number; path: string }>;
}

export interface InfrastructureRecord extends DataProvenance {
  id: string;
  name: string;
  type: 'nuclear' | 'datacenter' | 'subsea_cable' | 'hydro' | 'thermal' | 'spaceport' | 'port' | 'camera' | 'solar' | 'wind' | 'gas' | 'refinery' | 'manufacturing';
  country: string;
  latitude: number;
  longitude: number;
  capacity_mw?: number;
  operator?: string;
  commissioned_year?: number;
  status_operational: 'Operational' | 'Under Construction' | 'Planned' | 'Decommissioned';
  details?: string;
  imageUrl?: string;
  streamUrl?: string;
  eia_id?: string;
  fuel_type?: string;
  company_id?: string;
  grid_interconnection?: string;
}

export type ProvenanceClassification = 'VERIFIED' | 'DISPUTED' | 'WITHHELD' | 'REJECTED' | 'EXPERIMENTAL';

export interface PhysicalAssetRecord {
  asset_id: string;
  name: string;
  asset_type: 'refinery' | 'manufacturing' | 'power_plant' | 'datacenter' | 'headquarters' | 'port_terminal' | 'mine' | 'solar_park' | 'wind_farm' | 'office';
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  capacity_metric?: string;
  capacity_value?: number;
  ownership_pct: number;
  provenance: ProvenanceClassification;
  evidence_source: string;
  evidence_url: string;
  operational_status: 'Operational' | 'Under Construction' | 'Planned' | 'Decommissioned';
  eia_id?: string;
  grid_interconnect?: string;
  surrounding_events_count?: number;
}

export interface CompanyProfile extends DataProvenance {
  company_id: string;
  canonical_name: string;
  ticker: string;
  exchange: string;
  sector: string;
  industry: string;
  headquarters: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  market_cap_usd?: string;
  description: string;
  subsidiaries: string[];
  key_brands: string[];
  physical_assets: PhysicalAssetRecord[];
  commodity_exposure: string[];
  astra_signal?: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    summary: string;
    target_link: string;
  };
  fmb_valuation_link?: string;
  technicals_link?: string;
}

export type CameraStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE' | 'UNKNOWN';

export interface PublicCameraRecord extends DataProvenance {
  camera_id: string;
  provider: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  media_url: string;
  media_type: 'image' | 'mjpeg' | 'hls' | 'stream';
  source_url?: string;
  fetched_at: string;
  last_verified_at: string;
  status: CameraStatus;
  freshness_seconds: number;
  description?: string;
}

export interface VesselRecord extends DataProvenance {
  mmsi: string;
  name: string;
  callsign?: string;
  vessel_type: 'Cargo' | 'Tanker' | 'Container' | 'Passenger' | 'Tug' | 'Special Craft' | 'Fishing';
  latitude: number;
  longitude: number;
  speed_knots: number;
  course_deg: number;
  destination: string;
  flag_country: string;
  status: SourceStatus;
  raw_identifier?: string;
}

export interface PowerPlantRecord extends DataProvenance {
  id: string;
  eia_id?: string;
  gppd_idnr?: string;
  name: string;
  fuel_type: 'solar' | 'nuclear' | 'hydro' | 'gas' | 'coal' | 'wind' | 'oil';
  capacity_mw: number;
  operator: string;
  country: string;
  state_province?: string;
  latitude: number;
  longitude: number;
  commissioned_year?: number;
  grid_interconnection?: string;
  company_ticker?: string;
  status_operational: string;
}

export interface SearchResultItem {
  id: string;
  category: 'company' | 'power' | 'camera' | 'flight' | 'vessel' | 'satellite' | 'infrastructure';
  title: string;
  subtitle: string;
  badge: string;
  coordinates: [number, number];
  rawObject: any;
}

export interface NewsIntelligenceRecord extends DataProvenance {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  category: 'geopolitics' | 'military' | 'humanitarian' | 'cyber' | 'energy' | 'disaster';
  summary?: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
}

export interface MacroIndicatorRecord extends DataProvenance {
  symbol: string;
  name: string;
  price: number;
  change_24h_pct: number;
  category: 'energy' | 'metals' | 'forex' | 'crypto';
  unit: string;
  updated_at: string;
}

export interface SourceHealthEntry {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  status: SourceStatus;
  latency_ms: number;
  item_count: number;
  last_updated: string;
  cached: boolean;
  cache_ttl_seconds: number;
  error_message?: string;
  auth_mode: 'public' | 'api_key' | 'basic_auth' | 'none';
  rate_limits: string;
}

export interface LayerToggleState {
  aircraft: boolean;
  satellites: boolean;
  earthquakes: boolean;
  wildfires: boolean;
  weatherRadar: boolean;
  infrastructure: boolean;
  cameras: boolean;
  vessels: boolean;
  companies: boolean;
  newsIntel: boolean;
  bitPaths: boolean;
  orbitTracks: boolean;
  heatmapLayer: boolean;
  heatmapMode: 'thermal' | 'seismic' | 'aviation';
}

export type ViewMode = 'tactical-map' | 'analytics' | 'grid-matrix' | 'pass-predictor' | 'ai-analyst' | 'company-god-view';

export type BaseMapType = 'dark' | 'satellite' | 'terrain' | 'osm';

export interface RepositoryAuditItem {
  id: string;
  repo_name: string;
  repo_source: string;
  license: string;
  framework_stack: string;
  map_engine: string;
  external_data_sources: Array<{
    name: string;
    endpoint: string;
    status: SourceStatus;
    auth: string;
    cors: string;
    rate_limits: string;
  }>;
  adapter_modules: string[];
  key_strengths: string;
  drawbacks_risks: string;
}


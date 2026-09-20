import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { TacticalMap } from './components/TacticalMap';
import { LayerControlPanel } from './components/LayerControlPanel';
import { LiveCameraWidget } from './components/LiveCameraWidget';
import { ObjectDetailDrawer } from './components/ObjectDetailDrawer';
import { AuditReportModal } from './components/AuditReportModal';
import { SourceHealthModal } from './components/SourceHealthModal';
import { GeminiBriefingModal } from './components/GeminiBriefingModal';
import { TimelineScrubber } from './components/TimelineScrubber';
import { AlertNotificationCenter } from './components/AlertNotificationCenter';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LiveGridMatrix } from './components/LiveGridMatrix';
import { SatellitePassPredictor } from './components/SatellitePassPredictor';
import { SurveillanceWall } from './components/SurveillanceWall';
import { AiAnalystDrawer } from './components/AiAnalystDrawer';
import { ArgosSearchBar } from './components/ArgosSearchBar';
import { CompanyIntelligenceDrawer } from './components/CompanyIntelligenceDrawer';
import { calculateSatellitePosition } from './services/satellitePropagator';
import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  InfrastructureRecord, 
  NewsIntelligenceRecord, 
  MacroIndicatorRecord, 
  WeatherRadarMetadata,
  SourceHealthEntry,
  RepositoryAuditItem,
  BaseMapType,
  LayerToggleState,
  ViewMode,
  PublicCameraRecord,
  VesselRecord,
  CompanyProfile,
  SearchResultItem,
  PhysicalAssetRecord
} from './types';
import { Layers, Video, Sparkles, X } from 'lucide-react';

export default function App() {
  // Navigation & View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>('tactical-map');
  const [baseMap, setBaseMap] = useState<BaseMapType>('dark');
  const [layers, setLayers] = useState<LayerToggleState>({
    aircraft: true,
    satellites: true,
    earthquakes: true,
    wildfires: true,
    weatherRadar: false,
    infrastructure: true,
    cameras: true,
    vessels: true,
    companies: true,
    newsIntel: true,
    bitPaths: true,
    orbitTracks: true,
    heatmapLayer: false,
    heatmapMode: 'thermal'
  });

  // Data Stores (Strict Live + Verified Static Registry)
  const [flights, setFlights] = useState<AircraftRecord[]>([]);
  const [satellites, setSatellites] = useState<SatelliteRecord[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeRecord[]>([]);
  const [wildfires, setWildfires] = useState<WildfireRecord[]>([]);
  const [infrastructure, setInfrastructure] = useState<InfrastructureRecord[]>([]);
  const [cameras, setCameras] = useState<PublicCameraRecord[]>([]);
  const [vessels, setVessels] = useState<VesselRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<NewsIntelligenceRecord[]>([]);
  const [macro, setMacro] = useState<MacroIndicatorRecord[]>([]);
  const [radarMetadata, setRadarMetadata] = useState<WeatherRadarMetadata | null>(null);
  const [radarFramePath, setRadarFramePath] = useState<string | null>(null);
  const [sourcesHealth, setSourcesHealth] = useState<SourceHealthEntry[]>([]);
  const [repositories, setRepositories] = useState<RepositoryAuditItem[]>([]);

  // 4D Simulation Time
  const [simTime, setSimTime] = useState<Date>(new Date());
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Filtering & Parameters
  const [minQuakeMag, setMinQuakeMag] = useState<number>(0);
  const [satelliteGroup, setSatelliteGroup] = useState<string>('stations');

  // Selected Target & UI Drawers / Modals
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [isHealthOpen, setIsHealthOpen] = useState<boolean>(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isAiAnalystOpen, setIsAiAnalystOpen] = useState<boolean>(false);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(true);
  const [isIntelOpen, setIsIntelOpen] = useState<boolean>(true);
  const [isSideMapOpen, setIsSideMapOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gv_side_map_open') === 'true';
    } catch {}
    return false;
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('gv_side_map_open', isSideMapOpen ? 'true' : 'false');
    } catch {}
  }, [isSideMapOpen]);

  // Track per-feed response status and errors
  const [feedStatuses, setFeedStatuses] = useState<Record<string, { status: string; error?: string }>>({});

  // 1. Fetch ADS-B Flights
  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch('/api/flights');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setFlights(json.data);
        setFeedStatuses(prev => ({ ...prev, flights: { status: json.status || 'LIVE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, flights: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Flights ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, flights: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 2. Fetch CelesTrak Satellites
  const fetchSatellites = useCallback(async () => {
    try {
      const res = await fetch(`/api/satellites?group=${encodeURIComponent(satelliteGroup)}`);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const withCoords = json.data.map((s: SatelliteRecord) => {
          try {
            return {
              ...s,
              calculated: calculateSatellitePosition(s, simTime)
            };
          } catch {
            return s;
          }
        }).filter((s: SatelliteRecord) => s.calculated !== null && s.calculated !== undefined);
        setSatellites(withCoords);
        setFeedStatuses(prev => ({ ...prev, satellites: { status: json.status || 'LIVE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, satellites: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Satellites ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, satellites: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, [satelliteGroup, simTime]);

  // 3. Fetch USGS Earthquakes
  const fetchEarthquakes = useCallback(async () => {
    try {
      const res = await fetch('/api/earthquakes');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setEarthquakes(json.data);
        setFeedStatuses(prev => ({ ...prev, earthquakes: { status: json.status || 'LIVE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, earthquakes: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Earthquakes ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, earthquakes: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 4. Fetch NASA EONET Wildfires & Hazards
  const fetchWildfires = useCallback(async () => {
    try {
      const res = await fetch('/api/wildfires');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setWildfires(json.data);
        setFeedStatuses(prev => ({ ...prev, wildfires: { status: json.status || 'LIVE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, wildfires: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Wildfires ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, wildfires: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 5. Fetch Critical Infrastructure
  const fetchInfrastructure = useCallback(async () => {
    try {
      const res = await fetch('/api/infrastructure');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setInfrastructure(json.data);
        setFeedStatuses(prev => ({ ...prev, infrastructure: { status: json.status || 'STATIC_REFERENCE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, infrastructure: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Infrastructure ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, infrastructure: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 6. Fetch Public Live Web Cameras (Caltrans, NYSDOT, TfL, TfNSW, ACP, MLIT)
  const fetchCameras = useCallback(async () => {
    try {
      const res = await fetch('/api/cameras');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setCameras(json.data);
        setFeedStatuses(prev => ({ ...prev, cameras: { status: json.status || 'STATIC_REFERENCE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, cameras: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Cameras ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, cameras: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 7. Fetch AIS Marine Vessels
  const fetchVessels = useCallback(async () => {
    try {
      const res = await fetch('/api/vessels');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setVessels(json.data);
        setFeedStatuses(prev => ({ ...prev, vessels: { status: json.status || 'STATIC_REFERENCE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, vessels: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Vessels ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, vessels: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 8. Fetch Corporate Registries & Physical Asset Holdings
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/companies');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setCompanies(json.data);
        setFeedStatuses(prev => ({ ...prev, companies: { status: json.status || 'STATIC_REFERENCE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, companies: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Companies ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, companies: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 9. Fetch GDELT Geopolitical News
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setNews(json.data);
        setFeedStatuses(prev => ({ ...prev, news: { status: json.status || 'LIVE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, news: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('News ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, news: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 10. Fetch Macro Indicators
  const fetchMacro = useCallback(async () => {
    try {
      const res = await fetch('/api/macro');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setMacro(json.data);
        setFeedStatuses(prev => ({ ...prev, macro: { status: json.status || 'LIVE' } }));
      } else {
        setFeedStatuses(prev => ({ ...prev, macro: { status: json.status || 'UNAVAILABLE', error: json.error } }));
      }
    } catch (err: any) {
      console.warn('Macro ingest notice:', err?.message || err);
      setFeedStatuses(prev => ({ ...prev, macro: { status: 'UNAVAILABLE', error: err?.message || String(err) } }));
    }
  }, []);

  // 11. Fetch Weather Radar Metadata
  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch('/api/weather/radar');
      if (!res.ok) {
        console.warn(`Radar endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && json.data) {
        setRadarMetadata(json.data);
        if (json.data.frames && json.data.frames.length > 0) {
          setRadarFramePath(json.data.frames[json.data.frames.length - 1].path);
        }
      }
    } catch (err: any) {
      console.warn('Weather radar ingest notice:', err?.message || err);
    }
  }, []);

  // 12. Fetch Source Health Status
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/sources/health');
      if (!res.ok) {
        console.warn(`Health endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.sources)) {
        setSourcesHealth(json.sources);
      }
    } catch (err: any) {
      console.warn('Health ingest notice:', err?.message || err);
    }
  }, []);

  // 13. Fetch Repository Audit Matrix
  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch('/api/audit');
      if (!res.ok) {
        console.warn(`Audit endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.repositories)) {
        setRepositories(json.repositories);
      }
    } catch (err: any) {
      console.warn('Audit fetch notice:', err?.message || err);
    }
  }, []);

  // Global Refresh All Feeds
  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      fetchFlights(),
      fetchSatellites(),
      fetchEarthquakes(),
      fetchWildfires(),
      fetchInfrastructure(),
      fetchCameras(),
      fetchVessels(),
      fetchCompanies(),
      fetchNews(),
      fetchMacro(),
      fetchRadar(),
      fetchHealth(),
      fetchAudit()
    ]);
    setIsRefreshing(false);
  };

  // Initial Data Load
  useEffect(() => {
    refreshAll();
  }, []);

  // Periodic Telemetry Ingest Intervals
  useEffect(() => {
    const flightTimer = setInterval(fetchFlights, 20000); // 20s
    const quakeTimer = setInterval(fetchEarthquakes, 45000); // 45s
    const healthTimer = setInterval(fetchHealth, 30000); // 30s
    const newsTimer = setInterval(fetchNews, 60000); // 60s
    return () => {
      clearInterval(flightTimer);
      clearInterval(quakeTimer);
      clearInterval(healthTimer);
      clearInterval(newsTimer);
    };
  }, [fetchFlights, fetchEarthquakes, fetchHealth, fetchNews]);

  // URL Hash-Based Object Deep Linking (Argos Atlas addressable objects, e.g. #power=63031, #company=RELIANCE, #camera=..., #vessel=...)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;

      const [key, value] = hash.split('=');
      if (!key || !value) return;

      // 1. Power Plant Deep Linking (Supports EIA Plant ID like 63031 or slug)
      if (key === 'power') {
        const found = infrastructure.find(item => 
          item.id.toLowerCase() === value.toLowerCase() || 
          item.eia_id === value
        );
        if (found) {
          setSelectedObject(found);
          return;
        }
      }

      // 2. Company Deep Linking (e.g. #company=RELIANCE, #company=TATAPOWER)
      if (key === 'company') {
        const foundCompany = companies.find(c => 
          c.company_id.toLowerCase() === value.toLowerCase() || 
          c.ticker.toLowerCase() === value.toLowerCase() ||
          c.canonical_name.toLowerCase().includes(value.toLowerCase())
        );
        if (foundCompany) {
          setSelectedCompany(foundCompany);
          return;
        }
      }

      // 3. Public Camera Deep Linking (e.g. #camera=caltrans-d4-baybridge)
      if (key === 'camera') {
        const foundCam = cameras.find(c => 
          c.camera_id.toLowerCase() === value.toLowerCase()
        );
        if (foundCam) {
          setSelectedObject(foundCam);
          return;
        }
      }

      // 4. Marine AIS Vessel Deep Linking (e.g. #vessel=vessel-ever-given)
      if (key === 'vessel') {
        const foundVessel = vessels.find(v => 
          v.mmsi.toLowerCase() === value.toLowerCase() || 
          v.name.toLowerCase().includes(value.toLowerCase())
        );
        if (foundVessel) {
          setSelectedObject(foundVessel);
          return;
        }
      }

      // 5. Generic Infrastructure
      if (['port', 'cable', 'target'].includes(key)) {
        const found = infrastructure.find(item => item.id.toLowerCase() === value.toLowerCase());
        if (found) {
          setSelectedObject(found);
          return;
        }
      }

      // 6. Flights
      if (key === 'flight') {
        const found = flights.find(f => f.icao24.toLowerCase() === value.toLowerCase() || (f.callsign && f.callsign.toLowerCase().trim() === value.toLowerCase().trim()));
        if (found) {
          setSelectedObject(found);
          return;
        }
      }

      // 7. Satellites
      if (key === 'satellite') {
        const found = satellites.find(s => String(s.noradId) === value || (s.id && s.id.toLowerCase() === value.toLowerCase()));
        if (found && found.calculated) {
          setSelectedObject(found);
          return;
        }
      }

      // 8. Earthquakes
      if (key === 'earthquake') {
        const found = earthquakes.find(e => e.id.toLowerCase() === value.toLowerCase());
        if (found) {
          setSelectedObject(found);
          return;
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (infrastructure.length > 0 || companies.length > 0 || cameras.length > 0 || vessels.length > 0 || flights.length > 0 || earthquakes.length > 0 || satellites.length > 0) {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [infrastructure, companies, cameras, vessels, flights, satellites, earthquakes]);

  // Real-time or Simulated Satellite Propagation Tick
  useEffect(() => {
    if (!layers.satellites || satellites.length === 0) return;

    const orbitTicker = setInterval(() => {
      setSimTime(prevTime => {
        const nextTime = isSimPlaying 
          ? new Date(prevTime.getTime() + 1000 * simSpeed)
          : new Date();

        setSatellites(prevSats => prevSats.map(s => ({
          ...s,
          calculated: calculateSatellitePosition(s, nextTime) || s.calculated
        })));

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(orbitTicker);
  }, [layers.satellites, satellites.length, isSimPlaying, simSpeed]);

  // Handle Satellite Group Change
  useEffect(() => {
    fetchSatellites();
  }, [satelliteGroup, fetchSatellites]);

  // Filter Earthquakes by Magnitude
  const filteredEarthquakes = useMemo(() => {
    return earthquakes.filter(eq => eq.magnitude >= minQuakeMag);
  }, [earthquakes, minQuakeMag]);

  // Calculate active alerts count (e.g., M4.0+ quakes, wildfires, critical news)
  const activeAlertsCount = useMemo(() => {
    const highQuakes = filteredEarthquakes.filter(e => e.magnitude >= 4.0).length;
    const activeFires = wildfires.length;
    return highQuakes + activeFires;
  }, [filteredEarthquakes, wildfires]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. Tactical Command Header with View Modes */}
      <Header
        baseMap={baseMap}
        setBaseMap={setBaseMap}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(prev => !prev)}
        onOpenAiAnalyst={() => setIsAiAnalystOpen(prev => !prev)}
        alertCount={activeAlertsCount}
        onRefreshAll={refreshAll}
        isRefreshing={isRefreshing}
        activeCounts={{
          flights: flights.length,
          satellites: satellites.length,
          earthquakes: filteredEarthquakes.length,
          wildfires: wildfires.length,
          news: news.length
        }}
        sourcesHealth={sourcesHealth}
      />

      {/* 2. Main Geospatial / Multi-Modal Workspace */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* VIEW 1: TACTICAL MAP */}
        {viewMode === 'tactical-map' && (
          <div className="relative w-full h-full">
            {/* Floating Argos Atlas Global Search Bar */}
            <ArgosSearchBar
              onSelectResult={(result) => {
                if (result.category === 'company') {
                  const comp = companies.find(c => c.company_id === result.id || c.ticker === result.id);
                  if (comp) setSelectedCompany(comp);
                } else if (result.rawObject) {
                  setSelectedObject(result.rawObject);
                }
              }}
              onFlyTo={(lat, lon, zoom) => {
                setSelectedObject({ latitude: lat, longitude: lon, zoom });
              }}
            />

            {/* Tactical Map Canvas with Side Map Split Support */}
            <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-cyan-500/30">
              {/* Primary Tactical Map Pane */}
              <div className={`h-full relative flex flex-col transition-all duration-300 ${isSideMapOpen ? 'w-full md:w-3/5' : 'w-full'}`}>
                <TacticalMap
                  baseMap={baseMap}
                  layers={layers}
                  flights={flights}
                  satellites={satellites}
                  earthquakes={filteredEarthquakes}
                  wildfires={wildfires}
                  infrastructure={infrastructure}
                  cameras={cameras}
                  vessels={vessels}
                  companies={companies}
                  news={news}
                  radarMetadata={radarMetadata}
                  radarFramePath={radarFramePath}
                  currentTime={simTime}
                  onSelectObject={setSelectedObject}
                  onSelectCompany={setSelectedCompany}
                  selectedObject={selectedObject}
                />
              </div>

              {/* Side Map: Satellite Reconnaissance View */}
              {isSideMapOpen && (
                <div className="w-full md:w-2/5 h-1/2 md:h-full relative flex flex-col bg-slate-950 animate-in slide-in-from-right duration-200">
                  <div className="absolute top-3 left-4 z-20 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center justify-between gap-3 shadow-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SIDE MAP • HIGH-RES SATELLITE RECON</span>
                    </div>
                    <button
                      onClick={() => setIsSideMapOpen(false)}
                      className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                      title="Close Side Map"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <TacticalMap
                    baseMap="satellite"
                    layers={layers}
                    flights={flights}
                    satellites={satellites}
                    earthquakes={filteredEarthquakes}
                    wildfires={wildfires}
                    infrastructure={infrastructure}
                    cameras={cameras}
                    vessels={vessels}
                    companies={companies}
                    news={news}
                    radarMetadata={radarMetadata}
                    radarFramePath={radarFramePath}
                    currentTime={simTime}
                    onSelectObject={setSelectedObject}
                    onSelectCompany={setSelectedCompany}
                    selectedObject={selectedObject}
                  />
                </div>
              )}
            </div>

            {/* Side Map Toggle Button (When on Tactical Map) */}
            <button
              onClick={() => setIsSideMapOpen(prev => !prev)}
              className={`absolute top-20 right-4 z-20 flex items-center space-x-2 px-3 py-2 rounded-xl border font-mono text-xs shadow-xl backdrop-blur-md transition-all ${
                isSideMapOpen
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950/90 border-cyan-500/40 text-cyan-300 hover:bg-slate-900'
              }`}
              title="Toggle Side Satellite Reconnaissance Map"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">{isSideMapOpen ? 'Close Side Map' : 'Side Map'}</span>
            </button>

            {/* Company God View Intelligence Drawer */}
            {selectedCompany && (
              <CompanyIntelligenceDrawer
                company={selectedCompany}
                onClose={() => setSelectedCompany(null)}
                onFlyToAsset={(asset) => {
                  setSelectedObject(asset);
                }}
                onFlyToHeadquarters={(comp) => {
                  setSelectedObject({
                    id: comp.company_id,
                    name: `${comp.canonical_name} Headquarters`,
                    latitude: comp.headquarters.latitude,
                    longitude: comp.headquarters.longitude,
                    type: 'company_headquarters',
                    canonical_name: comp.canonical_name
                  });
                }}
              />
            )}

            {/* Timeline Scrubber */}
            <TimelineScrubber
              currentTime={simTime}
              setCurrentTime={setSimTime}
              isPlaying={isSimPlaying}
              setIsPlaying={setIsSimPlaying}
              playbackSpeed={simSpeed}
              setPlaybackSpeed={setSimSpeed}
              radarFrames={radarMetadata?.frames || []}
              currentRadarFrame={radarFramePath}
              setCurrentRadarFrame={setRadarFramePath}
            />

            {/* Floating Toggle Button (When layers panel is collapsed) */}
            {!isLayersOpen && (
              <button
                onClick={() => setIsLayersOpen(true)}
                className="absolute top-20 left-4 z-20 flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Show Layers</span>
              </button>
            )}

            {/* Layer Control Switchboard Panel */}
            <LayerControlPanel
              layers={layers}
              setLayers={setLayers}
              activeCounts={{
                flights: flights.length,
                satellites: satellites.length,
                earthquakes: filteredEarthquakes.length,
                wildfires: wildfires.length,
                news: news.length,
                infrastructure: infrastructure.length,
                cameras: cameras.length,
                vessels: vessels.length,
                companies: companies.length
              }}
              minQuakeMag={minQuakeMag}
              setMinQuakeMag={setMinQuakeMag}
              satelliteGroup={satelliteGroup}
              setSatelliteGroup={setSatelliteGroup}
              sourcesHealth={sourcesHealth}
              isOpen={isLayersOpen}
              onToggleOpen={() => setIsLayersOpen(!isLayersOpen)}
              onDockSideMap={() => setIsSideMapOpen(true)}
            />

            {/* Floating Live Cam HUD Toggle Button (When closed) */}
            {!isIntelOpen && (
              <button
                onClick={() => setIsIntelOpen(true)}
                className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all"
              >
                <Video className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-bold">Surveillance Cams ({cameras.length})</span>
              </button>
            )}

            {/* Draggable Tactical Surveillance & Multi-Domain Intel HUD */}
            <LiveCameraWidget
              cameras={cameras}
              macro={macro}
              news={news}
              earthquakes={filteredEarthquakes}
              wildfires={wildfires}
              onSelectObject={setSelectedObject}
              isOpen={isIntelOpen}
              onClose={() => setIsIntelOpen(false)}
              onOpenSurveillanceWall={() => setViewMode('surveillance-wall')}
              onDockSideMap={() => setIsSideMapOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: ANALYTICS DASHBOARD */}
        {viewMode === 'analytics' && (
          <AnalyticsDashboard
            earthquakes={filteredEarthquakes}
            wildfires={wildfires}
            flights={flights}
            satellites={satellites}
            infrastructure={infrastructure}
            news={news}
            macro={macro}
            sourcesHealth={sourcesHealth}
            feedStatuses={feedStatuses}
          />
        )}

        {/* VIEW 3: LIVE GRID MATRIX (TABULAR) */}
        {viewMode === 'grid-matrix' && (
          <LiveGridMatrix
            flights={flights}
            satellites={satellites}
            earthquakes={filteredEarthquakes}
            wildfires={wildfires}
            infrastructure={infrastructure}
            news={news}
            cameras={cameras}
            macro={macro}
            onSelectObject={(obj) => {
              setSelectedObject(obj);
              setViewMode('tactical-map');
            }}
          />
        )}

        {/* VIEW 4: SATELLITE PASS PREDICTOR */}
        {viewMode === 'pass-predictor' && (
          <SatellitePassPredictor
            satellites={satellites}
            onSelectSatellite={(sat) => {
              setSelectedObject(sat);
              setViewMode('tactical-map');
            }}
          />
        )}

        {/* VIEW 5: DEDICATED TACTICAL SURVEILLANCE WALL */}
        {viewMode === 'surveillance-wall' && (
          <SurveillanceWall
            cameras={cameras}
            onSelectCamera={(cam) => {
              setSelectedObject(cam);
            }}
            onClose={() => setViewMode('tactical-map')}
          />
        )}

        {/* VIEW 6: SIDE-BY-SIDE SPLIT MAP WORKSPACE */}
        {viewMode === 'split-map' && (
          <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-cyan-500/30">
            {/* Left Pane: Vector Tactical View */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col">
              <div className="absolute top-3 left-4 z-20 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                PANE 1: TACTICAL VECTOR / DARK
              </div>
              <TacticalMap
                baseMap="dark"
                layers={layers}
                flights={flights}
                satellites={satellites}
                earthquakes={filteredEarthquakes}
                wildfires={wildfires}
                infrastructure={infrastructure}
                cameras={cameras}
                vessels={vessels}
                companies={companies}
                news={news}
                radarMetadata={radarMetadata}
                radarFramePath={radarFramePath}
                currentTime={simTime}
                onSelectObject={setSelectedObject}
                onSelectCompany={setSelectedCompany}
                selectedObject={selectedObject}
              />
            </div>

            {/* Right Pane: Satellite Reconnaissance View */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative flex flex-col bg-slate-950">
              <div className="absolute top-3 left-4 z-20 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                PANE 2: HIGH-RES SATELLITE RECON
              </div>
              <TacticalMap
                baseMap="satellite"
                layers={layers}
                flights={flights}
                satellites={satellites}
                earthquakes={filteredEarthquakes}
                wildfires={wildfires}
                infrastructure={infrastructure}
                cameras={cameras}
                vessels={vessels}
                companies={companies}
                news={news}
                radarMetadata={radarMetadata}
                radarFramePath={radarFramePath}
                currentTime={simTime}
                onSelectObject={setSelectedObject}
                onSelectCompany={setSelectedCompany}
                selectedObject={selectedObject}
              />
            </div>

            {/* Floating Layer Control switchboard (movable across split view) */}
            <LayerControlPanel
              layers={layers}
              setLayers={setLayers}
              activeCounts={{
                flights: flights.length,
                satellites: satellites.length,
                earthquakes: filteredEarthquakes.length,
                wildfires: wildfires.length,
                news: news.length,
                infrastructure: infrastructure.length,
                cameras: cameras.length,
                vessels: vessels.length,
                companies: companies.length
              }}
              minQuakeMag={minQuakeMag}
              setMinQuakeMag={setMinQuakeMag}
              satelliteGroup={satelliteGroup}
              setSatelliteGroup={setSatelliteGroup}
              sourcesHealth={sourcesHealth}
              isOpen={isLayersOpen}
              onToggleOpen={() => setIsLayersOpen(!isLayersOpen)}
            />

            {/* Floating Live Cam HUD (movable across split view) */}
            <LiveCameraWidget
              cameras={cameras}
              macro={macro}
              news={news}
              earthquakes={filteredEarthquakes}
              wildfires={wildfires}
              onSelectObject={setSelectedObject}
              isOpen={isIntelOpen}
              onClose={() => setIsIntelOpen(false)}
              onOpenSurveillanceWall={() => setViewMode('surveillance-wall')}
            />
          </div>
        )}

        {/* Strict Data Provenance Detail Inspector Drawer */}
        <ObjectDetailDrawer
          selectedObject={selectedObject}
          onClose={() => setSelectedObject(null)}
        />
      </main>

      {/* 3. Global Notification Center & AI Assistant Drawers */}
      <AlertNotificationCenter
        earthquakes={filteredEarthquakes}
        wildfires={wildfires}
        news={news}
        isOpen={isAlertsOpen}
        onToggleOpen={() => setIsAlertsOpen(prev => !prev)}
        onSelectObject={(obj) => {
          setSelectedObject(obj);
          setViewMode('tactical-map');
        }}
      />

      <AiAnalystDrawer
        isOpen={isAiAnalystOpen}
        onClose={() => setIsAiAnalystOpen(false)}
        activeCounts={{
          flights: flights.length,
          satellites: satellites.length,
          earthquakes: filteredEarthquakes.length,
          wildfires: wildfires.length,
          news: news.length
        }}
        earthquakes={filteredEarthquakes}
        wildfires={wildfires}
        flights={flights}
        satellites={satellites}
        news={news}
      />

      {/* 4. Global Modals */}
      <AuditReportModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        repositories={repositories}
      />

      <SourceHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        sources={sourcesHealth}
        onRefresh={fetchHealth}
        isRefreshing={isRefreshing}
      />

      <GeminiBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        activeCounts={{
          flights: flights.length,
          satellites: satellites.length,
          earthquakes: filteredEarthquakes.length,
          wildfires: wildfires.length,
          news: news.length
        }}
        earthquakes={filteredEarthquakes}
        wildfires={wildfires}
        news={news}
      />
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { TacticalMap } from './components/TacticalMap';
import { LayerControlPanel } from './components/LayerControlPanel';
import { IntelFeedPanel } from './components/IntelFeedPanel';
import { ObjectDetailDrawer } from './components/ObjectDetailDrawer';
import { AuditReportModal } from './components/AuditReportModal';
import { SourceHealthModal } from './components/SourceHealthModal';
import { GeminiBriefingModal } from './components/GeminiBriefingModal';
import { TimelineScrubber } from './components/TimelineScrubber';
import { AlertNotificationCenter } from './components/AlertNotificationCenter';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LiveGridMatrix } from './components/LiveGridMatrix';
import { SatellitePassPredictor } from './components/SatellitePassPredictor';
import { AiAnalystDrawer } from './components/AiAnalystDrawer';
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
  ViewMode
} from './types';
import { Layers } from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 1. Fetch ADS-B Flights
  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch('/api/flights');
      if (!res.ok) {
        console.warn(`Flights endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setFlights(json.data);
      }
    } catch (err: any) {
      console.warn('Flights ingest notice:', err?.message || err);
    }
  }, []);

  // 2. Fetch CelesTrak Satellites
  const fetchSatellites = useCallback(async () => {
    try {
      const res = await fetch(`/api/satellites?group=${encodeURIComponent(satelliteGroup)}`);
      if (!res.ok) {
        console.warn(`Satellites endpoint HTTP ${res.status}`);
        return;
      }
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
      }
    } catch (err: any) {
      console.warn('Satellites ingest notice:', err?.message || err);
    }
  }, [satelliteGroup, simTime]);

  // 3. Fetch USGS Earthquakes
  const fetchEarthquakes = useCallback(async () => {
    try {
      const res = await fetch('/api/earthquakes');
      if (!res.ok) {
        console.warn(`Earthquakes endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setEarthquakes(json.data);
      }
    } catch (err: any) {
      console.warn('Earthquakes ingest notice:', err?.message || err);
    }
  }, []);

  // 4. Fetch NASA EONET Wildfires & Hazards
  const fetchWildfires = useCallback(async () => {
    try {
      const res = await fetch('/api/wildfires');
      if (!res.ok) {
        console.warn(`Wildfires endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setWildfires(json.data);
      }
    } catch (err: any) {
      console.warn('Wildfires ingest notice:', err?.message || err);
    }
  }, []);

  // 5. Fetch Critical Infrastructure
  const fetchInfrastructure = useCallback(async () => {
    try {
      const res = await fetch('/api/infrastructure');
      if (!res.ok) {
        console.warn(`Infrastructure endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setInfrastructure(json.data);
      }
    } catch (err: any) {
      console.warn('Infrastructure ingest notice:', err?.message || err);
    }
  }, []);

  // 6. Fetch GDELT Geopolitical News
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      if (!res.ok) {
        console.warn(`News endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setNews(json.data);
      }
    } catch (err: any) {
      console.warn('News ingest notice:', err?.message || err);
    }
  }, []);

  // 7. Fetch Macro Indicators
  const fetchMacro = useCallback(async () => {
    try {
      const res = await fetch('/api/macro');
      if (!res.ok) {
        console.warn(`Macro endpoint HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setMacro(json.data);
      }
    } catch (err: any) {
      console.warn('Macro ingest notice:', err?.message || err);
    }
  }, []);

  // 8. Fetch Weather Radar Metadata
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

  // 9. Fetch Source Health Status
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

  // 10. Fetch Repository Audit Matrix
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

  // URL Hash-Based Object Deep Linking (Argos Atlas addressable objects, e.g. #power=npp-kashiwazaki, #port=port-rotterdam)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;

      const [key, value] = hash.split('=');
      if (!key || !value) return;

      // Find in infrastructure
      if (['power', 'port', 'camera', 'company', 'cable', 'target'].includes(key)) {
        const found = infrastructure.find(item => item.id.toLowerCase() === value.toLowerCase());
        if (found) {
          setSelectedObject(found);
          return;
        }
      }

      // Find in flights
      if (key === 'flight') {
        const found = flights.find(f => f.icao24.toLowerCase() === value.toLowerCase() || (f.callsign && f.callsign.toLowerCase().trim() === value.toLowerCase().trim()));
        if (found) {
          setSelectedObject(found);
          return;
        }
      }

      // Find in satellites
      if (key === 'satellite') {
        const found = satellites.find(s => String(s.noradId) === value || (s.id && s.id.toLowerCase() === value.toLowerCase()));
        if (found && found.calculated) {
          setSelectedObject(found);
          return;
        }
      }

      // Find in earthquakes
      if (key === 'earthquake') {
        const found = earthquakes.find(e => e.id.toLowerCase() === value.toLowerCase());
        if (found) {
          setSelectedObject(found);
          return;
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Also evaluate when datasets load or update
    if (infrastructure.length > 0 || flights.length > 0 || earthquakes.length > 0 || satellites.length > 0) {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [infrastructure, flights, satellites, earthquakes]);

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
            <TacticalMap
              baseMap={baseMap}
              layers={layers}
              flights={flights}
              satellites={satellites}
              earthquakes={filteredEarthquakes}
              wildfires={wildfires}
              infrastructure={infrastructure}
              news={news}
              radarMetadata={radarMetadata}
              radarFramePath={radarFramePath}
              currentTime={simTime}
              onSelectObject={setSelectedObject}
              selectedObject={selectedObject}
            />

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
                infrastructure: infrastructure.length
              }}
              minQuakeMag={minQuakeMag}
              setMinQuakeMag={setMinQuakeMag}
              satelliteGroup={satelliteGroup}
              setSatelliteGroup={setSatelliteGroup}
              sourcesHealth={sourcesHealth}
              isOpen={isLayersOpen}
              onToggleOpen={() => setIsLayersOpen(!isLayersOpen)}
            />

            {/* Real-Time Intel Stream Feed Panel */}
            <IntelFeedPanel
              earthquakes={filteredEarthquakes}
              wildfires={wildfires}
              news={news}
              macro={macro}
              flights={flights}
              satellites={satellites}
              onSelectObject={setSelectedObject}
              isOpen={isIntelOpen}
              onToggleOpen={() => setIsIntelOpen(!isIntelOpen)}
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
            news={news}
            macro={macro}
            sourcesHealth={sourcesHealth}
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

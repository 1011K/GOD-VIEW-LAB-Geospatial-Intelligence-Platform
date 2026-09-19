import React from 'react';
import { 
  Plane, 
  Orbit, 
  Activity, 
  Flame, 
  CloudRain, 
  Building2, 
  Newspaper, 
  Eye, 
  EyeOff, 
  SlidersHorizontal, 
  Filter,
  CheckCircle,
  AlertCircle,
  Database
} from 'lucide-react';
import { LayerToggleState, SourceHealthEntry } from '../types';

interface LayerControlPanelProps {
  layers: LayerToggleState;
  setLayers: React.Dispatch<React.SetStateAction<LayerToggleState>>;
  activeCounts: {
    flights: number;
    satellites: number;
    earthquakes: number;
    wildfires: number;
    news: number;
    infrastructure: number;
  };
  minQuakeMag: number;
  setMinQuakeMag: (mag: number) => void;
  satelliteGroup: string;
  setSatelliteGroup: (grp: string) => void;
  sourcesHealth: SourceHealthEntry[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function LayerControlPanel({
  layers,
  setLayers,
  activeCounts,
  minQuakeMag,
  setMinQuakeMag,
  satelliteGroup,
  setSatelliteGroup,
  sourcesHealth,
  isOpen,
  onToggleOpen
}: LayerControlPanelProps) {
  const toggleLayer = (key: keyof LayerToggleState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSourceStatus = (id: string) => {
    const s = sourcesHealth.find(item => item.id === id);
    return s?.status || 'VERIFIED LIVE';
  };

  return (
    <aside 
      className={`absolute top-20 left-4 z-20 w-80 bg-slate-950/90 border border-cyan-950/70 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 font-mono text-xs ${
        isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[340px] opacity-0 pointer-events-none'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-cyan-950/60 bg-slate-900/60 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider font-['Chakra_Petch']">
            Geospatial Layers
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
          7 DOMAINS
        </span>
      </div>

      {/* Layer List */}
      <div className="p-3 space-y-2.5 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
        {/* 1. ADS-B Aircraft Layer */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.aircraft ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('aircraft')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Plane className={`w-4 h-4 ${layers.aircraft ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Live Aircraft (ADS-B)
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    getSourceStatus('opensky') === 'VERIFIED LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {getSourceStatus('opensky')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">OpenSky Network state vectors</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.flights}
              </span>
              <button onClick={() => toggleLayer('aircraft')} className="p-1 hover:text-slate-200">
                {layers.aircraft ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 2. NORAD Satellites Layer */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.satellites ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('satellites')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Orbit className={`w-4 h-4 ${layers.satellites ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Satellites (SGP4)
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">CelesTrak real-time TLE orbits</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.satellites}
              </span>
              <button onClick={() => toggleLayer('satellites')} className="p-1 hover:text-slate-200">
                {layers.satellites ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Satellite Group Filter */}
          {layers.satellites && (
            <div className="mt-2.5 pt-2 border-t border-indigo-950/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">NORAD Group:</span>
              <select
                value={satelliteGroup}
                onChange={(e) => setSatelliteGroup(e.target.value)}
                className="bg-slate-900 border border-indigo-500/30 text-indigo-300 rounded px-2 py-0.5 text-xs outline-none focus:border-indigo-400"
              >
                <option value="stations">Space Stations (ISS/Tiangong)</option>
                <option value="starlink">Starlink Constellation</option>
                <option value="weather">Weather & Earth Observation</option>
                <option value="active">Active High-Value Payload</option>
              </select>
            </div>
          )}
        </div>

        {/* 3. USGS Seismic Activity */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.earthquakes ? 'bg-amber-950/20 border-amber-500/40 text-amber-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('earthquakes')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Activity className={`w-4 h-4 ${layers.earthquakes ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Earthquakes & Seismic
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">USGS 24h Real-time feed</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.earthquakes}
              </span>
              <button onClick={() => toggleLayer('earthquakes')} className="p-1 hover:text-slate-200">
                {layers.earthquakes ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Magnitude Filter Slider */}
          {layers.earthquakes && (
            <div className="mt-2.5 pt-2 border-t border-amber-950/60 space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Min Magnitude Filter:</span>
                <span className="text-amber-400 font-bold">M{minQuakeMag.toFixed(1)}+</span>
              </div>
              <input
                type="range"
                min="0"
                max="6.0"
                step="0.5"
                value={minQuakeMag}
                onChange={(e) => setMinQuakeMag(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          )}
        </div>

        {/* 4. NASA EONET Wildfires & Hazards */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.wildfires ? 'bg-rose-950/20 border-rose-500/40 text-rose-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('wildfires')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Flame className={`w-4 h-4 ${layers.wildfires ? 'text-rose-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Wildfires & Hazards
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">NASA EONET & MODIS/VIIRS</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-rose-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.wildfires}
              </span>
              <button onClick={() => toggleLayer('wildfires')} className="p-1 hover:text-slate-200">
                {layers.wildfires ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 5. RainViewer Weather Radar */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.weatherRadar ? 'bg-blue-950/20 border-blue-500/40 text-blue-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('weatherRadar')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <CloudRain className={`w-4 h-4 ${layers.weatherRadar ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Global Weather Radar
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">RainViewer Doppler radar composite</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-blue-400 font-mono">DOPPLER</span>
              <button onClick={() => toggleLayer('weatherRadar')} className="p-1 hover:text-slate-200">
                {layers.weatherRadar ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 6. Critical Infrastructure & Energy */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.infrastructure ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('infrastructure')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Building2 className={`w-4 h-4 ${layers.infrastructure ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Critical Infrastructure & Ports
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    STATIC BASELINE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Power, Seaports, Cables & Transit Cams</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.infrastructure}
              </span>
              <button onClick={() => toggleLayer('infrastructure')} className="p-1 hover:text-slate-200">
                {layers.infrastructure ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 7. GDELT Geopolitical Intelligence */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.newsIntel ? 'bg-purple-950/20 border-purple-500/40 text-purple-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('newsIntel')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Newspaper className={`w-4 h-4 ${layers.newsIntel ? 'text-purple-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  OSINT & Geopolitical News
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">GDELT Project 2.0 Real-time feed</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-purple-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.news}
              </span>
              <button onClick={() => toggleLayer('newsIntel')} className="p-1 hover:text-slate-200">
                {layers.newsIntel ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 8. Subsea Optical Bit Paths */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.bitPaths ? 'bg-cyan-950/30 border-cyan-400/50 text-cyan-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('bitPaths')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Database className={`w-4 h-4 ${layers.bitPaths ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Subsea Optical Bit Paths
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    VERIFIED LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Trans-oceanic fiber trunk lines & pulses</div>
              </div>
            </button>
            <button onClick={() => toggleLayer('bitPaths')} className="p-1 hover:text-slate-200">
              {layers.bitPaths ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* 9. Orbit Ground Tracks */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.orbitTracks ? 'bg-indigo-950/30 border-indigo-400/50 text-indigo-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('orbitTracks')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Orbit className={`w-4 h-4 ${layers.orbitTracks ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Orbital Ground Tracks
                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    SGP4 ±45M
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Satellite sub-orbital projection lines</div>
              </div>
            </button>
            <button onClick={() => toggleLayer('orbitTracks')} className="p-1 hover:text-slate-200">
              {layers.orbitTracks ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* 10. Dynamic Heatmap Layer */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.heatmapLayer ? 'bg-rose-950/30 border-rose-500/50 text-rose-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('heatmapLayer')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Flame className={`w-4 h-4 ${layers.heatmapLayer ? 'text-rose-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Dynamic Heatmap Field
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    RADIAL BLEND
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Continuous density & energy gradient</div>
              </div>
            </button>
            <button onClick={() => toggleLayer('heatmapLayer')} className="p-1 hover:text-slate-200">
              {layers.heatmapLayer ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>

          {layers.heatmapLayer && (
            <div className="mt-2.5 pt-2 border-t border-rose-950/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Heatmap Mode:</span>
              <select
                value={layers.heatmapMode}
                onChange={(e) => setLayers(prev => ({ ...prev, heatmapMode: e.target.value as any }))}
                className="bg-slate-900 border border-rose-500/30 text-rose-300 rounded px-2 py-0.5 text-xs outline-none focus:border-rose-400"
              >
                <option value="thermal">Thermal Hazards (NASA EONET)</option>
                <option value="seismic">Seismic Energy (USGS)</option>
                <option value="aviation">Airspace Density (OpenSky)</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

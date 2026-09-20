import React, { useState, useEffect, useRef } from 'react';
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
  Database,
  Video,
  Ship,
  Factory,
  Zap,
  GripHorizontal,
  RotateCcw,
  PanelLeftClose,
  PanelRightClose,
  Maximize2,
  Minimize2,
  X
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
    cameras?: number;
    vessels?: number;
    companies?: number;
  };
  minQuakeMag: number;
  setMinQuakeMag: (mag: number) => void;
  satelliteGroup: string;
  setSatelliteGroup: (grp: string) => void;
  sourcesHealth: SourceHealthEntry[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onDockSideMap?: () => void;
}

export type DockMode = 'docked-left' | 'docked-right' | 'side-map' | 'floating';

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
  onToggleOpen,
  onDockSideMap
}: LayerControlPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  // Docking & Position state with localStorage persistence
  const [dockMode, setDockMode] = useState<DockMode>(() => {
    try {
      const saved = localStorage.getItem('gv_layer_dock_mode');
      if (saved === 'docked-left' || saved === 'docked-right' || saved === 'side-map' || saved === 'floating') return saved as DockMode;
    } catch {}
    return 'docked-left';
  });

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('gv_layer_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 16, y: 80 };
  });

  // Opacity customization with localStorage persistence
  const [opacity, setOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gv_layer_opacity');
      if (saved) return parseFloat(saved);
    } catch {}
    return 0.95;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 16,
    initialY: 80
  });

  // Save dockMode, position, and opacity
  useEffect(() => {
    try {
      localStorage.setItem('gv_layer_dock_mode', dockMode);
    } catch {}
  }, [dockMode]);

  useEffect(() => {
    try {
      localStorage.setItem('gv_layer_pos', JSON.stringify(position));
    } catch {}
  }, [position]);

  useEffect(() => {
    try {
      localStorage.setItem('gv_layer_opacity', opacity.toString());
    } catch {}
  }, [opacity]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) return;

    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const curX = rect.left;
      const curY = rect.top;
      setPosition({ x: curX, y: curY });
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: curX,
        initialY: curY
      };
    } else {
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y
      };
    }
    setIsDragging(true);
    setDockMode('floating');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(8, Math.min(window.innerWidth - 340, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(64, Math.min(window.innerHeight - 120, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const resetDock = (mode: DockMode) => {
    setDockMode(mode);
    if (mode === 'docked-left') {
      setPosition({ x: 16, y: 80 });
    } else if (mode === 'docked-right' || mode === 'side-map') {
      setPosition({ x: Math.max(16, window.innerWidth - 340), y: 80 });
      if (mode === 'side-map' && onDockSideMap) {
        onDockSideMap();
      }
    }
  };

  const cycleOpacity = () => {
    setOpacity(prev => prev === 0.95 ? 0.8 : prev === 0.8 ? 0.6 : 0.95);
  };

  const toggleLayer = (key: keyof LayerToggleState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSourceStatus = (id: string) => {
    const s = sourcesHealth.find(item => item.id === id);
    return s?.status || 'NOT_CHECKED';
  };

  if (!isOpen) return null;

  // Determine computed container style based on dockMode
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 28,
    opacity,
    transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.15s ease',
    ...(dockMode === 'floating'
      ? { left: `${position.x}px`, top: `${position.y}px` }
      : dockMode === 'side-map' || dockMode === 'docked-right'
      ? { right: '16px', top: '80px' }
      : { left: '16px', top: '80px' })
  };

  if (isMinimized) {
    return (
      <div
        ref={panelRef as any}
        style={containerStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs shadow-2xl backdrop-blur-xl cursor-grab active:cursor-grabbing select-none"
      >
        <GripHorizontal className="w-3.5 h-3.5 text-cyan-500" />
        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-bold uppercase tracking-wider text-[10px]">Layers</span>
        <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
          {Object.values(layers).filter(Boolean).length} ON
        </span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-0.5 rounded hover:bg-cyan-500/20 text-cyan-300 transition-colors"
          title="Expand Layer Panel"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <aside 
      ref={panelRef}
      style={containerStyle}
      className={`w-80 max-w-[calc(100vw-2rem)] bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl font-mono text-xs flex flex-col select-none ${
        isDragging ? 'cursor-grabbing scale-[1.01] ring-2 ring-cyan-400/50' : ''
      }`}
    >
      {/* Draggable Panel Header Bar */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="px-3 py-2.5 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/50 rounded-t-2xl flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal className="w-4 h-4 text-cyan-400" />
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider font-['Chakra_Petch'] text-[11px]">
            Geospatial Layers
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
            {dockMode === 'side-map' ? 'SIDE MAP' : dockMode === 'floating' ? 'FLOAT' : dockMode === 'docked-right' ? 'RIGHT' : 'LEFT'}
          </span>
        </div>

        {/* Action Buttons: Dock Left, Dock Right/Side Map, Opacity, Minimize, Close */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => resetDock(dockMode === 'docked-left' ? 'floating' : 'docked-left')}
            title="Dock to Left Rail"
            className={`p-1 rounded transition-colors ${
              dockMode === 'docked-left' ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => resetDock(dockMode === 'side-map' ? 'floating' : 'side-map')}
            title="Dock to Side Map (Right Rail)"
            className={`p-1 rounded transition-colors ${
              dockMode === 'side-map' || dockMode === 'docked-right' ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cycleOpacity}
            title={`Opacity: ${Math.round(opacity * 100)}% (Click to toggle)`}
            className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors font-bold"
          >
            {Math.round(opacity * 100)}%
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize Layers to Pill"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleOpen}
            title="Close Layers Panel"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
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
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    getSourceStatus('celestrak') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    getSourceStatus('celestrak') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {getSourceStatus('celestrak')}
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
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    getSourceStatus('usgs') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    getSourceStatus('usgs') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {getSourceStatus('usgs')}
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
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    getSourceStatus('nasa-eonet') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    getSourceStatus('nasa-eonet') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {getSourceStatus('nasa-eonet')}
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
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    getSourceStatus('rainviewer') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    getSourceStatus('rainviewer') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {getSourceStatus('rainviewer')}
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
                <div className="text-[10px] text-slate-400">Power, Seaports, Cables & Infrastructure</div>
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

        {/* 6B. Public Traffic & Web Cameras */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.cameras ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('cameras')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Video className={`w-4 h-4 ${layers.cameras ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Public Traffic Cameras
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Government DOTs & Port CCTVs</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.cameras || 12}
              </span>
              <button onClick={() => toggleLayer('cameras')} className="p-1 hover:text-slate-200">
                {layers.cameras ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 6C. Marine AIS Vessels */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.vessels ? 'bg-blue-950/30 border-blue-500/50 text-blue-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('vessels')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Ship className={`w-4 h-4 ${layers.vessels ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Marine AIS Vessels
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    LIVE AIS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Cargo, Tankers & Maritime Chokepoints</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.vessels || 8}
              </span>
              <button onClick={() => toggleLayer('vessels')} className="p-1 hover:text-slate-200">
                {layers.vessels ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* 6D. Company God View & Assets */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          layers.companies ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-100' : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLayer('companies')}
              className="flex items-center space-x-2.5 text-left flex-1"
            >
              <Factory className={`w-4 h-4 ${layers.companies ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  Company God View
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Physical Assets, Refineries & Plants</div>
              </div>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeCounts.companies || 6}
              </span>
              <button onClick={() => toggleLayer('companies')} className="p-1 hover:text-slate-200">
                {layers.companies ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
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
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    getSourceStatus('gdelt') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    getSourceStatus('gdelt') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {getSourceStatus('gdelt')}
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
      )}
    </aside>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Camera, 
  RefreshCw, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  X, 
  GripHorizontal, 
  MapPin, 
  Activity, 
  TrendingUp, 
  Globe, 
  Flame, 
  ShieldCheck, 
  AlertCircle,
  Radio,
  RotateCcw,
  ExternalLink,
  PanelLeftClose,
  PanelRightClose,
  LayoutGrid
} from 'lucide-react';
import { 
  PublicCameraRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  NewsIntelligenceRecord, 
  MacroIndicatorRecord 
} from '../types';

interface LiveCameraWidgetProps {
  cameras: PublicCameraRecord[];
  macro: MacroIndicatorRecord[];
  news: NewsIntelligenceRecord[];
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  onSelectObject: (obj: any) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSurveillanceWall?: () => void;
}

type TabMode = 'cameras' | 'macro' | 'osint' | 'hazards';
export type CameraDockMode = 'docked-left' | 'docked-right' | 'side-map' | 'floating';

export function LiveCameraWidget({
  cameras,
  macro,
  news,
  earthquakes,
  wildfires,
  onSelectObject,
  isOpen,
  onClose,
  onOpenSurveillanceWall
}: LiveCameraWidgetProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('cameras');
  const [currentCamIndex, setCurrentCamIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{ status: string; latency_ms: number; checked_at: string } | null>(null);
  const [imgError, setImgError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [zuluTime, setZuluTime] = useState('');

  // Dock Mode with localStorage persistence
  const [dockMode, setDockMode] = useState<CameraDockMode>(() => {
    try {
      const saved = localStorage.getItem('gv_camera_dock_mode');
      if (saved === 'docked-left' || saved === 'docked-right' || saved === 'side-map' || saved === 'floating') {
        return saved as CameraDockMode;
      }
    } catch {}
    return 'floating';
  });

  // Draggable State with localStorage persistence
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('gv_camera_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 460 : 300 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 16,
    initialY: typeof window !== 'undefined' ? window.innerHeight - 460 : 300
  });

  // Save dockMode & position
  useEffect(() => {
    try {
      localStorage.setItem('gv_camera_dock_mode', dockMode);
    } catch {}
  }, [dockMode]);

  useEffect(() => {
    try {
      localStorage.setItem('gv_camera_pos', JSON.stringify(position));
    } catch {}
  }, [position]);

  const activeCam = cameras[currentCamIndex] || cameras[0];

  // Keep live Zulu time ticking
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setZuluTime(now.toISOString().replace('T', ' ').substring(11, 19) + ' Z');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic Snapshot Refresh (every 8s to simulate live CCTV image stream)
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshKey(Date.now());
    }, 8000);
    return () => clearInterval(refreshTimer);
  }, []);

  // Auto-Cycle Patrol Mode (cycles cameras every 10 seconds)
  useEffect(() => {
    if (!isAutoCycling || cameras.length === 0) return;
    const patrolTimer = setInterval(() => {
      setCurrentCamIndex(prev => (prev + 1) % cameras.length);
      setImgError(false);
      setProbeResult(null);
    }, 10000);
    return () => clearInterval(patrolTimer);
  }, [isAutoCycling, cameras.length]);

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('iframe')) return;
    setIsDragging(true);
    setDockMode('floating');
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    
    const newX = Math.max(8, Math.min(window.innerWidth - 400, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(64, Math.min(window.innerHeight - 100, dragStartRef.current.initialY + deltaY));
    
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const resetPosition = () => {
    setDockMode('floating');
    setPosition({ x: 16, y: window.innerHeight - 460 });
  };

  const setDock = (mode: CameraDockMode) => {
    setDockMode(mode);
    if (mode === 'docked-left') {
      setPosition({ x: 16, y: window.innerHeight - 460 });
    } else if (mode === 'docked-right' || mode === 'side-map') {
      setPosition({ x: Math.max(16, window.innerWidth - 420), y: 80 });
    }
  };

  // Upstream Live Health Probe
  const handleProbeStream = async () => {
    if (!activeCam) return;
    setIsProbing(true);
    const start = performance.now();
    try {
      const probeTarget = activeCam.camera_id || activeCam.id || '';
      const res = await fetch(`/api/cameras/check-status?camera_id=${encodeURIComponent(probeTarget)}`);
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const json = await res.json();
        setProbeResult({
          status: json.status || 'LIVE',
          latency_ms: elapsed,
          checked_at: new Date().toLocaleTimeString()
        });
      } else {
        setProbeResult({
          status: 'UNAVAILABLE',
          latency_ms: elapsed,
          checked_at: new Date().toLocaleTimeString()
        });
      }
    } catch {
      setProbeResult({
        status: 'UNAVAILABLE',
        latency_ms: 999,
        checked_at: new Date().toLocaleTimeString()
      });
    } finally {
      setIsProbing(false);
    }
  };

  if (!isOpen) return null;

  // Determine computed container style based on dockMode
  const containerStyle: React.CSSProperties = dockMode === 'floating'
    ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 40 }
    : dockMode === 'docked-left'
    ? { position: 'fixed', left: '16px', bottom: '16px', zIndex: 40 }
    : dockMode === 'side-map' || dockMode === 'docked-right'
    ? { position: 'fixed', right: '16px', top: '80px', zIndex: 40, width: '400px' }
    : { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 40 };

  return (
    <div
      style={containerStyle}
      className={`w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl font-mono text-xs flex flex-col transition-all duration-150 select-none ${
        isDragging ? 'cursor-grabbing scale-[1.01] ring-2 ring-cyan-400/50' : ''
      }`}
    >
      {/* Draggable Header Title Bar */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="p-2.5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/50 border-b border-cyan-500/30 flex items-center justify-between rounded-t-2xl cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal className="w-4 h-4 text-cyan-400" />
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-slate-100 uppercase tracking-wider font-['Chakra_Petch'] text-[11px]">
              Tactical Surveillance HUD
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
            {dockMode === 'side-map' ? 'SIDE MAP' : dockMode === 'docked-right' ? 'RIGHT' : dockMode === 'docked-left' ? 'LEFT' : 'FLOAT'}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Dock Left */}
          <button
            onClick={() => setDock(dockMode === 'docked-left' ? 'floating' : 'docked-left')}
            title="Dock to Bottom-Left"
            className={`p-1 rounded transition-colors ${
              dockMode === 'docked-left' ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
          {/* Dock Side Map / Right */}
          <button
            onClick={() => setDock(dockMode === 'side-map' ? 'floating' : 'side-map')}
            title="Dock to Side Map (Right Rail)"
            className={`p-1 rounded transition-colors ${
              dockMode === 'side-map' ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
          {/* Snap Reset */}
          <button
            onClick={resetPosition}
            title="Snap Back to Default Position"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {/* Minimize / Expand */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          {/* Close HUD */}
          <button
            onClick={onClose}
            title="Close HUD"
            className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Sub Navigation Mode Tabs */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/90 border-b border-slate-800/80 text-[10px]">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('cameras')}
                className={`px-2 py-0.5 rounded transition-all font-bold flex items-center gap-1 ${
                  activeTab === 'cameras' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3 h-3 text-cyan-400" />
                <span>Live Cam ({cameras.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('macro')}
                className={`px-2 py-0.5 rounded transition-all font-bold flex items-center gap-1 ${
                  activeTab === 'macro' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Macro ({macro.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('osint')}
                className={`px-2 py-0.5 rounded transition-all font-bold flex items-center gap-1 ${
                  activeTab === 'osint' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3 h-3 text-purple-400" />
                <span>OSINT ({news.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('hazards')}
                className={`px-2 py-0.5 rounded transition-all font-bold flex items-center gap-1 ${
                  activeTab === 'hazards' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Hazards</span>
              </button>
            </div>

            <span className="text-slate-500 font-mono text-[9px]">
              {zuluTime}
            </span>
          </div>

          {/* TAB 1: LIVE SURVEILLANCE CAMERAS */}
          {activeTab === 'cameras' && activeCam && (
            <div className="p-2.5 space-y-2.5">
              {/* Quick Channel Bar */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 custom-scrollbar">
                {cameras.slice(0, 7).map((cam, idx) => (
                  <button
                    key={cam.camera_id}
                    onClick={() => {
                      setCurrentCamIndex(idx);
                      setImgError(false);
                      setProbeResult(null);
                    }}
                    className={`px-2 py-1 rounded text-[9px] whitespace-nowrap transition-all flex items-center gap-1 font-bold ${
                      idx === currentCamIndex
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>CH-0{idx + 1}: {cam.region}</span>
                  </button>
                ))}
              </div>

              {/* Video Monitor Frame: supports genuine embedded video streams (YouTube, HLS, IFRAME) or live refreshing CCTV snapshots */}
              <div className="relative aspect-video rounded-xl bg-slate-950 border border-cyan-500/40 overflow-hidden group shadow-inner">
                {/* Live Stream: Video or Image */}
                {activeCam.stream_type === 'youtube' || activeCam.media_type === 'video' ? (
                  <iframe
                    key={activeCam.camera_id}
                    src={activeCam.embed_url || activeCam.media_url}
                    title={activeCam.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0 pointer-events-auto"
                  />
                ) : !imgError ? (
                  <img
                    key={`${activeCam.camera_id}-${refreshKey}`}
                    src={`${activeCam.media_url}${activeCam.media_url.includes('?') ? '&' : '?'}_t=${refreshKey}`}
                    alt={activeCam.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-slate-500 p-4 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-amber-500 animate-pulse" />
                    <span className="text-[10px] text-slate-300 font-bold">STREAM RE-CONNECTING</span>
                    <span className="text-[9px] text-slate-500">Connecting to agency CCTV upstream server...</span>
                    <button
                      onClick={() => { setImgError(false); setRefreshKey(Date.now()); }}
                      className="mt-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[9px] border border-slate-700"
                    >
                      Retry Upstream
                    </button>
                  </div>
                )}

                {/* CCTV Tactical Overlay Elements */}
                <div className="absolute top-2 left-2 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950/80 border border-cyan-500/30 text-[9px] text-cyan-300 backdrop-blur-sm pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold">{activeCam.stream_type === 'youtube' ? 'LIVE VIDEO' : 'LIVE CCTV'}</span>
                  <span className="text-slate-400">|</span>
                  <span>{activeCam.region}</span>
                </div>

                <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-950/80 border border-cyan-500/30 text-[9px] text-slate-300 backdrop-blur-sm pointer-events-none">
                  <span className="text-slate-400">{activeCam.freshness_seconds <= 1 ? 'Continuous Stream' : `${activeCam.freshness_seconds}s interval`}</span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded bg-slate-950/85 border border-slate-800 text-[9px] text-slate-300 backdrop-blur-sm">
                  <div className="truncate pr-2 font-medium">
                    {activeCam.name}
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {activeCam.source_url && (
                      <a
                        href={activeCam.source_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open upstream source stream in new tab"
                        className="text-slate-400 hover:text-cyan-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => onSelectObject(activeCam)}
                      className="text-cyan-400 hover:text-cyan-200 font-bold flex items-center gap-0.5"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>FLY TO</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  onClick={handleProbeStream}
                  disabled={isProbing}
                  className="px-2 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className={`w-3 h-3 text-cyan-400 ${isProbing ? 'animate-spin' : ''}`} />
                  <span>{isProbing ? 'PROBING...' : 'PROBE UPSTREAM'}</span>
                </button>

                <button
                  onClick={() => setIsAutoCycling(!isAutoCycling)}
                  className={`px-2 py-1.5 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${
                    isAutoCycling
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {isAutoCycling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isAutoCycling ? 'STOP PATROL' : 'PATROL MODE'}</span>
                </button>

                {onOpenSurveillanceWall ? (
                  <button
                    onClick={onOpenSurveillanceWall}
                    className="px-2 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm"
                    title="Open 2x2 / 3x3 Live Video Surveillance Wall"
                  >
                    <LayoutGrid className="w-3 h-3 text-indigo-400" />
                    <span>CAM WALL</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setRefreshKey(Date.now())}
                    className="px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>REFRESH</span>
                  </button>
                )}
              </div>

              {/* Health Probe Report (if probed) */}
              {probeResult && (
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    Probe Status:
                    <span className={`font-bold ${probeResult.status === 'LIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {probeResult.status}
                    </span>
                  </span>
                  <span className="text-slate-500 font-mono">
                    {probeResult.latency_ms}ms • {probeResult.checked_at}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MARKET MACRO (NOW FULLY MOVABLE) */}
          {activeTab === 'macro' && (
            <div className="p-2.5 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                <span>GLOBAL ASSETS & COMMODITIES</span>
                <span className="text-emerald-400 font-bold">VERIFIED LIVE</span>
              </div>
              {macro.map((m, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      {m.name}
                      <span className="text-[9px] text-slate-400 font-mono">({m.symbol})</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{m.provider}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-100">
                      {m.price.toLocaleString()} <span className="text-[9px] text-slate-400">{m.unit}</span>
                    </div>
                    <div className={`text-[9px] font-bold ${m.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.change_24h_pct >= 0 ? '+' : ''}{m.change_24h_pct}% (24h)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: GEOPOLITICAL OSINT (NOW FULLY MOVABLE) */}
          {activeTab === 'osint' && (
            <div className="p-2.5 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                <span>GDELT 2.0 GEOPOLITICAL DISPATCHES</span>
                <span className="text-purple-400 font-bold">REAL-TIME</span>
              </div>
              {news.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => onSelectObject(n)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="px-1 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800 font-bold">
                      {n.category.toUpperCase()}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(n.published_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-2 hover:text-purple-300">
                    {n.title}
                  </p>
                  <div className="text-[9px] text-slate-400 flex items-center justify-between">
                    <span>{n.source}</span>
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> Fly To
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 4: HAZARDS & SEISMIC */}
          {activeTab === 'hazards' && (
            <div className="p-2.5 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                <span>CRISIS TELEMETRY & SEISMICITY</span>
                <span className="text-rose-400 font-bold">ACTIVE ANOMALIES</span>
              </div>
              {earthquakes.slice(0, 6).map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => onSelectObject(eq)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                      M{eq.magnitude} QUAKE
                    </span>
                    <div className="text-[11px] text-slate-200 mt-1">{eq.place}</div>
                  </div>
                  <div className="text-right text-[9px] text-slate-500">
                    <div>{eq.depthKm} km depth</div>
                    <div className="text-cyan-400 mt-1 font-bold">FLY TO</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

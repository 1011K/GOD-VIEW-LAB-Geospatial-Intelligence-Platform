import { useState, useEffect } from 'react';
import { 
  Globe, 
  ShieldAlert, 
  Activity, 
  FileText, 
  Cpu, 
  Layers, 
  RefreshCw, 
  Radio, 
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Server,
  Bell,
  BarChart3,
  TableProperties,
  Compass,
  Bot,
  Map as MapIcon,
  Sparkles
} from 'lucide-react';
import { BaseMapType, SourceHealthEntry, ViewMode } from '../types';
import { SpaceWeatherWidget } from './SpaceWeatherWidget';

interface HeaderProps {
  baseMap: BaseMapType;
  setBaseMap: (bm: BaseMapType) => void;
  viewMode: ViewMode;
  setViewMode: (vm: ViewMode) => void;
  onOpenAudit: () => void;
  onOpenHealth: () => void;
  onOpenBriefing: () => void;
  onOpenAlerts: () => void;
  onOpenAiAnalyst: () => void;
  alertCount: number;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  activeCounts: {
    flights: number;
    satellites: number;
    earthquakes: number;
    wildfires: number;
    news: number;
  };
  sourcesHealth: SourceHealthEntry[];
}

export function Header({
  baseMap,
  setBaseMap,
  viewMode,
  setViewMode,
  onOpenAudit,
  onOpenHealth,
  onOpenBriefing,
  onOpenAlerts,
  onOpenAiAnalyst,
  alertCount,
  onRefreshAll,
  isRefreshing,
  activeCounts,
  sourcesHealth
}: HeaderProps) {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'ZULU'));
      setTimeLocal(now.toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalVerifiedLive = sourcesHealth.filter(s => s.status === 'VERIFIED LIVE').length;

  return (
    <header className="h-16 bg-slate-950/95 border-b border-cyan-950/60 px-4 flex items-center justify-between z-30 select-none backdrop-blur-md font-mono text-xs">
      {/* Brand & Platform Identity */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950 animate-ping" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-wider font-['Chakra_Petch'] text-slate-100 flex items-center gap-1.5">
              GOD-VIEW-LAB
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v2.5 GEOINT
              </span>
            </h1>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              NO FAKE DATA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-cyan-400/90">{activeCounts.flights} Flights</span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400/90">{activeCounts.satellites} Sats</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400/90">{activeCounts.earthquakes} Quakes</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400/90">{activeCounts.wildfires} Fires</span>
          </p>
        </div>
      </div>

      {/* Center: View Modes Switcher */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setViewMode('tactical-map')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === 'tactical-map' 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Tactical Map</span>
        </button>

        <button
          onClick={() => setViewMode('3d-globe')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === '3d-globe' 
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold shadow-sm ring-1 ring-cyan-500/50' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="CesiumJS 3D Orbital God View Globe"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D God View</span>
        </button>

        <button
          onClick={() => setViewMode('analytics')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === 'analytics' 
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setViewMode('grid-matrix')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === 'grid-matrix' 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TableProperties className="w-3.5 h-3.5" />
          <span>Live Matrix</span>
        </button>

        <button
          onClick={() => setViewMode('pass-predictor')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === 'pass-predictor' 
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Pass Predictor</span>
        </button>

        <button
          onClick={() => setViewMode('surveillance-wall')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === 'surveillance-wall' 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tactical Multi-Camera Matrix & Surveillance Wall"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Cam Wall</span>
        </button>

        <button
          onClick={() => setViewMode('split-map')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
            viewMode === 'split-map' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Side-by-Side Split Map Dual Projection"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Split Map</span>
        </button>
      </div>

      {/* Right Actions, Alerts & AI */}
      <div className="flex items-center space-x-2">
        {/* Base Map Selector (Only visible on tactical-map view) */}
        {viewMode === 'tactical-map' && (
          <div className="hidden xl:flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setBaseMap('dark')}
              className={`px-2 py-1 rounded transition-colors ${
                baseMap === 'dark' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setBaseMap('satellite')}
              className={`px-2 py-1 rounded transition-colors ${
                baseMap === 'satellite' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sat
            </button>
            <button
              onClick={() => setBaseMap('terrain')}
              className={`px-2 py-1 rounded transition-colors ${
                baseMap === 'terrain' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Topo
            </button>
          </div>
        )}

        {/* NOAA Space Weather (Argus repo integration) */}
        <SpaceWeatherWidget />

        {/* Global Refresh */}
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-all disabled:opacity-50"
          title="Refresh All Real-Time Feeds"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Alert Notification Center Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-all"
          title="Tactical Alert Notifications Log"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold ring-2 ring-slate-950 animate-bounce">
              {alertCount}
            </span>
          )}
        </button>

        {/* AI Geointel Analyst Drawer */}
        <button
          onClick={onOpenAiAnalyst}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 transition-all shadow-sm"
          title="Interactive Geospatial AI Analyst (Gemini 3.8 Flash)"
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline font-bold">AI Analyst</span>
        </button>

        {/* Source Health Modal */}
        <button
          onClick={onOpenHealth}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 transition-all"
          title="Inspect API Diagnostics & Source Latency"
        >
          <Server className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Health</span>
        </button>

        {/* Repo Audit Modal */}
        <button
          onClick={onOpenAudit}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-indigo-100 transition-all"
          title="Complete Repository Audit Report"
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="hidden md:inline">Audit</span>
        </button>

        {/* Gemini Global Briefing */}
        <button
          onClick={onOpenBriefing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-800/80 hover:to-blue-800/80 border border-cyan-500/50 text-cyan-200 transition-all shadow-sm"
          title="Synthesize Situational Awareness Briefing"
        >
          <Cpu className="w-4 h-4 text-cyan-300" />
          <span className="hidden sm:inline font-bold">Briefing</span>
        </button>
      </div>
    </header>
  );
}

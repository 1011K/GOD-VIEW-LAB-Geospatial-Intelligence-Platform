import { useState } from 'react';
import { 
  Radio, 
  Activity, 
  Flame, 
  Newspaper, 
  TrendingUp, 
  Search, 
  ChevronRight, 
  MapPin, 
  ExternalLink,
  Filter,
  Zap,
  Globe
} from 'lucide-react';
import { 
  EarthquakeRecord, 
  WildfireRecord, 
  NewsIntelligenceRecord, 
  MacroIndicatorRecord, 
  AircraftRecord,
  SatelliteRecord 
} from '../types';

interface IntelFeedPanelProps {
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  news: NewsIntelligenceRecord[];
  macro: MacroIndicatorRecord[];
  flights: AircraftRecord[];
  satellites: SatelliteRecord[];
  onSelectObject: (obj: any) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

type TabType = 'all' | 'seismic' | 'wildfires' | 'osint' | 'macro';

export function IntelFeedPanel({
  earthquakes,
  wildfires,
  news,
  macro,
  flights,
  satellites,
  onSelectObject,
  isOpen,
  onToggleOpen
}: IntelFeedPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine and sort events
  const allEvents = [
    ...earthquakes.map(eq => ({
      id: eq.id,
      title: `M${eq.magnitude} Earthquake - ${eq.place}`,
      timestamp: new Date(eq.time),
      category: 'seismic',
      type: 'Earthquake',
      provider: eq.provider,
      status: eq.status,
      severity: eq.magnitude >= 5.0 ? 'high' : eq.magnitude >= 3.0 ? 'med' : 'low',
      raw: eq
    })),
    ...wildfires.map(wf => ({
      id: wf.id,
      title: `${wf.title} (${wf.category})`,
      timestamp: new Date(wf.date),
      category: 'wildfire',
      type: 'Thermal/Hazard',
      provider: wf.provider,
      status: wf.status,
      severity: 'med',
      raw: wf
    })),
    ...news.map(n => ({
      id: n.id,
      title: n.title,
      timestamp: new Date(n.published_at),
      category: 'osint',
      type: n.category.toUpperCase(),
      provider: n.provider,
      status: n.status,
      severity: 'info',
      raw: n
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Filter events
  const filteredEvents = allEvents.filter(ev => {
    if (activeTab !== 'all') {
      if (activeTab === 'seismic' && ev.category !== 'seismic') return false;
      if (activeTab === 'wildfires' && ev.category !== 'wildfire') return false;
      if (activeTab === 'osint' && ev.category !== 'osint') return false;
    }
    if (searchQuery.trim()) {
      return ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             ev.provider.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div 
      className={`absolute bottom-4 left-4 z-20 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 border border-cyan-950/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl font-mono text-xs flex flex-col transition-all duration-300 ${
        isOpen ? 'h-80 opacity-100' : 'h-10 opacity-90'
      }`}
    >
      {/* Header & Tabs */}
      <div className="p-2.5 bg-slate-900/80 border-b border-cyan-950/60 flex items-center justify-between rounded-t-xl">
        <button
          onClick={onToggleOpen}
          className="flex items-center space-x-2 text-left hover:text-cyan-300 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold text-slate-100 uppercase tracking-wider font-['Chakra_Petch']">
            Live Intelligence Stream
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            {allEvents.length}
          </span>
        </button>

        <button
          onClick={onToggleOpen}
          className="text-slate-400 hover:text-slate-200 text-[10px] px-2 py-0.5 rounded bg-slate-800"
        >
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950 border-b border-slate-800/80">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('seismic')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeTab === 'seismic' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Seismic ({earthquakes.length})
              </button>
              <button
                onClick={() => setActiveTab('wildfires')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeTab === 'wildfires' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hazards ({wildfires.length})
              </button>
              <button
                onClick={() => setActiveTab('osint')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeTab === 'osint' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OSINT ({news.length})
              </button>
              <button
                onClick={() => setActiveTab('macro')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeTab === 'macro' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Macro ({macro.length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {activeTab !== 'macro' && (
            <div className="px-2.5 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center space-x-2">
              <Search className="w-3 h-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter stream by location, country or keyword..."
                className="w-full bg-transparent text-[11px] text-slate-200 placeholder-slate-600 outline-none"
              />
            </div>
          )}

          {/* Stream Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {activeTab === 'macro' ? (
              <div className="space-y-2 p-1">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                  <span>GLOBAL COMMODITIES & BENCHMARKS</span>
                  <span className="text-emerald-400 font-bold">VERIFIED LIVE</span>
                </div>
                {macro.map((m, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        {m.name}
                        <span className="text-[9px] text-slate-400 font-mono">({m.symbol})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{m.provider}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-100">
                        {m.price.toLocaleString()} <span className="text-[9px] text-slate-400">{m.unit}</span>
                      </div>
                      <div className={`text-[10px] font-bold ${m.change_24h_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.change_24h_pct >= 0 ? '+' : ''}{m.change_24h_pct}% (24h)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-[11px]">
                No active events matching filter criteria.
              </div>
            ) : (
              filteredEvents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectObject(item.raw)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 transition-all group flex items-start justify-between"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                        item.category === 'seismic' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        item.category === 'wildfire' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-slate-200 group-hover:text-cyan-300 line-clamp-2">
                      {item.title}
                    </p>

                    <div className="text-[9px] text-slate-400 flex items-center gap-1">
                      <span>{item.provider}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 mt-2" />
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  CartesianGrid,
  Legend 
} from 'recharts';
import { 
  Activity, 
  Plane, 
  Radio, 
  Flame, 
  Newspaper, 
  Zap, 
  Layers, 
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  NewsIntelligenceRecord, 
  InfrastructureRecord, 
  MacroIndicatorRecord 
} from '../types';

interface AnalyticsDashboardProps {
  flights: AircraftRecord[];
  satellites: SatelliteRecord[];
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  infrastructure?: InfrastructureRecord[];
  news: NewsIntelligenceRecord[];
  macro?: MacroIndicatorRecord[];
  sourcesHealth?: any[];
  feedStatuses?: Record<string, { status: string; error?: string }>;
  onSelectObject?: (obj: any) => void;
}

const COLORS = ['#06b6d4', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#8b5cf6'];

export function AnalyticsDashboard({
  flights,
  satellites,
  earthquakes,
  wildfires,
  infrastructure = [],
  news,
  macro,
  sourcesHealth = [],
  feedStatuses = {},
  onSelectObject
}: AnalyticsDashboardProps) {
  const getFeedStatus = (feedKey: string, healthId: string) => {
    if (feedStatuses[feedKey]) return feedStatuses[feedKey].status;
    const h = sourcesHealth.find(s => s.id === healthId);
    if (h) return h.status;
    return 'UNKNOWN';
  };
  // 1. Earthquake Magnitude Distribution
  const magBins = [
    { range: 'M0 - M2.9', count: 0, color: '#38bdf8' },
    { range: 'M3.0 - M3.9', count: 0, color: '#facc15' },
    { range: 'M4.0 - M4.9', count: 0, color: '#fb923c' },
    { range: 'M5.0 - M5.9', count: 0, color: '#f87171' },
    { range: 'M6.0+', count: 0, color: '#dc2626' }
  ];
  earthquakes.forEach(eq => {
    if (eq.magnitude < 3.0) magBins[0].count++;
    else if (eq.magnitude < 4.0) magBins[1].count++;
    else if (eq.magnitude < 5.0) magBins[2].count++;
    else if (eq.magnitude < 6.0) magBins[3].count++;
    else magBins[4].count++;
  });

  // 2. Flight Altitude Bands
  const flightAltBands = [
    { band: 'Low (<10k ft)', count: 0 },
    { band: 'Mid (10k-25k ft)', count: 0 },
    { band: 'High (25k-35k ft)', count: 0 },
    { band: 'Cruising (35k+ ft)', count: 0 }
  ];
  flights.forEach(f => {
    const altFt = (f.baro_altitude || 0) * 3.28084;
    if (altFt < 10000) flightAltBands[0].count++;
    else if (altFt < 25000) flightAltBands[1].count++;
    else if (altFt < 35000) flightAltBands[2].count++;
    else flightAltBands[3].count++;
  });

  // 3. Satellite Altitude vs Velocity Scatter
  const satScatterData = satellites
    .filter(s => s.calculated)
    .slice(0, 50)
    .map(s => ({
      name: s.name,
      altitude: s.calculated?.altitudeKm || 0,
      velocity: s.calculated?.velocityKmS || 0,
      inclination: s.calculated?.inclinationDeg || 0,
      raw: s
    }));

  // 4. Infrastructure Type Breakdown
  const infraTypes = (infrastructure || []).reduce((acc: any, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const infraPieData = Object.keys(infraTypes).map(key => ({
    name: key.toUpperCase(),
    value: infraTypes[key]
  }));

  // 5. OSINT Category Breakdown
  const osintCategories = news.reduce((acc: any, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const osintPieData = Object.keys(osintCategories).map(key => ({
    name: key.toUpperCase(),
    value: osintCategories[key]
  }));

  return (
    <div className="w-full h-full bg-slate-950 overflow-y-auto custom-scrollbar p-6 space-y-6 font-mono text-xs">
      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/30">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Live Flights</span>
            <Plane className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {getFeedStatus('flights', 'opensky') === 'UNAVAILABLE' ? (
              <span className="text-sm text-rose-400">UNAVAILABLE</span>
            ) : (
              flights.length.toLocaleString()
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-slate-400">OpenSky ADS-B</span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
              getFeedStatus('flights', 'opensky') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              getFeedStatus('flights', 'opensky') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-slate-800 text-slate-400'
            }`}>{getFeedStatus('flights', 'opensky')}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-indigo-500/30">
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Satellites</span>
            <Radio className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {getFeedStatus('satellites', 'celestrak') === 'UNAVAILABLE' ? (
              <span className="text-sm text-rose-400">UNAVAILABLE</span>
            ) : (
              satellites.length.toLocaleString()
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-slate-400">CelesTrak SGP4</span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
              getFeedStatus('satellites', 'celestrak') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              getFeedStatus('satellites', 'celestrak') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-slate-800 text-slate-400'
            }`}>{getFeedStatus('satellites', 'celestrak')}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/30">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Earthquakes</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {getFeedStatus('earthquakes', 'usgs') === 'UNAVAILABLE' ? (
              <span className="text-sm text-rose-400">UNAVAILABLE</span>
            ) : (
              earthquakes.length.toLocaleString()
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-slate-400">USGS (24h)</span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
              getFeedStatus('earthquakes', 'usgs') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              getFeedStatus('earthquakes', 'usgs') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-slate-800 text-slate-400'
            }`}>{getFeedStatus('earthquakes', 'usgs')}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/30">
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Hazards/Fires</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {getFeedStatus('wildfires', 'nasa-eonet') === 'UNAVAILABLE' ? (
              <span className="text-sm text-rose-400">UNAVAILABLE</span>
            ) : (
              wildfires.length.toLocaleString()
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-slate-400">NASA EONET</span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
              getFeedStatus('wildfires', 'nasa-eonet') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              getFeedStatus('wildfires', 'nasa-eonet') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-slate-800 text-slate-400'
            }`}>{getFeedStatus('wildfires', 'nasa-eonet')}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/30">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[10px] uppercase font-bold">OSINT Dispatches</span>
            <Newspaper className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-slate-100">
            {getFeedStatus('news', 'gdelt') === 'UNAVAILABLE' ? (
              <span className="text-sm text-rose-400">UNAVAILABLE</span>
            ) : (
              news.length.toLocaleString()
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-slate-400">GDELT 2.0</span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
              getFeedStatus('news', 'gdelt') === 'LIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              getFeedStatus('news', 'gdelt') === 'UNAVAILABLE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              'bg-slate-800 text-slate-400'
            }`}>{getFeedStatus('news', 'gdelt')}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[10px] uppercase font-bold">Infrastructure</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-slate-100">{(infrastructure || []).length.toLocaleString()}</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[9px] text-slate-400">Nuclear/Cables</span>
            <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">STATIC_REFERENCE</span>
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Seismic Distribution Bar Chart */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-['Chakra_Petch'] flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Seismic Magnitude Distribution (USGS 24H)
            </h3>
            <span className="text-[10px] text-slate-400">{earthquakes.length} total events</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={magBins} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {magBins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Aviation Altitude Distribution */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-['Chakra_Petch'] flex items-center gap-2">
              <Plane className="w-4 h-4 text-cyan-400" />
              Airspace Altitude Band Breakdown
            </h3>
            <span className="text-[10px] text-slate-400">{flights.length} state vectors</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flightAltBands} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="band" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Satellite Altitude vs Velocity Scatter Plot */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-['Chakra_Petch'] flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              Satellite Altitude (km) vs Orbital Velocity (km/s)
            </h3>
            <span className="text-[10px] text-slate-400">SGP4 Mechanics</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {getFeedStatus('satellites', 'celestrak') === 'UNAVAILABLE' ? (
              <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-center space-y-1">
                <p className="font-bold">SATELLITE EPHEMERIS UNAVAILABLE</p>
                <p className="text-[10px] text-slate-400">Upstream CelesTrak service unreachable. No simulated positions rendered.</p>
              </div>
            ) : satScatterData.length === 0 ? (
              <div className="text-slate-500 text-[11px]">No active orbital ephemeris available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" dataKey="altitude" name="Altitude" unit="km" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis type="number" dataKey="velocity" name="Velocity" unit="km/s" stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <ZAxis range={[40, 120]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Scatter name="Satellites" data={satScatterData} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. OSINT Thematic Breakdown */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-['Chakra_Petch'] flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-purple-400" />
              OSINT Category & Thematic Distribution
            </h3>
            <span className="text-[10px] text-slate-400">GDELT Doc 2.0</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {getFeedStatus('news', 'gdelt') === 'UNAVAILABLE' ? (
              <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 text-center space-y-1">
                <p className="font-bold">OSINT DISPATCHES UNAVAILABLE</p>
                <p className="text-[10px] text-slate-400">Upstream GDELT 2.0 service unreachable.</p>
              </div>
            ) : osintPieData.length === 0 ? (
              <div className="text-slate-500 text-[11px]">No OSINT records found</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osintPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {osintPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

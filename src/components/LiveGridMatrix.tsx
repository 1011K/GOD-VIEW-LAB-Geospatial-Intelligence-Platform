import { useState } from 'react';
import { 
  Search, 
  Download, 
  ChevronRight, 
  Plane, 
  Radio, 
  Activity, 
  Flame, 
  Zap, 
  Newspaper,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Video
} from 'lucide-react';
import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  InfrastructureRecord, 
  NewsIntelligenceRecord,
  PublicCameraRecord 
} from '../types';

interface LiveGridMatrixProps {
  flights: AircraftRecord[];
  satellites: SatelliteRecord[];
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  infrastructure: InfrastructureRecord[];
  news: NewsIntelligenceRecord[];
  cameras?: PublicCameraRecord[];
  macro?: any[];
  onSelectObject: (obj: any) => void;
}

type GridDomain = 'flights' | 'satellites' | 'earthquakes' | 'wildfires' | 'infrastructure' | 'news' | 'cameras';

export function LiveGridMatrix({
  flights,
  satellites,
  earthquakes,
  wildfires,
  infrastructure,
  news,
  cameras = [],
  onSelectObject
}: LiveGridMatrixProps) {
  const [currentDomain, setCurrentDomain] = useState<GridDomain>('flights');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Export to CSV
  const exportCSV = () => {
    let rows: any[] = [];
    let filename = `god-view-${currentDomain}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (currentDomain === 'flights') {
      rows = flights.map(f => ({
        icao24: f.icao24,
        callsign: f.callsign,
        country: f.origin_country,
        altitude_m: f.baro_altitude || 0,
        velocity_ms: f.velocity || 0,
        heading: f.true_track || 0,
        lat: f.latitude,
        lon: f.longitude,
        provider: f.provider
      }));
    } else if (currentDomain === 'satellites') {
      rows = satellites.map(s => ({
        noradId: s.noradId,
        name: s.name,
        altitudeKm: s.calculated?.altitudeKm,
        velocityKmS: s.calculated?.velocityKmS,
        inclinationDeg: s.calculated?.inclinationDeg,
        periodMin: s.calculated?.periodMinutes,
        lat: s.calculated?.latitude,
        lon: s.calculated?.longitude,
        provider: s.provider
      }));
    } else if (currentDomain === 'earthquakes') {
      rows = earthquakes.map(e => ({
        id: e.id,
        mag: e.magnitude,
        place: e.place,
        depthKm: e.depthKm,
        lat: e.latitude,
        lon: e.longitude,
        time: new Date(e.time).toISOString(),
        provider: e.provider
      }));
    } else if (currentDomain === 'wildfires') {
      rows = wildfires.map(w => ({
        id: w.id,
        title: w.title,
        category: w.category,
        lat: w.latitude,
        lon: w.longitude,
        date: w.date,
        provider: w.provider
      }));
    } else if (currentDomain === 'infrastructure') {
      rows = infrastructure.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        capacity: i.capacity_mw,
        country: i.country,
        lat: i.latitude,
        lon: i.longitude,
        provider: i.provider
      }));
    } else if (currentDomain === 'news') {
      rows = news.map(n => ({
        id: n.id,
        title: n.title,
        source: n.source,
        category: n.category,
        published_at: n.published_at,
        provider: n.provider
      }));
    } else if (currentDomain === 'cameras') {
      rows = cameras.map(c => ({
        id: c.camera_id || c.id,
        name: c.name,
        country: c.country,
        region: c.region,
        stream_type: c.stream_type || c.media_type,
        status: c.status,
        lat: c.latitude,
        lon: c.longitude,
        provider: c.provider
      }));
    }

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map(r => Object.values(r).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col font-mono text-xs overflow-hidden">
      {/* Navigation and Toolbar */}
      <div className="p-4 bg-slate-900/80 border-b border-cyan-950/60 flex flex-wrap items-center justify-between gap-3">
        {/* Domain Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setCurrentDomain('flights')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'flights' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flights ({flights.length})</span>
          </button>
          <button
            onClick={() => setCurrentDomain('satellites')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'satellites' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Satellites ({satellites.length})</span>
          </button>
          <button
            onClick={() => setCurrentDomain('earthquakes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'earthquakes' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Earthquakes ({earthquakes.length})</span>
          </button>
          <button
            onClick={() => setCurrentDomain('wildfires')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'wildfires' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hazards ({wildfires.length})</span>
          </button>
          <button
            onClick={() => setCurrentDomain('infrastructure')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'infrastructure' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Infrastructure ({infrastructure.length})</span>
          </button>
          <button
            onClick={() => setCurrentDomain('news')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'news' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>OSINT ({news.length})</span>
          </button>
          <button
            onClick={() => setCurrentDomain('cameras')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentDomain === 'cameras' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Surveillance ({cameras.length})</span>
          </button>
        </div>

        {/* Search & Export */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 w-64">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table observations..."
              className="bg-transparent text-slate-200 placeholder-slate-600 outline-none w-full text-[11px]"
            />
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 border-b border-slate-800 uppercase text-[10px]">
            {currentDomain === 'flights' && (
              <tr>
                <th className="p-3">Callsign</th>
                <th className="p-3">ICAO24</th>
                <th className="p-3">Country</th>
                <th className="p-3">Altitude (m / ft)</th>
                <th className="p-3">Velocity (m/s)</th>
                <th className="p-3">Heading</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Provider</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
            {currentDomain === 'satellites' && (
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">NORAD ID</th>
                <th className="p-3">Altitude</th>
                <th className="p-3">Velocity</th>
                <th className="p-3">Inclination</th>
                <th className="p-3">Orbital Period</th>
                <th className="p-3">Radar Footprint</th>
                <th className="p-3">Sub-Satellite Point</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
            {currentDomain === 'earthquakes' && (
              <tr>
                <th className="p-3">Magnitude</th>
                <th className="p-3">Location / Place</th>
                <th className="p-3">Depth</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Provider</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
            {currentDomain === 'wildfires' && (
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Event Date</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Provider</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
            {currentDomain === 'infrastructure' && (
              <tr>
                <th className="p-3">Asset Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Capacity / Scale</th>
                <th className="p-3">Country</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Provider</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
            {currentDomain === 'news' && (
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Source Outlet</th>
                <th className="p-3">Category</th>
                <th className="p-3">Published Time</th>
                <th className="p-3">Provider</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
            {currentDomain === 'cameras' && (
              <tr>
                <th className="p-3">Camera Name</th>
                <th className="p-3">Region & Country</th>
                <th className="p-3">Stream Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Government Agency</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
            {currentDomain === 'flights' && flights
              .filter(f => !search || f.callsign.toLowerCase().includes(search.toLowerCase()) || f.origin_country.toLowerCase().includes(search.toLowerCase()) || f.icao24.toLowerCase().includes(search.toLowerCase()))
              .map(f => (
                <tr key={f.icao24} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(f)}>
                  <td className="p-3 font-bold text-cyan-300">{f.callsign || 'N/A'}</td>
                  <td className="p-3 text-slate-400 uppercase">{f.icao24}</td>
                  <td className="p-3">{f.origin_country}</td>
                  <td className="p-3">{f.baro_altitude ? `${f.baro_altitude}m (${Math.round(f.baro_altitude * 3.28084)}ft)` : 'Surface'}</td>
                  <td className="p-3">{f.velocity ? `${f.velocity} m/s (${Math.round(f.velocity * 1.94384)} kts)` : 'N/A'}</td>
                  <td className="p-3">{f.true_track !== null ? `${f.true_track}°` : 'N/A'}</td>
                  <td className="p-3 text-slate-400">{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}</td>
                  <td className="p-3 text-emerald-400 font-bold">{f.provider}</td>
                  <td className="p-3 text-right text-cyan-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}

            {currentDomain === 'satellites' && satellites
              .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.noradId.includes(search))
              .map(s => (
                <tr key={s.noradId} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(s)}>
                  <td className="p-3 font-bold text-indigo-300">{s.name}</td>
                  <td className="p-3 text-slate-400">{s.noradId}</td>
                  <td className="p-3 text-cyan-300">{s.calculated?.altitudeKm} km</td>
                  <td className="p-3">{s.calculated?.velocityKmS} km/s</td>
                  <td className="p-3">{s.calculated?.inclinationDeg}°</td>
                  <td className="p-3">{s.calculated?.periodMinutes} min</td>
                  <td className="p-3">{s.calculated?.footprintRadiusKm} km</td>
                  <td className="p-3 text-slate-400">{s.calculated?.latitude}°, {s.calculated?.longitude}°</td>
                  <td className="p-3 text-right text-indigo-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}

            {currentDomain === 'earthquakes' && earthquakes
              .filter(e => !search || e.place.toLowerCase().includes(search.toLowerCase()) || String(e.magnitude).includes(search))
              .map(e => (
                <tr key={e.id} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(e)}>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      e.magnitude >= 5.0 ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      e.magnitude >= 3.0 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      M{e.magnitude}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-200">{e.place}</td>
                  <td className="p-3">{e.depthKm} km</td>
                  <td className="p-3 text-slate-400">{new Date(e.time).toUTCString()}</td>
                  <td className="p-3 text-slate-400">{e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}</td>
                  <td className="p-3 text-emerald-400">{e.provider}</td>
                  <td className="p-3 text-right text-amber-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}

            {currentDomain === 'wildfires' && wildfires
              .filter(w => !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase()))
              .map(w => (
                <tr key={w.id} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(w)}>
                  <td className="p-3 font-bold text-rose-300">{w.title}</td>
                  <td className="p-3 uppercase text-slate-400">{w.category}</td>
                  <td className="p-3">{new Date(w.date).toLocaleDateString()}</td>
                  <td className="p-3 text-slate-400">{w.latitude.toFixed(4)}, {w.longitude.toFixed(4)}</td>
                  <td className="p-3 text-emerald-400">{w.provider}</td>
                  <td className="p-3 text-right text-rose-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}

            {currentDomain === 'infrastructure' && infrastructure
              .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.country.toLowerCase().includes(search.toLowerCase()))
              .map(i => (
                <tr key={i.id} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(i)}>
                  <td className="p-3 font-bold text-emerald-300">{i.name}</td>
                  <td className="p-3 uppercase text-slate-400">{i.type}</td>
                  <td className="p-3">{i.capacity_mw ? `${i.capacity_mw} MW` : 'N/A'}</td>
                  <td className="p-3">{i.country}</td>
                  <td className="p-3 text-slate-400">{i.latitude.toFixed(4)}, {i.longitude.toFixed(4)}</td>
                  <td className="p-3 text-slate-400">{i.provider}</td>
                  <td className="p-3 text-right text-emerald-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}

            {currentDomain === 'news' && news
              .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.source.toLowerCase().includes(search.toLowerCase()))
              .map(n => (
                <tr key={n.id} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(n)}>
                  <td className="p-3 font-bold text-purple-300 max-w-md line-clamp-1">{n.title}</td>
                  <td className="p-3 text-slate-400">{n.source}</td>
                  <td className="p-3 uppercase text-cyan-400">{n.category}</td>
                  <td className="p-3 text-slate-400">{new Date(n.published_at).toLocaleString()}</td>
                  <td className="p-3 text-emerald-400">{n.provider}</td>
                  <td className="p-3 text-right text-purple-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}

            {currentDomain === 'cameras' && cameras
              .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase()))
              .map(c => (
                <tr key={c.camera_id || c.id} className="hover:bg-slate-900/60 cursor-pointer" onClick={() => onSelectObject(c)}>
                  <td className="p-3 font-bold text-cyan-300 max-w-sm truncate flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{c.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{c.region}, {c.country}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      c.stream_type === 'youtube' || c.media_type === 'video'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {c.stream_type === 'youtube' ? 'LIVE VIDEO' : 'CCTV SNAP'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      c.status === 'LIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">{c.provider}</td>
                  <td className="p-3 text-right text-cyan-400"><ChevronRight className="w-4 h-4 ml-auto" /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

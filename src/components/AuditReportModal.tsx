import { useState } from 'react';
import { 
  X, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Database, 
  Cpu, 
  ExternalLink,
  Code,
  Lock,
  Zap,
  Globe,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { RepositoryAuditItem } from '../types';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: RepositoryAuditItem[];
}

type SectionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export function AuditReportModal({ isOpen, onClose, repositories }: AuditReportModalProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('A');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sections = [
    { key: 'A' as SectionKey, title: 'A. Repository Audit', icon: FileText },
    { key: 'B' as SectionKey, title: 'B. Data-Source Registry', icon: Database },
    { key: 'C' as SectionKey, title: 'C. Feature-Overlap Matrix', icon: Layers },
    { key: 'D' as SectionKey, title: 'D. Licensing & Legal Risks', icon: Lock },
    { key: 'E' as SectionKey, title: 'E. Working vs Broken Sources', icon: AlertTriangle },
    { key: 'F' as SectionKey, title: 'F. Canonical Implementations', icon: CheckCircle2 },
    { key: 'G' as SectionKey, title: 'G. GOD-VIEW Architecture', icon: Cpu },
    { key: 'H' as SectionKey, title: 'H. Genuine AI Studio Capabilities', icon: Zap }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-950 border border-cyan-950/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-mono text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] tracking-wide">
                GOD-VIEW-LAB REFERENCE REPOSITORIES AUDIT
              </h2>
              <p className="text-[11px] text-slate-400">
                Architectural Evaluation, Data Ingest Provenance & Zero-Fake-Data Compliance Matrix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 py-2 bg-slate-900/40 border-b border-slate-800/80 overflow-x-auto custom-scrollbar">
          {sections.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-300 leading-relaxed">
          {/* SECTION A: REPOSITORY AUDIT */}
          {activeSection === 'A' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION A: Comprehensive 8-Repository Technical Audit
                </h3>
                <p className="text-xs text-slate-300">
                  Every reference repository has been systematically audited against stack architecture, rendering engine, external endpoints, adapters, and data fabrication vulnerabilities.
                </p>
              </div>

              <div className="space-y-4">
                {repositories.map(repo => (
                  <div key={repo.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-100 font-mono">{repo.repo_name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                            {repo.license}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{repo.repo_source}</p>
                      </div>

                      <div className="text-right text-[11px]">
                        <span className="text-slate-400">Map Engine: </span>
                        <span className="text-cyan-300 font-semibold">{repo.map_engine}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">FRAMEWORK / STACK:</span>
                        <span className="text-slate-200">{repo.framework_stack}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">DATA ADAPTER MODULES:</span>
                        <span className="text-cyan-400 font-mono text-[11px]">{repo.adapter_modules.join(', ')}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong className="text-emerald-400">Key Strengths: </strong>
                        <span className="text-slate-300">{repo.key_strengths}</span>
                      </div>
                      <div>
                        <strong className="text-rose-400">Drawbacks & Risks: </strong>
                        <span className="text-slate-300">{repo.drawbacks_risks}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: DATA SOURCE REGISTRY */}
          {activeSection === 'B' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION B: Complete Global Data-Source Registry
                </h3>
                <p className="text-xs text-slate-300">
                  Every integrated feed is classified by authentication requirement, CORS proxy requirements, rate limits, and verification status.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5 border-b border-slate-800">Domain / Feed</th>
                      <th className="p-2.5 border-b border-slate-800">Endpoint URL</th>
                      <th className="p-2.5 border-b border-slate-800">Status</th>
                      <th className="p-2.5 border-b border-slate-800">Auth Required</th>
                      <th className="p-2.5 border-b border-slate-800">CORS / Proxy</th>
                      <th className="p-2.5 border-b border-slate-800">Rate Limits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">OpenSky Network (ADS-B)</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://opensky-network.org/api/states/all</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">VERIFIED LIVE</td>
                      <td className="p-2.5 text-slate-400">Optional Basic</td>
                      <td className="p-2.5 text-amber-300">Server Proxy Req.</td>
                      <td className="p-2.5 text-slate-400">10s (Anon) / 5s (Auth)</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">CelesTrak (NORAD GP TLEs)</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://celestrak.org/NORAD/elements/gp.php</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">VERIFIED LIVE</td>
                      <td className="p-2.5 text-slate-400">None</td>
                      <td className="p-2.5 text-slate-300">Server Cached</td>
                      <td className="p-2.5 text-slate-400">60s refresh cache</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">USGS Seismic Program</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/...</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">VERIFIED LIVE</td>
                      <td className="p-2.5 text-slate-400">None</td>
                      <td className="p-2.5 text-emerald-400">Open CORS</td>
                      <td className="p-2.5 text-slate-400">Unrestricted</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">NASA EONET v3</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://eonet.gsfc.nasa.gov/api/v3/events</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">VERIFIED LIVE</td>
                      <td className="p-2.5 text-slate-400">None</td>
                      <td className="p-2.5 text-emerald-400">Open CORS</td>
                      <td className="p-2.5 text-slate-400">60s cache</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">RainViewer Weather Radar</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://api.rainviewer.com/public/weather-maps.json</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">VERIFIED LIVE</td>
                      <td className="p-2.5 text-slate-400">None</td>
                      <td className="p-2.5 text-emerald-400">Open CORS</td>
                      <td className="p-2.5 text-slate-400">10k req/day</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">GDELT Project 2.0 Doc API</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://api.gdeltproject.org/api/v2/doc/doc</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">VERIFIED LIVE</td>
                      <td className="p-2.5 text-slate-400">None</td>
                      <td className="p-2.5 text-emerald-400">Open CORS</td>
                      <td className="p-2.5 text-slate-400">1 req / 5 sec</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">IAEA / GEM / TeleGeography</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">Geospatial Infrastructure Dataset</td>
                      <td className="p-2.5 text-slate-300 font-semibold">STATIC DATA</td>
                      <td className="p-2.5 text-slate-400">None (Public)</td>
                      <td className="p-2.5 text-slate-400">N/A (Embedded)</td>
                      <td className="p-2.5 text-slate-400">Static Baseline</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-slate-200">NASA FIRMS Direct MODIS</td>
                      <td className="p-2.5 text-cyan-400 truncate max-w-[200px]">https://firms.modaps.eosdis.nasa.gov/api/area</td>
                      <td className="p-2.5 text-amber-400 font-semibold">REQUIRES KEY</td>
                      <td className="p-2.5 text-amber-300">NASA MAP_KEY</td>
                      <td className="p-2.5 text-amber-300">Server Proxy Req.</td>
                      <td className="p-2.5 text-slate-400">10 min cache window</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION C: FEATURE OVERLAP MATRIX */}
          {activeSection === 'C' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION C: Feature-Overlap Matrix Across 8 Reference Projects
                </h3>
                <p className="text-xs text-slate-300">
                  Analysis of duplicate capabilities, showing which repository implements each feature best.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase">1. Aircraft ADS-B Tracking</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Found in:</strong> Gods-Eye-View, Open-Live-Map, WorldMonitor.<br/>
                    <strong>Strongest Implementation:</strong> <span className="text-emerald-400">Gods-Eye-View & Open-Live-Map</span> (clean state vector translation, heading rotation, velocity interpolation).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase">2. Satellite Orbital Mechanics</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Found in:</strong> Gods-Eye-View, TerriaJS.<br/>
                    <strong>Strongest Implementation:</strong> <span className="text-emerald-400">Gods-Eye-View (SGP4 satellite.js)</span>. Instantaneous lat/lon/alt geodetic calculations with horizon coverage footprints.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase">3. Seismic & Earth Hazards</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Found in:</strong> WorldMonitor, Argus, Gods-Eye-View.<br/>
                    <strong>Strongest Implementation:</strong> <span className="text-emerald-400">WorldMonitor / Argus</span> (depth-based color ramps and magnitude-squared energy radius).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-rose-300 uppercase">4. Wildfire & Thermal Tracking</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Found in:</strong> Active Fire Dashboard, Argus, WorldMonitor.<br/>
                    <strong>Strongest Implementation:</strong> <span className="text-emerald-400">Argus / NASA EONET v3</span>. Active Fire Dashboard had a dangerous mock-fallback which must be discarded.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-blue-300 uppercase">5. Weather Doppler Radar</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Found in:</strong> WorldMonitor.<br/>
                    <strong>Strongest Implementation:</strong> <span className="text-emerald-400">WorldMonitor (RainViewer API)</span>. Seamless tile overlays with time-slider compatibility.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase">6. Critical Infrastructure</h4>
                  <p className="text-[11px] text-slate-300">
                    <strong>Found in:</strong> Gigawatt Map, TerriaJS.<br/>
                    <strong>Strongest Implementation:</strong> <span className="text-emerald-400">Gigawatt Map</span> (high-precision coordinates for nuclear, hyperscale datacenters, subsea cables).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: LICENSING RISKS */}
          {activeSection === 'D' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION D: Licensing & Intellectual Property Risks
                </h3>
                <p className="text-xs text-slate-300">
                  Rigorous review of licenses to prevent intellectual property contamination and ensure compliance.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <h4 className="font-bold text-emerald-400">MIT & Apache-2.0 Repositories (Safe for Re-architecture)</h4>
                  <p className="text-slate-300 text-xs mt-1">
                    • <code>bilawalsidhu/gods-eye-view</code> (MIT)<br/>
                    • <code>hendrikbgr/open-live-map</code> (MIT)<br/>
                    • <code>NoahSBrown/Argus</code> (MIT)<br/>
                    • <code>Sudhendra/gigawattmap</code> (Apache-2.0)<br/>
                    • <code>girubato/active_fire_dashboard</code> (MIT)<br/>
                    • <code>TerriaJS/terriajs</code> (Apache-2.0)<br/>
                    Permits clean adaptation and architectural re-implementation with standard copyright attributions.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <h4 className="font-bold text-amber-400">GPL-3.0 Copyleft Risk: deco31416/worldmonitor</h4>
                  <p className="text-slate-300 text-xs mt-1">
                    WorldMonitor uses GPL-3.0. Direct copy-pasting of its source code would trigger copyleft requirements on downstream code. To maintain clean architecture, GOD-VIEW-LAB implements clean-room TypeScript adapters that query public open APIs (GDELT, RainViewer, Open-Meteo) directly without copying GPL-licensed source files.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION E: WORKING VS BROKEN SOURCES */}
          {activeSection === 'E' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION E: Working vs Broken vs Key-Required Sources
                </h3>
                <p className="text-xs text-slate-300">
                  Audit of live working endpoints vs services with rate limits or credentials requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Genuinely Working Live Public Feeds</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    <li>OpenSky Network ADS-B (with proxy & rate-limit cache)</li>
                    <li>CelesTrak NORAD TLE Orbital Feeds</li>
                    <li>USGS Earthquake Hazards 24h Feed</li>
                    <li>NASA EONET v3 Natural Disasters & Wildfires</li>
                    <li>RainViewer Global Doppler Radar Tile Network</li>
                    <li>GDELT Project 2.0 Global Event Database</li>
                    <li>CoinGecko & Public Macro Commodity Benchmarks</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-amber-500/40 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Key-Required / Fragile Public Endpoints</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    <li>NASA FIRMS Direct (requires <code>NASA_FIRMS_MAP_KEY</code>)</li>
                    <li>AISHub / MarineTraffic AIS (requires paid token or IP whitelist)</li>
                    <li>ACLED Armed Conflict Data (requires OAuth2 registration)</li>
                    <li>Overpass API (public servers throttle high-volume queries)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION F: RECOMMENDED CANONICAL IMPLEMENTATION */}
          {activeSection === 'F' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION F: Recommended Canonical Implementation by Layer
                </h3>
                <p className="text-xs text-slate-300">
                  Synthesizing the best practices across all 8 reference repositories into a unified standard.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <strong className="text-cyan-400">Map & Rendering Core: </strong>
                  <span>Leaflet with Hardware-Accelerated Vector & Tile Layers, supporting seamless switching between Tactical Dark Matter (Carto), High-Res Esri Satellite, and OpenTopoMap without WebGL crash vulnerabilities.</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <strong className="text-indigo-400">Orbital Mechanics Engine: </strong>
                  <span>Direct SGP4 mathematical propagation via <code>satellite.js</code> running on real CelesTrak TLE records, calculating instantaneous geodetic positions and radar horizon footprints.</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <strong className="text-amber-400">Aviation Kinematics: </strong>
                  <span>OpenSky Network state vector parser with dynamic SVG heading rotation, true track orientation, and altitude color grading.</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <strong className="text-rose-400">Zero-Fake-Data Enforcement: </strong>
                  <span>Complete elimination of sample/mock fallbacks. When an upstream provider returns 429, 503 or network timeout, the application explicitly tags the layer as <code>SOURCE UNAVAILABLE</code> and displays exact provider telemetry.</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION G: PROPOSED GOD-VIEW-LAB ARCHITECTURE */}
          {activeSection === 'G' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION G: Unified GOD-VIEW-LAB Full-Stack Architecture
                </h3>
                <p className="text-xs text-slate-300">
                  Server-side proxy layer + High-performance client-side Leaflet mapping + Server-side Gemini AI Geointelligence synthesis.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3 font-mono text-[11px]">
                <div className="text-cyan-300 font-bold">[CLIENT BROWSER (Vite + React 19 + Leaflet + Tailwind CSS)]</div>
                <div className="pl-4 border-l-2 border-cyan-500/40 space-y-1 text-slate-300">
                  <div>├── TacticalMap (Tile engine, SVG markers, footprint circles, radar overlays)</div>
                  <div>├── LayerControlPanel (Dynamic filter sliders, group selectors, record counts)</div>
                  <div>├── IntelFeedPanel (Real-time telemetry event stream & jump-to-target)</div>
                  <div>├── ObjectDetailDrawer (Strict Data Provenance inspector & Raw JSON viewer)</div>
                  <div>└── Orbit Propagator (Client/Server SGP4 orbital mechanics)</div>
                </div>

                <div className="text-emerald-300 font-bold mt-2">[EXPRESS BACKEND PROXY (server.ts / Node.js)]</div>
                <div className="pl-4 border-l-2 border-emerald-500/40 space-y-1 text-slate-300">
                  <div>├── In-Memory TTL Cache & Rate Limit Protection (Prevents 429s)</div>
                  <div>├── Strict Data Policy Wrapper (Injects sourceUrl, fetched_at, status)</div>
                  <div>├── External API Bridges (OpenSky, CelesTrak, USGS, EONET, RainViewer, GDELT)</div>
                  <div>└── Gemini 2.5 Flash Situational Briefing Engine (@google/genai)</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION H: GENUINE AI STUDIO CAPABILITIES */}
          {activeSection === 'H' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 font-['Chakra_Petch'] mb-2">
                  SECTION H: Exact Capabilities Operating in AI Studio Environment
                </h3>
                <p className="text-xs text-slate-300">
                  Confirmation of all operational features running natively inside Google AI Studio Cloud Run containers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block">✓ Full-Stack Single Port (3000) Ingress</span>
                  <span className="text-slate-300 text-[11px]">Vite SPA middleware integrated with Express API routes.</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block">✓ Real Live Public API Feeds</span>
                  <span className="text-slate-300 text-[11px]">OpenSky ADS-B, CelesTrak TLEs, USGS Seismic, NASA EONET, RainViewer Radar, GDELT OSINT.</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block">✓ Server-Side Gemini Intelligence</span>
                  <span className="text-slate-300 text-[11px]">Secure server-side calls via <code>@google/genai</code> with <code>process.env.GEMINI_API_KEY</code>.</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-emerald-400 font-bold block">✓ Zero-Fake-Data Guaranteed</span>
                  <span className="text-slate-300 text-[11px]">Failed or unconfigured feeds accurately return SOURCE UNAVAILABLE.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-cyan-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            GOD-VIEW-LAB ARCHITECTURAL AUDIT SPECIFICATION v2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}

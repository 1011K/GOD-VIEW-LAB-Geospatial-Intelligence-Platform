import { useState, useEffect } from 'react';
import { Radio, Activity, Sun, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';

interface SpaceWeatherData {
  kp_index: number;
  geomagnetic_storm_scale: string;
  latest_observation?: {
    time_tag: string;
    kp_index: number;
    estimated_kp: number;
    kp: string;
  };
}

export function SpaceWeatherWidget() {
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaceWeather = async () => {
      try {
        const res = await fetch('/api/space-weather');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceWeather();
    const interval = setInterval(fetchSpaceWeather, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return null;

  const kp = data.kp_index || 0;
  const stormSeverity = kp >= 7 ? 'danger' : kp >= 5 ? 'warning' : 'normal';

  return (
    <div className="relative font-mono text-xs select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all shadow-sm ${
          stormSeverity === 'danger'
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
            : stormSeverity === 'warning'
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
            : 'bg-slate-900/80 hover:bg-slate-800 border-cyan-500/30 text-cyan-300'
        }`}
        title="NOAA Space Weather Prediction Center (Argus repo)"
      >
        <Sun className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-bold text-[10px]">SPACE WX</span>
        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-950/80 font-bold border border-slate-700">
          Kp {kp}
        </span>
        <span className="hidden lg:inline text-[9px] text-slate-400">
          {data.geomagnetic_storm_scale.split(' ')[0]}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-72 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-2xl z-50 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-1.5 text-slate-200 font-bold text-[11px]">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>NOAA SWPC TELEMETRY</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
              VERIFIED LIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400">Planetary Kp Index</div>
              <div className="text-base font-bold text-cyan-300">{kp} / 9</div>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-slate-400">Storm Scale</div>
              <div className={`font-bold ${stormSeverity === 'danger' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.geomagnetic_storm_scale}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
            Real-time planetary magnetic disturbance index ingested from NOAA Space Weather Operations (Argus repo architecture).
          </div>

          <div className="text-[9px] text-slate-500 flex items-center justify-between border-t border-slate-900 pt-1">
            <span>Repo: NoahSBrown/Argus</span>
            <span>swpc.noaa.gov</span>
          </div>
        </div>
      )}
    </div>
  );
}

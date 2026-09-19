import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  X, 
  AlertTriangle, 
  Flame, 
  Radio, 
  Activity, 
  ChevronRight, 
  CheckCheck,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import { EarthquakeRecord, WildfireRecord, NewsIntelligenceRecord } from '../types';

export interface AlertItem {
  id: string;
  type: 'seismic' | 'hazard' | 'osint';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  timestamp: Date;
  location?: { lat: number; lng: number };
  rawObject: any;
}

interface AlertNotificationCenterProps {
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  news: NewsIntelligenceRecord[];
  onSelectObject: (obj: any) => void;
  isOpen: boolean;
  onClose?: () => void;
  onToggleOpen?: () => void;
}

// Audio synth chime via Web Audio API
function playAlertChime(severity: 'CRITICAL' | 'WARNING' | 'INFO') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
    
    if (severity === 'CRITICAL') {
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function AlertNotificationCenter({
  earthquakes,
  wildfires,
  news,
  onSelectObject,
  isOpen,
  onClose,
  onToggleOpen
}: AlertNotificationCenterProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeToasts, setActiveToasts] = useState<AlertItem[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const seenIds = useRef<Set<string>>(new Set());

  // Generate alerts from telemetry feeds
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    // 1. High-magnitude earthquakes (M >= 4.0)
    earthquakes.forEach(eq => {
      if (eq.magnitude >= 4.0) {
        newAlerts.push({
          id: `alert-eq-${eq.id}`,
          type: 'seismic',
          severity: eq.magnitude >= 5.5 ? 'CRITICAL' : 'WARNING',
          title: `M${eq.magnitude} Seismic Tremor Detected`,
          description: `${eq.place} (Depth: ${eq.depthKm}km)`,
          timestamp: new Date(eq.time),
          location: { lat: eq.latitude, lng: eq.longitude },
          rawObject: eq
        });
      }
    });

    // 2. Severe Hazards / Wildfires
    wildfires.forEach(wf => {
      newAlerts.push({
        id: `alert-wf-${wf.id}`,
        type: 'hazard',
        severity: 'WARNING',
        title: `Thermal Anomaly Alert: ${wf.title}`,
        description: `NASA EONET Category: ${wf.category}`,
        timestamp: new Date(wf.date),
        location: { lat: wf.latitude, lng: wf.longitude },
        rawObject: wf
      });
    });

    // 3. High-Priority Breaking OSINT
    news.forEach(n => {
      if (n.category === 'military' || n.category === 'cyber' || n.category === 'disaster' || n.category === 'geopolitics') {
        newAlerts.push({
          id: `alert-news-${n.id}`,
          type: 'osint',
          severity: n.category === 'military' || n.category === 'disaster' ? 'WARNING' : 'INFO',
          title: `OSINT Flash: ${n.title}`,
          description: `Source: ${n.source}`,
          timestamp: new Date(n.published_at),
          rawObject: n
        });
      }
    });

    // Sort by newest
    newAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setAlerts(newAlerts);

    // Detect fresh items to pop as toasts
    const fresh = newAlerts.filter(a => !seenIds.current.has(a.id)).slice(0, 2);
    if (fresh.length > 0) {
      fresh.forEach(f => seenIds.current.add(f.id));
      setActiveToasts(prev => [...prev, ...fresh].slice(-3));
      if (isAudioEnabled && fresh.some(f => f.severity === 'CRITICAL' || f.severity === 'WARNING')) {
        playAlertChime(fresh[0].severity);
      }
    }
  }, [earthquakes, wildfires, news, isAudioEnabled]);

  // Auto-dismiss toasts after 8 seconds
  useEffect(() => {
    if (activeToasts.length === 0) return;
    const timer = setTimeout(() => {
      setActiveToasts(prev => prev.slice(1));
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeToasts]);

  const dismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* Floating Alert Toasts (Top Right) */}
      <div className="fixed top-16 right-4 z-40 space-y-2 pointer-events-none max-w-sm w-full font-mono text-xs">
        {activeToasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-300 flex items-start justify-between space-x-2 ${
              toast.severity === 'CRITICAL'
                ? 'bg-rose-950/90 border-rose-500/80 text-rose-100 shadow-rose-950/50'
                : toast.severity === 'WARNING'
                ? 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/50'
                : 'bg-cyan-950/90 border-cyan-500/80 text-cyan-100 shadow-cyan-950/50'
            }`}
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  toast.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                  toast.severity === 'WARNING' ? 'bg-amber-600 text-black' :
                  'bg-cyan-600 text-black'
                }`}>
                  {toast.severity}
                </span>
                <span className="text-[10px] text-slate-300">{toast.timestamp.toLocaleTimeString()}</span>
              </div>
              <h4 className="font-bold text-[11px] leading-tight">{toast.title}</h4>
              <p className="text-[10px] text-slate-300 line-clamp-1">{toast.description}</p>
              
              <button
                onClick={() => {
                  onSelectObject(toast.rawObject);
                  dismissToast(toast.id);
                }}
                className="mt-1 flex items-center space-x-1 text-[10px] text-cyan-300 hover:underline font-bold"
              >
                <MapPin className="w-3 h-3" />
                <span>Locate on Map & Inspect</span>
              </button>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Full Alert Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 max-w-full bg-slate-950 border-l border-cyan-950/80 shadow-2xl flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900/90 border-b border-cyan-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-slate-100 font-['Chakra_Petch'] text-sm">
                  TACTICAL ALERT LOG
                </h3>
                <span className="text-[10px] text-slate-400">
                  {alerts.length} Active System Triggers
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isAudioEnabled 
                    ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={isAudioEnabled ? 'Mute Alert Audio' : 'Unmute Alert Audio'}
              >
                {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => (onClose || onToggleOpen)?.()}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                No active critical alerts detected.
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500' :
                    alert.severity === 'WARNING' ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500' :
                    'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      alert.severity === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}>
                      {alert.severity} • {alert.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-200 text-[11px] leading-snug">
                    {alert.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {alert.description}
                  </p>

                  <button
                    onClick={() => {
                      onSelectObject(alert.rawObject);
                      (onClose || onToggleOpen)?.();
                    }}
                    className="w-full mt-2 py-1 px-2 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 text-[10px] flex items-center justify-center space-x-1 border border-slate-700 transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Select & Focus Target</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  Copy, 
  AlertCircle,
  FileCheck,
  Zap
} from 'lucide-react';

interface GeminiBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCounts: {
    flights: number;
    satellites: number;
    earthquakes: number;
    wildfires: number;
    news: number;
  };
  earthquakes: any[];
  wildfires: any[];
  news: any[];
}

export function GeminiBriefingModal({
  isOpen,
  onClose,
  activeCounts,
  earthquakes,
  wildfires,
  news
}: GeminiBriefingModalProps) {
  const [briefing, setBriefing] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  if (!isOpen) return null;

  const generateBriefing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeFlightsCount: activeCounts.flights,
          activeSatellitesCount: activeCounts.satellites,
          activeEarthquakes: earthquakes.slice(0, 5),
          activeWildfires: wildfires.slice(0, 5),
          activeNews: news.slice(0, 5)
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate situation briefing.');
      }

      setBriefing(data.briefing);
      setGeneratedAt(new Date(data.generated_at).toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-mono text-xs">
      <div className="w-full max-w-3xl bg-slate-950 border border-cyan-950/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] tracking-wide flex items-center gap-2">
                GEMINI GEOINTELLIGENCE SITUATION BRIEFING
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  GEMINI 2.5 FLASH
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Automated multi-domain geospatial situation synthesis grounded strictly in verified observations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action / Context Banner */}
        <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-300">
            Current Telemetry Context:{' '}
            <strong className="text-cyan-300">{activeCounts.flights} Flights</strong>,{' '}
            <strong className="text-indigo-300">{activeCounts.satellites} Sats</strong>,{' '}
            <strong className="text-amber-300">{earthquakes.length} Quakes</strong>,{' '}
            <strong className="text-rose-300">{wildfires.length} Hazards</strong>
          </div>

          <button
            onClick={generateBriefing}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 shadow-md shadow-cyan-950"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Synthesizing Telemetry...' : briefing ? 'Regenerate Briefing' : 'Generate Briefing'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="block font-bold">Briefing Generation Unavailable:</strong>
                <p className="text-xs text-rose-200/90 mt-0.5">{error}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Verify that <code>GEMINI_API_KEY</code> is configured in the AI Studio environment secrets.
                </p>
              </div>
            </div>
          )}

          {!briefing && !loading && !error && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 font-['Chakra_Petch']">
                No Active Situation Briefing Generated Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Generate Briefing" to run a server-side Gemini 2.5 Flash analytical synthesis over the live aircraft positions, orbital tracks, seismic tremors, and global events.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-cyan-300 animate-pulse">
                Synthesizing global geospatial telemetry through Gemini 2.5 Flash...
              </p>
            </div>
          )}

          {briefing && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                <span>GENERATED AT: {generatedAt} (ZULU TIME GROUNDED)</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Briefing'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                {briefing}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-cyan-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Hallucination Policy: Model prompted strictly on actual fetched observations.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

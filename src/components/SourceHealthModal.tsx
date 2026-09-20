import React from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wifi, 
  Key, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { SourceHealthEntry } from '../types';

interface SourceHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceHealthEntry[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function SourceHealthModal({
  isOpen,
  onClose,
  sources,
  onRefresh,
  isRefreshing
}: SourceHealthModalProps) {
  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'VERIFIED LIVE':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        );
      case 'CACHED':
        return (
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] font-bold">
            CACHED
          </span>
        );
      case 'STALE':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold">
            STALE
          </span>
        );
      case 'STATIC DATA':
      case 'STATIC_REFERENCE':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold">
            STATIC_REFERENCE
          </span>
        );
      case 'NOT_CHECKED':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px] font-bold">
            NOT_CHECKED
          </span>
        );
      case 'REQUIRES KEY':
      case 'NOT_CONFIGURED':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
            <Key className="w-2.5 h-2.5" />
            {status}
          </span>
        );
      case 'UNAVAILABLE':
      case 'SOURCE UNAVAILABLE':
      case 'BROKEN':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            UNAVAILABLE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-mono text-xs">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-950/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] tracking-wide">
                DATA SOURCE HEALTH & PROVENANCE MONITOR
              </h2>
              <p className="text-[11px] text-slate-400">
                Real-Time Provider Latency, Cache TTL & Zero-Fake-Data Enforcement Audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Ping Sources</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Quality Notice */}
        <div className="px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-950/50 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2 text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Strict Zero-Fake-Data Policy Enforced: Every observation retains verified provider provenance.</span>
          </div>
          <span className="text-slate-400">
            Total Monitored Adapters: <strong className="text-slate-200">{sources.length}</strong>
          </span>
        </div>

        {/* Table List */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {sources.map(source => (
            <div 
              key={source.id} 
              className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-100 font-mono">{source.name}</span>
                    <span className="text-slate-400 text-xs">({source.provider})</span>
                  </div>
                  <div className="text-[10px] text-cyan-400 truncate max-w-lg mt-0.5 font-mono">
                    {source.endpoint}
                  </div>
                </div>
                <div>
                  {getStatusBadge(source.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-400 block text-[9px]">RESPONSE LATENCY:</span>
                  <span className="text-emerald-400 font-bold">{source.latency_ms != null ? `${source.latency_ms} ms` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">OBSERVATIONS:</span>
                  <span className="text-cyan-300 font-bold">{source.item_count} items</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">CACHE STRATEGY:</span>
                  <span className="text-slate-300">{source.cache_ttl_seconds > 0 ? `${source.cache_ttl_seconds}s TTL` : 'Live Direct'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">AUTH MODE:</span>
                  <span className="text-slate-300 uppercase">{source.auth_mode}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Rate Limits: {source.rate_limits}</span>
                <span>Last Ingest: {source.last_updated ? new Date(source.last_updated).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-cyan-950/60 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Source status refreshes automatically every 30 seconds.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

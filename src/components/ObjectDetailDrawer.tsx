import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  MapPin, 
  Layers, 
  Code, 
  Info, 
  Copy, 
  Check, 
  Compass, 
  Gauge, 
  Radio, 
  Zap, 
  Globe2,
  Sparkles,
  Link as LinkIcon,
  Video,
  Anchor
} from 'lucide-react';
import { DataProvenance } from '../types';

interface ObjectDetailDrawerProps {
  selectedObject: any | null;
  onClose: () => void;
}

export function ObjectDetailDrawer({ selectedObject, onClose }: ObjectDetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!selectedObject) return null;

  // Calculate deep-link hash for Argos-style object sharing
  const getObjectHash = () => {
    if (selectedObject.icao24) return `flight=${selectedObject.icao24}`;
    if (selectedObject.noradId) return `satellite=${selectedObject.noradId}`;
    if (selectedObject.magnitude !== undefined) return `earthquake=${selectedObject.id}`;
    if (selectedObject.type === 'nuclear' || selectedObject.type === 'hydro' || selectedObject.type === 'thermal') return `power=${selectedObject.id}`;
    if (selectedObject.type === 'port') return `port=${selectedObject.id}`;
    if (selectedObject.type === 'camera') return `camera=${selectedObject.id}`;
    if (selectedObject.type === 'datacenter') return `company=${selectedObject.id}`;
    if (selectedObject.type === 'subsea_cable') return `cable=${selectedObject.id}`;
    if (selectedObject.id) return `target=${selectedObject.id}`;
    return '';
  };

  const handleCopyLink = () => {
    const hash = getObjectHash();
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url);
    window.location.hash = hash;
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetObject: selectedObject,
          domain: selectedObject.icao24 ? 'Aircraft' : selectedObject.noradId ? 'Satellite' : selectedObject.magnitude ? 'Seismic' : 'Infrastructure'
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(`⚠️ Analysis note: ${data.error || 'Failed to synthesize target intelligence.'}`);
      }
    } catch (err: any) {
      setAiAnalysis(`⚠️ System error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedObject, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED LIVE':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            VERIFIED LIVE
          </span>
        );
      case 'STATIC DATA':
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold flex items-center gap-1">
            STATIC BASELINE
          </span>
        );
      case 'REQUIRES KEY':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
            REQUIRES KEY
          </span>
        );
      case 'SOURCE UNAVAILABLE':
      case 'BROKEN':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1">
            SOURCE UNAVAILABLE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px] font-bold">
            {status || 'UNKNOWN'}
          </span>
        );
    }
  };

  // Compute freshness
  const fetchedDate = selectedObject.fetched_at ? new Date(selectedObject.fetched_at) : new Date();
  const secondsAgo = Math.max(0, Math.floor((Date.now() - fetchedDate.getTime()) / 1000));

  // Determine title and subtitle
  const title = selectedObject.callsign || selectedObject.name || selectedObject.title || selectedObject.id || 'Selected Target';
  const subCategory = selectedObject.icao24 
    ? `Aircraft ADS-B • ${selectedObject.origin_country || 'International'}`
    : selectedObject.noradId
    ? `Orbital Satellite • NORAD #${selectedObject.noradId}`
    : selectedObject.magnitude !== undefined
    ? `Seismic Event • USGS M${selectedObject.magnitude}`
    : selectedObject.type
    ? `Critical Asset • ${selectedObject.type.toUpperCase()}`
    : selectedObject.category
    ? `Intelligence • ${selectedObject.category.toUpperCase()}`
    : 'Telemetry Track';

  return (
    <div className="absolute top-20 right-4 z-30 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 border border-cyan-950/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl font-mono text-xs overflow-hidden flex flex-col max-h-[calc(100vh-120px)] animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 bg-slate-900/80 border-b border-cyan-950/60 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(selectedObject.status)}
            {selectedObject.raw_identifier && (
              <span className="text-[10px] text-cyan-400/80 bg-slate-950 px-1.5 py-0.5 rounded border border-cyan-950">
                ID: {selectedObject.raw_identifier}
              </span>
            )}
          </div>
          <h2 className="text-sm font-bold text-slate-100 mt-1.5 font-['Chakra_Petch'] tracking-wide truncate max-w-[260px]">
            {title}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{subCategory}</p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopyLink}
            title="Copy deep-link address URL hash"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1 text-[10px]"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
        {/* Strict Data Provenance Box */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DATA PROVENANCE & AUDIT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-400 block">PROVIDER:</span>
              <span className="text-slate-200 font-medium">{selectedObject.provider || 'Unspecified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ADAPTER:</span>
              <span className="text-cyan-300 font-medium truncate block">{selectedObject.adapter || 'direct-ingest'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">FETCHED AT:</span>
              <span className="text-slate-300">{fetchedDate.toLocaleTimeString()} ({secondsAgo}s ago)</span>
            </div>
            <div>
              <span className="text-slate-400 block">FRESHNESS:</span>
              <span className={secondsAgo < 60 ? 'text-emerald-400' : 'text-amber-400'}>
                {secondsAgo < 60 ? 'Live Stream' : `${Math.floor(secondsAgo / 60)}m cache`}
              </span>
            </div>
          </div>

          {selectedObject.sourceUrl && (
            <div className="pt-2 border-t border-slate-800/80">
              <a
                href={selectedObject.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 truncate"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{selectedObject.sourceUrl}</span>
              </a>
            </div>
          )}
        </div>

        {/* Geodetic Coordinates */}
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>GEOSPATIAL COORDINATES</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 text-[9px] block">LATITUDE:</span>
              <span className="text-slate-100 font-bold">
                {selectedObject.latitude !== undefined ? selectedObject.latitude.toFixed(5) : selectedObject.calculated?.latitude?.toFixed(5) || 'N/A'}°
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 text-[9px] block">LONGITUDE:</span>
              <span className="text-slate-100 font-bold">
                {selectedObject.longitude !== undefined ? selectedObject.longitude.toFixed(5) : selectedObject.calculated?.longitude?.toFixed(5) || 'N/A'}°
              </span>
            </div>
          </div>
        </div>

        {/* Domain Specific Metrics */}
        {/* Aircraft Metrics */}
        {selectedObject.icao24 && (
          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold text-[11px]">
              <Compass className="w-3.5 h-3.5" />
              <span>FLIGHT KINEMATICS</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">ALTITUDE:</span>
                <span className="text-cyan-300 font-bold">{selectedObject.baro_altitude ? `${Math.round(selectedObject.baro_altitude)} m` : 'Surface'}</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">VELOCITY:</span>
                <span className="text-cyan-300 font-bold">{selectedObject.velocity ? `${Math.round(selectedObject.velocity * 3.6)} km/h` : 'N/A'}</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">HEADING:</span>
                <span className="text-cyan-300 font-bold">{selectedObject.true_track ? `${Math.round(selectedObject.true_track)}°` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Satellite Orbital Metrics */}
        {selectedObject.noradId && selectedObject.calculated && (
          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold text-[11px]">
              <Globe2 className="w-3.5 h-3.5" />
              <span>ORBITAL TELEMETRY (SGP4)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">ALTITUDE:</span>
                <span className="text-indigo-300 font-bold">{selectedObject.calculated.altitudeKm} km</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">VELOCITY:</span>
                <span className="text-indigo-300 font-bold">{selectedObject.calculated.velocityKmS} km/s</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">FOOTPRINT RADIUS:</span>
                <span className="text-indigo-300 font-bold">{selectedObject.calculated.footprintRadiusKm} km</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">PERIOD:</span>
                <span className="text-indigo-300 font-bold">{selectedObject.calculated.periodMinutes} min</span>
              </div>
            </div>
          </div>
        )}

        {/* Earthquake Metrics */}
        {selectedObject.magnitude !== undefined && (
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-1.5 text-amber-300 font-semibold text-[11px]">
              <Gauge className="w-3.5 h-3.5" />
              <span>SEISMIC ENERGY PARAMETERS</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">MAGNITUDE:</span>
                <span className="text-amber-400 font-bold text-xs">M{selectedObject.magnitude}</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">DEPTH:</span>
                <span className="text-amber-300 font-bold">{selectedObject.depthKm} km</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">TSUNAMI:</span>
                <span className={selectedObject.tsunami ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  {selectedObject.tsunami ? 'WARNING' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Infrastructure & Port / Camera Parameters */}
        {selectedObject.type && (
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center space-x-1.5 text-emerald-300 font-semibold text-[11px]">
              {selectedObject.type === 'camera' ? (
                <Video className="w-3.5 h-3.5 text-emerald-400" />
              ) : selectedObject.type === 'port' ? (
                <Anchor className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>
                {selectedObject.type === 'camera' ? 'OFFICIAL GOVERNMENT TRANSPORT CAMERA' : selectedObject.type === 'port' ? 'STRATEGIC MARITIME PORT FACILITY' : 'INFRASTRUCTURE SPECIFICATION'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block">OPERATOR / AUTHORITY:</span>
                <span className="text-emerald-300 font-medium truncate block">{selectedObject.operator || 'National Authority'}</span>
              </div>
              {selectedObject.capacity_mw > 0 ? (
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">CAPACITY:</span>
                  <span className="text-emerald-400 font-bold">{selectedObject.capacity_mw} MW</span>
                </div>
              ) : (
                <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">JURISDICTION:</span>
                  <span className="text-slate-200 font-bold">{selectedObject.country}</span>
                </div>
              )}
            </div>

            {selectedObject.details && (
              <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded">
                {selectedObject.details}
              </p>
            )}

            {/* Live Camera Stream Feed Link if Type is Camera */}
            {selectedObject.type === 'camera' && (
              <div className="p-2.5 rounded bg-slate-950 border border-emerald-950/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    PUBLIC STREAM FEED
                  </span>
                  <span className="text-slate-400">NO PRIVATE CCTV</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  In compliance with strict data provenance rules, feeds are sourced exclusively from verified public transport & harbor authorities.
                </p>
                {selectedObject.streamUrl && (
                  <a
                    href={selectedObject.streamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1.5 w-full py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Official Municipal Portal</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Deep AI Target Analysis Section */}
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-cyan-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI TARGET ANALYSIS</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              GEMINI 3.8
            </span>
          </div>

          {aiAnalysis ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                {aiAnalysis}
              </div>
              <button
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition-colors"
              >
                {isAnalyzing ? 'Re-analyzing...' : 'Re-Run AI Target Synthesis'}
              </button>
            </div>
          ) : (
            <button
              onClick={runAiAnalysis}
              disabled={isAnalyzing}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Synthesizing Target Telemetry...' : 'Generate Deep AI Intelligence Report'}</span>
            </button>
          )}
        </div>

        {/* Raw JSON Payload Inspector */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full flex items-center justify-between px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <span className="flex items-center space-x-1.5 text-[10px]">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>RAW JSON OBSERVATION PAYLOAD</span>
            </span>
            <span className="text-[10px] text-cyan-400">
              {showRawJson ? 'Hide' : 'Inspect'}
            </span>
          </button>

          {showRawJson && (
            <div className="mt-2 relative">
              <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-[9px] text-slate-300 overflow-x-auto max-h-48 font-mono">
                {JSON.stringify(selectedObject, null, 2)}
              </pre>
              <button
                onClick={handleCopyJson}
                className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] flex items-center gap-1 border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

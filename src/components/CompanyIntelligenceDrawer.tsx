import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  Zap, 
  Factory, 
  Database, 
  Sun, 
  Wind, 
  Copy, 
  Check, 
  Compass, 
  BarChart3, 
  LineChart, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { CompanyProfile, PhysicalAssetRecord, ProvenanceClassification } from '../types';

interface CompanyIntelligenceDrawerProps {
  company: CompanyProfile | null;
  onClose: () => void;
  onFlyToAsset: (asset: PhysicalAssetRecord) => void;
  onFlyToHeadquarters: (company: CompanyProfile) => void;
}

export function CompanyIntelligenceDrawer({
  company,
  onClose,
  onFlyToAsset,
  onFlyToHeadquarters
}: CompanyIntelligenceDrawerProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAssetTab, setSelectedAssetTab] = useState<'all' | 'manufacturing' | 'energy' | 'datacenter'>('all');

  if (!company) return null;

  const handleCopyDeepLink = () => {
    const hash = `company=${company.company_id}`;
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url);
    window.location.hash = hash;
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getProvenanceBadge = (prov: ProvenanceClassification) => {
    switch (prov) {
      case 'VERIFIED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            VERIFIED
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            DISPUTED / SUPPLIER
          </span>
        );
      case 'WITHHELD':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/80 border border-purple-500/60 text-purple-300">
            WITHHELD
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/80 border border-rose-500/60 text-rose-300">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
            EXPERIMENTAL
          </span>
        );
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'refinery':
      case 'manufacturing':
        return <Factory className="w-3.5 h-3.5 text-amber-400" />;
      case 'power_plant':
      case 'solar_park':
      case 'wind_farm':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'datacenter':
        return <Database className="w-3.5 h-3.5 text-cyan-400" />;
      case 'headquarters':
      case 'office':
        return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredAssets = company.physical_assets.filter(a => {
    if (selectedAssetTab === 'all') return true;
    if (selectedAssetTab === 'manufacturing') return a.asset_type === 'manufacturing' || a.asset_type === 'refinery';
    if (selectedAssetTab === 'energy') return a.asset_type === 'power_plant' || a.asset_type === 'solar_park' || a.asset_type === 'wind_farm';
    if (selectedAssetTab === 'datacenter') return a.asset_type === 'datacenter';
    return true;
  });

  return (
    <aside className="absolute top-16 left-4 z-20 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] flex flex-col bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl font-mono text-xs overflow-hidden transition-all animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-3.5 bg-slate-900/80 border-b border-cyan-950/80 flex items-start justify-between">
        <div className="flex items-start space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-100 font-sans tracking-tight">
                {company.canonical_name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {company.ticker}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
              <span>{company.exchange}</span>
              <span>•</span>
              <span>{company.sector}</span>
              {company.market_cap_usd && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{company.market_cap_usd}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopyDeepLink}
            title="Copy Deep Link (#company=...)"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors border border-slate-700/60"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors border border-slate-700/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ASTRA Signal & Analysis Card */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900/90 to-cyan-950/30 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>ASTRA INTELLIGENCE SIGNAL</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
              company.astra_signal.bias === 'BULLISH' 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                : company.astra_signal.bias === 'BEARISH'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {company.astra_signal.bias === 'BULLISH' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {company.astra_signal.bias} ({company.astra_signal.confidence}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {company.astra_signal.summary}
          </p>
          
          {/* Quick Deep Integration Action Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <a
              href={`#company=${company.company_id}`}
              className="px-2 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-300 text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1"
            >
              <Activity className="w-3 h-3" />
              <span>ASTRA</span>
            </a>
            <a
              href={`#${company.fmb_valuation_link.replace(/^\//, '')}`}
              onClick={(e) => {
                e.preventDefault();
                alert(`Navigating to ASTRA FMB Valuation Engine for ${company.ticker}...`);
              }}
              className="px-2 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1"
            >
              <BarChart3 className="w-3 h-3" />
              <span>FMB</span>
            </a>
            <a
              href={`#${company.technicals_link.replace(/^\//, '')}`}
              onClick={(e) => {
                e.preventDefault();
                alert(`Navigating to ASTRA Technicals Chart for ${company.exchange}:${company.ticker}...`);
              }}
              className="px-2 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-purple-300 text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1"
            >
              <LineChart className="w-3 h-3" />
              <span>CHARTS</span>
            </a>
          </div>
        </div>

        {/* Corporate Headquarters */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400">Headquarters</div>
              <div className="text-slate-200 font-semibold">{company.headquarters.city}, {company.headquarters.country}</div>
            </div>
          </div>
          <button
            onClick={() => onFlyToHeadquarters(company)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950/80 text-cyan-300 text-[10px] border border-cyan-500/30 flex items-center gap-1"
          >
            <Compass className="w-3 h-3" />
            <span>Fly To HQ</span>
          </button>
        </div>

        {/* Commodity & Supply Chain Exposure */}
        {company.commodity_exposure.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Key Commodity & Supply Chain Exposures
            </div>
            <div className="flex flex-wrap gap-1">
              {company.commodity_exposure.map((com, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 text-[10px]"
                >
                  {com}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Physical Assets Registry */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Factory className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Physical Assets ({company.physical_assets.length})
              </span>
            </div>
            <div className="text-[9px] text-slate-400">Strict Provenance</div>
          </div>

          {/* Asset Category Filter Tabs */}
          <div className="flex space-x-1 p-0.5 bg-slate-900/80 rounded-lg border border-slate-800">
            {(['all', 'manufacturing', 'energy', 'datacenter'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedAssetTab(tab)}
                className={`flex-1 py-1 text-[9px] rounded capitalize transition-all ${
                  selectedAssetTab === tab 
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Asset Cards List */}
          <div className="space-y-2 pt-1">
            {filteredAssets.map(asset => (
              <div
                key={asset.asset_id}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-start space-x-2 min-w-0">
                    <div className="p-1 rounded bg-slate-800 mt-0.5 flex-shrink-0">
                      {getAssetIcon(asset.asset_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 truncate">
                        {asset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <span className="capitalize">{asset.asset_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{asset.region ? `${asset.region}, ` : ''}{asset.country}</span>
                      </div>
                    </div>
                  </div>
                  {getProvenanceBadge(asset.provenance)}
                </div>

                {/* Capacity & Operational Status */}
                <div className="flex items-center justify-between text-[10px] bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/50">
                  <div className="text-slate-300">
                    <span className="text-slate-500">Capacity: </span>
                    <span className="font-semibold text-emerald-400">
                      {asset.capacity_value ? `${asset.capacity_value.toLocaleString()} ${asset.capacity_metric}` : 'Operational Scale'}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    <span className="text-slate-500">Ownership: </span>
                    <span className="font-semibold text-cyan-300">{asset.ownership_pct}%</span>
                  </div>
                </div>

                {/* Evidence & Provenance Verification */}
                <div className="text-[9px] text-slate-400 flex items-center justify-between pt-0.5">
                  <div className="truncate max-w-[200px]" title={asset.evidence_source}>
                    <span className="text-slate-500">Proof: </span>
                    {asset.evidence_source}
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {asset.evidence_url && (
                      <a
                        href={asset.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-cyan-300"
                        title="View Official Regulatory Filing"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => onFlyToAsset(asset)}
                      className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 transition-colors flex items-center gap-1 font-bold"
                    >
                      <Compass className="w-2.5 h-2.5" />
                      <span>Fly</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provenance Disclaimers */}
        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[9px] text-slate-500 leading-relaxed flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>
            Every physical facility in Company God View requires authoritative provenance documentation. Geographic proximity is never used to infer corporate ownership or customer relationships.
          </span>
        </div>
      </div>
    </aside>
  );
}

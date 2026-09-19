import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  RotateCcw, 
  ShieldAlert, 
  Terminal,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  NewsIntelligenceRecord, 
  MacroIndicatorRecord 
} from '../types';

interface AiAnalystDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCounts?: any;
  flights: AircraftRecord[];
  satellites: SatelliteRecord[];
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  news: NewsIntelligenceRecord[];
  macro?: MacroIndicatorRecord[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

const PRESET_QUERIES = [
  "Correlate recent high-magnitude earthquakes with coastal infrastructure risks.",
  "Analyze current commercial aviation corridors and abnormal altitude clusters.",
  "Identify active Starlink and ISS orbital trajectories over conflict zones.",
  "Provide an integrated threat assessment of GDELT OSINT news and thermal anomalies."
];

export function AiAnalystDrawer({
  isOpen,
  onClose,
  flights,
  satellites,
  earthquakes,
  wildfires,
  news,
  macro
}: AiAnalystDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'gemini',
      text: `Tactical Geospatial Intelligence Engine online. Powered by Gemini 3.8 Flash.\nCurrently synthesizing ${flights.length} live ADS-B flights, ${satellites.length} Keplerian orbital assets, ${earthquakes.length} seismic tremors, and ${wildfires.length} thermal anomalies.\n\nHow can I assist your geospatial analysis?`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contextData: {
            flightsCount: flights.length,
            sampleFlights: flights.slice(0, 10).map(f => ({ callsign: f.callsign, country: f.origin_country, alt: f.baro_altitude, vel: f.velocity })),
            satellitesCount: satellites.length,
            sampleSatellites: satellites.slice(0, 10).map(s => ({ name: s.name, alt: s.calculated?.altitudeKm, inc: s.calculated?.inclinationDeg })),
            earthquakes: earthquakes.slice(0, 10).map(e => ({ mag: e.magnitude, place: e.place, depth: e.depthKm })),
            wildfires: wildfires.slice(0, 10).map(w => ({ title: w.title, category: w.category })),
            news: news.slice(0, 10).map(n => ({ title: n.title, source: n.source, cat: n.category })),
            macro
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'gemini',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'gemini',
          text: `⚠️ Analysis Engine Notice: ${data.error || 'Failed to complete tactical synthesis.'}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'gemini',
        text: `⚠️ System Error: Network timeout communicating with server intelligence agent (${err.message})`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[480px] max-w-full bg-slate-950 border-l border-cyan-950/80 shadow-2xl flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900/90 border-b border-cyan-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 font-['Chakra_Petch'] text-sm flex items-center gap-1.5">
              <span>GEOINTEL AI ANALYST</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 text-[9px]">GEMINI 3.8 FLASH</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Live multi-layer geospatial correlation & strategic assessment
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

      {/* Preset Prompts */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800 space-y-1.5">
        <span className="text-[10px] text-slate-400 font-bold block uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Quick Intelligence Prompts:
        </span>
        <div className="space-y-1">
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSend(preset)}
              className="w-full text-left p-1.5 rounded bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[10px] truncate transition-colors"
            >
              • {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1 text-[9px] text-slate-500 mb-0.5">
              <span>{msg.sender === 'user' ? 'OPERATOR' : 'GEMINI ANALYST'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-xl max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-900/40 border border-cyan-500/50 text-cyan-100'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-cyan-400 p-2 bg-slate-900/40 rounded-lg border border-slate-800 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-[11px]">Gemini 3.8 Flash synthesizing multi-layer geointel data...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-900/90 border-t border-cyan-950/60 flex items-center space-x-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask tactical analyst anything about current telemetry..."
          disabled={isLoading}
          className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500 text-xs font-mono"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

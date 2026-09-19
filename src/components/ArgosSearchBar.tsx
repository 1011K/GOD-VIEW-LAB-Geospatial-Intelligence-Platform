import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Building2, 
  Zap, 
  Video, 
  Ship, 
  Plane, 
  Orbit, 
  MapPin, 
  ExternalLink,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { SearchResultItem } from '../types';

interface ArgosSearchBarProps {
  onSelectResult: (result: SearchResultItem) => void;
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
}

export function ArgosSearchBar({ onSelectResult, onFlyTo }: ArgosSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.results)) {
            setResults(json.results);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    onFlyTo(item.coordinates[0], item.coordinates[1], item.category === 'company' ? 6 : 14);
    onSelectResult(item);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'company':
        return <Building2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'power':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'camera':
        return <Video className="w-3.5 h-3.5 text-emerald-400" />;
      case 'vessel':
        return <Ship className="w-3.5 h-3.5 text-blue-400" />;
      case 'flight':
        return <Plane className="w-3.5 h-3.5 text-sky-400" />;
      case 'satellite':
        return <Orbit className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div ref={searchContainerRef} className="relative z-30 w-full max-w-md font-mono text-xs">
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-cyan-400/80" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search company (RELIANCE, AAPL, MSFT), power (#63031), camera, vessel..."
          className="w-full pl-9 pr-14 py-2 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-500/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs shadow-xl backdrop-blur-md transition-all focus:ring-1 focus:ring-cyan-500/40 focus:outline-none"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-2 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 pointer-events-none font-sans">
            ⌘K
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-96 overflow-y-auto bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl divide-y divide-slate-800/60">
          <div className="px-3 py-1.5 bg-slate-900/60 text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider flex justify-between items-center">
            <span>Global Tactical Index ({results.length} matches)</span>
            <span className="text-slate-500 text-[9px]">Select to fly map</span>
          </div>

          <div className="py-1">
            {results.map((item) => (
              <button
                key={`${item.category}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 hover:bg-cyan-950/40 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-start space-x-2.5 min-w-0">
                  <div className="mt-0.5 p-1 rounded bg-slate-900 border border-slate-700 flex-shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-100 group-hover:text-cyan-300 truncate">
                        {item.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 border border-slate-700 text-slate-300 flex-shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

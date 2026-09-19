import React, { useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Clock, 
  Radio,
  Calendar,
  CloudRain
} from 'lucide-react';

interface TimelineScrubberProps {
  currentTime: Date;
  setCurrentTime: (newTime: Date | ((prev: Date) => Date)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  radarFrames?: Array<{ time: number; path: string }>;
  currentRadarFrame?: string | null;
  setCurrentRadarFrame?: (path: string) => void;
}

export function TimelineScrubber({
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  radarFrames = [],
  currentRadarFrame,
  setCurrentRadarFrame
}: TimelineScrubberProps) {
  // Range: -24 hours to +6 hours from real current time
  const now = new Date();
  const minTime = now.getTime() - 24 * 3600 * 1000;
  const maxTime = now.getTime() + 6 * 3600 * 1000;
  const totalRange = maxTime - minTime;

  const isLive = Math.abs(currentTime.getTime() - Date.now()) < 5000;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetMs = minTime + (val / 100) * totalRange;
    setCurrentTime(new Date(targetMs));
    if (isPlaying) setIsPlaying(false);
  };

  const sliderPercent = Math.min(100, Math.max(0, ((currentTime.getTime() - minTime) / totalRange) * 100));

  const stepHours = (hours: number) => {
    setCurrentTime(new Date(currentTime.getTime() + hours * 3600 * 1000));
  };

  const resetToLive = () => {
    setIsPlaying(false);
    setCurrentTime(new Date());
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[600px] max-w-[calc(100vw-2rem)] bg-slate-950/95 border border-cyan-950/80 rounded-xl shadow-2xl backdrop-blur-md px-4 py-2.5 font-mono text-xs text-slate-200">
      {/* Top Header: Current Time & State Badge */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-cyan-950/60">
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            4D Temporal Simulation
          </span>
          <span className="text-cyan-300 font-bold font-mono">
            {currentTime.toUTCString().replace('GMT', 'ZULU')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isLive ? (
            <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>LIVE RECEPT</span>
            </span>
          ) : (
            <button
              onClick={resetToLive}
              className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>RETURN TO LIVE</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrubber Slider */}
      <div className="relative mb-2">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={sliderPercent}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
        />
        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
          <span>-24h (Historical)</span>
          <span className="text-cyan-400 font-bold">T0 (Now)</span>
          <span>+6h (Orbital Projection)</span>
        </div>
      </div>

      {/* Control Actions & Speed Multiplier */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => stepHours(-1)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors text-[10px] px-1.5 flex items-center gap-0.5"
            title="Step back 1 hour"
          >
            <Rewind className="w-3 h-3" /> -1h
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded border transition-colors flex items-center gap-1 text-xs px-2.5 font-bold ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={() => stepHours(1)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors text-[10px] px-1.5 flex items-center gap-0.5"
            title="Step forward 1 hour"
          >
            +1h <FastForward className="w-3 h-3" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center space-x-1 text-[10px]">
          <span className="text-slate-400">WARP:</span>
          {[1, 10, 60, 300].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 rounded border transition-colors ${
                playbackSpeed === spd
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {spd === 1 ? '1x' : `${spd}x`}
            </button>
          ))}
        </div>

        {/* Radar Doppler Frame Selector */}
        {radarFrames.length > 0 && setCurrentRadarFrame && (
          <div className="flex items-center space-x-1.5 text-[10px]">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={currentRadarFrame || ''}
              onChange={(e) => setCurrentRadarFrame(e.target.value)}
              className="bg-slate-900 border border-blue-500/30 text-blue-300 rounded px-1.5 py-0.5 text-[10px] outline-none"
            >
              {radarFrames.map((f, i) => (
                <option key={i} value={f.path}>
                  {new Date(f.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

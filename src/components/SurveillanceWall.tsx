import React, { useState } from 'react';
import { PublicCameraRecord } from '../types';
import {
  Video,
  Grid,
  Maximize2,
  Volume2,
  VolumeX,
  ExternalLink,
  Radio,
  Search,
  CheckCircle,
  RefreshCw,
  Eye,
  ChevronDown
} from 'lucide-react';

interface SurveillanceWallProps {
  cameras: PublicCameraRecord[];
  onSelectCamera?: (camera: PublicCameraRecord) => void;
  onClose?: () => void;
}

type GridLayout = '2x2' | '3x3' | '1+5';

export const SurveillanceWall: React.FC<SurveillanceWallProps> = ({
  cameras,
  onSelectCamera,
  onClose
}) => {
  const [layout, setLayout] = useState<GridLayout>('2x2');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'video' | 'highway'>('all');
  const [globalMute, setGlobalMute] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedFeedIndices, setSelectedFeedIndices] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const [activeSlotMenu, setActiveSlotMenu] = useState<number | null>(null);

  // Filter available cameras
  const filteredCameras = cameras.filter(cam => {
    const desc = cam.description || '';
    const matchesSearch = cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedFilter === 'video') return cam.stream_type === 'youtube' || cam.media_type === 'video' || !!cam.embed_url;
    if (selectedFilter === 'highway') return cam.provider.toLowerCase().includes('transport') || cam.provider.toLowerCase().includes('highway') || cam.provider.toLowerCase().includes('tfl') || cam.provider.toLowerCase().includes('caltrans');
    return true;
  });

  // Calculate slots based on layout
  const slotCount = layout === '2x2' ? 4 : layout === '3x3' ? 9 : 6;
  const currentSlots = Array.from({ length: slotCount }, (_, i) => {
    const feedIdx = selectedFeedIndices[i] ?? i;
    return filteredCameras[feedIdx % (filteredCameras.length || 1)] || cameras[0];
  });

  const handleSelectSlotCamera = (slotIdx: number, camIdx: number) => {
    const newIndices = [...selectedFeedIndices];
    newIndices[slotIdx] = camIdx;
    setSelectedFeedIndices(newIndices);
    setActiveSlotMenu(null);
  };

  const getEmbedUrl = (cam: PublicCameraRecord, muted: boolean) => {
    if (cam.embed_url) {
      try {
        const url = new URL(cam.embed_url);
        if (muted) {
          url.searchParams.set('mute', '1');
        } else {
          url.searchParams.set('mute', '0');
        }
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('enablejsapi', '1');
        return url.toString();
      } catch {
        return cam.embed_url;
      }
    }
    return cam.media_url;
  };

  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-mono select-none">
      {/* Top Tactical Command Bar */}
      <header className="flex-none px-4 py-3 bg-slate-900/90 border-b border-cyan-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-wider text-cyan-300 uppercase">
                Tactical Surveillance Wall
              </h1>
              <span className="px-2 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold flex items-center gap-1">
                OPTICAL FEED MATRIX
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Public Highway & Geospatial Optical Feeds ({filteredCameras.length} Catalog Nodes)
            </p>
          </div>
        </div>

        {/* Quick Filter & Search */}
        <div className="flex items-center space-x-2 flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter feeds by city, landmark, or provider..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-cyan-500/30 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 border border-slate-700/50 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2 py-1 rounded ${selectedFilter === 'all' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('video')}
              className={`px-2 py-1 rounded ${selectedFilter === 'video' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              HD Video
            </button>
            <button
              onClick={() => setSelectedFilter('highway')}
              className={`px-2 py-1 rounded ${selectedFilter === 'highway' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              CCTV/DOT
            </button>
          </div>
        </div>

        {/* Layout Switchers & Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950/90 border border-cyan-500/30 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setLayout('2x2')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
                layout === '2x2' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2x2 Grid (4 Feeds)"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">2x2</span>
            </button>
            <button
              onClick={() => setLayout('3x3')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
                layout === '3x3' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3x3 Grid (9 Feeds)"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">3x3</span>
            </button>
            <button
              onClick={() => setLayout('1+5')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
                layout === '1+5' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="1 Hero + 5 Secondary Feeds"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">1+5 Hero</span>
            </button>
          </div>

          <button
            onClick={() => setGlobalMute(!globalMute)}
            className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
              globalMute
                ? 'bg-slate-800/80 border-slate-600 text-slate-400 hover:text-slate-200'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
            }`}
            title={globalMute ? 'Unmute Active Streams' : 'Mute All Feeds'}
          >
            {globalMute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[10px] hidden sm:inline">{globalMute ? 'Muted' : 'Live Audio'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Return to Map
            </button>
          )}
        </div>
      </header>

      {/* Surveillance Matrix Grid Body */}
      <div className="flex-1 p-2 bg-slate-950 overflow-hidden">
        {layout === '1+5' ? (
          /* 1 Hero + 5 Column Layout */
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-2">
            {/* Primary Hero Screen */}
            <div className="lg:col-span-2 h-full bg-slate-900/90 rounded-xl border border-cyan-500/40 overflow-hidden flex flex-col relative shadow-2xl">
              {currentSlots[heroIndex] && (
                <VideoFeedTile
                  camera={currentSlots[heroIndex]}
                  slotIdx={heroIndex}
                  isHero={true}
                  globalMute={globalMute}
                  getEmbedUrl={getEmbedUrl}
                  allCameras={filteredCameras}
                  onSelectCamera={onSelectCamera}
                  onSwapSlot={handleSelectSlotCamera}
                  isMenuOpen={activeSlotMenu === heroIndex}
                  setIsMenuOpen={(open) => setActiveSlotMenu(open ? heroIndex : null)}
                />
              )}
            </div>

            {/* 5 Stacked Secondary Screens */}
            <div className="h-full grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto pr-1">
              {currentSlots.slice(1, 6).map((cam, idx) => {
                const actualSlot = idx + 1;
                return (
                  <div
                    key={`slot-${actualSlot}`}
                    className="h-44 lg:h-auto min-h-[140px] bg-slate-900/90 rounded-xl border border-slate-700/60 hover:border-cyan-500/40 transition-all overflow-hidden flex flex-col relative group"
                  >
                    <VideoFeedTile
                      camera={cam}
                      slotIdx={actualSlot}
                      isHero={false}
                      globalMute={globalMute}
                      getEmbedUrl={getEmbedUrl}
                      allCameras={filteredCameras}
                      onSelectCamera={onSelectCamera}
                      onSwapSlot={handleSelectSlotCamera}
                      onPromoteToHero={() => setHeroIndex(actualSlot)}
                      isMenuOpen={activeSlotMenu === actualSlot}
                      setIsMenuOpen={(open) => setActiveSlotMenu(open ? actualSlot : null)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Standard 2x2 or 3x3 Grid */
          <div
            className={`w-full h-full grid gap-2 ${
              layout === '2x2' ? 'grid-cols-1 md:grid-cols-2 grid-rows-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-3'
            }`}
          >
            {currentSlots.map((cam, idx) => (
              <div
                key={`matrix-slot-${idx}`}
                className="w-full h-full bg-slate-900/90 rounded-xl border border-cyan-500/20 hover:border-cyan-400/50 transition-all overflow-hidden flex flex-col relative group shadow-lg"
              >
                <VideoFeedTile
                  camera={cam}
                  slotIdx={idx}
                  isHero={false}
                  globalMute={globalMute}
                  getEmbedUrl={getEmbedUrl}
                  allCameras={filteredCameras}
                  onSelectCamera={onSelectCamera}
                  onSwapSlot={handleSelectSlotCamera}
                  isMenuOpen={activeSlotMenu === idx}
                  setIsMenuOpen={(open) => setActiveSlotMenu(open ? idx : null)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Status Ticker Bar */}
      <footer className="flex-none px-4 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            OPTICAL FEED DIRECTORY: {currentSlots.length} DISPLAYED
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            PROVENANCE: Government DOT / Municipal Traffic Services
          </span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>SOURCE TYPE: Public Embed / Snapshot</span>
          <span className="text-cyan-400 font-bold">{currentSlots.length} CHANNELS</span>
        </div>
      </footer>
    </div>
  );
};

interface VideoFeedTileProps {
  camera?: PublicCameraRecord;
  slotIdx: number;
  isHero: boolean;
  globalMute: boolean;
  getEmbedUrl: (cam: PublicCameraRecord, muted: boolean) => string;
  allCameras: PublicCameraRecord[];
  onSelectCamera?: (camera: PublicCameraRecord) => void;
  onSwapSlot: (slotIdx: number, cameraIdx: number) => void;
  onPromoteToHero?: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

const VideoFeedTile: React.FC<VideoFeedTileProps> = ({
  camera,
  slotIdx,
  isHero,
  globalMute,
  getEmbedUrl,
  allCameras,
  onSelectCamera,
  onSwapSlot,
  onPromoteToHero,
  isMenuOpen,
  setIsMenuOpen
}) => {
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!camera) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
        No Camera Assigned
      </div>
    );
  }

  const isVideo = camera.stream_type === 'youtube' || camera.media_type === 'video' || !!camera.embed_url;
  const directLink = camera.source_url || camera.media_url;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 px-2.5 py-1.5 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-none ${
            camera.status === 'LIVE' ? 'bg-emerald-500 animate-pulse' :
            (camera.status as string) === 'REACHABLE' ? 'bg-cyan-400' :
            camera.status === 'UNAVAILABLE' || camera.status === 'OFFLINE' ? 'bg-rose-500' :
            'bg-amber-500'
          }`} />
          <span className="text-xs font-bold text-slate-100 truncate tracking-wide">
            {camera.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-none uppercase">
            {camera.stream_type || camera.media_type}
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 flex-none">
            {camera.status}
          </span>
        </div>

        {/* Quick Channel Dropdown & Actions */}
        <div className="flex items-center space-x-1.5 flex-none relative">
          {onPromoteToHero && (
            <button
              onClick={onPromoteToHero}
              className="p-1 rounded bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 text-[10px]"
              title="Promote to Main Hero Screen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}

          {onSelectCamera && (
            <button
              onClick={() => onSelectCamera(camera)}
              className="p-1 rounded bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 text-[10px]"
              title="Inspect Telemetry in Drawer"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}

          {/* Switch Channel Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-[10px] text-cyan-300"
          >
            <span>CH {slotIdx + 1}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Switch Channel Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-7 w-64 max-h-56 bg-slate-900 border border-cyan-500/40 rounded-lg shadow-2xl overflow-y-auto z-40 p-1 divide-y divide-slate-800">
              <div className="px-2 py-1 text-[10px] text-cyan-400 font-bold uppercase tracking-wider bg-slate-950/80 rounded">
                Switch Slot {slotIdx + 1} Stream:
              </div>
              {allCameras.map((camOption, optIdx) => (
                <button
                  key={camOption.camera_id}
                  onClick={() => onSwapSlot(slotIdx, optIdx)}
                  className={`w-full text-left px-2 py-1.5 text-xs hover:bg-cyan-500/20 transition-colors flex items-center justify-between ${
                    camOption.camera_id === camera.camera_id ? 'text-cyan-300 font-bold bg-cyan-950/40' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{camOption.name}</span>
                  <span className="text-[9px] text-slate-500 ml-1 flex-none uppercase">
                    {camOption.stream_type || camOption.media_type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Video / Image Feed Body */}
      <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
            <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
            <p className="text-xs text-rose-300 font-semibold">Feed Carrier Signal Interrupted</p>
            <p className="text-[10px] text-slate-500 max-w-xs">{camera.description || camera.region}</p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => {
                  setHasError(false);
                  setReloadKey(k => k + 1);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry Feed
              </button>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Direct
              </a>
            </div>
          </div>
        ) : isVideo ? (
          <iframe
            key={`stream-${camera.camera_id}-${reloadKey}`}
            src={getEmbedUrl(camera, globalMute)}
            title={camera.name}
            className="w-full h-full border-0 pointer-events-auto object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setHasError(true)}
          />
        ) : (
          <img
            key={`img-${camera.camera_id}-${reloadKey}`}
            src={`${camera.media_url}${camera.media_url.includes('?') ? '&' : '?'}t=${Date.now()}`}
            alt={camera.name}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-2.5 py-1 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between text-[10px] text-slate-400 pointer-events-none">
        <span className="truncate max-w-[65%]">{camera.description || `${camera.region}, ${camera.country}`}</span>
        <span className="font-mono text-cyan-400/90 flex-none">
          {camera.latitude.toFixed(3)}°, {camera.longitude.toFixed(3)}°
        </span>
      </div>
    </div>
  );
};

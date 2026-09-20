import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  Clock, 
  Compass, 
  Calendar, 
  ChevronRight, 
  Eye,
  Navigation
} from 'lucide-react';
import { SatelliteRecord } from '../types';
import { calculateUpcomingPasses, SatellitePass } from '../services/satellitePropagator';

interface SatellitePassPredictorProps {
  satellites: SatelliteRecord[];
  onSelectSatellite: (sat: SatelliteRecord) => void;
}

const PRESET_CITIES = [
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'London, United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'New York, United States', lat: 40.7128, lng: -74.0060 },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Geneva, Switzerland (CERN)', lat: 46.2044, lng: 6.1432 },
  { name: 'Cape Canaveral, FL (NASA)', lat: 28.3922, lng: -80.6077 }
];

export function SatellitePassPredictor({
  satellites,
  onSelectSatellite
}: SatellitePassPredictorProps) {
  const [selectedSatId, setSelectedSatId] = useState<string>(satellites[0]?.noradId || '');
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]);
  const [customLat, setCustomLat] = useState<string>('35.6762');
  const [customLng, setCustomLng] = useState<string>('139.6503');
  const [useCustomCoord, setUseCustomCoord] = useState<boolean>(false);

  const currentSat = satellites.find(s => s.noradId === selectedSatId) || satellites[0];

  const observerLat = useCustomCoord ? parseFloat(customLat) || 0 : selectedCity.lat;
  const observerLng = useCustomCoord ? parseFloat(customLng) || 0 : selectedCity.lng;

  const passes: SatellitePass[] = currentSat 
    ? calculateUpcomingPasses(currentSat, observerLat, observerLng, new Date(), 36)
    : [];

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto custom-scrollbar font-mono text-xs space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-950/80 space-y-1">
        <h2 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] flex items-center gap-2">
          <Radio className="w-5 h-5 text-indigo-400" />
          ORBITAL GROUND PASS & TRAJECTORY PREDICTOR
        </h2>
        <p className="text-xs text-slate-400">
          Compute real-time line-of-sight elevation angles and upcoming visual pass windows via analytical SGP4 mechanics.
        </p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select Target Satellite */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <label className="text-slate-300 font-bold block uppercase text-[11px]">
            1. Select Target Orbital Vehicle
          </label>
          <select
            value={selectedSatId}
            onChange={(e) => setSelectedSatId(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 font-mono text-xs"
          >
            {satellites.map(sat => (
              <option key={sat.noradId} value={sat.noradId}>
                {sat.name} (NORAD #{sat.noradId}) - Alt: {sat.calculated?.altitudeKm || 'N/A'}km
              </option>
            ))}
          </select>

          {currentSat && (
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Inclination:</span>
                <span className="text-slate-200 font-bold">{currentSat.calculated?.inclinationDeg}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orbital Velocity:</span>
                <span className="text-slate-200 font-bold">{currentSat.calculated?.velocityKmS} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orbital Period:</span>
                <span className="text-slate-200 font-bold">{currentSat.calculated?.periodMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Footprint Radius:</span>
                <span className="text-cyan-300 font-bold">{currentSat.calculated?.footprintRadiusKm} km</span>
              </div>
            </div>
          )}
        </div>

        {/* Observer Ground Station */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-bold uppercase text-[11px]">
              2. Ground Station / Observer Location
            </label>
            <button
              onClick={() => setUseCustomCoord(!useCustomCoord)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
            >
              {useCustomCoord ? 'Use Preset Cities' : 'Custom Lat/Lon'}
            </button>
          </div>

          {!useCustomCoord ? (
            <div className="space-y-1.5">
              {PRESET_CITIES.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCity(city)}
                  className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                    selectedCity.name === city.name 
                      ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-300 font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>{city.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">LATITUDE (°N):</span>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">LONGITUDE (°E):</span>
                <input
                  type="text"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculated Upcoming Passes Result */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase font-['Chakra_Petch'] flex items-center justify-between">
          <span>Predicted Pass Windows (Next 36 Hours)</span>
          <span className="text-indigo-400 text-[10px] font-mono">
            Ground Station: {useCustomCoord ? `${customLat}°, ${customLng}°` : selectedCity.name}
          </span>
        </h3>

        {satellites.length === 0 ? (
          <div className="py-12 text-center text-rose-400 font-bold border border-rose-500/30 rounded-lg bg-rose-950/20 p-6 space-y-2">
            <div>DATA UNAVAILABLE</div>
            <div className="text-xs font-normal text-slate-400">
              No active orbital ephemeris loaded. Upstream CelesTrak service may be unreachable or returned no TLE data.
            </div>
          </div>
        ) : passes.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No line-of-sight visual passes above 10° elevation detected in the next 36 hours for this ground station.
          </div>
        ) : (
          <div className="space-y-2">
            {passes.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between hover:border-indigo-500/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-bold">
                      PASS #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-100">
                      {p.startTime.toLocaleDateString()} at {p.startTime.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-3">
                    <span>Duration: <strong className="text-slate-200">{p.durationMinutes} min</strong></span>
                    <span>Max Elevation: <strong className="text-cyan-300">{p.maxElevationDeg}°</strong></span>
                    <span>Peak Time: <strong className="text-slate-200">{p.maxElevationTime.toLocaleTimeString()}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectSatellite(currentSat)}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold text-[11px] transition-colors"
                >
                  Track Orbit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

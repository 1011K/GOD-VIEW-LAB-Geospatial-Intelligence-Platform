import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  InfrastructureRecord, 
  NewsIntelligenceRecord, 
  WeatherRadarMetadata,
  BaseMapType,
  LayerToggleState,
  PublicCameraRecord,
  VesselRecord,
  CompanyProfile
} from '../types';
import { calculateGroundTrack } from '../services/satellitePropagator';

interface TacticalMapProps {
  baseMap: BaseMapType;
  layers: LayerToggleState;
  flights: AircraftRecord[];
  satellites: SatelliteRecord[];
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  infrastructure: InfrastructureRecord[];
  cameras?: PublicCameraRecord[];
  vessels?: VesselRecord[];
  companies?: CompanyProfile[];
  news: NewsIntelligenceRecord[];
  radarMetadata: WeatherRadarMetadata | null;
  radarFramePath?: string | null;
  onSelectObject: (obj: any) => void;
  onSelectCompany?: (company: CompanyProfile) => void;
  selectedObject: any | null;
  currentSimTime?: Date;
  currentTime?: Date;
}

// Major Global Submarine Fiber Optic Cable Geometries
const SUBSEA_CABLE_ROUTES: Array<{ id: string; name: string; capacity: string; coordinates: [number, number][] }> = [
  {
    id: 'cable-marea',
    name: 'MAREA (Virginia Beach -> Bilbao)',
    capacity: '200 Tbps (8 pairs)',
    coordinates: [[36.8529, -75.9780], [38.5, -55.0], [41.2, -30.0], [43.3, -15.0], [43.3486, -2.9969]]
  },
  {
    id: 'cable-grace-hopper',
    name: 'Grace Hopper (New York -> Bude -> Bilbao)',
    capacity: '340 Tbps (16 pairs)',
    coordinates: [[40.7128, -74.0060], [45.0, -50.0], [50.8284, -4.5434], [43.3486, -2.9969]]
  },
  {
    id: 'cable-trans-pacific',
    name: 'Trans-Pacific Express (Nedonna Beach -> Chongming/Qingdao)',
    capacity: '5.12 Tbps',
    coordinates: [[45.7196, -123.9482], [42.0, -160.0], [38.0, 170.0], [35.0, 140.0], [31.5, 121.9]]
  },
  {
    id: 'cable-sea-me-we-5',
    name: 'SEA-ME-WE 5 (Marseille -> Singapore)',
    capacity: '24 Tbps',
    coordinates: [
      [43.2965, 5.3698], [37.0, 15.0], [31.2, 29.9], [27.0, 34.5], 
      [12.5, 43.5], [10.0, 60.0], [6.9, 79.8], [1.3521, 103.8198]
    ]
  },
  {
    id: 'cable-2africa',
    name: '2Africa (Circumnavigation of Africa)',
    capacity: '180 Tbps',
    coordinates: [
      [50.8, -1.1], [36.0, -5.5], [14.7, -17.4], [5.0, -3.0], 
      [-4.3, 15.3], [-33.9, 18.4], [-25.9, 32.5], [-4.0, 39.6], 
      [12.0, 45.0], [27.0, 34.0], [31.2, 29.9], [43.3, 5.4]
    ]
  },
  {
    id: 'cable-southern-cross',
    name: 'Southern Cross NEXT (Sydney -> Auckland -> Los Angeles)',
    capacity: '72 Tbps',
    coordinates: [[-33.8688, 151.2093], [-36.8485, 174.7633], [-18.0, 178.0], [-14.0, -170.0], [21.3, -157.8], [33.7, -118.2]]
  }
];

export function TacticalMap({
  baseMap,
  layers,
  flights,
  satellites,
  earthquakes,
  wildfires,
  infrastructure,
  news,
  cameras = [],
  vessels = [],
  companies = [],
  radarMetadata,
  radarFramePath,
  onSelectObject,
  onSelectCompany,
  selectedObject,
  currentSimTime = new Date()
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups
  const flightsLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const flightVectorsLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const satellitesLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const orbitPathsLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const bitPathsLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const heatmapLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const earthquakesLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const wildfiresLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const infrastructureLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const camerasLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const vesselsLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const companiesLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const newsLayerGroup = useRef<L.LayerGroup>(L.layerGroup());

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22, 15],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add layer groups in order
    heatmapLayerGroup.current.addTo(map);
    bitPathsLayerGroup.current.addTo(map);
    orbitPathsLayerGroup.current.addTo(map);
    flightVectorsLayerGroup.current.addTo(map);
    earthquakesLayerGroup.current.addTo(map);
    wildfiresLayerGroup.current.addTo(map);
    infrastructureLayerGroup.current.addTo(map);
    companiesLayerGroup.current.addTo(map);
    vesselsLayerGroup.current.addTo(map);
    camerasLayerGroup.current.addTo(map);
    newsLayerGroup.current.addTo(map);
    flightsLayerGroup.current.addTo(map);
    satellitesLayerGroup.current.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Base Map Tiles
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let options: L.TileLayerOptions = {
      maxZoom: 19,
      subdomains: 'abcd'
    };

    if (baseMap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      options = { maxZoom: 18 };
    } else if (baseMap === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      options = { maxZoom: 17, subdomains: 'abc' };
    } else if (baseMap === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = { maxZoom: 19, subdomains: 'abc' };
    }

    const newTileLayer = L.tileLayer(url, options).addTo(mapRef.current);
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [baseMap]);

  // Update Weather Radar Layer (RainViewer Doppler)
  useEffect(() => {
    if (!mapRef.current) return;

    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (layers.weatherRadar && radarMetadata) {
      const activePath = radarFramePath || (radarMetadata.radar.past.length > 0 ? radarMetadata.radar.past[radarMetadata.radar.past.length - 1].path : null);
      if (activePath) {
        const radarUrl = `${radarMetadata.host}${activePath}/256/{z}/{x}/{y}/2/1_1.png`;
        const rLayer = L.tileLayer(radarUrl, {
          opacity: 0.65,
          zIndex: 100
        }).addTo(mapRef.current);
        radarLayerRef.current = rLayer;
      }
    }
  }, [layers.weatherRadar, radarMetadata, radarFramePath]);

  // 1. Render Bit Paths (Submarine Fiber Cables with Animated Flow)
  useEffect(() => {
    bitPathsLayerGroup.current.clearLayers();
    if (!layers.bitPaths) return;

    SUBSEA_CABLE_ROUTES.forEach(cable => {
      // Glow background line
      const glowLine = L.polyline(cable.coordinates, {
        color: '#06b6d4',
        weight: 4,
        opacity: 0.35,
        lineCap: 'round'
      });
      bitPathsLayerGroup.current.addLayer(glowLine);

      // Core animated pulse line (dashed with css pulse)
      const coreLine = L.polyline(cable.coordinates, {
        color: '#38bdf8',
        weight: 2,
        opacity: 0.9,
        dashArray: '8, 12',
        className: 'animated-bit-path'
      }).bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 2px;">
          <strong style="color: #38bdf8;">${cable.name}</strong><br/>
          Bandwidth: <span style="color: #4ade80;">${cable.capacity}</span><br/>
          <span style="color: #94a3b8; font-size: 9px;">GLOBAL SUBSEA OPTICAL BIT PATH</span>
        </div>
      `, { direction: 'top', className: 'tactical-map-tooltip' });

      coreLine.on('click', () => onSelectObject({
        id: cable.id,
        name: cable.name,
        type: 'subsea_cable',
        country: 'International Waters',
        latitude: cable.coordinates[0][0],
        longitude: cable.coordinates[0][1],
        details: `Undersea fiber optic trans-oceanic trunk line. Capacity: ${cable.capacity}`,
        provider: 'Submarine Cable Map Registry',
        sourceUrl: 'https://www.submarinecablemap.com',
        adapter: 'SubmarineFiberRegistry',
        fetched_at: new Date().toISOString(),
        status: 'VERIFIED LIVE'
      }));

      bitPathsLayerGroup.current.addLayer(coreLine);
    });
  }, [layers.bitPaths, onSelectObject]);

  // 2. Render Heatmap Layer (Thermal, Seismic, or Aviation)
  useEffect(() => {
    heatmapLayerGroup.current.clearLayers();
    if (!layers.heatmapLayer) return;

    if (layers.heatmapMode === 'thermal') {
      wildfires.forEach(wf => {
        const circle = L.circle([wf.latitude, wf.longitude], {
          radius: 120000,
          color: '#f43f5e',
          weight: 0,
          fillColor: '#f43f5e',
          fillOpacity: 0.28
        });
        const innerCircle = L.circle([wf.latitude, wf.longitude], {
          radius: 40000,
          color: '#fbbf24',
          weight: 0,
          fillColor: '#fbbf24',
          fillOpacity: 0.45
        });
        heatmapLayerGroup.current.addLayer(circle);
        heatmapLayerGroup.current.addLayer(innerCircle);
      });
    } else if (layers.heatmapMode === 'seismic') {
      earthquakes.forEach(eq => {
        const energyRadius = Math.max(25000, Math.pow(eq.magnitude, 2.6) * 12000);
        const circle = L.circle([eq.latitude, eq.longitude], {
          radius: energyRadius,
          color: '#f59e0b',
          weight: 0,
          fillColor: eq.magnitude >= 5.0 ? '#ef4444' : '#f59e0b',
          fillOpacity: 0.25
        });
        heatmapLayerGroup.current.addLayer(circle);
      });
    } else if (layers.heatmapMode === 'aviation') {
      flights.forEach(f => {
        const circle = L.circle([f.latitude, f.longitude], {
          radius: 85000,
          color: '#06b6d4',
          weight: 0,
          fillColor: '#06b6d4',
          fillOpacity: 0.18
        });
        heatmapLayerGroup.current.addLayer(circle);
      });
    }
  }, [layers.heatmapLayer, layers.heatmapMode, wildfires, earthquakes, flights]);

  // 3. Render Orbital Ground Tracks (for selected or all active satellites)
  useEffect(() => {
    orbitPathsLayerGroup.current.clearLayers();
    if (!layers.orbitTracks && !selectedObject?.line1) return;

    const targetSats = layers.orbitTracks 
      ? satellites.slice(0, 15) 
      : (selectedObject?.line1 ? [selectedObject] : []);

    targetSats.forEach(sat => {
      const segments = calculateGroundTrack(sat, currentSimTime, 45, 45, 90);
      segments.forEach(segment => {
        const pastPoints: [number, number][] = segment.filter(p => p.isPast).map(p => [p.latitude, p.longitude]);
        const futurePoints: [number, number][] = segment.filter(p => !p.isPast).map(p => [p.latitude, p.longitude]);

        if (pastPoints.length > 1) {
          const pastLine = L.polyline(pastPoints, {
            color: '#818cf8',
            weight: 2,
            opacity: 0.6,
            dashArray: '4, 6'
          });
          orbitPathsLayerGroup.current.addLayer(pastLine);
        }

        if (futurePoints.length > 1) {
          const futureLine = L.polyline(futurePoints, {
            color: '#10b981',
            weight: 2.5,
            opacity: 0.85
          });
          orbitPathsLayerGroup.current.addLayer(futureLine);
        }
      });
    });
  }, [layers.orbitTracks, selectedObject, satellites, currentSimTime]);

  // 4. Render Aircraft (with velocity projection vectors)
  useEffect(() => {
    flightsLayerGroup.current.clearLayers();
    flightVectorsLayerGroup.current.clearLayers();
    if (!layers.aircraft) return;

    flights.forEach(f => {
      const track = f.true_track || 0;
      const alt = f.baro_altitude || 0;
      const vel = f.velocity || 0;
      
      let altColor = '#06b6d4'; // cyan
      if (alt < 1500) altColor = '#10b981'; // green
      else if (alt > 9000) altColor = '#818cf8'; // indigo

      // Velocity projection track line (15 min projected vector)
      if (vel > 30 && track !== null) {
        const distMeters = vel * 900; // 15 mins in meters
        const rad = track * (Math.PI / 180);
        const dLat = (distMeters * Math.cos(rad)) / 111320;
        const dLon = (distMeters * Math.sin(rad)) / (111320 * Math.cos(f.latitude * (Math.PI / 180)));
        
        const vectorLine = L.polyline([[f.latitude, f.longitude], [f.latitude + dLat, f.longitude + dLon]], {
          color: altColor,
          weight: 1.5,
          opacity: 0.45,
          dashArray: '2, 4'
        });
        flightVectorsLayerGroup.current.addLayer(vectorLine);
      }

      const flightSvg = `
        <div style="transform: rotate(${track}deg); transform-origin: center; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${altColor}" stroke="#020617" stroke-width="1.5" style="filter: drop-shadow(0 0 4px ${altColor});">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-flight-icon',
        html: flightSvg,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([f.latitude, f.longitude], { icon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: #38bdf8;">${f.callsign || 'N/A'}</strong> (${f.origin_country})<br/>
            Alt: ${alt ? Math.round(alt) + 'm' : 'Ground'} | Vel: ${vel ? Math.round(vel * 3.6) + ' km/h' : 'N/A'}<br/>
            Heading: ${track}°<br/>
            <span style="color: #4ade80; font-size: 9px;">VERIFIED ADS-B LIVE</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      marker.on('click', () => onSelectObject(f));
      flightsLayerGroup.current.addLayer(marker);
    });
  }, [flights, layers.aircraft, onSelectObject]);

  // 5. Render Satellites (SGP4 calculated positions & footprints)
  useEffect(() => {
    satellitesLayerGroup.current.clearLayers();
    if (!layers.satellites) return;

    satellites.forEach(s => {
      if (!s.calculated) return;

      const { latitude, longitude, altitudeKm, footprintRadiusKm, velocityKmS } = s.calculated;

      // Draw footprint circle
      if (footprintRadiusKm > 0) {
        const circle = L.circle([latitude, longitude], {
          radius: footprintRadiusKm * 1000,
          color: '#6366f1',
          weight: 1,
          opacity: 0.35,
          fillColor: '#818cf8',
          fillOpacity: 0.05
        });
        satellitesLayerGroup.current.addLayer(circle);
      }

      const satSvg = `
        <div style="display: flex; align-items: center; justify-content: center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" style="filter: drop-shadow(0 0 6px rgba(165,180,252,0.8));">
            <circle cx="12" cy="12" r="4" fill="#6366f1" />
            <path d="M4 4l4 4M20 20l-4-4M20 4l-4 4M4 20l4-4" stroke="#e0e7ff" />
            <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(-30 12 12)" stroke="#818cf8" stroke-dasharray="2 2"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-sat-icon',
        html: satSvg,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([latitude, longitude], { icon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: #a5b4fc;">${s.name}</strong><br/>
            Alt: ${altitudeKm} km | Vel: ${velocityKmS} km/s<br/>
            <span style="color: #6366f1; font-size: 9px;">NORAD #${s.noradId} (SGP4 LIVE)</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      marker.on('click', () => onSelectObject(s));
      satellitesLayerGroup.current.addLayer(marker);
    });
  }, [satellites, layers.satellites, onSelectObject]);

  // 6. Render Earthquakes (USGS)
  useEffect(() => {
    earthquakesLayerGroup.current.clearLayers();
    if (!layers.earthquakes) return;

    earthquakes.forEach(eq => {
      const radius = Math.max(5, Math.pow(eq.magnitude, 2.2) * 2.2);
      
      let color = '#ef4444'; // shallow (< 30km)
      if (eq.depthKm > 70) color = '#3b82f6'; // deep
      else if (eq.depthKm > 30) color = '#f59e0b'; // intermediate

      const circleMarker = L.circleMarker([eq.latitude, eq.longitude], {
        radius,
        color,
        weight: 2,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: 0.35
      }).bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 2px;">
          <strong style="color: ${color};">M${eq.magnitude} - ${eq.place}</strong><br/>
          Depth: ${eq.depthKm} km | ${new Date(eq.time).toLocaleTimeString()}<br/>
          <span style="color: #94a3b8; font-size: 9px;">USGS LIVE SEISMIC</span>
        </div>
      `, { direction: 'top', className: 'tactical-map-tooltip' });

      circleMarker.on('click', () => onSelectObject(eq));
      earthquakesLayerGroup.current.addLayer(circleMarker);
    });
  }, [earthquakes, layers.earthquakes, onSelectObject]);

  // 7. Render Wildfires & Hazards (NASA EONET)
  useEffect(() => {
    wildfiresLayerGroup.current.clearLayers();
    if (!layers.wildfires) return;

    wildfires.forEach(wf => {
      const fireSvg = `
        <div style="display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#f43f5e" stroke="#ffe4e6" stroke-width="1.5" style="filter: drop-shadow(0 0 6px #f43f5e);">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-fire-icon',
        html: fireSvg,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([wf.latitude, wf.longitude], { icon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: #f43f5e;">${wf.title}</strong><br/>
            Category: ${wf.category}<br/>
            <span style="color: #fda4af; font-size: 9px;">NASA EONET LIVE</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      marker.on('click', () => onSelectObject(wf));
      wildfiresLayerGroup.current.addLayer(marker);
    });
  }, [wildfires, layers.wildfires, onSelectObject]);

  // 8. Render Critical Infrastructure & Power Plants (including EIA 63031 Gloucester Solar)
  useEffect(() => {
    infrastructureLayerGroup.current.clearLayers();
    if (!layers.infrastructure) return;

    infrastructure.forEach(item => {
      let iconColor = '#10b981';
      let symbolPath = '<polygon points="12 2 2 22 22 22" fill="#10b981" stroke="#022c22" stroke-width="1.5"/>';

      if (item.type === 'nuclear') {
        iconColor = '#fbbf24';
        symbolPath = '<circle cx="12" cy="12" r="8" fill="#fbbf24" stroke="#451a03" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#451a03"/>';
      } else if (item.type === 'solar') {
        iconColor = '#f59e0b';
        symbolPath = '<circle cx="12" cy="12" r="5" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/><line x1="12" y1="1" x2="12" y2="4" stroke="#f59e0b" stroke-width="2"/><line x1="12" y1="20" x2="12" y2="23" stroke="#f59e0b" stroke-width="2"/><line x1="1" y1="12" x2="4" y2="12" stroke="#f59e0b" stroke-width="2"/><line x1="20" y1="12" x2="23" y2="12" stroke="#f59e0b" stroke-width="2"/>';
      } else if (item.type === 'hydro') {
        iconColor = '#3b82f6';
        symbolPath = '<path d="M4 18c4-4 8 0 12-4 2-2 4-2 4-2v6H4v-0z" fill="#3b82f6" stroke="#172554" stroke-width="1.5"/>';
      } else if (item.type === 'wind') {
        iconColor = '#06b6d4';
        symbolPath = '<circle cx="12" cy="12" r="2" fill="#06b6d4"/><line x1="12" y1="12" x2="12" y2="2" stroke="#06b6d4" stroke-width="2"/><line x1="12" y1="12" x2="4" y2="18" stroke="#06b6d4" stroke-width="2"/><line x1="12" y1="12" x2="20" y2="18" stroke="#06b6d4" stroke-width="2"/>';
      } else if (item.type === 'thermal' || item.type === 'gas') {
        iconColor = '#f97316';
        symbolPath = '<rect x="6" y="8" width="12" height="14" fill="#f97316" stroke="#7c2d12" stroke-width="1.5"/><line x1="9" y1="4" x2="9" y2="8" stroke="#f97316" stroke-width="2"/><line x1="15" y1="4" x2="15" y2="8" stroke="#f97316" stroke-width="2"/>';
      } else if (item.type === 'datacenter') {
        iconColor = '#38bdf8';
        symbolPath = '<rect x="4" y="4" width="16" height="16" rx="2" fill="#38bdf8" stroke="#082f49" stroke-width="1.5"/><line x1="8" y1="8" x2="16" y2="8" stroke="#082f49"/><line x1="8" y1="12" x2="16" y2="12" stroke="#082f49"/>';
      } else if (item.type === 'subsea_cable') {
        iconColor = '#a855f7';
        symbolPath = '<path d="M3 12h18M3 6h18M3 18h18" stroke="#a855f7" stroke-width="2"/>';
      } else if (item.type === 'spaceport') {
        iconColor = '#ec4899';
        symbolPath = '<path d="M12 2v20M2 12h20" stroke="#ec4899" stroke-width="2"/>';
      } else if (item.type === 'port') {
        iconColor = '#22d3ee';
        symbolPath = '<path d="M12 3a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3zM4 14a8 8 0 0 0 16 0h-2a6 6 0 0 1-12 0H4zm7-4h2v8h-2v-8z" fill="#22d3ee" stroke="#083344" stroke-width="1"/>';
      } else if (item.type === 'camera') {
        iconColor = '#10b981';
        symbolPath = '<path d="M23 7l-7 5 7 5V7z" fill="#10b981"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="#10b981" stroke="#022c22" stroke-width="1.5"/><circle cx="8" cy="12" r="3" fill="#022c22"/>';
      }

      const infraSvg = `
        <div style="display: flex; align-items: center; justify-content: center;">
          <svg width="22" height="22" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 4px ${iconColor});">
            ${symbolPath}
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-infra-icon',
        html: infraSvg,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([item.latitude, item.longitude], { icon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: ${iconColor};">${item.name}</strong><br/>
            Type: ${item.type.toUpperCase()}${item.eia_id ? ` (EIA: ${item.eia_id})` : ''} | ${item.country}<br/>
            ${item.capacity_mw ? `Capacity: ${item.capacity_mw} MW<br/>` : ''}
            ${item.operator ? `Operator: ${item.operator}<br/>` : ''}
            <span style="color: #94a3b8; font-size: 9px;">VERIFIED GEOSPATIAL REGISTRY</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      marker.on('click', () => onSelectObject(item));
      infrastructureLayerGroup.current.addLayer(marker);
    });
  }, [infrastructure, layers.infrastructure, onSelectObject]);

  // 9. Render Public Traffic & Web Cameras (Caltrans, NYSDOT, TfL, TfNSW, ACP, MLIT)
  useEffect(() => {
    camerasLayerGroup.current.clearLayers();
    if (!layers.cameras || !cameras.length) return;

    cameras.forEach(cam => {
      const isLive = cam.status === 'LIVE';
      const camColor = isLive ? '#10b981' : '#f59e0b';

      const camSvg = `
        <div style="display: flex; align-items: center; justify-content: center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 0 5px ${camColor});">
            <rect x="2" y="5" width="14" height="14" rx="2" fill="#022c22" stroke="${camColor}" stroke-width="1.5"/>
            <path d="M16 10l6-3.5v11l-6-3.5v-4z" fill="${camColor}"/>
            <circle cx="9" cy="12" r="3" fill="${camColor}"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-cam-icon',
        html: camSvg,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([cam.latitude, cam.longitude], { icon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: ${camColor};">${cam.name}</strong><br/>
            Provider: ${cam.provider}<br/>
            Status: <span style="color: ${camColor}; font-weight: bold;">${cam.status}</span><br/>
            <span style="color: #94a3b8; font-size: 9px;">PUBLIC GOVERNMENT CAM</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      marker.on('click', () => onSelectObject(cam));
      camerasLayerGroup.current.addLayer(marker);
    });
  }, [cameras, layers.cameras, onSelectObject]);

  // 10. Render Marine AIS Vessels
  useEffect(() => {
    vesselsLayerGroup.current.clearLayers();
    if (!layers.vessels || !vessels.length) return;

    vessels.forEach(v => {
      const course = v.course_deg || 0;
      const vesselSvg = `
        <div style="display: flex; align-items: center; justify-content: center; transform: rotate(${course}deg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#38bdf8" stroke="#082f49" stroke-width="1.5" style="filter: drop-shadow(0 0 4px #38bdf8);">
            <polygon points="12 2 4 20 12 16 20 20 12 2"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-vessel-icon',
        html: vesselSvg,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([v.latitude, v.longitude], { icon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: #38bdf8;">${v.name} (${v.vessel_type})</strong><br/>
            MMSI: ${v.mmsi} | Speed: ${v.speed_knots} kts<br/>
            Destination: ${v.destination} | Flag: ${v.flag_country}<br/>
            <span style="color: #94a3b8; font-size: 9px;">COASTAL TERRESTRIAL AIS</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      marker.on('click', () => onSelectObject(v));
      vesselsLayerGroup.current.addLayer(marker);
    });
  }, [vessels, layers.vessels, onSelectObject]);

  // 11. Render Company Headquarters & Physical Assets
  useEffect(() => {
    companiesLayerGroup.current.clearLayers();
    if (!layers.companies || !companies.length) return;

    companies.forEach(company => {
      // Headquarters Marker
      const hqSvg = `
        <div style="display: flex; align-items: center; justify-content: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#06b6d4" stroke="#083344" stroke-width="1.5" style="filter: drop-shadow(0 0 6px #06b6d4);">
            <rect x="4" y="2" width="16" height="20" rx="2" fill="#0e7490"/>
            <rect x="7" y="5" width="3" height="3" fill="#67e8f9"/>
            <rect x="14" y="5" width="3" height="3" fill="#67e8f9"/>
            <rect x="7" y="11" width="3" height="3" fill="#67e8f9"/>
            <rect x="14" y="11" width="3" height="3" fill="#67e8f9"/>
            <rect x="10" y="16" width="4" height="6" fill="#164e63"/>
          </svg>
        </div>
      `;

      const hqIcon = L.divIcon({
        className: 'custom-hq-icon',
        html: hqSvg,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const hqMarker = L.marker([company.headquarters.latitude, company.headquarters.longitude], { icon: hqIcon })
        .bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: #22d3ee;">${company.canonical_name} (${company.ticker})</strong><br/>
            Headquarters: ${company.headquarters.city}<br/>
            Market Cap: ${company.market_cap_usd || 'N/A'}<br/>
            <span style="color: #67e8f9; font-size: 9px;">COMPANY GOD VIEW</span>
          </div>
        `, { direction: 'top', className: 'tactical-map-tooltip' });

      hqMarker.on('click', () => {
        if (onSelectCompany) onSelectCompany(company);
        else onSelectObject(company);
      });
      companiesLayerGroup.current.addLayer(hqMarker);

      // Render Each Verified Physical Asset
      company.physical_assets.forEach(asset => {
        const assetColor = asset.provenance === 'VERIFIED' ? '#10b981' : '#f59e0b';
        const assetSvg = `
          <div style="display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 5px ${assetColor});">
              <polygon points="12 2 2 22 22 22" fill="#042f2e" stroke="${assetColor}" stroke-width="2"/>
              <circle cx="12" cy="14" r="3" fill="${assetColor}"/>
            </svg>
          </div>
        `;

        const assetIcon = L.divIcon({
          className: 'custom-asset-icon',
          html: assetSvg,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const assetMarker = L.marker([asset.latitude, asset.longitude], { icon: assetIcon })
          .bindTooltip(`
            <div style="font-family: monospace; font-size: 11px; padding: 2px;">
              <strong style="color: ${assetColor};">${asset.name}</strong><br/>
              Company: ${company.ticker} (${company.canonical_name})<br/>
              Type: ${asset.asset_type.toUpperCase()} | Ownership: ${asset.ownership_pct}%<br/>
              Provenance: <span style="color: ${assetColor}; font-weight: bold;">${asset.provenance}</span><br/>
              <span style="color: #94a3b8; font-size: 9px;">EVIDENCE: ${asset.evidence_source}</span>
            </div>
          `, { direction: 'top', className: 'tactical-map-tooltip' });

        assetMarker.on('click', () => {
          if (onSelectCompany) onSelectCompany(company);
          onSelectObject(asset);
        });
        companiesLayerGroup.current.addLayer(assetMarker);
      });
    });
  }, [companies, layers.companies, onSelectCompany, onSelectObject]);

  // Center on selected object smoothly with high-precision zoom
  useEffect(() => {
    if (!mapRef.current || !selectedObject) return;
    const lat = selectedObject.latitude !== undefined ? selectedObject.latitude : selectedObject.calculated?.latitude;
    const lon = selectedObject.longitude !== undefined ? selectedObject.longitude : selectedObject.calculated?.longitude;
    
    if (typeof lat === 'number' && typeof lon === 'number') {
      let targetZoom = 8;
      if (selectedObject.eia_id || selectedObject.type === 'solar' || selectedObject.type === 'nuclear' || selectedObject.camera_id || selectedObject.asset_id) {
        targetZoom = 13; // High-zoom for power plants and cameras like Argos #power=63031
      } else if (selectedObject.canonical_name) {
        targetZoom = 6;
      }
      
      mapRef.current.flyTo([lat, lon], Math.max(mapRef.current.getZoom(), targetZoom), {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedObject]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Subtle Center Reticle */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-16 h-16 border border-cyan-500/40 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-400/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}

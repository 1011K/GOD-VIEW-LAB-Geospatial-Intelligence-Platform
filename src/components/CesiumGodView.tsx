import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { 
  AircraftRecord, 
  SatelliteRecord, 
  EarthquakeRecord, 
  WildfireRecord, 
  InfrastructureRecord, 
  PublicCameraRecord, 
  VesselRecord, 
  LayerToggleState,
  WeatherRadarMetadata
} from '../types';
import { 
  Globe, 
  Layers, 
  RotateCcw, 
  Compass, 
  Maximize2, 
  Crosshair, 
  Info,
  Radio,
  Eye
} from 'lucide-react';

interface CesiumGodViewProps {
  flights: AircraftRecord[];
  satellites: SatelliteRecord[];
  earthquakes: EarthquakeRecord[];
  wildfires: WildfireRecord[];
  infrastructure: InfrastructureRecord[];
  cameras: PublicCameraRecord[];
  vessels: VesselRecord[];
  layerToggles: LayerToggleState;
  selectedObject: any | null;
  onSelectObject: (obj: any) => void;
  radarMetadata?: WeatherRadarMetadata | null;
  simTime: Date;
}

// Ensure Cesium static asset paths are configured keyless
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium/';
  Cesium.Ion.defaultAccessToken = '';
}

export function CesiumGodView({
  flights,
  satellites,
  earthquakes,
  wildfires,
  infrastructure,
  cameras,
  vessels,
  layerToggles,
  selectedObject,
  onSelectObject,
  simTime
}: CesiumGodViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesMapRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const [activeCameraInfo, setActiveCameraInfo] = useState<PublicCameraRecord | null>(null);
  const [hudStats, setHudStats] = useState({
    fps: 60,
    cameraHeightKm: 12000,
    trackedEntities: 0
  });

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Dark Matter Carto tile provider - 100% keyless
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      credit: '© OpenStreetMap, © CARTO'
    });

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: new Cesium.ImageryLayer(imageryProvider),
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      animation: false,
      fullscreenButton: false,
      vrButton: false,
      navigationHelpButton: false,
      skyAtmosphere: new Cesium.SkyAtmosphere(),
      globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84)
    } as any);

    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020617');

    // Initial viewpoint (global overview looking at Europe/Atlantic/Americas)
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(10.0, 30.0, 18000000.0),
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-85.0),
        roll: 0.0
      }
    });

    // Pick handler for interactive entity inspection
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && (picked.id as any)._geointData) {
        const data = (picked.id as any)._geointData;
        onSelectObject(data);
        if (data.camera_id) {
          setActiveCameraInfo(data as PublicCameraRecord);
        }
      } else {
        setActiveCameraInfo(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Track camera altitude changes for HUD
    viewer.camera.moveEnd.addEventListener(() => {
      const height = viewer.camera.positionCartographic.height / 1000;
      setHudStats(prev => ({
        ...prev,
        cameraHeightKm: Math.round(height)
      }));
    });

    viewerRef.current = viewer;

    return () => {
      handler.destroy();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Update Entities in Scene (Parity with 2D Store)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const entities = viewer.entities;
    entities.removeAll();
    entitiesMapRef.current.clear();

    let totalEntities = 0;

    // 1. Aircraft (with 3D altitude extrusion and orientation)
    if (layerToggles.aircraft && flights) {
      for (const flight of flights.slice(0, 1500)) {
        if (!flight.latitude || !flight.longitude) continue;
        const altMeters = flight.baro_altitude || flight.geo_altitude || 9000;
        const pos = Cesium.Cartesian3.fromDegrees(flight.longitude, flight.latitude, altMeters);
        const surfacePos = Cesium.Cartesian3.fromDegrees(flight.longitude, flight.latitude, 0);

        // Aircraft marker
        const ent = entities.add({
          id: `flight-${flight.icao24}`,
          position: pos,
          point: {
            pixelSize: 6,
            color: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000000)
          },
          label: {
            text: flight.callsign || flight.icao24,
            font: '10px monospace',
            fillColor: Cesium.Color.CYAN.withAlpha(0.9),
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -9),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000000)
          },
          // Ground track lead line
          polyline: {
            positions: [surfacePos, pos],
            width: 1,
            material: Cesium.Color.CYAN.withAlpha(0.25)
          }
        });

        (ent as any)._geointData = flight;
        entitiesMapRef.current.set(flight.icao24, ent);
        totalEntities++;
      }
    }

    // 2. Satellites (SGP4 3D coordinates & orbital path)
    if (layerToggles.satellites && satellites) {
      for (const sat of satellites.slice(0, 500)) {
        if (!sat.calculated) continue;
        const altMeters = (sat.calculated.altitudeKm || 500) * 1000;
        const pos = Cesium.Cartesian3.fromDegrees(
          sat.calculated.longitude, 
          sat.calculated.latitude, 
          altMeters
        );

        const ent = entities.add({
          id: `sat-${sat.noradId}`,
          position: pos,
          point: {
            pixelSize: 8,
            color: Cesium.Color.GOLD,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1.5
          },
          label: {
            text: sat.name,
            font: '11px monospace',
            fillColor: Cesium.Color.GOLD,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000000)
          }
        });

        (ent as any)._geointData = sat;
        entitiesMapRef.current.set(sat.noradId, ent);
        totalEntities++;
      }
    }

    // 3. Earthquakes (USGS Seismic events with magnitude scale and depth)
    if (layerToggles.earthquakes && earthquakes) {
      for (const quake of earthquakes) {
        const mag = Math.max(1, quake.magnitude);
        const radiusMeters = Math.max(15000, mag * 35000);
        const pos = Cesium.Cartesian3.fromDegrees(quake.longitude, quake.latitude, 0);

        const ent = entities.add({
          id: `quake-${quake.id}`,
          position: pos,
          ellipse: {
            semiMinorAxis: radiusMeters,
            semiMajorAxis: radiusMeters,
            material: mag >= 6.0 
              ? Cesium.Color.RED.withAlpha(0.65)
              : mag >= 4.5 
              ? Cesium.Color.ORANGE.withAlpha(0.6)
              : Cesium.Color.YELLOW.withAlpha(0.5),
            outline: true,
            outlineColor: Cesium.Color.RED,
            outlineWidth: 1.5
          },
          label: {
            text: `M${mag.toFixed(1)}`,
            font: '10px monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000000)
          }
        });

        (ent as any)._geointData = quake;
        totalEntities++;
      }
    }

    // 4. Wildfires & Thermal Hazards (NASA EONET)
    if (layerToggles.wildfires && wildfires) {
      for (const fire of wildfires) {
        const pos = Cesium.Cartesian3.fromDegrees(fire.longitude, fire.latitude, 0);
        const ent = entities.add({
          id: `wildfire-${fire.id}`,
          position: pos,
          point: {
            pixelSize: 7,
            color: Cesium.Color.fromCssColorString('#f43f5e'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          },
          label: {
            text: fire.title,
            font: '9px monospace',
            fillColor: Cesium.Color.fromCssColorString('#fda4af'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -9),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000000)
          }
        });

        (ent as any)._geointData = fire;
        totalEntities++;
      }
    }

    // 5. Critical Infrastructure
    if (layerToggles.infrastructure && infrastructure) {
      for (const infra of infrastructure) {
        const pos = Cesium.Cartesian3.fromDegrees(infra.longitude, infra.latitude, 0);
        const ent = entities.add({
          id: `infra-${infra.id}`,
          position: pos,
          point: {
            pixelSize: 6,
            color: Cesium.Color.fromCssColorString('#10b981'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          },
          label: {
            text: infra.name,
            font: '10px monospace',
            fillColor: Cesium.Color.fromCssColorString('#a7f3d0'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4000000)
          }
        });

        (ent as any)._geointData = infra;
        totalEntities++;
      }
    }

    // 6. Public Surveillance Cameras
    if (layerToggles.cameras && cameras) {
      for (const cam of cameras) {
        const pos = Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, 0);
        const ent = entities.add({
          id: `cam-${cam.camera_id}`,
          position: pos,
          point: {
            pixelSize: 7,
            color: cam.status === 'LIVE' ? Cesium.Color.LIME : Cesium.Color.DEEPSKYBLUE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          },
          label: {
            text: `[CAM] ${cam.name}`,
            font: '9px monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3000000)
          }
        });

        (ent as any)._geointData = cam;
        totalEntities++;
      }
    }

    // 7. Maritime AIS Vessels
    if (layerToggles.vessels && vessels) {
      for (const v of vessels.slice(0, 300)) {
        const pos = Cesium.Cartesian3.fromDegrees(v.longitude, v.latitude, 0);
        const ent = entities.add({
          id: `vessel-${v.mmsi}`,
          position: pos,
          point: {
            pixelSize: 5,
            color: Cesium.Color.ROYALBLUE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          },
          label: {
            text: v.name || v.mmsi,
            font: '9px monospace',
            fillColor: Cesium.Color.LIGHTSKYBLUE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000)
          }
        });

        (ent as any)._geointData = v;
        totalEntities++;
      }
    }

    setHudStats(prev => ({ ...prev, trackedEntities: totalEntities }));
  }, [
    flights, 
    satellites, 
    earthquakes, 
    wildfires, 
    infrastructure, 
    cameras, 
    vessels, 
    layerToggles, 
    simTime
  ]);

  // Fly to selected object when changed from outside
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedObject) return;

    const lat = selectedObject.latitude;
    const lon = selectedObject.longitude;
    const alt = selectedObject.baro_altitude || (selectedObject.calculated?.altitudeKm ? selectedObject.calculated.altitudeKm * 1000 : 500000);

    if (lat !== undefined && lon !== undefined) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, Math.max(alt * 2.5, 250000)),
        duration: 1.5
      });
      if (selectedObject.camera_id) {
        setActiveCameraInfo(selectedObject as PublicCameraRecord);
      }
    }
  }, [selectedObject]);

  // Reset Camera View to Global
  const handleResetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(10.0, 30.0, 18000000.0),
      duration: 1.2
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-950 select-none overflow-hidden">
      {/* 3D WebGL Globe Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Top 3D Tactical HUD Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-slate-900/90 border border-cyan-500/40 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200">
        <div className="flex items-center space-x-1.5 text-cyan-400">
          <Globe className="w-4 h-4 animate-spin" style={{ animationDuration: '30s' }} />
          <span className="font-bold font-['Chakra_Petch'] tracking-wide">3D GOD VIEW ORBITAL GLOBE</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-cyan-300">
          ALT: {hudStats.cameraHeightKm.toLocaleString()} KM
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-emerald-400 font-bold">
          {hudStats.trackedEntities} TRACKED
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 uppercase">
          KEYLESS WGS84
        </span>
      </div>

      {/* 3D Navigation Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col space-y-1.5 font-mono">
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 shadow-xl transition-colors"
          title="Reset View to Global Overview"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Camera Preview Popover in 3D Mode */}
      {activeCameraInfo && (
        <div className="absolute bottom-6 right-6 z-30 w-80 bg-slate-950/95 border border-cyan-500/60 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col animate-in slide-in-from-bottom-2 duration-200">
          <div className="px-3 py-2 bg-slate-900/90 border-b border-cyan-500/40 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 truncate">
              <span className={`w-2 h-2 rounded-full ${
                activeCameraInfo.status === 'LIVE' ? 'bg-emerald-400 animate-pulse' :
                activeCameraInfo.status === 'REACHABLE' ? 'bg-cyan-400' : 'bg-rose-500'
              }`} />
              <span className="font-bold text-slate-100 truncate">{activeCameraInfo.name}</span>
            </div>
            <button
              onClick={() => setActiveCameraInfo(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
            {activeCameraInfo.stream_type === 'youtube' || activeCameraInfo.media_type === 'video' ? (
              <iframe
                src={activeCameraInfo.embed_url || activeCameraInfo.media_url}
                title={activeCameraInfo.name}
                className="w-full h-full border-0 object-cover"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <img
                src={`${activeCameraInfo.media_url}${activeCameraInfo.media_url.includes('?') ? '&' : '?'}t=${Date.now()}`}
                alt={activeCameraInfo.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-2.5 bg-slate-900/80 border-t border-slate-800 space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{activeCameraInfo.region}, {activeCameraInfo.country}</span>
              <span className="text-cyan-300 font-bold">{activeCameraInfo.status}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-500 font-mono">
                {activeCameraInfo.latitude.toFixed(3)}°, {activeCameraInfo.longitude.toFixed(3)}°
              </span>
              {(activeCameraInfo.source_url || activeCameraInfo.sourceUrl) && (
                <a
                  href={activeCameraInfo.source_url || activeCameraInfo.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Open Stream</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

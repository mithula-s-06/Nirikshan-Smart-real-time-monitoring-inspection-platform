import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Maximize2,
  Minimize2,
  Compass,
  Video,
  ShieldAlert,
  Building,
  Radio,
  MapPin,
  ExternalLink
} from 'lucide-react';

export interface GoogleEarthLeafletMapProps {
  projects: any[];
  cameras: any[];
  inspectors: any[];
  units?: any[];
  selectedEntity: any | null;
  onSelectEntity: (entity: any) => void;
  onOpenStreamModal?: (camera: any) => void;
  filterLayer: 'all' | 'projects' | 'cctv' | 'inspectors' | 'units';
  onChangeFilterLayer: (layer: 'all' | 'projects' | 'cctv' | 'inspectors' | 'units') => void;
}

type BaseMapType = 'google-hybrid' | 'google-satellite' | 'google-terrain' | 'carto-dark' | 'osm';

export const GoogleEarthLeafletMap: React.FC<GoogleEarthLeafletMapProps> = ({
  projects,
  cameras,
  inspectors,
  units = [],
  selectedEntity,
  onSelectEntity,
  onOpenStreamModal,
  filterLayer,
  onChangeFilterLayer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<{ [key in BaseMapType]?: L.TileLayer }>({});
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentBaseMap, setCurrentBaseMap] = useState<BaseMapType>('google-hybrid');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on geographical center of India
    const map = L.map(mapContainerRef.current, {
      center: [21.7679, 78.8718],
      zoom: 5,
      minZoom: 3,
      maxZoom: 20,
      zoomControl: false,
    });

    // Custom Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Tile Layers Definition
    // Google Earth Hybrid (Satellite + Road / Landmark labels)
    const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Earth & Imagery &bull; Nirikshan National GIS',
    });

    // Google Earth Satellite (Clean photo imagery)
    const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Earth Imagery',
    });

    // Google Terrain / Physical with Contours
    const googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps Terrain',
    });

    // CartoDB Dark Matter (Tactical Dark Mode)
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    });

    // OpenStreetMap Standard
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    baseLayersRef.current = {
      'google-hybrid': googleHybrid,
      'google-satellite': googleSatellite,
      'google-terrain': googleTerrain,
      'carto-dark': cartoDark,
      'osm': osm,
    };

    // Add initial base layer
    googleHybrid.addTo(map);

    // Marker Layer Group
    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Invalidate size after layout settles
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    Object.values(baseLayersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add selected layer
    const targetLayer = baseLayersRef.current[currentBaseMap];
    if (targetLayer) {
      targetLayer.addTo(map);
    }
  }, [currentBaseMap]);

  // 3. Render Markers & Geofences
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const bounds = L.latLngBounds([]);
    let markerCount = 0;

    // A. Projects
    if (filterLayer === 'all' || filterLayer === 'projects') {
      projects.forEach((p) => {
        const coords = p.location?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        const lng = coords[0];
        const lat = coords[1];
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const isCritical = p.riskLevel === 'CRITICAL';
        const isHigh = p.riskLevel === 'HIGH';
        const isMedium = p.riskLevel === 'MEDIUM';

        const color = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : isMedium ? '#38bdf8' : '#10b981';
        const isSelected = selectedEntity?.id === p.id || selectedEntity?._id === p.id;

        // Geofence boundary circle (in real ground meters)
        const radiusMeters = p.geofenceRadiusMeters || 300;
        const geofenceCircle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: color,
          weight: isSelected ? 2.5 : 1.2,
          opacity: 0.85,
          fillColor: color,
          fillOpacity: isSelected ? 0.28 : 0.12,
          dashArray: isSelected ? undefined : '5, 4',
        });
        geofenceCircle.addTo(group);

        // Custom High-Tech Pin Icon
        const iconHtml = `
          <div style="
            position: relative;
            width: ${isSelected ? 36 : 28}px;
            height: ${isSelected ? 36 : 28}px;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${color};
              opacity: ${isSelected ? 0.45 : 0.25};
              animation: ${isCritical || isSelected ? 'leafletPulse 1.8s infinite' : 'none'};
            "></div>
            <div style="
              width: ${isSelected ? 20 : 14}px;
              height: ${isSelected ? 20 : 14}px;
              border-radius: 50%;
              background: ${color};
              border: 2px solid #ffffff;
              box-shadow: 0 0 10px ${color}, 0 2px 6px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 8px;
              font-weight: 800;
            ">
              ${isCritical ? '!' : ''}
            </div>
            <div style="
              position: absolute;
              bottom: -16px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(15, 23, 42, 0.92);
              border: 1px solid rgba(148, 163, 184, 0.3);
              color: #f8fafc;
              font-size: 10px;
              font-weight: 700;
              padding: 1px 5px;
              border-radius: 4px;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.6);
              pointer-events: none;
            ">
              ${(p.name || p.code || 'Project').slice(0, 18)}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'leaflet-project-marker',
          html: iconHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Rich Interactive Popup
        const popupContent = `
          <div style="
            font-family: 'Plus Jakarta Sans', sans-serif;
            min-width: 250px;
            padding: 4px;
            color: #0f172a;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 2px 6px;
                border-radius: 4px;
                background: ${isCritical ? '#fee2e2' : '#e0f2fe'};
                color: ${isCritical ? '#b91c1c' : '#0369a1'};
              ">
                ${p.riskLevel || 'NORMAL'} RISK
              </span>
              <span style="font-size: 11px; font-weight: 700; color: #475569; font-family: monospace;">
                ${p.code || ''}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3;">
              ${p.name}
            </h4>
            <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
              <strong>Scheme:</strong> ${p.scheme || 'National Development'}<br/>
              <strong>Location:</strong> ${p.district || ''}, ${p.state || ''}<br/>
              <strong>Coordinates:</strong> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E<br/>
              <strong>Budget:</strong> ₹${(p.sanctionedBudget || 0).toLocaleString()} | <strong>Progress:</strong> ${p.reportedPhysicalProgressPct || 0}%<br/>
              <strong>Geofence:</strong> ${radiusMeters}m radius
            </div>
            <button
              id="btn-inspect-${p.id || p._id}"
              style="
                width: 100%;
                background: #0284c7;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              "
            >
              Inspect Telemetry & Details &rarr;
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });

        marker.on('click', () => {
          onSelectEntity({ ...p, kind: 'PROJECT' });
        });

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`btn-inspect-${p.id || p._id}`);
            if (btn) {
              btn.onclick = () => onSelectEntity({ ...p, kind: 'PROJECT' });
            }
          }, 50);
        });

        marker.addTo(group);
        bounds.extend([lat, lng]);
        markerCount++;
      });
    }

    // B. CCTV Cameras
    if (filterLayer === 'all' || filterLayer === 'cctv') {
      cameras.forEach((c) => {
        const coords = c.location?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        const lng = coords[0];
        const lat = coords[1];
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const isOnline = c.status === 'ONLINE';
        const color = isOnline ? '#10b981' : '#f59e0b';

        const iconHtml = `
          <div style="
            position: relative;
            width: 26px;
            height: 26px;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 6px;
              background: #0f172a;
              border: 2px solid ${color};
              box-shadow: 0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${color};
              font-size: 11px;
            ">
              📹
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'leaflet-cctv-marker',
          html: iconHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 240px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${isOnline ? '#dcfce7' : '#fef3c7'}; color: ${isOnline ? '#15803d' : '#b45309'};">
                ${c.status || 'UNKNOWN'}
              </span>
              <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: #64748b;">
                ${c.code || ''}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a;">
              ${c.name}
            </h4>
            <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
              <strong>Associated Project:</strong> ${c.projectId?.name || 'Site Surveillance'}<br/>
              <strong>Coordinates:</strong> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E<br/>
              <strong>Resolution:</strong> 1080p @ 30fps (H.264 WebRTC / HLS)
            </div>
            <button
              id="btn-stream-${c.id || c._id}"
              style="
                width: 100%;
                background: #f59e0b;
                color: #0f172a;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 800;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              "
            >
              ▶ View Live Stream Feed
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });

        marker.on('click', () => {
          onSelectEntity({ ...c, kind: 'CCTV' });
        });

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`btn-stream-${c.id || c._id}`);
            if (btn && onOpenStreamModal) {
              btn.onclick = () => onOpenStreamModal(c);
            }
          }, 50);
        });

        marker.addTo(group);
        bounds.extend([lat, lng]);
        markerCount++;
      });
    }

    // C. Live Field Inspectors
    if (filterLayer === 'all' || filterLayer === 'inspectors') {
      inspectors.forEach((i) => {
        const coords = i.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        const lng = coords[0];
        const lat = coords[1];
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        // Accuracy Halo
        L.circle([lat, lng], {
          radius: (i.accuracyMeters || 10) * 8,
          color: '#10b981',
          weight: 1,
          opacity: 0.6,
          fillColor: '#10b981',
          fillOpacity: 0.15,
        }).addTo(group);

        const iconHtml = `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: #10b981;
              opacity: 0.4;
              animation: leafletPulse 1.4s infinite;
            "></div>
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid #ffffff;
              box-shadow: 0 0 10px #10b981, 0 2px 6px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 9px;
            ">
              🚶
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'leaflet-inspector-marker',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 230px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #dcfce7; color: #15803d;">
                LIVE TELEMETRY
              </span>
              <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: #64748b;">
                ${i.batteryLevel || 90}% 🔋
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a;">
              ${i.name}
            </h4>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              <strong>Status:</strong> ${i.status || 'ON_MISSION'}<br/>
              <strong>Speed:</strong> ${i.speedKmh || 0} km/h<br/>
              <strong>Active Mission:</strong> ${i.activeInspectionId || 'M-2026-001'}<br/>
              <strong>Coordinates:</strong> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260 });
        marker.on('click', () => onSelectEntity({ ...i, kind: 'INSPECTOR' }));
        marker.addTo(group);
        bounds.extend([lat, lng]);
        markerCount++;
      });
    }

    // D. Beneficiary Institutional Units (from merged VerifAttend)
    if ((filterLayer === 'all' || filterLayer === 'units') && units.length > 0) {
      units.forEach((u) => {
        const lat = u.location?.lat;
        const lng = u.location?.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const radiusMeters = u.geofenceRadiusMeters || 150;
        L.circle([lat, lng], {
          radius: radiusMeters,
          color: '#818cf8',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#818cf8',
          fillOpacity: 0.15,
          dashArray: '4, 4',
        }).addTo(group);

        const iconHtml = `
          <div style="
            position: relative;
            width: 26px;
            height: 26px;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 6px;
              background: #312e81;
              border: 2px solid #a5b4fc;
              box-shadow: 0 0 8px rgba(129, 140, 248, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
            ">
              🏫
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'leaflet-unit-marker',
          html: iconHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 230px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #e0e7ff; color: #4338ca;">
                INSTITUTIONAL UNIT
              </span>
              <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: #64748b;">
                ${u.type || 'Hostel'}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a;">
              ${u.name}
            </h4>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              <strong>Sanctioned Strength:</strong> ${u.sanctionedStrength || 30}<br/>
              <strong>Active Registered:</strong> ${u.activeParticipantsCount || 30} beneficiaries<br/>
              <strong>Risk Score:</strong> ${u.metrics?.riskScore || 0}/100 (${u.metrics?.riskLevel || 'LOW'})<br/>
              <strong>Geofence Radius:</strong> ${radiusMeters}m
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260 });
        marker.on('click', () => onSelectEntity({ ...u, kind: 'BENEFICIARY_UNIT' }));
        marker.addTo(group);
        bounds.extend([lat, lng]);
        markerCount++;
      });
    }

    // Auto fit bounds on initial population if markers exist
    if (markerCount > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [projects, cameras, inspectors, units, filterLayer, selectedEntity]);

  const handleRecenterIndia = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([21.7679, 78.8718], 5, { duration: 1.2 });
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = L.latLngBounds([]);

    projects.forEach((p) => {
      if (p.location?.coordinates?.length >= 2) {
        bounds.extend([p.location.coordinates[1], p.location.coordinates[0]]);
      }
    });

    cameras.forEach((c) => {
      if (c.location?.coordinates?.length >= 2) {
        bounds.extend([c.location.coordinates[1], c.location.coordinates[0]]);
      }
    });

    inspectors.forEach((i) => {
      if (i.coordinates?.length >= 2) {
        bounds.extend([i.coordinates[1], i.coordinates[0]]);
      }
    });

    units.forEach((u) => {
      if (typeof u.location?.lat === 'number' && typeof u.location?.lng === 'number') {
        bounds.extend([u.location.lat, u.location.lng]);
      }
    });

    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 14, duration: 1.2 });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  return (
    <div
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '580px',
        zIndex: isFullscreen ? 9999 : 1,
        borderRadius: isFullscreen ? 0 : '14px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        background: '#070d19',
      }}
    >
      <style>{`
        @keyframes leafletPulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
          background: #ffffff !important;
        }
        .leaflet-popup-tip {
          background: #ffffff !important;
        }
        .leaflet-container {
          background: #0f172a !important;
        }
      `}</style>

      {/* Top Floating Controls Bar */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {/* Entity Layer Filters */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(12px)',
            padding: '0.35rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Layers size={14} /> Layers:
          </span>

          <button
            onClick={() => onChangeFilterLayer('all')}
            style={{
              background: filterLayer === 'all' ? '#0284c7' : 'transparent',
              color: filterLayer === 'all' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '0.25rem 0.55rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All Entities ({projects.length + cameras.length + inspectors.length + units.length})
          </button>

          <button
            onClick={() => onChangeFilterLayer('projects')}
            style={{
              background: filterLayer === 'projects' ? '#0284c7' : 'transparent',
              color: filterLayer === 'projects' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '0.25rem 0.55rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Projects ({projects.length})
          </button>

          <button
            onClick={() => onChangeFilterLayer('cctv')}
            style={{
              background: filterLayer === 'cctv' ? '#0284c7' : 'transparent',
              color: filterLayer === 'cctv' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '0.25rem 0.55rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            CCTV Feeds ({cameras.length})
          </button>

          <button
            onClick={() => onChangeFilterLayer('inspectors')}
            style={{
              background: filterLayer === 'inspectors' ? '#0284c7' : 'transparent',
              color: filterLayer === 'inspectors' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '0.25rem 0.55rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Inspectors ({inspectors.length})
          </button>

          {units.length > 0 && (
            <button
              onClick={() => onChangeFilterLayer('units')}
              style={{
                background: filterLayer === 'units' ? '#6366f1' : 'transparent',
                color: filterLayer === 'units' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '0.25rem 0.55rem',
                borderRadius: '5px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Beneficiary Hostels ({units.length})
            </button>
          )}
        </div>

        {/* Satellite Map Switcher & Utilities */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(12px)',
            padding: '0.35rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {/* Base Map Selector */}
          <select
            value={currentBaseMap}
            onChange={(e) => setCurrentBaseMap(e.target.value as BaseMapType)}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '5px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="google-hybrid">🛰️ Google Earth Hybrid</option>
            <option value="google-satellite">🌍 Google Earth Satellite</option>
            <option value="google-terrain">🏔️ Google Terrain</option>
            <option value="carto-dark">🌑 Carto Dark Matter</option>
            <option value="osm">🗺️ OpenStreetMap</option>
          </select>

          <button
            onClick={handleFitAll}
            title="Fit All Entities"
            style={{
              background: '#334155',
              color: '#f8fafc',
              border: 'none',
              padding: '0.3rem 0.5rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Compass size={13} /> Fit All
          </button>

          <button
            onClick={handleRecenterIndia}
            title="Reset India Center"
            style={{
              background: '#334155',
              color: '#f8fafc',
              border: 'none',
              padding: '0.3rem 0.5rem',
              borderRadius: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🇮🇳 India
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            style={{
              background: '#334155',
              color: '#f8fafc',
              border: 'none',
              padding: '0.3rem 0.5rem',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Live Geospatial Status Watermark (Bottom Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          left: '0.75rem',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '0.3rem 0.6rem',
          borderRadius: '6px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          fontSize: '0.7rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
        <strong style={{ color: '#f8fafc' }}>Google Earth Satellite Active</strong>
        <span>&bull;</span>
        <span>{projects.length} Projects Plotted</span>
        <span>&bull;</span>
        <span>{cameras.length} CCTV Streams</span>
      </div>
    </div>
  );
};

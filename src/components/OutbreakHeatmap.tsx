import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  Radio, 
  Filter, 
  PlusCircle, 
  ShieldAlert, 
  Layers, 
  CheckCircle,
  Activity,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import { OutbreakRecord, OutbreakAlert, SeverityLevel } from '../types';
import { detectOutbreakClusters } from '../data/sampleOutbreaks';

interface OutbreakHeatmapProps {
  outbreaks: OutbreakRecord[];
  onAddOutbreak: (outbreak: Omit<OutbreakRecord, 'id' | 'timestamp'>) => void;
}

export const OutbreakHeatmap: React.FC<OutbreakHeatmapProps> = ({
  outbreaks,
  onAddOutbreak,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterCirclesLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [thresholdRadiusKm, setThresholdRadiusKm] = useState<number>(30);
  const [activeAlerts, setActiveAlerts] = useState<OutbreakAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<OutbreakAlert | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Filtered outbreak records
  const filteredOutbreaks = outbreaks.filter((rec) => {
    if (selectedCrop !== 'All' && !rec.cropName.toLowerCase().includes(selectedCrop.toLowerCase())) {
      return false;
    }
    if (selectedSeverity !== 'All' && rec.severityLevel !== selectedSeverity) {
      return false;
    }
    return true;
  });

  // Calculate cluster alerts based on filtered outbreaks
  useEffect(() => {
    const alerts = detectOutbreakClusters(outbreaks, 3, thresholdRadiusKm);
    setActiveAlerts(alerts);
    if (alerts.length > 0 && !selectedAlert) {
      setSelectedAlert(alerts[0]);
    }
  }, [outbreaks, thresholdRadiusKm]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around East Africa / Global agricultural belt
      const map = L.map(mapContainerRef.current, {
        center: [0.5143, 35.2698],
        zoom: 7,
        zoomControl: true,
      });

      // Clean OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      clusterCirclesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Cluster Circles whenever outbreaks or alerts change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !clusterCirclesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    clusterCirclesLayerRef.current.clearLayers();

    // Render cluster alert heat circles
    activeAlerts.forEach((alert) => {
      const circle = L.circle(alert.centerCoords, {
        color: '#e11d48',
        fillColor: '#f43f5e',
        fillOpacity: 0.18,
        radius: alert.radiusKm * 1000,
        weight: 2,
        dashArray: '6, 6',
      });
      circle.bindTooltip(`⚠️ Outbreak Cluster: ${alert.diseaseName} (${alert.clusterCount} farms)`, {
        permanent: false,
        direction: 'top',
      });
      circle.addTo(clusterCirclesLayerRef.current!);
    });

    // Render individual outbreak point markers
    filteredOutbreaks.forEach((rec) => {
      const isCritical = rec.severityLevel === 'Critical';
      const isSevere = rec.severityLevel === 'Severe';
      const colorClass = isCritical ? '#e11d48' : isSevere ? '#f59e0b' : '#10b981';

      // Custom pulsing HTML marker icon
      const customIcon = L.divIcon({
        className: 'custom-outbreak-marker',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${colorClass};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            position: relative;
          ">
            ${isCritical ? `<div style="
              position: absolute;
              inset: -6px;
              border-radius: 50%;
              background-color: ${colorClass};
              opacity: 0.4;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>` : ''}
            <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([rec.latitude, rec.longitude], { icon: customIcon });

      const timeAgo = Math.round((Date.now() - rec.timestamp) / (1000 * 60));
      const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 180px; padding: 2px;">
          <div style="font-weight: bold; font-size: 13px; color: #1c1917; margin-bottom: 2px;">${rec.diseaseName}</div>
          <div style="color: #047857; font-weight: 600; margin-bottom: 4px;">🌾 ${rec.cropName}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${isCritical ? '#ffe4e6' : '#fef3c7'}; color: ${isCritical ? '#be123c' : '#b45309'}; padding: 1px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
              ${rec.severityLevel}
            </span>
            <span style="color: #78716c; font-size: 11px;">${timeStr}</span>
          </div>
          <div style="color: #57534e; font-size: 11px; margin-top: 4px;">📍 ${rec.regionName}</div>
          <div style="color: #a8a29e; font-size: 10px; margin-top: 2px;">${rec.farmIdAnon} • ${rec.reportedBy}</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(markersLayerRef.current!);
    });
  }, [filteredOutbreaks, activeAlerts]);

  // Center map to selected alert
  const handleFlyToAlert = (alert: OutbreakAlert) => {
    setSelectedAlert(alert);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(alert.centerCoords, 9, { duration: 1.2 });
    }
  };

  // Center map on preset regions
  const handleFlyToRegion = (lat: number, lon: number, zoom = 8) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], zoom, { duration: 1.2 });
    }
  };

  // Simulate an Outbreak report to trigger threshold
  const handleSimulateOutbreak = () => {
    setSimulating(true);
    // Add an outbreak nearby Eldoret, Kenya to trigger or expand the alert
    const randomOffsetLat = (Math.random() - 0.5) * 0.08;
    const randomOffsetLon = (Math.random() - 0.5) * 0.08;

    setTimeout(() => {
      onAddOutbreak({
        cropName: 'Maize / Corn',
        diseaseName: 'Maize Lethal Necrosis',
        severityLevel: 'Critical',
        latitude: Number((0.5143 + randomOffsetLat).toFixed(4)),
        longitude: Number((35.2698 + randomOffsetLon).toFixed(4)),
        regionName: 'Uasin Gishu County, Kenya (Field Zone B)',
        farmIdAnon: `Farm #KE-${Math.floor(500 + Math.random() * 400)}`,
        reportedBy: 'AgriGuard Field Scout Simulated Telemetry',
      });
      setSimulating(false);
      handleFlyToRegion(0.5143, 35.2698, 9);
    }, 400);
  };

  // Stats calculation
  const totalDetections = outbreaks.length;
  const criticalCount = outbreaks.filter(o => o.severityLevel === 'Critical').length;
  const cropBreakdown = outbreaks.reduce((acc, o) => {
    acc[o.cropName] = (acc[o.cropName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostVulnerableCrop = (Object.entries(cropBreakdown) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Maize';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner with Regional Early Warning Status */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                Live Epidemiological Telemetry
              </span>
              <span className="text-xs text-stone-400 font-medium">Anonymized Smallholder Farm Network</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
              Geo-Spatial Crop Outbreak Heatmap & Broadcast Alerts
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Real-time spatial tracking of crop pathology vectors. When multiple farms in a cluster detect identical pathogens, early-warning advisories are automatically dispatched to local farmer cooperatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateOutbreak}
              disabled={simulating}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{simulating ? 'Injecting Outbreak...' : 'Simulate Field Outbreak'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Broadcast Alert Trigger Banner */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => handleFlyToAlert(alert)}
              className="p-5 rounded-3xl bg-rose-950/60 backdrop-blur-2xl border border-rose-500/40 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-rose-950/80 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-lg shadow-rose-600/30">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest">
                      Regional Broadcast Alert
                    </span>
                    <span className="text-xs font-bold text-rose-300">{alert.regionName}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-1">
                    {alert.clusterCount} Cluster Outbreaks: {alert.diseaseName} on {alert.cropName}
                  </h3>
                  <p className="text-xs text-rose-200/90 mt-1 max-w-2xl leading-relaxed">
                    {alert.advisoryText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="px-3.5 py-2 rounded-xl bg-rose-900/90 border border-rose-400 text-xs font-black text-rose-200 uppercase tracking-wider">
                  Focus Zone
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl">
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider">Total Detections</p>
          <p className="text-2xl font-black text-white font-mono mt-1">{totalDetections}</p>
          <span className="text-[10px] text-lime-400 font-bold uppercase tracking-wider">100% Geo-referenced</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl">
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider">Threat Hotspots</p>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">{criticalCount}</p>
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Quarantine Priority</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl">
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider">Most Targeted Crop</p>
          <p className="text-lg font-bold text-lime-300 font-['Outfit'] truncate mt-1">{mostVulnerableCrop}</p>
          <span className="text-[10px] text-stone-400 font-medium">Pathology Density High</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl">
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider">Broadcast Clusters</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{activeAlerts.length}</p>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{thresholdRadiusKm}km Radius</span>
        </div>
      </div>

      {/* Main Map Canvas & Side Filter Panel */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Interactive Leaflet Map Container */}
        <div className="lg:col-span-8 relative min-h-[440px] lg:min-h-[540px] bg-[#070d07]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[440px] lg:min-h-[540px] z-10" />

          {/* Quick Region Navigation Shortcuts */}
          <div className="absolute top-3 right-3 z-20 flex flex-wrap gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/10 text-xs">
            <span className="text-[10px] text-stone-400 font-bold self-center px-1.5 uppercase tracking-wider">Jump:</span>
            <button
              onClick={() => handleFlyToRegion(0.5143, 35.2698, 9)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-[#0a120a] text-stone-200 text-[11px] font-bold transition-all cursor-pointer"
            >
              Kenya
            </button>
            <button
              onClick={() => handleFlyToRegion(30.9010, 75.8573, 9)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-[#0a120a] text-stone-200 text-[11px] font-bold transition-all cursor-pointer"
            >
              India
            </button>
            <button
              onClick={() => handleFlyToRegion(-1.2864, 29.6897, 10)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-[#0a120a] text-stone-200 text-[11px] font-bold transition-all cursor-pointer"
            >
              Uganda
            </button>
            <button
              onClick={() => handleFlyToRegion(20.6767, -101.3563, 10)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-[#0a120a] text-stone-200 text-[11px] font-bold transition-all cursor-pointer"
            >
              Mexico
            </button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-20 bg-black/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
              <span className="text-[11px] text-stone-200 font-semibold">Critical Infection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
              <span className="text-[11px] text-stone-200 font-semibold">Severe / Moderate Infection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lime-400 shadow-sm shadow-lime-400/50"></span>
              <span className="text-[11px] text-stone-200 font-semibold">Low Severity / Monitored</span>
            </div>
          </div>
        </div>

        {/* Side Telemetry Controls & Outbreak List */}
        <div className="lg:col-span-4 p-5 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between space-y-4 bg-black/40">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-widest text-lime-400 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-lime-400" />
                Filter Outbreak Data
              </h3>
              <span className="text-[11px] text-stone-400 font-mono font-bold">{filteredOutbreaks.length} shown</span>
            </div>

            {/* Crop Filter */}
            <div className="space-y-1.5">
              <label htmlFor="crop-filter-select" className="text-[10px] font-black uppercase tracking-wider text-stone-400">Crop Category:</label>
              <select
                id="crop-filter-select"
                aria-label="Filter Outbreaks by Crop"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-lime-400 transition-colors"
              >
                <option value="All" className="bg-stone-900 text-white">All Crops ({outbreaks.length})</option>
                <option value="Maize" className="bg-stone-900 text-white">Maize / Corn</option>
                <option value="Potato" className="bg-stone-900 text-white">Potato</option>
                <option value="Rice" className="bg-stone-900 text-white">Rice / Paddy</option>
                <option value="Tomato" className="bg-stone-900 text-white">Tomato</option>
                <option value="Cassava" className="bg-stone-900 text-white">Cassava</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="space-y-1.5">
              <label htmlFor="severity-filter-select" className="text-[10px] font-black uppercase tracking-wider text-stone-400">Severity Level:</label>
              <select
                id="severity-filter-select"
                aria-label="Filter Outbreaks by Severity"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-lime-400 transition-colors"
              >
                <option value="All" className="bg-stone-900 text-white">All Severity Levels</option>
                <option value="Critical" className="bg-stone-900 text-white">Critical Only</option>
                <option value="Severe" className="bg-stone-900 text-white">Severe</option>
                <option value="Moderate" className="bg-stone-900 text-white">Moderate</option>
              </select>
            </div>

            {/* Threshold Radius Config */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-300 text-[11px] uppercase tracking-wider">Cluster Alert Radius:</span>
                <span className="font-mono font-bold text-lime-400">{thresholdRadiusKm} km</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={thresholdRadiusKm}
                onChange={(e) => setThresholdRadiusKm(Number(e.target.value))}
                className="w-full accent-lime-400 cursor-pointer"
              />
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Trigger broadcast alert if ≥3 cases of same pathology occur within radius.
              </p>
            </div>
          </div>

          {/* Recent Outbreak Feeds */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Live Field Feed
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {filteredOutbreaks.slice(0, 6).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleFlyToRegion(rec.latitude, rec.longitude, 11)}
                  className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-lime-400/50 transition-all cursor-pointer text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-stone-100 line-clamp-1">{rec.diseaseName}</p>
                    <p className="text-[10px] text-stone-400">{rec.cropName} • {rec.regionName.split(',')[0]}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-[#0a120a] ${
                    rec.severityLevel === 'Critical' ? 'bg-rose-500 text-white' :
                    rec.severityLevel === 'Severe' ? 'bg-amber-400' : 'bg-lime-400'
                  }`}>
                    {rec.severityLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

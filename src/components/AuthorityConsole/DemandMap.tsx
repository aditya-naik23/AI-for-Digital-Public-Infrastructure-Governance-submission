import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Filter, MapPin, CheckCircle2 } from 'lucide-react';
import { CitizenRequest, ExistingFacility, InfrastructureGap, DevelopmentProject } from '../../types';

interface DemandMapProps {
  requests: CitizenRequest[];
  gaps: InfrastructureGap[];
  existingFacilities: ExistingFacility[];
  projects: DevelopmentProject[];
  onSelectRequest: (request: CitizenRequest) => void;
  selectedRequestId?: string;
  heightClassName?: string;
  showFiltersHeader?: boolean;
}

export const DemandMap: React.FC<DemandMapProps> = ({
  requests,
  gaps,
  existingFacilities,
  projects,
  onSelectRequest,
  selectedRequestId,
  heightClassName = 'h-[460px]',
  showFiltersHeader = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<{
    demand: L.LayerGroup;
    gaps: L.LayerGroup;
    facilities: L.LayerGroup;
  } | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('Rayagada');
  const [showHotspotsLayer, setShowHotspotsLayer] = useState(true);
  const [showGapsLayer, setShowGapsLayer] = useState(true);
  const [showFacilitiesLayer, setShowFacilitiesLayer] = useState(true);

  // Initialize Map with clean light tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.22, 83.35],
      zoom: 9,
      zoomControl: true,
    });

    // Clean light OpenStreetMap Positron style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const demandGroup = L.layerGroup().addTo(map);
    const gapsGroup = L.layerGroup().addTo(map);
    const facilitiesGroup = L.layerGroup().addTo(map);

    layersGroupRef.current = {
      demand: demandGroup,
      gaps: gapsGroup,
      facilities: facilitiesGroup,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle region filter pan
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (regionFilter === 'Rayagada') {
      mapInstanceRef.current.flyTo([19.25, 83.25], 9);
    } else if (regionFilter === 'Brazil') {
      mapInstanceRef.current.flyTo([-19.8, -44.0], 10);
    } else if (regionFilter === 'Russia') {
      mapInstanceRef.current.flyTo([56.84, 60.64], 10);
    } else if (regionFilter === 'China') {
      mapInstanceRef.current.flyTo([31.23, 121.47], 11);
    }
  }, [regionFilter]);

  // Render restrained markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const { demand, gaps: gapsGroup, facilities: facGroup } = layersGroupRef.current;

    demand.clearLayers();
    gapsGroup.clearLayers();
    facGroup.clearLayers();

    // 1. Demand Hotspots: Red (High/Urgent), Amber (Moderate)
    if (showHotspotsLayer) {
      const filtered = requests.filter((r) => {
        if (categoryFilter !== 'All' && r.reportedCategory !== categoryFilter) return false;
        if (priorityFilter !== 'All' && r.priorityScore.indicatorLevel !== priorityFilter) return false;
        return true;
      });

      filtered.forEach((req) => {
        const coords = req.structuredExtraction?.coordinates || req.reportedLocation;
        const isUrgent = req.priorityScore.indicatorLevel === 'Urgent';
        const color = isUrgent ? '#dc2626' : '#d97706';
        const isSelected = selectedRequestId === req.id;

        const circle = L.circleMarker([coords.lat, coords.lng], {
          radius: isSelected ? 18 : isUrgent ? 13 : 9,
          fillColor: color,
          color: isSelected ? '#0f172a' : '#ffffff',
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        // Status determination
        const isVerified = req.isVerifiedByHuman;
        const statusLabel = isVerified ? 'Verified' : 'Pending Review';
        const statusBg = isVerified ? '#ecfdf5' : '#fffbeb';
        const statusColor = isVerified ? '#047857' : '#b45309';
        const statusBorder = isVerified ? '#a7f3d0' : '#fde68a';
        const statusDot = isVerified ? '#10b981' : '#f59e0b';

        const tooltipContent = `
          <div style="padding: 10px 12px; min-width: 230px; font-family: Inter, system-ui, sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #0f172a;">${req.id}</span>
              <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: ${statusDot};"></span>
                ${statusLabel}
              </span>
            </div>

            <div style="margin-bottom: 6px;">
              <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 2px;">
                ${req.reportedCategory}
              </div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.3;">
                ${req.reportedLocation.name || req.reportedLocation.district}
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #64748b; padding-top: 6px; border-top: 1px solid #f1f5f9; margin-top: 6px;">
              <span>Cluster: <strong style="color: #0f172a; font-family: 'JetBrains Mono', monospace;">${req.clusterCount} citizen reports</strong></span>
              <span>Priority: <strong style="color: ${isUrgent ? '#dc2626' : '#d97706'}; font-weight: 700;">${req.priorityScore.overallScore}/100</strong></span>
            </div>

            <div style="margin-top: 6px; font-size: 10px; color: #2563eb; text-align: right; font-weight: 500;">
              Click marker to inspect dossier →
            </div>
          </div>
        `;

        circle.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10],
          opacity: 1,
          className: 'dpi-map-tooltip',
          sticky: false,
        });

        circle.on('mouseover', function (this: L.CircleMarker) {
          this.setRadius(isUrgent ? 16 : 12);
          this.setStyle({ weight: 2.5, fillOpacity: 0.95 });
        });

        circle.on('mouseout', function (this: L.CircleMarker) {
          this.setRadius(isSelected ? 18 : isUrgent ? 13 : 9);
          this.setStyle({ weight: isSelected ? 3 : 1.5, fillOpacity: 0.85 });
        });

        circle.on('click', () => {
          onSelectRequest(req);
        });

        circle.addTo(demand);
      });
    }

    // 2. Documented Infrastructure Gaps (Census deficit indicators)
    if (showGapsLayer) {
      gaps.forEach((gap) => {
        const gapIcon = L.divIcon({
          className: 'gap-marker-clean',
          html: `<div style="background-color: #991b1b; color: white; border-radius: 3px; padding: 2px 5px; font-size: 9px; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.25); white-space: nowrap; border: 1px solid #7f1d1d;">GAP: ${gap.category}</div>`,
          iconSize: [100, 18],
          iconAnchor: [50, 9],
        });

        const marker = L.marker([gap.centerCoordinates.lat, gap.centerCoordinates.lng], { icon: gapIcon });
        marker.bindTooltip(
          `<div style="padding: 8px 10px; min-width: 200px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Census Deficit Gap</span>
              <span style="font-size: 9px; font-weight: 700; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 3px; padding: 1px 4px;">${gap.gapSeverity} (${gap.gapIndex.toFixed(0)}/100)</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${gap.category}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${gap.district} (${gap.region})</div>
            <div style="font-size: 10px; color: #334155; margin-top: 4px; padding-top: 4px; border-top: 1px solid #f1f5f9; line-height: 1.3;">${gap.currentDeficit}</div>
          </div>`,
          {
            direction: 'top',
            offset: [0, -10],
            opacity: 1,
            className: 'dpi-map-tooltip',
          }
        );
        marker.addTo(gapsGroup);
      });
    }

    // 3. Existing Facilities (Blue points)
    if (showFacilitiesLayer) {
      existingFacilities.forEach((fac) => {
        const circle = L.circleMarker([fac.coordinates.lat, fac.coordinates.lng], {
          radius: 5,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.8,
        });

        circle.bindTooltip(
          `<div style="padding: 8px 10px; min-width: 180px; font-family: Inter, sans-serif;">
            <div style="font-size: 10px; color: #2563eb; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Existing Facility</div>
            <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${fac.name}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${fac.category} • <span style="color: #059669; font-weight: 600;">${fac.status}</span></div>
          </div>`,
          {
            direction: 'top',
            offset: [0, -6],
            opacity: 1,
            className: 'dpi-map-tooltip',
          }
        );
        circle.addTo(facGroup);
      });
    }
  }, [
    requests,
    gaps,
    existingFacilities,
    categoryFilter,
    priorityFilter,
    onSelectRequest,
    selectedRequestId,
    showHotspotsLayer,
    showGapsLayer,
    showFacilitiesLayer,
  ]);

  return (
    <div className="w-full flex flex-col bg-white overflow-hidden">
      {/* Top Filter and Layer Strip */}
      {showFiltersHeader && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>GIS Node:</span>
            </span>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="Rayagada">Rayagada (India Node)</option>
              <option value="Brazil">Minas Gerais (Brazil Node)</option>
              <option value="Russia">Ural District (Russia Node)</option>
              <option value="China">Shanghai (China Node)</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Categories</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Roads & Bridges">Roads & Bridges</option>
              <option value="Clean Water & Sanitation">Clean Water</option>
              <option value="Flood & Storm Drainage">Flood & Drainage</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Priority Levels</option>
              <option value="Urgent">Urgent Only (≥85)</option>
              <option value="High">High (70-84)</option>
              <option value="Medium">Medium (50-69)</option>
            </select>
          </div>

          {/* Layer toggles & Legend */}
          <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showHotspotsLayer}
                onChange={(e) => setShowHotspotsLayer(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-0 cursor-pointer"
              />
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
              <span>Demand Hotspots</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGapsLayer}
                onChange={(e) => setShowGapsLayer(e.target.checked)}
                className="rounded border-slate-300 text-red-900 focus:ring-0 cursor-pointer"
              />
              <span className="w-2 h-2 rounded-sm bg-red-900 inline-block" />
              <span>Census Gaps</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showFacilitiesLayer}
                onChange={(e) => setShowFacilitiesLayer(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span>Existing Facilities</span>
            </label>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className={`w-full z-10 ${heightClassName}`} />
    </div>
  );
};

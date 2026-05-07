"use client";
import { useEffect, useState } from "react";
import type { Recommendation } from "@/lib/mockData";

interface BengaluruMapProps {
  recommendations: Recommendation[];
  onZoneSelect?: (rec: Recommendation) => void;
  selectedZoneId?: string;
}

// Simplified Bengaluru zone polygons (approximate bounding polygons)
const ZONE_POLYGONS: Record<string, [number, number][]> = {
  "WF-01": [
    [12.955, 77.730], [12.955, 77.770], [12.985, 77.770], [12.985, 77.730]
  ],
  "EC-01": [
    [12.825, 77.665], [12.825, 77.700], [12.855, 77.700], [12.855, 77.665]
  ],
  "KOR-02": [
    [12.925, 77.610], [12.925, 77.645], [12.950, 77.645], [12.950, 77.610]
  ],
  "HEB-01": [
    [13.025, 77.580], [13.025, 77.620], [13.050, 77.620], [13.050, 77.580]
  ],
  "MAR-01": [
    [12.945, 77.685], [12.945, 77.715], [12.970, 77.715], [12.970, 77.685]
  ],
  "IND-01": [
    [12.968, 77.630], [12.968, 77.660], [12.992, 77.660], [12.992, 77.630]
  ],
  "YES-01": [
    [13.010, 77.540], [13.010, 77.575], [13.035, 77.575], [13.035, 77.540]
  ],
  "BTM-01": [
    [12.905, 77.595], [12.905, 77.625], [12.930, 77.625], [12.930, 77.595]
  ],
};

function getSynergyColor(score: number) {
  if (score >= 88) return "#22C55E";
  if (score >= 75) return "#F59E0B";
  return "#EF4444";
}

export default function BengaluruMap({
  recommendations,
  onZoneSelect,
  selectedZoneId,
}: BengaluruMapProps) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet")["MapContainer"];
    TileLayer: typeof import("react-leaflet")["TileLayer"];
    Polygon: typeof import("react-leaflet")["Polygon"];
    Popup: typeof import("react-leaflet")["Popup"];
    CircleMarker: typeof import("react-leaflet")["CircleMarker"];
    Tooltip: typeof import("react-leaflet")["Tooltip"];
  } | null>(null);

  useEffect(() => {
    // Dynamically import to avoid SSR issues
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([rl, L]) => {
      // Fix leaflet default icon
      delete (L.default.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMapComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Polygon: rl.Polygon,
        Popup: rl.Popup,
        CircleMarker: rl.CircleMarker,
        Tooltip: rl.Tooltip,
      });
    });

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  if (!MapComponents) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading Bengaluru map...</p>
        </div>
      </div>
    );
  }

  const {
    MapContainer,
    TileLayer,
    Polygon,
    Popup,
    CircleMarker,
    Tooltip,
  } = MapComponents;

  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={11}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {recommendations.map((rec) => {
        const polygon = ZONE_POLYGONS[rec.zone_id];
        const color = getSynergyColor(rec.synergy_score);
        const isSelected = rec.zone_id === selectedZoneId;

        return (
          <Polygon
            key={rec.zone_id}
            positions={polygon || []}
            pathOptions={{
              fillColor: color,
              fillOpacity: isSelected ? 0.55 : 0.32,
              color: isSelected ? color : color,
              weight: isSelected ? 3 : 1.5,
              dashArray: isSelected ? undefined : "4 2",
            }}
            eventHandlers={{
              click: () => onZoneSelect?.(rec),
            }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                <strong>{rec.zone_name}</strong>
                <br />
                Synergy Score:{" "}
                <strong style={{ color }}>{rec.synergy_score}/100</strong>
              </div>
            </Tooltip>
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", minWidth: 200 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  {rec.zone_name}
                </p>
                <p style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>
                  Zone ID: {rec.zone_id}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
                  <span style={{ color: "#64748B" }}>Synergy Score</span>
                  <strong style={{ color }}>{rec.synergy_score}/100</strong>
                  <span style={{ color: "#64748B" }}>EV Density</span>
                  <strong>{rec.ev_density}/km²</strong>
                  <span style={{ color: "#64748B" }}>Grid Headroom</span>
                  <strong>{rec.grid_headroom} MW</strong>
                  <span style={{ color: "#64748B" }}>Solar Ready</span>
                  <strong style={{ color: rec.solar_ready ? "#22C55E" : "#EF4444" }}>
                    {rec.solar_ready ? "Yes" : "No"}
                  </strong>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {/* Dot markers at zone centroids */}
      {recommendations.map((rec) => {
        const color = getSynergyColor(rec.synergy_score);
        const isSelected = rec.zone_id === selectedZoneId;
        return (
          <CircleMarker
            key={`dot-${rec.zone_id}`}
            center={rec.coordinates as [number, number]}
            radius={isSelected ? 10 : 6}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.9,
              color: "white",
              weight: 2,
            }}
            eventHandlers={{ click: () => onZoneSelect?.(rec) }}
          />
        );
      })}
    </MapContainer>
  );
}

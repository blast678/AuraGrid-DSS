"use client";
import { useEffect, useState } from "react";

interface BengaluruMapProps {
  recommendations: any[]; // Accept any data for now
  onZoneSelect?: (rec: any) => void;
  selectedZoneId?: string;
}

const ZONE_POLYGONS: Record<string, [number, number][]> = {
  "WF-01": [[12.955, 77.730], [12.955, 77.770], [12.985, 77.770], [12.985, 77.730]],
  "EC-01": [[12.825, 77.665], [12.825, 77.700], [12.855, 77.700], [12.855, 77.665]],
  "KOR-02": [[12.925, 77.610], [12.925, 77.645], [12.950, 77.645], [12.950, 77.610]],
  "IND-01": [[12.968, 77.630], [12.968, 77.660], [12.992, 77.660], [12.992, 77.630]],
  "BTM-01": [[12.905, 77.595], [12.905, 77.625], [12.930, 77.625], [12.930, 77.595]],
};

function getSynergyColor(score: number) {
  if (score >= 88) return "#10B981";
  if (score >= 75) return "#F59E0B";
  return "#EF4444";
}

export default function BengaluruMap({ recommendations, onZoneSelect, selectedZoneId }: BengaluruMapProps) {
  const [MapComponents, setMapComponents] = useState<any>(null);

  // 1. THE TRUTH LOG: Check if the data actually arrived here!
  console.log("🗺️ MAP RECEIVED DATA:", recommendations);

  useEffect(() => {
    // 2. THE CSS SHIELD: Guarantee the map styles are loaded
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMapComponents({ MapContainer: rl.MapContainer, TileLayer: rl.TileLayer, Polygon: rl.Polygon, CircleMarker: rl.CircleMarker, Tooltip: rl.Tooltip });
    });
  }, []);

  if (!MapComponents) return <div className="w-full h-full bg-slate-100 animate-pulse" />;
  const { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip } = MapComponents;

  const safeRecommendations = (recommendations || []).filter(rec => rec.zone_id && ZONE_POLYGONS[rec.zone_id]);

  return (
    <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: "400px", width: "100%", borderRadius: "0.75rem" }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      
      {safeRecommendations.map((rec) => (
        <Polygon 
          key={`poly-${rec.zone_id}`} 
          positions={ZONE_POLYGONS[rec.zone_id]} 
          pathOptions={{ fillColor: getSynergyColor(rec.synergy_score), fillOpacity: 0.7, color: getSynergyColor(rec.synergy_score) }} 
          eventHandlers={{ click: () => onZoneSelect?.(rec) }} 
        />
      ))}
      
      {safeRecommendations.map((rec) => (
        <CircleMarker 
          key={`dot-${rec.zone_id}`} 
          center={rec.coordinates as [number, number]} 
          radius={6} 
          pathOptions={{ fillColor: "#fff", color: "#000", weight: 2 }} 
        />
      ))}
    </MapContainer>
  );
}
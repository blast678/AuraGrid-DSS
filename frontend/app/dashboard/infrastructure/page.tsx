"use client";
import { useState, Fragment } from "react";
import dynamic from "next/dynamic";
import {
  Map,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { Recommendation } from "@/lib/mockData";

// Dynamic import to prevent SSR issues with Leaflet
const BengaluruMap = dynamic(
  () => import("@/components/map/BengaluruMap"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  )}
);

function ScoreBar({ score }: { score: number }) {
  const color = score >= 88 ? "#22C55E" : score >= 75 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-8" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function exportBBMP(recs: Recommendation[]) {
  const headers = [
    "Zone ID", "Zone Name", "Synergy Score", "EV Density (vehicles/km²)",
    "Grid Headroom (MW)", "Solar Hosting (MW)", "Land Type", "Solar Ready", "Reasoning"
  ];
  const rows = recs.map((r) => [
    r.zone_id, r.zone_name, r.synergy_score, Number(r.ev_density).toFixed(0),
    Number(r.grid_headroom).toFixed(1), Number(r.solar_hosting).toFixed(1), r.land_type, r.solar_ready ? "Yes" : "No",
    `"${r.reasoning.replace(/"/g, '""')}"`
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AuraGrid-DSS_BBMP_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateROI(recs: Recommendation[]) {
  const top = recs[0];
  const report = `
AURAGRID-DSS INFRASTRUCTURE ROI REPORT
Generated: ${new Date().toLocaleString()}
BESCOM Decision-Support Layer — Confidential

TOP RECOMMENDED SITE: ${top.zone_name} (${top.zone_id})
─────────────────────────────────────────────────

SYNERGY SCORE: ${top.synergy_score}/100

METRICS:
  EV Density:         ${Number(top.ev_density).toFixed(0)} vehicles/km²
  Grid Headroom:      ${Number(top.grid_headroom).toFixed(1)} MW available
  Solar Hosting Cap:  ${Number(top.solar_hosting).toFixed(1)} MW potential
  Land Type:          ${top.land_type}
  Solar Ready:        ${top.solar_ready ? "YES — BBMP net-metering eligible" : "NO — Grid reinforcement required"}

FINANCIAL PROJECTIONS (10-Year NPV):
  CapEx Estimate:     ₹ ${(top.grid_headroom * 2.8).toFixed(1)} Cr
  Revenue (charging): ₹ ${(top.ev_density * top.grid_headroom * 0.42).toFixed(1)} Cr/year
  Grid Savings:       ₹ ${(top.synergy_score * 0.85).toFixed(1)} Lakh/year
  NPV (10yr, 8):      ₹ ${(top.ev_density * 0.31 + top.synergy_score * 1.2).toFixed(1)} Cr
  IRR Estimate:       ${(top.synergy_score * 0.18).toFixed(1)}%

STRATEGIC REASONING:
${top.reasoning}

ALL RANKED SITES:
${recs.map((r, i) => `  ${i + 1}. ${r.zone_name}: Score ${r.synergy_score}/100`).join("\n")}

─────────────────────────────────────────────────
AuraGrid-DSS v2.4 · BESCOM Smart Grid Division
Generated for BBMP Infrastructure Planning Cell
  `.trim();
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AuraGrid-DSS_ROI_Report_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InfrastructurePage() {
  const { data: recommendations, isLoading } = useRecommendations();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const top5 = (recommendations ?? []).slice(0, 5);
  const selectedRec = recommendations?.find((r) => r.zone_id === selectedZoneId);

  return (
    <div className="px-6 py-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map className="w-4 h-4" style={{ color: "#16A34A" }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Infrastructure Planner · Spatial Optimizer
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bengaluru EV Hub Site Selection
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-ranked charging hub candidates · Synergy scoring across EV density, grid headroom & solar capacity
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-slate-600"
            onClick={() => recommendations && generateROI(recommendations)}
          >
            <FileText className="w-3.5 h-3.5" />
            Generate ROI Report
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-2 text-white"
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2D5AA0)" }}
            onClick={() => recommendations && exportBBMP(recommendations)}
          >
            <Download className="w-3.5 h-3.5" />
            Export for BBMP
          </Button>
        </div>
      </div>

      {/* ── Map + Selected Zone ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <Card className="card-enterprise xl:col-span-2">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Bengaluru Synergy Heatmap
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                  <span className="text-[10px] text-slate-500">High (≥88)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-400" />
                  <span className="text-[10px] text-slate-500">Medium (75-87)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-[10px] text-slate-500">Low (&lt;75)</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-[400px] rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <BengaluruMap
                  recommendations={recommendations ?? []}
                  onZoneSelect={(rec) => setSelectedZoneId(rec.zone_id)}
                  selectedZoneId={selectedZoneId ?? undefined}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zone Detail Panel */}
        <Card className="card-enterprise">
          <CardHeader className="pb-3 pt-5 px-6">
            <CardTitle className="text-sm font-semibold text-slate-700">
              {selectedRec ? selectedRec.zone_name : "Zone Inspector"}
            </CardTitle>
            {!selectedRec && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Click a zone on the map to inspect
              </p>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-5">
            {!selectedRec ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Map className="w-10 h-10 mb-3" />
                <p className="text-sm text-slate-400 text-center">
                  Select a zone on the map to view detailed metrics
                </p>
              </div>
            ) : (
              <div className="space-y-4 slide-in-up">
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-xs font-bold"
                    style={{
                      background:
                        selectedRec.synergy_score >= 88
                          ? "#F0FDF4"
                          : "#FFFBEB",
                      color:
                        selectedRec.synergy_score >= 88
                          ? "#16A34A"
                          : "#D97706",
                      border: "none",
                    }}
                  >
                    Score: {selectedRec.synergy_score}/100
                  </Badge>
                  {selectedRec.solar_ready ? (
                    <Badge className="text-xs bg-blue-50 text-blue-700 border-none">
                      Solar Ready
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-slate-100 text-slate-500 border-none">
                      Solar: Needs Review
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "EV Density", value: `${Number(selectedRec.ev_density).toFixed(0)} vehicles/km²`, color: "#1A3A6B" },
                    { label: "Grid Headroom", value: `${Number(selectedRec.grid_headroom).toFixed(1)} MW`, color: "#22C55E" },
                    { label: "Solar Hosting", value: `${Number(selectedRec.solar_hosting).toFixed(1)} MW`, color: "#F59E0B" },
                    { label: "Land Type", value: selectedRec.land_type, color: "#64748B" },
                  ].map((m) => (
                    <div key={m.label} className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{m.label}</span>
                      <span className="text-xs font-bold" style={{ color: m.color }}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    AI Reasoning
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedRec.reasoning}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    variant="outline"
                    onClick={() => recommendations && generateROI(recommendations)}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    ROI Report
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs text-white"
                    style={{ background: "#1A3A6B" }}
                    onClick={() => recommendations && exportBBMP(recommendations)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    BBMP Export
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top 5 Table ─────────────────────────────────────────── */}
      <Card className="card-enterprise">
        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Top 5 Recommended Sites
            </CardTitle>
            <div className="flex gap-2 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => recommendations && generateROI(recommendations)}
              >
                <FileText className="w-3 h-3 mr-1" />
                ROI
              </Button>
              <Button
                size="sm"
                className="text-xs text-white"
                style={{ background: "#1A3A6B" }}
                onClick={() => recommendations && exportBBMP(recommendations)}
              >
                <Download className="w-3 h-3 mr-1" />
                BBMP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100">
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-6">
                      #
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Zone
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      EV Density
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Grid Headroom
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Solar Hosting
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Land Type
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Solar
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Score
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top5.map((rec, idx) => (
                    <Fragment key={rec.zone_id}>
                      <TableRow
                        className="border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setSelectedZoneId(
                            selectedZoneId === rec.zone_id ? null : rec.zone_id
                          );
                          setExpandedRow(
                            expandedRow === rec.zone_id ? null : rec.zone_id
                          );
                        }}
                      >
                        <TableCell className="text-xs font-bold text-slate-400">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-semibold text-slate-800">
                            {rec.zone_name}
                          </p>
                          <p className="text-[10px] text-slate-400">{rec.zone_id}</p>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 tabular-nums">
                          {Number(rec.ev_density).toFixed(0)}/km²
                        </TableCell>
                        <TableCell className="text-xs font-semibold tabular-nums" style={{ color: "#22C55E" }}>
                          {Number(rec.grid_headroom).toFixed(1)} MW
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-slate-700">
                          {Number(rec.solar_hosting).toFixed(1)} MW
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {rec.land_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rec.solar_ready ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300" />
                          )}
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <ScoreBar score={rec.synergy_score} />
                        </TableCell>
                        <TableCell>
                          {expandedRow === rec.zone_id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRow === rec.zone_id && (
                        <TableRow className="bg-slate-50">
                          <TableCell colSpan={9} className="px-6 py-3">
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mt-0.5">
                                AI Reasoning:
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {rec.reasoning}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
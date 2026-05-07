"use client";
import {
  Shield,
  TrendingDown,
  Sun,
  AlertTriangle,
  Activity,
  Map,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCard from "@/components/kpi/KpiCard";
import { MOCK_KPIS, MOCK_FORECASTS } from "@/lib/mockData";
import Link from "next/link";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const SUBSTATIONS = ["Koramangala", "Whitefield", "Electronic City", "Indiranagar", "Hebbal", "Marathahalli"];

function MiniSparkline({ data }: { data: { v: number }[] }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke="#22C55E" dot={false} strokeWidth={1.5} />
          <Tooltip
            content={() => null}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const kpis = MOCK_KPIS;
  const solarSparkData = MOCK_FORECASTS["Whitefield"].slice(0, 24).map((d) => ({
    v: d.optimized_load,
  }));

  return (
    <div className="px-6 py-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot-green" />
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
              Live — All Systems Operational
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AuraGrid Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bengaluru Smart Grid · BESCOM Decision-Support Layer ·{" "}
            {format(new Date(), "EEEE, MMMM d yyyy, HH:mm")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-slate-600"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Grid Stability Index"
          value={kpis.gridStabilityIndex}
          unit="%"
          delta={kpis.gridStabilityTrend}
          icon={Shield}
          iconColor="#1A3A6B"
          iconBg="#EEF2FF"
          accentColor="#1A3A6B"
          subtitle="N-1 contingency: SAFE"
          pulse
        />
        <KpiCard
          title="Peak Reduction (24h)"
          value={kpis.peakReductionPct}
          unit="%"
          delta={kpis.peakReductionTrend}
          icon={TrendingDown}
          iconColor="#16A34A"
          iconBg="#F0FDF4"
          accentColor="#22C55E"
          subtitle="Water-filling algorithm active"
        />
        <KpiCard
          title="Solar Utilization"
          value={kpis.solarUtilizationPct}
          unit="%"
          delta={kpis.solarUtilizationTrend}
          deltaLabel="cloud cover impact"
          icon={Sun}
          iconColor="#D97706"
          iconBg="#FFFBEB"
          accentColor="#F59E0B"
          subtitle="Whitefield array: 94% forecast"
        />
        <KpiCard
          title="Critical Zones"
          value={kpis.criticalZones}
          icon={AlertTriangle}
          iconColor="#DC2626"
          iconBg="#FEF2F2"
          accentColor="#EF4444"
          subtitle={kpis.criticalZonesList.join(", ")}
          badge={
            kpis.criticalZones > 0 ? (
              <Badge
                variant="destructive"
                className="text-[10px] h-5 animate-pulse"
              >
                ALERT
              </Badge>
            ) : undefined
          }
        />
      </div>

      {/* ── Quick Links ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Grid Monitor Card */}
        <Link href="/dashboard/grid-monitor" className="block group">
          <Card className="card-enterprise h-full shine-on-hover group-hover:scale-[1.01] transition-transform duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #1A3A6B, #2D5AA0)" }}>
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Grid Monitor</h2>
                    <p className="text-xs text-slate-500">The Governor</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <MiniSparkline data={solarSparkData} />
              <p className="text-xs text-slate-500 mt-3">
                Compare Baseline vs AuraGrid optimized load across all{" "}
                <strong className="text-slate-700">{SUBSTATIONS.length} Bengaluru substations</strong>.
                Real-time directives from water-filling optimization engine.
              </p>
              <div className="flex gap-2 mt-4">
                {["Koramangala", "Whitefield", "Electronic City"].map((z) => (
                  <Badge key={z} variant="secondary" className="text-[10px]">
                    {z}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">+3</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Infrastructure Planner Card */}
        <Link href="/dashboard/infrastructure" className="block group">
          <Card className="card-enterprise h-full shine-on-hover group-hover:scale-[1.01] transition-transform duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #16A34A, #22C55E)" }}>
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Infra Planner</h2>
                    <p className="text-xs text-slate-500">Spatial Optimizer</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Top Score", value: "94/100", color: "#22C55E" },
                  { label: "Sites Ranked", value: "8", color: "#1A3A6B" },
                  { label: "Solar Ready", value: "5", color: "#F59E0B" },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] text-slate-500">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Bengaluru zone heatmap with synergy scores. Top candidate:{" "}
                <strong className="text-slate-700">Whitefield Tech Corridor (94/100)</strong>.
                Generate ROI reports and export for BBMP approval.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Zone Status Row ─────────────────────────────────────── */}
      <Card className="card-enterprise">
        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: "#1A3A6B" }} />
              Zone Status Overview
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              Live · Updated 30s
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Koramangala", load: 87, status: "critical" },
              { name: "Whitefield", load: 79, status: "warning" },
              { name: "Electronic City", load: 68, status: "normal" },
              { name: "Indiranagar", load: 61, status: "normal" },
              { name: "Hebbal", load: 44, status: "normal" },
              { name: "Marathahalli", load: 91, status: "critical" },
            ].map((zone) => {
              const statusColor =
                zone.status === "critical"
                  ? "#EF4444"
                  : zone.status === "warning"
                  ? "#F59E0B"
                  : "#22C55E";
              const dotClass =
                zone.status === "critical"
                  ? "status-dot-red"
                  : zone.status === "warning"
                  ? "status-dot-amber"
                  : "status-dot-green";
              return (
                <div
                  key={zone.name}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={dotClass} />
                    <span className="text-[10px] font-semibold text-slate-600 truncate">
                      {zone.name}
                    </span>
                  </div>
                  <div className="mb-1.5">
                    <div className="flex justify-between items-end mb-1">
                      <span
                        className="text-lg font-bold"
                        style={{ color: statusColor }}
                      >
                        {zone.load}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${zone.load}%`,
                          background: statusColor,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Grid Load</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

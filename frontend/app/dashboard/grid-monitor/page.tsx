"use client";
import { useState } from "react";
import { Activity, RefreshCw, Zap, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadForecastChart from "@/components/charts/LoadForecastChart";
import DirectivesPanel from "@/components/directives/DirectivesPanel";
import { useForecast } from "@/hooks/useForecast";
import { useDirectives } from "@/hooks/useDirectives";

const SUBSTATIONS = [
  "Koramangala",
  "Whitefield",
  "Electronic City",
  "Indiranagar",
  "Hebbal",
  "Marathahalli",
];

export default function GridMonitorPage() {
  const [activeZone, setActiveZone] = useState(SUBSTATIONS[0]);

  const { data: forecast, isLoading: forecastLoading, refetch: refetchForecast, dataUpdatedAt } =
    useForecast(activeZone);
  const { data: directives, isLoading: directivesLoading, refetch: refetchDirectives } =
    useDirectives(activeZone);

  const actionRequired = directives?.filter((d) => d.severity === "ACTION_REQUIRED").length ?? 0;

  const peakLoad = forecast
    ? Math.max(...forecast.map((d) => d.predicted_load)).toFixed(1)
    : "—";
  const optimizedPeak = forecast
    ? Math.max(...forecast.map((d) => d.optimized_load)).toFixed(1)
    : "—";
  const saving = forecast && peakLoad !== "—" && optimizedPeak !== "—"
    ? ((Number(peakLoad) - Number(optimizedPeak)) / Number(peakLoad) * 100).toFixed(1)
    : "—";

  return (
    <div className="px-6 py-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4" style={{ color: "#1A3A6B" }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Grid Monitor · The Governor
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Load Optimization Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Water-filling algorithm · 48h rolling forecast ·{" "}
            {dataUpdatedAt
              ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
              : "Connecting..."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-slate-600"
          onClick={() => {
            refetchForecast();
            refetchDirectives();
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── Substation Tabs ─────────────────────────────────────── */}
      <Tabs
        value={activeZone}
        onValueChange={setActiveZone}
        className="mb-6"
      >
        <TabsList className="h-auto flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
          {SUBSTATIONS.map((zone) => (
            <TabsTrigger
              key={zone}
              value={zone}
              className="text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500"
            >
              {zone}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Baseline Peak",
            value: `${peakLoad} MW`,
            color: "#3B82F6",
            sub: "Predicted max load",
          },
          {
            label: "Optimized Peak",
            value: `${optimizedPeak} MW`,
            color: "#22C55E",
            sub: "After water-filling",
          },
          {
            label: "Peak Reduction",
            value: saving !== "—" ? `${saving}%` : "—",
            color: saving !== "—" && Number(saving) > 0 ? "#22C55E" : "#EF4444",
            sub: "Energy shifted off-peak",
          },
        ].map((stat) => (
          <Card key={stat.label} className="card-enterprise">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {stat.label}
              </p>
              <p className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Content: Chart + Directives ───────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chart */}
        <Card className="card-enterprise xl:col-span-2">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#1A3A6B" }} />
                {activeZone} — Load Forecast (48h)
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded" style={{ background: "#3B82F6", borderTop: "2px dashed #3B82F6" }} />
                  <span className="text-[10px] text-slate-500">Baseline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded" style={{ background: "#22C55E" }} />
                  <span className="text-[10px] text-slate-500">Optimized</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-5">
            {forecastLoading ? (
              <div className="h-80 bg-slate-50 animate-pulse rounded-xl" />
            ) : forecast ? (
              <LoadForecastChart data={forecast} zone={activeZone} />
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
                No forecast data available
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-3 px-2">
              ● Green dots indicate water-filling shifted charging windows (17:00–21:00 peak deferral)
            </p>
          </CardContent>
        </Card>

        {/* Directives Panel */}
        <Card className="card-enterprise">
          <CardHeader className="pb-3 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Active Directives
              </CardTitle>
              {actionRequired > 0 && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  {actionRequired} URGENT
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {activeZone} · Refreshes every 30s
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-5">
            <DirectivesPanel
              directives={directives ?? []}
              isLoading={directivesLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Algorithm Info ──────────────────────────────────────── */}
      <Card className="card-enterprise mt-5">
        <CardContent className="px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1A3A6B, #2D5AA0)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-0.5">
                Water-Filling Optimization Algorithm
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                AuraGrid&apos;s water-filling algorithm treats available grid capacity as a &ldquo;container&rdquo; and
                redistributes EV charging demand to flatten the load curve. Peak hours (17:00–21:00) are
                throttled by dispatching demand to off-peak windows (02:00–06:00), maximizing solar
                self-consumption and reducing BESCOM&apos;s peak generation requirement by up to{" "}
                <strong className="text-slate-700">22%</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

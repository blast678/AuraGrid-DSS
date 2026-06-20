"use client";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { format } from "date-fns";
import type { ForecastPoint } from "@/lib/mockData";

interface LoadForecastChartProps {
  data: any[]; // (Leave whatever is currently here)
  zone: string;
  currentTimeIndex?: number; // 👈 ADD THIS EXACT LINE
}

interface CustomTooltipEntry {
  dataKey?: string;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipEntry[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length < 2) return null;
  const predicted = payload.find((p) => p.dataKey === "predicted_load");
  const optimized = payload.find((p) => p.dataKey === "optimized_load");
  const delta =
    predicted?.value !== undefined && optimized?.value !== undefined
      ? ((predicted.value as number) - (optimized.value as number)).toFixed(1)
      : "0";
  if (label === undefined) return null;
  const ts = new Date(label);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[200px]">
      <p className="text-xs font-semibold text-slate-500 mb-2">
        {format(ts, "MMM d, HH:mm")}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" style={{ borderTop: "2px dashed #3B82F6" }} />
            <span className="text-xs text-slate-600">Baseline Predicted</span>
          </div>
          <span className="text-xs font-bold text-slate-800">
            {Number(predicted?.value).toFixed(1)} MW
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block rounded" style={{ background: "#22C55E" }} />
            <span className="text-xs text-slate-600">AuraGrid Optimized</span>
          </div>
          <span className="text-xs font-bold" style={{ color: "#22C55E" }}>
            {Number(optimized?.value).toFixed(1)} MW
          </span>
        </div>
        <div
          className="pt-1.5 border-t border-slate-100 flex justify-between"
          style={{ marginTop: 6 }}
        >
          <span className="text-[11px] text-slate-400">Peak Saved</span>
          <span
            className="text-[11px] font-bold"
            style={{ color: Number(delta) > 0 ? "#22C55E" : "#EF4444" }}
          >
            {Number(delta) > 0 ? "−" : "+"}
            {Math.abs(Number(delta))} MW
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoadForecastChart({ data, zone }: LoadForecastChartProps) {
  // Annotate shift points for reference dots
  const shiftedPoints = data.filter((d) => d.is_shifted);
  const peakShifted = shiftedPoints.filter(
    (d) => new Date(d.timestamp).getHours() >= 17
  );

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(v) => format(new Date(v), "HH:mm")}
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            interval={5}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}MW`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) =>
              value === "predicted_load"
                ? "Baseline Predicted Load"
                : "AuraGrid Optimized Load"
            }
          />

          {/* Shaded area under baseline */}
          <Area
            type="monotone"
            dataKey="predicted_load"
            fill="url(#baselineGradient)"
            stroke="none"
            fillOpacity={1}
          />
          {/* Shaded savings area under optimized */}
          <Area
            type="monotone"
            dataKey="optimized_load"
            fill="url(#savingsGradient)"
            stroke="none"
            fillOpacity={1}
          />

          {/* Baseline dashed line */}
          <Line
            type="monotone"
            dataKey="predicted_load"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 5, fill: "#3B82F6" }}
          />

          {/* Optimized solid line */}
          <Line
            type="monotone"
            dataKey="optimized_load"
            stroke="#22C55E"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#22C55E" }}
          />

          {/* Mark peak-shifted points */}
          {peakShifted.slice(0, 4).map((pt) => (
            <ReferenceDot
              key={pt.timestamp}
              x={pt.timestamp}
              y={pt.optimized_load}
              r={4}
              fill="#22C55E"
              stroke="white"
              strokeWidth={1.5}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  accentColor?: string;
  subtitle?: string;
  pulse?: boolean;
  badge?: React.ReactNode;
}

export default function KpiCard({
  title,
  value,
  unit,
  delta,
  deltaLabel = "vs yesterday",
  icon: Icon,
  iconColor = "#1A3A6B",
  iconBg = "#EEF2FF",
  accentColor = "#1A3A6B",
  subtitle,
  pulse = false,
  badge,
}: KpiCardProps) {
  const trendPositive = delta !== undefined && delta > 0;
  const trendNegative = delta !== undefined && delta < 0;
  const TrendIcon = trendPositive
    ? TrendingUp
    : trendNegative
    ? TrendingDown
    : Minus;

  return (
    <Card
      className={cn(
        "card-enterprise relative overflow-hidden shine-on-hover",
        "hover:scale-[1.01] transition-transform duration-200"
      )}
    >
      {/* Accent left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: accentColor }}
      />

      <CardContent className="pl-5 pr-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={1.8} />
          </div>
          {badge}
        </div>

        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-end gap-1.5">
            <span
              className={cn(
                "text-3xl font-bold leading-none tracking-tight",
                pulse && "kpi-pulse"
              )}
              style={{ color: accentColor }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400 mb-0.5">
                {unit}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>

        {delta !== undefined && (
          <div className="flex items-center gap-1.5 mt-3">
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold",
                trendPositive && "bg-green-50 text-green-700",
                trendNegative && "bg-red-50 text-red-600",
                !trendPositive && !trendNegative && "bg-slate-100 text-slate-500"
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {Math.abs(delta)}%
            </div>
            <span className="text-[11px] text-slate-400">{deltaLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

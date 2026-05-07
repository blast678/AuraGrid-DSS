"use client";
import { useEffect } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Directive } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface DirectivesPanelProps {
  directives: Directive[];
  isLoading?: boolean;
}

const SEVERITY_CONFIG = {
  ACTION_REQUIRED: {
    icon: AlertTriangle,
    label: "ACTION REQUIRED",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    iconColor: "#EF4444",
    labelColor: "#DC2626",
    dot: "status-dot-red",
  },
  ADVISORY: {
    icon: AlertCircle,
    label: "ADVISORY",
    bg: "#FFFBEB",
    border: "#FCD34D",
    iconColor: "#F59E0B",
    labelColor: "#D97706",
    dot: "status-dot-amber",
  },
  NOMINAL: {
    icon: CheckCircle2,
    label: "NOMINAL",
    bg: "#F0FDF4",
    border: "#86EFAC",
    iconColor: "#22C55E",
    labelColor: "#16A34A",
    dot: "status-dot-green",
  },
};

export default function DirectivesPanel({
  directives,
  isLoading,
}: DirectivesPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!directives || directives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <CheckCircle2 className="w-8 h-8 mb-2 text-green-400" />
        <p className="text-sm">No active directives</p>
      </div>
    );
  }

  // Sort: ACTION_REQUIRED first, then ADVISORY, then NOMINAL
  const sorted = [...directives].sort((a, b) => {
    const order = { ACTION_REQUIRED: 0, ADVISORY: 1, NOMINAL: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scroll">
      {sorted.map((dir, idx) => {
        const config = SEVERITY_CONFIG[dir.severity];
        const Icon = config.icon;
        return (
          <div
            key={dir.id}
            className="slide-in-up rounded-xl border p-3.5"
            style={{
              background: config.bg,
              borderColor: config.border,
              animationDelay: `${idx * 60}ms`,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Icon
                  className="w-4 h-4"
                  style={{ color: config.iconColor }}
                  strokeWidth={2}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={config.dot}
                  />
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: config.labelColor }}
                  >
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(dir.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed font-medium"
                  style={{ color: "#1E293B" }}
                >
                  {/* Remove the uppercase prefix that's already shown in the badge */}
                  {dir.message.replace(/^(ACTION REQUIRED|ADVISORY|NOMINAL): /i, "")}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

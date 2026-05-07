"use client";
import { useState, useEffect, useRef } from "react";
import { ScrollText, AlertTriangle, Info, XCircle, Filter, RefreshCw } from "lucide-react";
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
import { MOCK_LOGS, type SystemLog } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const LEVEL_CONFIG = {
  INFO: {
    icon: Info,
    color: "#3B82F6",
    bg: "#EFF6FF",
    label: "INFO",
  },
  WARN: {
    icon: AlertTriangle,
    color: "#F59E0B",
    bg: "#FFFBEB",
    label: "WARN",
  },
  ERROR: {
    icon: XCircle,
    color: "#EF4444",
    bg: "#FEF2F2",
    label: "ERROR",
  },
};

type LogLevel = "INFO" | "WARN" | "ERROR" | "ALL";

export default function SystemLogsPage() {
  const [filter, setFilter] = useState<LogLevel>("ALL");
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Simulate new logs arriving
  useEffect(() => {
    const sources = ["water-fill-engine", "kafka-consumer", "prophet-ai", "ocpp-gateway", "db-writer", "grid-monitor"];
    const levels: SystemLog["level"][] = ["INFO", "INFO", "INFO", "WARN", "ERROR"];
    const messages = {
      "water-fill-engine": ["Optimization cycle complete.", "Peak shift dispatched.", "Demand response activated."],
      "kafka-consumer": ["Events consumed successfully.", "Partition lag: 0.", "Topic heartbeat OK."],
      "prophet-ai": ["Forecast refreshed.", "MAPE: 3.1%.", "Retraining skipped — accuracy above threshold."],
      "ocpp-gateway": ["Station heartbeat received.", "Charge session started.", "Session terminated gracefully."],
      "db-writer": ["Rows inserted successfully.", "Connection pool healthy.", "Vacuum scheduled."],
      "grid-monitor": ["Feeder load within bounds.", "Voltage sag resolved.", "N-1 contingency: SAFE."],
    };

    const interval = setInterval(() => {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const msgs = messages[source as keyof typeof messages];
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level,
        source,
        message: msgs[Math.floor(Math.random() * msgs.length)],
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 100));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filtered = filter === "ALL" ? logs : logs.filter((l) => l.level === filter);
  const counts = {
    INFO: logs.filter((l) => l.level === "INFO").length,
    WARN: logs.filter((l) => l.level === "WARN").length,
    ERROR: logs.filter((l) => l.level === "ERROR").length,
  };

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="w-4 h-4" style={{ color: "#1A3A6B" }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              System Logs · Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Event Stream &amp; Diagnostics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time log feed from all AuraGrid subsystems · Last 100 events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-slate-600"
          onClick={() => setLogs(MOCK_LOGS)}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["INFO", "WARN", "ERROR"] as const).map((level) => {
          const cfg = LEVEL_CONFIG[level];
          const Icon = cfg.icon;
          return (
            <Card
              key={level}
              className={cn(
                "card-enterprise cursor-pointer transition-all duration-150",
                filter === level && "ring-2"
              )}
              style={filter === level ? { boxShadow: `0 0 0 2px ${cfg.color}` } : undefined}
              onClick={() => setFilter(filter === level ? "ALL" : level)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ color: cfg.color }}>
                      {counts[level]}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {level}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Log Table */}
      <Card className="card-enterprise">
        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              {filter === "ALL" ? "All Events" : `Filtered: ${filter}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={cn(
                  "text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                  autoScroll
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {autoScroll ? "● Live" : "○ Paused"}
              </button>
              <Badge variant="outline" className="text-[10px]">
                {filtered.length} events
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="max-h-[560px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="border-slate-100">
                  <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-6 w-40">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">
                    Level
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-36">
                    Source
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Message
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log, idx) => {
                  const cfg = LEVEL_CONFIG[log.level];
                  const Icon = cfg.icon;
                  return (
                    <TableRow
                      key={log.id}
                      className={cn(
                        "border-slate-50 transition-colors",
                        idx === 0 && "slide-in-up",
                        log.level === "ERROR" && "bg-red-50/30",
                        log.level === "WARN" && "bg-amber-50/30"
                      )}
                    >
                      <TableCell className="pl-6 py-2.5">
                        <span
                          className="text-[10px] font-mono text-slate-400 tabular-nums"
                        >
                          {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold w-fit"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.source}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 pr-6">
                        <span className="text-xs text-slate-700">{log.message}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div ref={bottomRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

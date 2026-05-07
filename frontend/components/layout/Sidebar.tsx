"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Map,
  ScrollText,
  Zap,
  ChevronRight,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Grid Monitor",
    href: "/dashboard/grid-monitor",
    icon: Activity,
    description: "Load & Directives",
  },
  {
    label: "Infra Planner",
    href: "/dashboard/infrastructure",
    icon: Map,
    description: "Spatial Optimizer",
  },
  {
    label: "System Logs",
    href: "/dashboard/system-logs",
    icon: ScrollText,
    description: "Audit & Events",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 z-40"
        style={{ background: "var(--sidebar)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight"
              style={{ color: "var(--sidebar-foreground)" }}>
              AuraGrid
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--sidebar-accent-foreground)", opacity: 0.6 }}>
              BESCOM DSL v2.4
            </p>
          </div>
        </div>

        {/* Overview link */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2"
            style={{ color: "var(--sidebar-accent-foreground)", opacity: 0.45 }}>
            Main
          </p>
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
              pathname === "/dashboard"
                ? "text-white"
                : "hover:text-white"
            )}
            style={
              pathname === "/dashboard"
                ? {
                    background: "linear-gradient(135deg, #22C55E22, #22C55E11)",
                    color: "#22C55E",
                    borderLeft: "3px solid #22C55E",
                  }
                : { color: "var(--sidebar-foreground)", opacity: 0.8 }
            }
          >
            <Radio className="w-4 h-4" />
            <span>Overview</span>
            {pathname === "/dashboard" && (
              <ChevronRight className="ml-auto w-3.5 h-3.5" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 mt-4"
            style={{ color: "var(--sidebar-accent-foreground)", opacity: 0.45 }}>
            Modules
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
                  )}
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, #22C55E22, #22C55E11)",
                          color: "#22C55E",
                          borderLeft: "3px solid #22C55E",
                        }
                      : {
                          color: "var(--sidebar-foreground)",
                          opacity: 0.75,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--sidebar-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.opacity = "0.75";
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.label}</p>
                    <p
                      className="text-[10px] truncate"
                      style={{ opacity: 0.55 }}
                    >
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight className="ml-auto w-3.5 h-3.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t"
          style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--sidebar-accent)" }}>
            <span className="status-dot-green flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate"
                style={{ color: "var(--sidebar-foreground)" }}>
                All systems operational
              </p>
              <p className="text-[10px]" style={{ color: "var(--sidebar-accent-foreground)", opacity: 0.55 }}>
                Grid freq: 49.97 Hz
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ─────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t"
        style={{
          background: "var(--sidebar)",
          borderColor: "var(--sidebar-border)",
        }}>
        <div className="flex items-center justify-around px-2 py-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-0 transition-colors"
            )}
            style={
              pathname === "/dashboard"
                ? { color: "#22C55E" }
                : { color: "var(--sidebar-foreground)", opacity: 0.65 }
            }
          >
            <Radio className="w-5 h-5" />
            <span className="text-[10px] font-medium">Overview</span>
          </Link>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-0 transition-colors"
                style={
                  isActive
                    ? { color: "#22C55E" }
                    : {
                        color: "var(--sidebar-foreground)",
                        opacity: 0.65,
                      }
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

import { Suspense } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Dumbbell,
  Flag,
  Home,
  ListTodo,
  MessageSquare,
  Settings,
  Sparkles
} from "lucide-react";

import { ReminderCenter } from "@/components/shared/ReminderCenter";

const navItems = [
  { to: "/dashboard", label: "Command", icon: Home },
  { to: "/quest-board", label: "Quests", icon: ListTodo },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/goals", label: "Goals", icon: Flag },
  { to: "/habits", label: "Habits", icon: Dumbbell },
  { to: "/hunter-log", label: "Log", icon: BarChart3 },
  { to: "/finance", label: "Finance", icon: CircleDollarSign },
  { to: "/events", label: "Events", icon: Activity },
  { to: "/system-chat", label: "Chat", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings }
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="system-screen min-h-screen bg-abyss text-slate-100">
      <ReminderCenter />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,71,214,0.16),transparent_28%),radial-gradient(circle_at_88%_4%,rgba(156,77,255,0.18),transparent_26%),linear-gradient(180deg,rgba(7,2,13,0),rgba(7,2,13,0.88)_72%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-systemBlue/20 bg-black/30 px-4 py-5 shadow-[inset_-1px_0_0_rgba(233,91,255,0.12)] backdrop-blur-xl lg:block">
          <Link to="/" className="mb-8 flex items-center gap-3 rounded-sm border border-systemBlue/20 bg-panel/40 px-2 py-2 shadow-system">
            <span className="flex size-10 items-center justify-center rounded-sm border border-systemBlue bg-panel text-systemCyan shadow-system">
              <Sparkles size={20} />
            </span>
            <span>
              <span className="system-label block text-xs">
                The System
              </span>
              <span className="block text-lg font-semibold text-slate-50">Life OS</span>
            </span>
          </Link>
          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    "group flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition",
                    active
                      ? "border-systemBlue/60 bg-systemBlue/10 text-systemCyan shadow-[inset_0_0_20px_rgba(233,91,255,0.08)]"
                      : "border-transparent text-slate-400 hover:border-systemBlue/30 hover:bg-panel/70 hover:text-slate-100"
                  ].join(" ")}
                >
                  <Icon className="transition group-hover:text-systemCyan" size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-systemBlue/20 bg-abyss/90 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <Link to="/" className="system-label font-semibold">
                Life OS
              </Link>
              <Link to="/awakening" className="text-sm text-slate-300">
                Awakening
              </Link>
            </div>
          </header>
          <main className="flex-1 px-4 py-5 md:px-8 lg:px-10">
            <Suspense fallback={<RouteLoading />}>
              <Outlet />
            </Suspense>
          </main>
          <nav className="sticky bottom-0 z-20 flex gap-2 overflow-x-auto border-t border-systemBlue/20 bg-abyss/95 p-2 backdrop-blur lg:hidden">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    "flex min-w-[72px] flex-col items-center gap-1 rounded-sm border px-2 py-2 text-[11px]",
                    active
                      ? "border-systemBlue/40 bg-systemBlue/10 text-systemCyan"
                      : "border-transparent text-slate-400"
                  ].join(" ")}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

function RouteLoading() {
  return (
    <div className="system-panel mx-auto max-w-5xl rounded-sm p-5 text-sm text-slate-400">
      <div className="system-panel-content">Loading System module...</div>
    </div>
  );
}

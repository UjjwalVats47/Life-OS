import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, Compass, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/shared/RankBadge";
import { StatBadge } from "@/components/shared/StatBadge";
import { XpBar } from "@/components/shared/XpBar";
import {
  loadDashboardSummary,
  type DashboardSummary
} from "@/features/dashboard/dashboardService";

const statLabels = [
  ["Intelligence", "intelligence"],
  ["Vitality", "vitality"],
  ["Focus", "focus"],
  ["Discipline", "discipline"],
  ["Perception", "perception"]
] as const;

export function CommandCenter() {
  const [summary, setSummary] = useState<DashboardSummary>();

  useEffect(() => {
    void loadDashboardSummary().then(setSummary);
  }, []);

  if (!summary) {
    return <div className="system-panel mx-auto max-w-7xl p-6 text-sm text-slate-500">Reading local System state...</div>;
  }

  const activated = summary.onboardingCompleted;

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="system-panel rounded-sm p-5 md:p-6">
          <div className="system-panel-content">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="system-label text-xs font-semibold">Command Center</p>
              <span className="rounded-sm border border-systemGreen/40 bg-systemGreen/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-systemGreen">
                Local Core Online
              </span>
            </div>
            <h1 className="system-title mt-5 max-w-3xl text-2xl font-black leading-tight text-slate-50 md:text-3xl">
              {activated ? `${summary.activeIdentity} protocol active.` : "First protocol awaiting activation."}
            </h1>
            <div className="system-divider my-5" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ProtocolItem
                label="Identity"
                value={activated ? summary.activeIdentity ?? "Active" : "Unawakened"}
                tone={activated ? "success" : "warning"}
              />
              <ProtocolItem
                label="Quest Engine"
                value={activated ? `${summary.pendingQuests} available` : "Standby"}
              />
              <ProtocolItem
                label="Work Model"
                value={activated ? `${summary.workItemCount} linked` : "Waiting"}
                tone={summary.workItemCount ? "success" : "warning"}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={activated ? "/quest-board" : "/awakening"}>
                  {activated ? "Open Quest Board" : "Begin Awakening"}
                </Link>
              </Button>
              {activated ? (
                <Button asChild variant="secondary">
                  <Link to="/schedule">View Schedule</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <RankBadge
          label={activated ? "Rank" : "Active Rank"}
          nextRank={summary.nextRank}
          progress={summary.rankProgress}
          rank={summary.activeRank}
        />
      </div>

      {summary.firstWeekProtocol ? <FirstWeekProtocolPanel summary={summary} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="system-panel rounded-sm p-5">
          <div className="system-panel-content">
            <div className="mb-4 flex items-center justify-between">
              <p className="system-label text-xs">Status</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Streak {summary.streak} | RP {summary.resetPoints}
              </p>
            </div>
            <XpBar current={summary.lifetimeXp} max={summary.nextRankXp} />
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              {statLabels.map(([label, stat]) => (
                <StatBadge key={label} label={label} value={summary.stats[stat]} />
              ))}
            </div>
          </div>
        </div>
        <div className="system-panel rounded-sm p-5">
          <div className="system-panel-content">
            <p className="system-label text-xs">Core</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProtocolItem label="Privacy" value="Local" tone="success" />
              <ProtocolItem label="AI" value="Rule based" />
              <ProtocolItem label="Reviews" value="0 / 2" />
              <ProtocolItem label="PWA" value="Ready" tone="success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FirstWeekProtocolPanel({ summary }: { summary: DashboardSummary }) {
  const today = new Date().toISOString().slice(0, 10);
  const protocol = summary.firstWeekProtocol;
  if (!protocol) return null;

  return (
    <section className="system-panel rounded-sm p-5">
      <div className="system-panel-content">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="system-label text-xs">First Week Protocol</p>
            <h2 className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-slate-50">
              {protocol.createdForIdentity}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-sm border border-systemBlue/25 bg-systemBlue/10 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-systemCyan">
            <Compass className="size-3.5" />
            Evidence week
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-7">
          {protocol.days.map((day) => {
            const active = day.date === today;
            return (
              <article
                className={`min-h-[112px] rounded-sm border p-3 ${
                  active
                    ? "border-systemBlue/55 bg-systemBlue/15 shadow-[0_0_18px_rgba(233,91,255,0.18)]"
                    : "border-systemBlue/15 bg-black/25"
                }`}
                key={day.date}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{shortDate(day.date)}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-100">
                  {day.focus.split("_").join(" ")}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-systemCyan">{day.intensity}</p>
                <p className="mt-2 text-[11px] text-slate-500">{day.maxPriorityQuests} priority quests max</p>
              </article>
            );
          })}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {protocol.evidenceRules.map((rule) => (
            <p className="rounded-sm border border-systemBlue/10 bg-black/20 p-3 text-[11px] leading-5 text-slate-400" key={rule}>
              {rule}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

type ProtocolItemProps = {
  label: string;
  tone?: "default" | "success" | "warning";
  value: string;
};

function ProtocolItem({ label, value, tone = "default" }: ProtocolItemProps) {
  const icon =
    tone === "warning" ? (
      <TriangleAlert size={16} />
    ) : tone === "success" ? (
      <CheckCircle2 size={16} />
    ) : (
      <Activity size={16} />
    );
  const toneClasses = {
    default: "text-systemCyan",
    success: "text-systemGreen",
    warning: "text-warning"
  };

  return (
    <div className="min-w-0 rounded-sm border border-systemBlue/20 bg-black/25 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] ${toneClasses[tone]}`}>
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

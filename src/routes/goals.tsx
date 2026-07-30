import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { StatDots } from "@/components/shared/StatDots";
import {
  loadGoalsIdentity,
  updateGoalProgress
} from "@/features/life-areas/lifeAreasService";
import type { Goal } from "@/types/domain";
import type { LifeStat } from "@/components/shared/statVisuals";

type GoalState = Awaited<ReturnType<typeof loadGoalsIdentity>>;

export function GoalsRoute() {
  const [state, setState] = useState<GoalState>();
  const refresh = useCallback(() => loadGoalsIdentity().then(setState), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!state) return <Loading />;

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <header className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <p className="system-label text-xs font-semibold">Goals and Identity</p>
          <h1 className="system-title mt-3 text-2xl font-black text-slate-50">
            Transformation hierarchy.
          </h1>
        </div>
      </header>

      {!state.identity ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="system-panel rounded-sm p-4">
            <div className="system-panel-content">
              <p className="system-label text-[10px]">Active identity</p>
              <h2 className="mt-3 text-xl font-black uppercase tracking-[0.06em] text-systemCyan">
                {state.identity.name}
              </h2>
              <p className="mt-3 text-[12px] leading-5 text-slate-400">
                {state.identity.transformationPromise}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {state.identity.pillars.map((pillar) => (
                  <MetaChip key={pillar}>{pillar.split("_").join(" ")}</MetaChip>
                ))}
              </div>
              <div className="mt-5 border border-systemGreen/25 bg-systemGreen/10 p-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-systemGreen">Reset points</p>
                <p className="mt-2 text-2xl font-black text-slate-50">{state.resetPoints} / 60</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  One free override is restored when the adaptive threshold is reached.
                </p>
              </div>
            </div>
          </aside>

          <div className="system-panel rounded-sm p-4">
            <div className="system-panel-content space-y-3">
              {state.goals.map((goal) => (
                <GoalCard goal={goal} key={goal.id} onUpdate={refresh} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => Promise<void> }) {
  const stats = statMap[goal.domain];

  return (
    <article className="border border-systemBlue/15 bg-black/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100">{goal.title}</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{goal.reason}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <MetaChip tone={goal.level === "primary" ? "primary" : "default"}>{goal.level}</MetaChip>
            <MetaChip>{goal.system}</MetaChip>
            <MetaChip>{`${goal.timelineMonths ?? "flexible"} months`}</MetaChip>
          </div>
        </div>
        <StatDots stats={stats} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden border border-systemBlue/15 bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-systemBlue to-systemViolet shadow-[0_0_12px_rgba(233,91,255,0.55)]"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">{goal.progress}% complete</span>
        <div className="flex gap-2">
          <ProgressButton goal={goal} increment={5} onUpdate={onUpdate} />
          <ProgressButton goal={goal} increment={10} onUpdate={onUpdate} />
        </div>
      </div>
    </article>
  );
}

function ProgressButton({
  goal,
  increment,
  onUpdate
}: {
  goal: Goal;
  increment: number;
  onUpdate: () => Promise<void>;
}) {
  return (
    <button
      className="border border-systemBlue/25 bg-systemBlue/5 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-systemCyan"
      onClick={async () => {
        await updateGoalProgress(goal.id, goal.progress + increment);
        await onUpdate();
      }}
      type="button"
    >
      +{increment}%
    </button>
  );
}

const statMap: Record<Goal["domain"], LifeStat[]> = {
  academics: ["intelligence", "focus"],
  discipline_routine: ["discipline", "focus"],
  finance: ["perception", "discipline"],
  fitness_health: ["vitality", "discipline"],
  personality_social_confidence: ["perception", "discipline"],
  skills_career: ["intelligence", "focus"]
};

function MetaChip({ children, tone = "default" }: { children: string; tone?: "default" | "primary" }) {
  return (
    <span
      className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${
        tone === "primary"
          ? "border-systemBlue/40 bg-systemBlue/10 text-systemCyan"
          : "border-systemBlue/20 bg-systemBlue/5 text-slate-400"
      }`}
    >
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="system-panel p-6 text-center">
      <p className="text-sm text-slate-400">No active identity exists yet.</p>
      <Button asChild className="mt-4">
        <Link to="/awakening">Complete Awakening</Link>
      </Button>
    </div>
  );
}

function Loading() {
  return <div className="system-panel mx-auto max-w-6xl p-6 text-sm text-slate-500">Reading goal hierarchy...</div>;
}

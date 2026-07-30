import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatDots } from "@/components/shared/StatDots";
import {
  loadGoalsIdentity
} from "@/features/life-areas/lifeAreasService";
import {
  loadGoalTaskPlans,
  regenerateGoalTaskPlan,
  updateGoalCalibration,
  type GoalTaskPlanView
} from "@/features/goals/goalTaskPlanningService";
import type { Goal } from "@/types/domain";
import type { LifeStat } from "@/components/shared/statVisuals";

type GoalState = Awaited<ReturnType<typeof loadGoalsIdentity>>;
type PageState = GoalState & { taskPlans: GoalTaskPlanView[] };

export function GoalsRoute() {
  const [state, setState] = useState<PageState>();
  const refresh = useCallback(async () => {
    const [goalState, taskPlans] = await Promise.all([loadGoalsIdentity(), loadGoalTaskPlans()]);
    setState({ ...goalState, taskPlans });
  }, []);

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
                <GoalCard
                  goal={goal}
                  key={goal.id}
                  onUpdate={refresh}
                  taskPlan={state.taskPlans.find((item) => item.goal.id === goal.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GoalCard({
  goal,
  onUpdate,
  taskPlan
}: {
  goal: Goal;
  onUpdate: () => Promise<void>;
  taskPlan?: GoalTaskPlanView;
}) {
  const stats = statMap[goal.domain];
  const actionCycleProgress = taskPlan?.totalActions
    ? Math.round((taskPlan.completedActions / taskPlan.totalActions) * 100)
    : 0;
  const displayedProgress = taskPlan?.plan ? actionCycleProgress : goal.progress;
  const [expanded, setExpanded] = useState(Boolean(taskPlan?.plan));
  const [calibrating, setCalibrating] = useState(false);
  const [engineMessage, setEngineMessage] = useState("");
  const [calibration, setCalibration] = useState({
    availableResources: goal.availableResources ?? "",
    constraints: goal.constraints ?? "",
    currentLevel: goal.currentLevel ?? "",
    targetOutcome: goal.targetOutcome ?? ""
  });
  const [generating, setGenerating] = useState(false);

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
          style={{ width: `${displayedProgress}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">
          {taskPlan?.plan
            ? `${taskPlan.completedActions}/${taskPlan.totalActions} current action cycle`
            : `${goal.progress}% recorded progress`}
        </span>
      </div>

      <div className="mt-3 border-t border-systemBlue/15 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-systemViolet">Action engine</p>
            <p className="mt-1 text-[11px] text-slate-400">
              {taskPlan?.plan
                ? `${taskPlan.plan.capabilities.length} capabilities | ${taskPlan.tasks.length} generated actions`
                : "No action plan generated"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="h-8 px-3 text-[10px]"
              onClick={() => setCalibrating((value) => !value)}
              variant="secondary"
            >
              <SlidersHorizontal className="mr-2 size-3.5" />
              Calibrate
            </Button>
            <Button
              className="h-8 px-3 text-[10px]"
              disabled={generating}
              onClick={async () => {
                setGenerating(true);
                const generated = await regenerateGoalTaskPlan(goal.id);
                setEngineMessage(generated.localAiDetail);
                await onUpdate();
                setExpanded(true);
                setGenerating(false);
              }}
              variant="secondary"
            >
              <RefreshCw className={`mr-2 size-3.5 ${generating ? "animate-spin" : ""}`} />
              {taskPlan?.plan ? "Regenerate" : "Generate actions"}
            </Button>
            {taskPlan?.plan ? (
              <button
                aria-label={expanded ? "Collapse action plan" : "Expand action plan"}
                className="grid size-8 place-items-center border border-systemBlue/25 bg-systemBlue/5 text-systemCyan"
                onClick={() => setExpanded((value) => !value)}
                type="button"
              >
                {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            ) : null}
          </div>
        </div>

        {calibrating ? (
          <div className="mt-3 grid gap-2 border border-systemBlue/15 bg-black/20 p-3 md:grid-cols-2">
            <CalibrationField
              label="Current level"
              onChange={(value) => setCalibration((state) => ({ ...state, currentLevel: value }))}
              placeholder="Example: beginner, knows variables and loops"
              value={calibration.currentLevel}
            />
            <CalibrationField
              label="Target outcome"
              onChange={(value) => setCalibration((state) => ({ ...state, targetOutcome: value }))}
              placeholder="Example: solve intermediate problems and ship one project"
              value={calibration.targetOutcome}
            />
            <CalibrationField
              label="Available resources"
              onChange={(value) => setCalibration((state) => ({ ...state, availableResources: value }))}
              placeholder="Example: laptop, Python, course notes"
              value={calibration.availableResources}
            />
            <CalibrationField
              label="Constraints"
              onChange={(value) => setCalibration((state) => ({ ...state, constraints: value }))}
              placeholder="Example: offline only, 60 minutes per weekday"
              value={calibration.constraints}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button
                className="h-8 px-3 text-[10px]"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  const generated = await updateGoalCalibration(goal.id, calibration);
                  setEngineMessage(generated.localAiDetail);
                  await onUpdate();
                  setGenerating(false);
                  setCalibrating(false);
                  setExpanded(true);
                }}
              >
                Save calibration
              </Button>
            </div>
          </div>
        ) : null}

        {engineMessage ? (
          <p className="mt-2 text-[10px] leading-5 text-slate-500">{engineMessage}</p>
        ) : null}

        {expanded && taskPlan?.plan ? <ActionPlan planView={taskPlan} /> : null}
      </div>
    </article>
  );
}

function CalibrationField({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">
      {label}
      <input
        className="h-9 border border-systemBlue/20 bg-black/35 px-3 text-[11px] normal-case tracking-normal text-slate-100 outline-none focus:border-systemViolet/60"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function ActionPlan({ planView }: { planView: GoalTaskPlanView }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="border border-systemViolet/20 bg-systemViolet/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-systemViolet">
            {planView.plan?.archetype.split("_").join(" ")}
          </p>
          <span className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
            Plan v{planView.plan?.version}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-300">{planView.plan?.interpretation}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {planView.plan?.capabilities.map((capability) => (
            <span
              className="border border-systemBlue/20 bg-black/20 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-slate-300"
              key={capability.key}
              title={capability.purpose}
            >
              {capability.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {planView.tasks.map((task) => (
          <article className="border border-systemBlue/15 bg-black/25 p-3" key={task.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] font-semibold leading-5 text-slate-100">{task.title}</p>
              <span className="shrink-0 text-[10px] text-systemCyan">{task.estimatedMinutes}m</span>
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-systemViolet">
              {task.actionType?.split("_").join(" ")} | {task.generationSource === "local_ai" ? "local AI" : "local core"}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">{task.completionEvidence}</p>
            {task.dependencyTaskKeys?.length ? (
              <p className="mt-2 text-[10px] text-slate-500">Unlocks after earlier proof</p>
            ) : (
              <p className="mt-2 text-[10px] text-systemGreen">Eligible now</p>
            )}
          </article>
        ))}
      </div>
    </div>
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

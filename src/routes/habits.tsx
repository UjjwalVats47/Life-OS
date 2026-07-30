import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatDots } from "@/components/shared/StatDots";
import {
  createReplacementHabit,
  loadHabitRedirection
} from "@/features/life-areas/lifeAreasService";
import type { LifeStat } from "@/components/shared/statVisuals";

type HabitState = Awaited<ReturnType<typeof loadHabitRedirection>>;

export function HabitsRoute() {
  const [state, setState] = useState<HabitState>();
  const refresh = useCallback(() => loadHabitRedirection().then(setState), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!state) return <div className="system-panel mx-auto max-w-6xl p-6 text-sm text-slate-500">Reading habit evidence...</div>;

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <header className="system-panel rounded-sm p-5">
        <div className="system-panel-content">
          <p className="system-label text-xs font-semibold">Habits and Redirection</p>
          <h1 className="system-title mt-3 text-2xl font-black text-slate-50">
            Proof habits replace old-identity behavior.
          </h1>
          <div className="system-divider my-4" />
          <p className="max-w-3xl text-[13px] leading-6 text-slate-300">
            Consistency comes from completed habit-linked quests. Weak patterns can be converted into scheduled replacement habits.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="system-panel p-4">
          <div className="system-panel-content">
            <p className="system-label text-[10px]">Proof habits</p>
            <div className="mt-4 space-y-3">
              {state.habits.map(({ consistency, habit, strength }) => (
                <article className="border border-systemBlue/15 bg-black/25 p-3" key={habit.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{habit.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{habit.frequency}</p>
                    </div>
                    <StatDots stats={habitStats[habit.domain]} />
                  </div>
                  <div className="mt-3 h-1.5 border border-systemBlue/15 bg-black/40">
                    <div className="h-full bg-systemBlue" style={{ width: `${strength.score}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                    <span>Consistency {consistency}%</span>
                    <span className="text-right text-systemCyan">Strength {strength.score}%</span>
                    <span>{strength.label.split("_").join(" ")}</span>
                    <span className="text-right">Pressure {strength.pressure}</span>
                    <span>Momentum {strength.momentum}</span>
                    <span className="text-right">Missed {strength.missedCount}</span>
                  </div>
                </article>
              ))}
              {!state.habits.length ? <Empty text="Complete Awakening to generate proof habits." /> : null}
            </div>
          </div>
        </section>

        <section className="system-panel p-4">
          <div className="system-panel-content">
            <p className="system-label text-[10px]">Old-identity targets</p>
            <div className="mt-4 space-y-3">
              {state.targets.map((target) => (
                <article className="border border-systemBlue/15 bg-black/25 p-3" key={target.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{target.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        {target.severity} | {target.status}
                      </p>
                    </div>
                    {target.status === "redirected" ? <CheckCircle2 className="size-4 text-systemGreen" /> : null}
                  </div>
                  {target.status !== "redirected" ? (
                    <Button
                      className="mt-3 h-8 px-3 text-[10px]"
                      onClick={async () => {
                        await createReplacementHabit(target);
                        await refresh();
                      }}
                      variant="secondary"
                    >
                      Generate replacement
                      <ArrowRight className="ml-2 size-3.5" />
                    </Button>
                  ) : (
                    <p className="mt-3 text-[11px] leading-5 text-systemGreen">
                      Replacement habit is active and can enter future quest slots.
                    </p>
                  )}
                </article>
              ))}
              {!state.targets.length ? <Empty text="No weak-area targets were recorded." /> : null}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

const habitStats: Record<string, LifeStat[]> = {
  academics: ["intelligence", "focus"],
  discipline_routine: ["discipline", "focus"],
  finance: ["perception", "discipline"],
  fitness_health: ["vitality", "discipline"],
  personality_social_confidence: ["perception", "discipline"],
  skills_career: ["intelligence", "focus"]
};

function Empty({ text }: { text: string }) {
  return <div className="border border-dashed border-systemBlue/15 p-5 text-center text-[12px] text-slate-600">{text}</div>;
}

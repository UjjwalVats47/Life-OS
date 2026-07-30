import { useCallback, useEffect, useState } from "react";
import { IndianRupee, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addExpense,
  loadFinanceDashboard
} from "@/features/finance/financeService";
import type { LifeDomain } from "@/types/enums";

type FinanceState = Awaited<ReturnType<typeof loadFinanceDashboard>>;

const fieldClass =
  "h-10 w-full border border-systemBlue/25 bg-black/35 px-3 text-sm text-slate-100 outline-none focus:border-systemBlue/70";

export function FinanceRoute() {
  const [state, setState] = useState<FinanceState>();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [stress, setStress] = useState(5);
  const [mood, setMood] = useState(5);
  const [goalId, setGoalId] = useState("");
  const [domain, setDomain] = useState<LifeDomain | "">("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => loadFinanceDashboard().then(setState), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitExpense() {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Enter a valid positive amount.");
      return;
    }

    await addExpense({
      amount: numericAmount,
      category,
      domain: domain || undefined,
      goalId: goalId || undefined,
      mood,
      note,
      stress
    });
    setAmount("");
    setNote("");
    setMessage("Expense stored locally.");
    await refresh();
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <header className="system-panel p-5">
        <div className="system-panel-content">
          <p className="system-label text-xs">Finance</p>
          <h1 className="system-title mt-3 text-2xl font-black text-slate-50">Quick expense capture.</h1>
          <div className="system-divider my-4" />
          <p className="max-w-3xl text-[13px] leading-6 text-slate-300">
            Low-friction spending evidence with optional goal, life-area, mood, and stress links.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <section className="system-panel p-4">
          <div className="system-panel-content space-y-3">
            <p className="system-label text-[10px]">Add expense</p>
            <label>
              <span className="mb-2 block text-[9px] uppercase tracking-[0.12em] text-slate-500">Amount</span>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 size-4 text-slate-500" />
                <input
                  className={`${fieldClass} pl-9`}
                  inputMode="decimal"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  value={amount}
                />
              </div>
            </label>
            <select className={fieldClass} onChange={(event) => setCategory(event.target.value)} value={category}>
              {["Food", "Travel", "Course", "Fitness", "Entertainment", "Bills", "Other"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              className={fieldClass}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional note"
              value={note}
            />
            <select className={fieldClass} onChange={(event) => setGoalId(event.target.value)} value={goalId}>
              <option value="">No linked goal</option>
              {state?.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            <select
              className={fieldClass}
              onChange={(event) => setDomain(event.target.value as LifeDomain | "")}
              value={domain}
            >
              <option value="">No life-area link</option>
              <option value="academics">Academics</option>
              <option value="fitness_health">Fitness / Health</option>
              <option value="finance">Finance</option>
              <option value="discipline_routine">Discipline / Routine</option>
              <option value="skills_career">Skills / Career</option>
              <option value="personality_social_confidence">Social confidence</option>
            </select>
            <RangeField label="Mood" onChange={setMood} value={mood} />
            <RangeField label="Stress" onChange={setStress} value={stress} />
            <Button className="w-full" onClick={submitExpense}>
              <Plus className="mr-2 size-4" />
              Add expense
            </Button>
            {message ? <p className="text-[11px] leading-5 text-systemCyan">{message}</p> : null}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Weekly spend" value={currency(state?.total ?? 0)} />
            <Metric label="Entries" value={String(state?.entries.length ?? 0)} />
            <Metric label="High-stress spend" value={currency(state?.stressLinkedAmount ?? 0)} tone="warning" />
          </div>
          <div className="system-panel p-4">
            <div className="system-panel-content">
              <p className="system-label text-[10px]">Weekly category summary</p>
              <div className="mt-4 space-y-2">
                {Object.entries(state?.byCategory ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value]) => (
                    <div className="flex items-center justify-between border-b border-systemBlue/10 py-2 text-sm" key={name}>
                      <span className="text-slate-400">{name}</span>
                      <span className="font-semibold text-slate-100">{currency(value)}</span>
                    </div>
                  ))}
                {!Object.keys(state?.byCategory ?? {}).length ? (
                  <p className="py-5 text-center text-[12px] text-slate-600">No expenses recorded this week.</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="system-panel p-4">
            <div className="system-panel-content">
              <p className="system-label text-[10px]">Recent entries</p>
              <div className="mt-4 space-y-2">
                {state?.entries.slice(0, 6).map((entry) => (
                  <div className="flex items-center justify-between border border-systemBlue/10 bg-black/20 p-3" key={entry.id}>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{entry.category}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{entry.note ?? entry.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-systemCyan">{currency(entry.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function RangeField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="block border border-systemBlue/15 bg-black/20 p-3">
      <span className="flex justify-between text-[9px] uppercase tracking-[0.12em] text-slate-500">
        {label}
        <span className="text-systemCyan">{value}/10</span>
      </span>
      <input
        className="mt-3 h-1 w-full accent-[#e95bff]"
        max={10}
        min={1}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
    </label>
  );
}

function Metric({ label, tone = "default", value }: { label: string; tone?: "default" | "warning"; value: string }) {
  return (
    <div className="system-panel p-4">
      <div className="system-panel-content">
        <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className={`mt-2 text-xl font-black ${tone === "warning" ? "text-amber-300" : "text-systemCyan"}`}>{value}</p>
      </div>
    </div>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(value);
}

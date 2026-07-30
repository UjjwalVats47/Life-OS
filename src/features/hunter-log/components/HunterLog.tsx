import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrainCircuit, Clock3, FlaskConical, RefreshCw, Trash2, TrendingUp, TriangleAlert } from "lucide-react";
import {
  clearDerivedHunterLogInsights,
  loadHunterLog,
  rebuildDerivedInsights
} from "@/features/hunter-log/hunterLogService";

type HunterLogState = Awaited<ReturnType<typeof loadHunterLog>>;

export function HunterLogView() {
  const [state, setState] = useState<HunterLogState>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadHunterLog().then(setState);
  }, []);

  if (!state) {
    return <div className="system-panel mx-auto max-w-7xl p-6 text-sm text-slate-500">Analyzing local behavior...</div>;
  }

  async function refreshState() {
    setState(await loadHunterLog());
  }

  return (
    <HunterLogContent
      message={message}
      onClear={async () => {
        const count = await clearDerivedHunterLogInsights();
        setMessage(`${count} derived insight snapshots cleared.`);
        await refreshState();
      }}
      onRebuild={async () => {
        const count = await rebuildDerivedInsights();
        setMessage(`${count} derived insight snapshots rebuilt.`);
        await refreshState();
      }}
      state={state}
    />
  );
}

function HunterLogContent({
  message,
  onClear,
  onRebuild,
  state
}: {
  message: string;
  onClear: () => Promise<void>;
  onRebuild: () => Promise<void>;
  state: HunterLogState;
}) {
  return (
    <section className="mx-auto max-w-7xl space-y-4">
      <header className="system-panel p-5">
        <div className="system-panel-content">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="system-label text-xs">Hunter&apos;s Log</p>
              <h1 className="system-title mt-3 text-2xl font-black text-slate-50">Behavioral pattern analysis.</h1>
            </div>
            <div className="flex gap-2">
              <IconButton label="Rebuild insights" onClick={() => void onRebuild()}>
                <RefreshCw className="size-4" />
              </IconButton>
              <IconButton label="Clear insights" onClick={() => void onClear()}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </div>
        </div>
      </header>

      {message ? (
        <div className="rounded-sm border border-systemGreen/30 bg-systemGreen/10 px-4 py-3 text-sm text-systemGreen">
          {message}
        </div>
      ) : null}

      <section className="system-panel p-4">
        <div className="system-panel-content flex items-start gap-3">
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-systemCyan" />
          <div>
            <p className="system-label text-[10px]">Current Experiment</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{state.recommendedExperiment}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Completion rate" value={`${state.completionRate}%`} />
        <Metric label="Postponement rate" value={`${state.postponementRate}%`} tone={state.postponementRate > 30 ? "warning" : "default"} />
        <Metric label="Best window" value={state.rhythm.bestWindow ?? "No evidence"} />
        <Metric label="Weak window" value={state.rhythm.weakestWindow ?? "No evidence"} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel description="Completion and postponement by time of day." title="Productivity Rhythm">
          <CanvasChart
            labels={state.rhythm.buckets.map((bucket) => bucket.label)}
            max={100}
            series={[
              { color: "#4fb7ff", data: state.rhythm.buckets.map((bucket) => bucket.completionRate), label: "Completion" },
              { color: "#ff5c78", data: state.rhythm.buckets.map((bucket) => bucket.postponementRate), label: "Postponement" }
            ]}
            type="bar"
          />
        </ChartPanel>
        <ChartPanel description="Current progress across active System goals." title="Goal Progress">
          {state.goals.length ? (
            <CanvasChart
              labels={state.goals.map((goal) => shortLabel(goal.name))}
              max={100}
              series={[
                {
                  color: "#e95bff",
                  data: state.goals.map((goal) => goal.progress),
                  label: "Progress"
                }
              ]}
              type="horizontalBar"
            />
          ) : (
            <ChartEmpty text="No goals have been activated." />
          )}
        </ChartPanel>
        <ChartPanel description="Mood and stress evidence linked to reflections and expenses." title="Mood / Stress">
          {state.moodTrend.length ? (
            <CanvasChart
              labels={state.moodTrend.map((entry) => entry.date.slice(5))}
              max={10}
              series={[
                { color: "#3df59f", data: state.moodTrend.map((entry) => entry.mood), label: "Mood" },
                { color: "#ff5c78", data: state.moodTrend.map((entry) => entry.stress), label: "Stress" }
              ]}
              type="line"
            />
          ) : (
            <ChartEmpty text="No mood or stress entries exist yet." />
          )}
        </ChartPanel>
        <ChartPanel description="Weekly spending grouped by recorded stress level." title="Finance / Stress Link">
          <CanvasChart
            labels={state.financeStress.map((item) => item.label)}
            series={[
              {
                color: "#f4c95d",
                data: state.financeStress.map((item) => item.total),
                label: "Spending"
              }
            ]}
            type="bar"
          />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="system-panel p-4 lg:col-span-2">
          <div className="system-panel-content">
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-4 text-systemCyan" />
              <p className="system-label text-[10px]">Explainable insights</p>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {state.explainableInsights.map((insight) => (
                <InsightCard insight={insight} key={insight.title} />
              ))}
            </div>
          </div>
        </section>

        <section className="system-panel p-4">
          <div className="system-panel-content">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-systemCyan" />
              <p className="system-label text-[10px]">Schedule patterns</p>
            </div>
            <div className="mt-4 space-y-2">
              {state.schedulePatterns.map((pattern, index) => (
                <div
                  className={`border-l px-3 py-2 text-[12px] leading-5 ${
                    pattern.severity === "warning"
                      ? "border-systemRed bg-systemRed/5 text-red-100"
                      : pattern.severity === "positive"
                        ? "border-systemGreen bg-systemGreen/5 text-green-100"
                        : "border-systemBlue bg-systemBlue/5 text-slate-400"
                  }`}
                  key={`${pattern.text}-${index}`}
                >
                  {pattern.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="system-panel p-4">
          <div className="system-panel-content">
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-4 text-systemCyan" />
              <p className="system-label text-[10px]">System commentary</p>
            </div>
            <div className="mt-4 space-y-3">
              {state.commentary.map((comment) => (
                <p className="border border-systemBlue/15 bg-black/25 p-3 text-[12px] leading-5 text-slate-300" key={comment}>
                  {comment}
                </p>
              ))}
              {state.savedInsights.map((insight) => (
                <div className="flex gap-2 border border-systemBlue/10 p-3" key={insight.id}>
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-systemCyan" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-200">{insight.title}</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">{insight.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-sm border border-systemBlue/25 bg-black/25 text-slate-300 transition hover:border-systemBlue/55 hover:text-systemCyan"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function InsightCard({ insight }: { insight: HunterLogState["explainableInsights"][number] }) {
  return (
    <article className={`border p-3 ${insightToneClass(insight.severity)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.06em] text-slate-50">{insight.title}</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-slate-500">
            {insight.confidence} confidence | n={insight.sampleSize} | {insight.observationWindow}
          </p>
        </div>
        <span className="rounded-sm border border-systemBlue/20 bg-black/25 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-systemCyan">
          {insight.severity}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-[12px] leading-5 md:grid-cols-3">
        <InsightDetail label="Evidence" text={insight.evidence} />
        <InsightDetail label="Alternative" text={insight.alternativeExplanation} />
        <InsightDetail label="Experiment" text={insight.experiment} />
      </div>
    </article>
  );
}

function InsightDetail({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-sm border border-systemBlue/10 bg-black/20 p-2">
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-slate-300">{text}</p>
    </div>
  );
}

function insightToneClass(severity: HunterLogState["explainableInsights"][number]["severity"]) {
  const classes = {
    critical: "border-systemRed/45 bg-systemRed/10",
    neutral: "border-systemBlue/20 bg-black/25",
    positive: "border-systemGreen/35 bg-systemGreen/10",
    warning: "border-amber-400/35 bg-amber-400/10"
  };

  return classes[severity];
}

function ChartPanel({
  children,
  description,
  title
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="system-panel p-4">
      <div className="system-panel-content">
        <p className="system-label text-[10px]">{title}</p>
        <p className="mt-2 text-[11px] text-slate-500">{description}</p>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

function Metric({ label, tone = "default", value }: { label: string; tone?: "default" | "warning"; value: string }) {
  return (
    <div className="system-panel p-4">
      <div className="system-panel-content">
        <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className={`size-4 ${tone === "warning" ? "text-systemRed" : "text-systemCyan"}`} />
          <p className={`text-lg font-black ${tone === "warning" ? "text-red-200" : "text-slate-50"}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ChartEmpty({ text }: { text: string }) {
  return <div className="flex h-[280px] items-center justify-center text-center text-[12px] text-slate-600">{text}</div>;
}

function CanvasChart({
  labels,
  max,
  series,
  type
}: {
  labels: string[];
  max?: number;
  series: Array<{ color: string; data: number[]; label: string }>;
  type: "bar" | "horizontalBar" | "line";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    drawChart(context, { height: rect.height, labels, max, series, type, width: rect.width });
  }, [labels, max, series, type]);

  return (
    <div>
      <canvas
        aria-label={`${type} chart`}
        className="h-[280px] w-full rounded-sm border border-systemBlue/10 bg-black/20"
        ref={canvasRef}
      />
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-500">
        {series.map((item) => (
          <span className="inline-flex items-center gap-1" key={item.label}>
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function drawChart(
  context: CanvasRenderingContext2D,
  chart: {
    height: number;
    labels: string[];
    max?: number;
    series: Array<{ color: string; data: number[]; label: string }>;
    type: "bar" | "horizontalBar" | "line";
    width: number;
  }
) {
  const padding = { bottom: 30, left: chart.type === "horizontalBar" ? 112 : 34, right: 18, top: 18 };
  const chartWidth = chart.width - padding.left - padding.right;
  const chartHeight = chart.height - padding.top - padding.bottom;
  const maxValue = chart.max ?? Math.max(1, ...chart.series.flatMap((item) => item.data));

  context.clearRect(0, 0, chart.width, chart.height);
  context.strokeStyle = "rgba(156,77,255,0.13)";
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight / 4) * index;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(chart.width - padding.right, y);
    context.stroke();
  }
  context.font = "10px Inter, sans-serif";
  context.fillStyle = "#7c859b";

  if (chart.type === "horizontalBar") {
    drawHorizontalBars(context, chart, padding, chartWidth, chartHeight, maxValue);
    return;
  }

  chart.labels.forEach((label, index) => {
    const x = padding.left + (chartWidth / Math.max(1, chart.labels.length - 1)) * index;
    context.fillText(label, x - 10, chart.height - 10);
  });

  if (chart.type === "line") {
    chart.series.forEach((item) => {
      context.strokeStyle = item.color;
      context.lineWidth = 2;
      context.beginPath();
      item.data.forEach((value, index) => {
        const x = padding.left + (chartWidth / Math.max(1, item.data.length - 1)) * index;
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    });
    return;
  }

  const slotWidth = chartWidth / Math.max(1, chart.labels.length);
  chart.series.forEach((item, seriesIndex) => {
    context.fillStyle = item.color;
    item.data.forEach((value, index) => {
      const barWidth = slotWidth / (chart.series.length + 1);
      const x = padding.left + index * slotWidth + seriesIndex * barWidth + 6;
      const barHeight = (value / maxValue) * chartHeight;
      context.fillRect(x, padding.top + chartHeight - barHeight, Math.max(4, barWidth - 6), barHeight);
    });
  });
}

function drawHorizontalBars(
  context: CanvasRenderingContext2D,
  chart: {
    height: number;
    labels: string[];
    max?: number;
    series: Array<{ color: string; data: number[]; label: string }>;
    type: "bar" | "horizontalBar" | "line";
    width: number;
  },
  padding: { bottom: number; left: number; right: number; top: number },
  chartWidth: number,
  chartHeight: number,
  maxValue: number
) {
  const rowHeight = chartHeight / Math.max(1, chart.labels.length);
  const data = chart.series[0]?.data ?? [];
  context.fillStyle = chart.series[0]?.color ?? "#e95bff";

  chart.labels.forEach((label, index) => {
    const y = padding.top + index * rowHeight + rowHeight * 0.25;
    const width = ((data[index] ?? 0) / maxValue) * chartWidth;
    context.fillStyle = "#9aa4b8";
    context.fillText(label, 8, y + 10);
    context.fillStyle = chart.series[0]?.color ?? "#e95bff";
    context.fillRect(padding.left, y, width, Math.max(8, rowHeight * 0.5));
  });
}

function shortLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 16)}...` : label;
}

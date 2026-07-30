import { statVisuals, type LifeStat } from "@/components/shared/statVisuals";

type StatBadgeProps = {
  label: string;
  value: number;
};

export function StatBadge({ label, value }: StatBadgeProps) {
  const statKey = label.toLowerCase() as LifeStat;
  const visual = statVisuals[statKey];
  const softShadow = visual?.shadow.replace(/0\.\d+\)/, "0.14)");

  return (
    <div
      className="rounded-sm border bg-black/25 px-3 py-2.5"
      style={{
        borderColor: visual ? `${visual.color}33` : undefined,
        boxShadow: visual
          ? `inset 0 0 18px ${softShadow}, 0 0 14px ${softShadow}`
          : "inset 0 0 18px rgba(233,91,255,0.05)"
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p
        className="mt-1.5 text-xl font-semibold"
        style={{
          color: visual?.color,
          textShadow: visual ? `0 0 10px ${visual.shadow}` : undefined
        }}
      >
        {value}
      </p>
    </div>
  );
}

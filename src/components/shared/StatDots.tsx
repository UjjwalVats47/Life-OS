import { statVisuals, type LifeStat } from "@/components/shared/statVisuals";

type StatDotsProps = {
  size?: "xs" | "sm";
  stats: LifeStat[];
};

export function StatDots({ size = "xs", stats }: StatDotsProps) {
  const dotSize = size === "sm" ? "size-2.5" : "size-2";
  const uniqueStats = Array.from(new Set(stats));

  return (
    <span
      aria-label={uniqueStats.map((stat) => statVisuals[stat].label).join(", ")}
      className="inline-flex items-center gap-1.5"
      title={uniqueStats.map((stat) => statVisuals[stat].label).join(" + ")}
    >
      {uniqueStats.map((stat) => (
        <span
          key={stat}
          className={`${dotSize} rounded-full border border-white/20`}
          style={{
            backgroundColor: statVisuals[stat].color,
            boxShadow: `0 0 8px ${statVisuals[stat].shadow}`
          }}
        />
      ))}
    </span>
  );
}


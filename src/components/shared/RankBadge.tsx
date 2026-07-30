type RankBadgeProps = {
  rank: string;
  label?: string;
  nextRank?: string;
  progress?: number;
};

export function RankBadge({ rank, label = "Active Rank", nextRank = "D", progress = 18 }: RankBadgeProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="system-panel rounded-sm px-5 py-5">
      <div className="system-panel-content">
        <p className="system-label text-xs">{label}</p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-5xl font-black leading-none text-systemCyan drop-shadow-[0_0_18px_rgba(233,91,255,0.58)]">
            {rank}
          </p>
          <p className="pb-1 text-xs uppercase tracking-[0.16em] text-slate-400">Rank</p>
        </div>
        <div
          aria-label={`${clampedProgress}% progress toward ${nextRank} Rank`}
          className="relative mt-4 h-2"
          role="progressbar"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={clampedProgress}
        >
          <span
            className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-[#1b0922] via-[#4a1858] to-[#1b0922] opacity-70 shadow-[0_0_5px_rgba(156,77,255,0.14)]"
            style={{
              clipPath: "polygon(0 48%, 14% 45%, 50% 40%, 86% 45%, 100% 48%, 100% 52%, 86% 55%, 50% 60%, 14% 55%, 0 52%)"
            }}
          />
          <span
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#27102f] via-[#632572] to-[#9140a6] shadow-[0_0_7px_rgba(233,91,255,0.28)]"
            style={{
              clipPath: "polygon(0 48%, 24% 44%, 100% 37%, 100% 63%, 24% 56%, 0 52%)",
              width: `${clampedProgress}%`
            }}
          />
          <span
            className="absolute top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#a34fba] bg-[#6f277f] shadow-[0_0_4px_rgba(233,91,255,0.9),0_0_10px_rgba(156,77,255,0.5)]"
            style={{ left: `${clampedProgress}%` }}
          />
        </div>
        <p className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span>Beginner protocol</span>
          <span>{nextRank} Rank</span>
        </p>
      </div>
    </div>
  );
}

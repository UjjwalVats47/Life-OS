type XpBarProps = {
  current: number;
  max: number;
};

export function XpBar({ current, max }: XpBarProps) {
  const value = max <= 0 ? 0 : Math.min(100, Math.round((current / max) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400">
        <span>XP Progress</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-sm border border-systemBlue/20 bg-black/40 shadow-[inset_0_0_18px_rgba(0,0,0,0.55)]">
        <div
          className="h-full rounded-sm bg-gradient-to-r from-systemBlue to-systemViolet shadow-[0_0_18px_rgba(233,91,255,0.65)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

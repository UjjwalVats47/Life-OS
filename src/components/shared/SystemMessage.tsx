type SystemMessageProps = {
  title: string;
  body: string;
};

export function SystemMessage({ title, body }: SystemMessageProps) {
  return (
    <aside className="system-panel rounded-sm p-4 text-[13px] text-slate-200">
      <div className="system-panel-content flex gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-systemBlue/50 bg-systemBlue/10 text-base font-semibold text-systemCyan shadow-system">
          !
        </span>
        <span>
          <p className="system-label text-xs">{title}</p>
          <p className="mt-2 leading-6 text-slate-300">{body}</p>
        </span>
      </div>
    </aside>
  );
}

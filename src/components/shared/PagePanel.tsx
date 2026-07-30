type PagePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PagePanel({ eyebrow, title, description }: PagePanelProps) {
  return (
    <section className="system-panel mx-auto max-w-5xl rounded-sm p-5 shadow-system">
      <div className="system-panel-content">
        <p className="system-label text-xs font-semibold">{eyebrow}</p>
        <h1 className="system-title mt-3 text-2xl font-black text-slate-50">{title}</h1>
        <div className="system-divider my-4" />
        <p className="max-w-3xl text-[13px] leading-6 text-slate-300">{description}</p>
      </div>
    </section>
  );
}

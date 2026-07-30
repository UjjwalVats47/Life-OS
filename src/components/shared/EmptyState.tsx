type EmptyStateProps = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-700 bg-panel/50 p-6 text-center">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SystemMessage } from "@/components/shared/SystemMessage";

export function IndexRoute() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center gap-8 px-5 py-10">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-systemCyan">
          The System: Life OS
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold text-slate-50 md:text-6xl">
          Identity transformation, structured into quests.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-300">
          Local-first command center for goals, habits, scheduling, XP, and
          behavioral insight. Milestone 1 is the foundation shell.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/awakening">Begin Awakening</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/dashboard">Open Command Center</Link>
        </Button>
      </div>
      <SystemMessage
        title="System Status"
        body="Rule-based core online. External AI disabled by default. Local database initializing on this device."
      />
    </section>
  );
}

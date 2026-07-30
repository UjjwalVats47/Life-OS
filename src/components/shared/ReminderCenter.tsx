import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, X } from "lucide-react";

import {
  completeReminder,
  deliverDueReminders,
  dismissReminder,
  loadReminderCenter
} from "@/system/notifications/reminderEngine";
import type { Notification } from "@/types/domain";

export function ReminderCenter() {
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState<Notification[]>([]);

  const refresh = useCallback(async () => {
    await deliverDueReminders();
    setReminders(await loadReminderCenter());
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  async function dismiss(id: string) {
    await dismissReminder(id);
    await refresh();
  }

  async function complete(id: string) {
    await completeReminder(id);
    await refresh();
  }

  return (
    <div className="fixed right-3 top-3 z-40 md:right-5 md:top-5">
      <button
        aria-label="Open reminders"
        className="relative inline-flex size-11 items-center justify-center rounded-sm border border-systemBlue/35 bg-black/55 text-systemCyan shadow-system backdrop-blur transition hover:border-systemBlue/70"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <BellRing className="size-4" />
        {reminders.length ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-systemBlue/50 bg-systemBlue text-[10px] font-black text-black">
            {reminders.length}
          </span>
        ) : null}
      </button>

      {open || reminders.length ? (
        <section className="system-panel mt-2 w-[min(88vw,360px)] rounded-sm p-3">
          <div className="system-panel-content">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="system-label text-[10px] font-semibold">Reminder Center</p>
              <button
                aria-label="Close reminders"
                className="rounded-sm border border-systemBlue/20 p-1 text-slate-400 hover:text-systemCyan"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {reminders.length ? (
              <div className="space-y-2">
                {reminders.slice(0, 4).map((reminder) => (
                  <article
                    className="rounded-sm border border-systemBlue/15 bg-black/35 px-3 py-2"
                    key={reminder.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-100">{reminder.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400">{reminder.body}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          aria-label={`Complete ${reminder.title}`}
                          className="rounded-sm border border-systemGreen/30 p-1 text-systemGreen"
                          onClick={() => void complete(reminder.id)}
                          type="button"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          aria-label={`Dismiss ${reminder.title}`}
                          className="rounded-sm border border-systemBlue/20 p-1 text-slate-400"
                          onClick={() => void dismiss(reminder.id)}
                          type="button"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-sm border border-systemBlue/10 bg-black/25 px-3 py-2 text-xs text-slate-500">
                No due reminders.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

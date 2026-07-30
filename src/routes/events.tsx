import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, Check, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addEvent,
  approveCalendarImport,
  loadEventsDashboard,
  previewCalendarImport,
  updatePrepItem
} from "@/features/events/eventsService";
import type { LifeEvent } from "@/types/domain";

type EventsState = Awaited<ReturnType<typeof loadEventsDashboard>>;
type CalendarPreview = Awaited<ReturnType<typeof previewCalendarImport>>;
const fieldClass =
  "h-10 w-full border border-systemBlue/25 bg-black/35 px-3 text-sm text-slate-100 outline-none focus:border-systemBlue/70";
const textareaClass = `${fieldClass} h-auto min-h-32 py-3 leading-6`;

export function EventsRoute() {
  const [state, setState] = useState<EventsState>([]);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<LifeEvent["eventType"]>("exam_test");
  const [importance, setImportance] = useState<LifeEvent["importance"]>("high");
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)
  );
  const [calendarText, setCalendarText] = useState("");
  const [calendarPreview, setCalendarPreview] = useState<CalendarPreview>([]);
  const [message, setMessage] = useState("");
  const refresh = useCallback(() => loadEventsDashboard().then(setState), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submit() {
    if (title.trim().length < 2) {
      setMessage("Enter an event title.");
      return;
    }
    await addEvent({ eventDate, eventType, importance, title: title.trim() });
    setTitle("");
    setMessage("Event and draft preparation plan created.");
    await refresh();
  }

  async function runCalendarPreview() {
    if (!calendarText.trim()) {
      setMessage("Paste calendar .ics text before preview.");
      return;
    }

    const preview = await previewCalendarImport(calendarText);
    setCalendarPreview(preview);
    setMessage(preview.length ? `${preview.length} calendar items ready for review.` : "No calendar events found.");
  }

  async function approveImportedEvents() {
    if (!calendarPreview.length) {
      setMessage("Preview calendar items before approving.");
      return;
    }

    await approveCalendarImport(calendarPreview);
    setCalendarText("");
    setCalendarPreview([]);
    setMessage("Calendar items imported as Life OS events.");
    await refresh();
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <header className="system-panel p-5">
        <div className="system-panel-content">
          <p className="system-label text-xs">Events</p>
          <h1 className="system-title mt-3 text-2xl font-black text-slate-50">Deadlines and preparation plans.</h1>
          <div className="system-divider my-4" />
          <p className="max-w-3xl text-[13px] leading-6 text-slate-300">
            Add real deadlines, review backward preparation checkpoints, edit dates, and approve tasks into the System.
          </p>
        </div>
      </header>

      <section className="system-panel p-4">
        <div className="system-panel-content">
          <p className="system-label text-[10px]">Add event</p>
          <div className="mt-4 grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <input className={fieldClass} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" value={title} />
            <select className={fieldClass} onChange={(event) => setEventType(event.target.value as LifeEvent["eventType"])} value={eventType}>
              <option value="exam_test">Exam / test</option>
              <option value="submission">Submission</option>
              <option value="interview">Interview</option>
              <option value="bill_due">Bill due</option>
              <option value="birthday_anniversary">Birthday / anniversary</option>
              <option value="user_defined">Other</option>
            </select>
            <input className={fieldClass} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setEventDate(event.target.value)} type="date" value={eventDate} />
            <select className={fieldClass} onChange={(event) => setImportance(event.target.value as LifeEvent["importance"])} value={importance}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <Button onClick={submit}>
              <CalendarPlus className="mr-2 size-4" />
              Add
            </Button>
          </div>
          {message ? <p className="mt-3 text-[11px] text-systemCyan">{message}</p> : null}
        </div>
      </section>

      <section className="system-panel p-4">
        <div className="system-panel-content">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="system-label text-[10px]">Calendar import</p>
            <div className="flex gap-2">
              <Button className="h-9 px-3 text-[10px]" onClick={runCalendarPreview} variant="ghost">
                <Upload className="mr-2 size-3.5" />
                Preview
              </Button>
              <Button
                className="h-9 px-3 text-[10px]"
                disabled={!calendarPreview.length}
                onClick={approveImportedEvents}
                variant="secondary"
              >
                <Check className="mr-2 size-3.5" />
                Import selected
              </Button>
            </div>
          </div>
          <textarea
            className={`${textareaClass} mt-4`}
            onChange={(event) => setCalendarText(event.target.value)}
            placeholder="Paste .ics calendar text"
            value={calendarText}
          />
          {calendarPreview.length ? (
            <div className="mt-4 grid gap-2">
              {calendarPreview.map((item) => (
                <CalendarPreviewRow item={item} key={`${item.sourceId ?? item.title}-${item.startDate}-${item.startTime ?? ""}`} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="space-y-4">
        {state.map(({ event, prepItems }) => (
          <section className="system-panel p-4" key={event.id}>
            <div className="system-panel-content">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-systemCyan">{event.eventType.split("_").join(" ")}</p>
                  <h2 className="mt-2 text-lg font-black text-slate-50">{event.title}</h2>
                </div>
                <span className="border border-systemBlue/25 bg-systemBlue/5 px-3 py-1 text-[11px] text-slate-300">
                  {event.eventDate} | {event.importance}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {prepItems.map((prep, index) => (
                  <PrepRow
                    index={index + 1}
                    key={prep.id}
                    prep={prep}
                    refresh={refresh}
                  />
                ))}
                {!prepItems.length ? <p className="text-[12px] text-slate-600">No future preparation checkpoints remain.</p> : null}
              </div>
            </div>
          </section>
        ))}
        {!state.length ? <div className="system-panel p-6 text-center text-[12px] text-slate-600">No events recorded.</div> : null}
      </div>
    </section>
  );
}

function CalendarPreviewRow({ item }: { item: CalendarPreview[number] }) {
  return (
    <article className="grid gap-3 border border-systemBlue/15 bg-black/25 p-3 md:grid-cols-[1fr_auto]">
      <div>
        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">
          {item.startDate}
          {item.startTime ? ` | ${item.startTime}${item.endTime ? `-${item.endTime}` : ""}` : ""}
          {" | "}
          {item.suggestedEvent.eventType.split("_").join(" ")}
        </p>
        {item.conflicts.length ? (
          <div className="mt-3 space-y-1">
            {item.conflicts.map((conflict) => (
              <p
                className="flex items-center gap-2 text-[11px] leading-5 text-amber-200"
                key={`${conflict.conflictType}-${conflict.conflictingTitle}`}
              >
                <AlertTriangle className="size-3.5 shrink-0" />
                {conflict.message}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <span
        className={`h-fit border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${
          item.conflicts.length
            ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
            : "border-systemGreen/30 bg-systemGreen/10 text-systemGreen"
        }`}
      >
        {item.conflicts.length ? `${item.conflicts.length} conflict${item.conflicts.length > 1 ? "s" : ""}` : "clear"}
      </span>
    </article>
  );
}

function PrepRow({
  index,
  prep,
  refresh
}: {
  index: number;
  prep: EventsState[number]["prepItems"][number];
  refresh: () => Promise<void>;
}) {
  const [date, setDate] = useState(prep.scheduledDate);

  return (
    <div className="grid gap-2 border border-systemBlue/15 bg-black/25 p-3 md:grid-cols-[auto_1fr_160px_auto_auto] md:items-center">
      <span className="text-[10px] text-slate-500">#{index}</span>
      <div>
        <p className="text-xs font-semibold text-slate-100">Preparation checkpoint</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">{prep.status}</p>
      </div>
      <input className={fieldClass} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
      <Button
        className="h-9 px-3 text-[10px]"
        onClick={async () => {
          await updatePrepItem(prep.id, { scheduledDate: date });
          await refresh();
        }}
        variant="ghost"
      >
        <Save className="mr-2 size-3.5" />
        Save
      </Button>
      <Button
        className="h-9 px-3 text-[10px]"
        disabled={prep.status === "approved"}
        onClick={async () => {
          await updatePrepItem(prep.id, { scheduledDate: date, status: "approved" });
          await refresh();
        }}
        variant="secondary"
      >
        <Check className="mr-2 size-3.5" />
        {prep.status === "approved" ? "Approved" : "Approve"}
      </Button>
    </div>
  );
}

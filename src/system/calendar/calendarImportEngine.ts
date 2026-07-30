import type { Commitment, LifeEvent, ScheduleBlock } from "@/types/domain";

export type CalendarImportItem = {
  description?: string;
  endDate?: string;
  endTime?: string;
  sourceId?: string;
  startDate: string;
  startTime?: string;
  title: string;
};

export type CalendarConflict = {
  conflictingTitle: string;
  conflictType: "fixed_block" | "commitment" | "event";
  message: string;
};

export type CalendarImportPreview = CalendarImportItem & {
  conflicts: CalendarConflict[];
  suggestedEvent: Pick<LifeEvent, "details" | "eventDate" | "eventType" | "importance" | "title">;
};

export function parseIcsCalendar(text: string): CalendarImportItem[] {
  const unfolded = unfoldIcsLines(text);
  const events = collectEventBlocks(unfolded);

  return events
    .map(parseEventBlock)
    .filter((event): event is CalendarImportItem => Boolean(event))
    .sort((a, b) => `${a.startDate}${a.startTime ?? ""}`.localeCompare(`${b.startDate}${b.startTime ?? ""}`));
}

export function createCalendarImportPreview(input: {
  commitments: Commitment[];
  events: LifeEvent[];
  importedItems: CalendarImportItem[];
  scheduleBlocks: ScheduleBlock[];
}) {
  return input.importedItems.map<CalendarImportPreview>((item) => {
    const conflicts = findConflicts(item, input.scheduleBlocks, input.commitments, input.events);
    const details = [
      item.description,
      item.startTime ? `Imported calendar time: ${item.startTime}${item.endTime ? `-${item.endTime}` : ""}` : undefined,
      item.sourceId ? `Calendar UID: ${item.sourceId}` : undefined
    ]
      .filter(Boolean)
      .join("\n");

    return {
      ...item,
      conflicts,
      suggestedEvent: {
        details: details || undefined,
        eventDate: item.startDate,
        eventType: inferEventType(item.title),
        importance: inferImportance(item, conflicts),
        title: item.title
      }
    };
  });
}

function unfoldIcsLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce<string[]>((lines, line) => {
      if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length) {
        lines[lines.length - 1] += line.slice(1);
        return lines;
      }

      lines.push(line.trimEnd());
      return lines;
    }, []);
}

function collectEventBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] | undefined;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = [];
      continue;
    }

    if (line === "END:VEVENT") {
      if (current) blocks.push(current);
      current = undefined;
      continue;
    }

    if (current) current.push(line);
  }

  return blocks;
}

function parseEventBlock(lines: string[]): CalendarImportItem | undefined {
  const fields = new Map<string, string>();

  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).split(";")[0].toUpperCase();
    const value = decodeIcsText(line.slice(separator + 1));
    fields.set(key, value);
  }

  const start = parseIcsDate(fields.get("DTSTART"));
  if (!start) return undefined;

  const end = parseIcsDate(fields.get("DTEND"));
  const title = fields.get("SUMMARY")?.trim();
  if (!title) return undefined;

  const item: CalendarImportItem = {
    startDate: start.date,
    title
  };
  const description = fields.get("DESCRIPTION");
  const sourceId = fields.get("UID");

  if (description) item.description = description;
  if (end?.date) item.endDate = end.date;
  if (end?.time) item.endTime = end.time;
  if (sourceId) item.sourceId = sourceId;
  if (start.time) item.startTime = start.time;

  return item;
}

function parseIcsDate(value?: string) {
  if (!value) return undefined;
  const compact = value.trim();
  const dateMatch = compact.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!dateMatch) return undefined;

  return {
    date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
    time: dateMatch[4] && dateMatch[5] ? `${dateMatch[4]}:${dateMatch[5]}` : undefined
  };
}

function decodeIcsText(value: string) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function findConflicts(
  item: CalendarImportItem,
  scheduleBlocks: ScheduleBlock[],
  commitments: Commitment[],
  events: LifeEvent[]
) {
  const conflicts: CalendarConflict[] = [];
  if (!item.startTime || !item.endTime) {
    return conflicts;
  }

  const dayOfWeek = new Date(`${item.startDate}T00:00:00`).getDay();
  const importedRange = { end: toMinutes(item.endTime), start: toMinutes(item.startTime) };

  for (const block of scheduleBlocks.filter((block) => block.dayOfWeek === dayOfWeek)) {
    if (overlaps(importedRange, { end: toMinutes(block.endTime), start: toMinutes(block.startTime) })) {
      conflicts.push({
        conflictingTitle: block.title,
        conflictType: "fixed_block",
        message: `Overlaps fixed block: ${block.title}`
      });
    }
  }

  for (const commitment of commitments.filter((commitment) => commitment.dayOfWeek === dayOfWeek)) {
    if (overlaps(importedRange, { end: toMinutes(commitment.endTime), start: toMinutes(commitment.startTime) })) {
      conflicts.push({
        conflictingTitle: commitment.title,
        conflictType: "commitment",
        message: `Overlaps commitment: ${commitment.title}`
      });
    }
  }

  for (const event of events.filter((event) => event.eventDate === item.startDate)) {
    conflicts.push({
      conflictingTitle: event.title,
      conflictType: "event",
      message: `Same date as existing event: ${event.title}`
    });
  }

  return conflicts;
}

function inferEventType(title: string): LifeEvent["eventType"] {
  const normalized = title.toLowerCase();
  if (/\b(exam|test|quiz)\b/.test(normalized)) return "exam_test";
  if (/\b(submission|assignment|project|deadline)\b/.test(normalized)) return "submission";
  if (/\b(interview)\b/.test(normalized)) return "interview";
  if (/\b(bill|payment|fee|rent)\b/.test(normalized)) return "bill_due";
  if (/\b(birthday|anniversary)\b/.test(normalized)) return "birthday_anniversary";
  return "user_defined";
}

function inferImportance(item: CalendarImportItem, conflicts: CalendarConflict[]): LifeEvent["importance"] {
  if (conflicts.some((conflict) => conflict.conflictType === "fixed_block")) return "critical";
  if (conflicts.length) return "high";
  if (item.startTime) return "medium";
  return "low";
}

function overlaps(a: { end: number; start: number }, b: { end: number; start: number }) {
  return a.start < b.end && b.start < a.end;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

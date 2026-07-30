import { describe, expect, it } from "vitest";
import {
  createCalendarImportPreview,
  parseIcsCalendar
} from "@/system/calendar/calendarImportEngine";
import type { Commitment, LifeEvent, ScheduleBlock } from "@/types/domain";

describe("calendarImportEngine", () => {
  it("parses ICS events into sorted calendar import items", () => {
    const items = parseIcsCalendar(`
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:exam-1
SUMMARY:Physics exam
DTSTART:20260820T090000
DTEND:20260820T110000
DESCRIPTION:Chapter 1\\nChapter 2
END:VEVENT
BEGIN:VEVENT
UID:bill-1
SUMMARY:Hostel fee payment
DTSTART;VALUE=DATE:20260815
END:VEVENT
END:VCALENDAR
`);

    expect(items).toEqual([
      expect.objectContaining({
        sourceId: "bill-1",
        startDate: "2026-08-15",
        title: "Hostel fee payment"
      }),
      expect.objectContaining({
        description: "Chapter 1\nChapter 2",
        endTime: "11:00",
        sourceId: "exam-1",
        startDate: "2026-08-20",
        startTime: "09:00",
        title: "Physics exam"
      })
    ]);
  });

  it("previews conflicts against fixed blocks, commitments, and existing events", () => {
    const preview = createCalendarImportPreview({
      commitments: [
        makeCommitment({
          dayOfWeek: 4,
          endTime: "10:30",
          startTime: "09:30",
          title: "Interview prep"
        })
      ],
      events: [
        makeEvent({
          eventDate: "2026-08-20",
          title: "Math test"
        })
      ],
      importedItems: [
        {
          endTime: "10:00",
          startDate: "2026-08-20",
          startTime: "09:00",
          title: "Physics exam"
        }
      ],
      scheduleBlocks: [
        makeScheduleBlock({
          dayOfWeek: 4,
          endTime: "14:30",
          startTime: "08:00",
          title: "School"
        })
      ]
    });

    expect(preview[0].suggestedEvent).toMatchObject({
      eventDate: "2026-08-20",
      eventType: "exam_test",
      importance: "critical",
      title: "Physics exam"
    });
    expect(preview[0].conflicts.map((conflict) => conflict.conflictType)).toEqual([
      "fixed_block",
      "commitment",
      "event"
    ]);
  });
});

function makeScheduleBlock(overrides: Partial<ScheduleBlock>): ScheduleBlock {
  return {
    blockType: "school",
    createdAt: "2026-07-30T00:00:00.000Z",
    dayOfWeek: 1,
    endTime: "12:00",
    id: "block-1",
    startTime: "08:00",
    title: "Block",
    updatedAt: "2026-07-30T00:00:00.000Z",
    userId: "user-1",
    ...overrides
  };
}

function makeCommitment(overrides: Partial<Commitment>): Commitment {
  return {
    commitmentType: "fixed",
    createdAt: "2026-07-30T00:00:00.000Z",
    dayOfWeek: 1,
    endTime: "12:00",
    id: "commitment-1",
    startTime: "08:00",
    title: "Commitment",
    updatedAt: "2026-07-30T00:00:00.000Z",
    userId: "user-1",
    ...overrides
  };
}

function makeEvent(overrides: Partial<LifeEvent>): LifeEvent {
  return {
    createdAt: "2026-07-30T00:00:00.000Z",
    eventDate: "2026-08-01",
    eventType: "user_defined",
    id: "event-1",
    importance: "medium",
    status: "planned",
    title: "Event",
    updatedAt: "2026-07-30T00:00:00.000Z",
    userId: "user-1",
    ...overrides
  };
}

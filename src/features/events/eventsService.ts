import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { generateEventPrepPlan } from "@/system/events/eventPrepEngine";
import { getBaseXp } from "@/system/gamification/xpEngine";
import type { EventPrepItem, LifeEvent, TaskTemplate } from "@/types/domain";
import type { LifeDomain, StatName } from "@/types/enums";

export async function loadEventsDashboard() {
  const userId = defaultUserProfileId;
  const [events, prepItems] = await Promise.all([
    db.events.where("userId").equals(userId).toArray(),
    db.eventPrepItems.where("userId").equals(userId).toArray()
  ]);

  return events
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .map((event) => ({
      event,
      prepItems: prepItems
        .filter((item) => item.eventId === event.id)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    }));
}

export async function addEvent(
  input: Pick<LifeEvent, "eventDate" | "eventType" | "importance" | "title">
) {
  const timestamp = nowIso();
  const userId = defaultUserProfileId;
  const event: LifeEvent = {
    ...input,
    createdAt: timestamp,
    id: createId(),
    status: "planned",
    updatedAt: timestamp,
    userId
  };
  const prepItems = generateEventPrepPlan(event).map<EventPrepItem>((step) => ({
    createdAt: timestamp,
    eventId: event.id,
    id: createId(),
    scheduledDate: step.scheduledDate,
    status: "draft",
    updatedAt: timestamp,
    userId
  }));

  await db.transaction("rw", [db.events, db.eventPrepItems], async () => {
    await db.events.put(event);
    await db.eventPrepItems.bulkPut(prepItems);
  });
}

export async function updatePrepItem(
  prepItemId: string,
  update: { scheduledDate?: string; status?: EventPrepItem["status"] }
) {
  const timestamp = nowIso();

  await db.transaction("rw", [db.eventPrepItems, db.events, db.taskTemplates], async () => {
    const prep = await db.eventPrepItems.get(prepItemId);
    if (!prep) throw new Error("Preparation item was not found.");

    let taskTemplateId = prep.taskTemplateId;
    if (update.status === "approved" && !taskTemplateId) {
      const event = await db.events.get(prep.eventId);
      if (!event) throw new Error("Linked event was not found.");
      const domain = domainForEvent(event.eventType);
      const task: TaskTemplate = {
        baseXp: getBaseXp("deadline_prep"),
        category: "deadline_prep",
        createdAt: timestamp,
        difficulty: event.importance === "critical" ? "hard" : "normal",
        domain,
        estimatedMinutes: 45,
        eventId: event.id,
        id: createId(),
        statWeights: statWeightsForDomain(domain),
        status: "active",
        title: `Prepare: ${event.title}`,
        updatedAt: timestamp,
        userId: event.userId
      };
      taskTemplateId = task.id;
      await db.taskTemplates.put(task);
    }

    await db.eventPrepItems.update(prepItemId, {
      ...update,
      taskTemplateId,
      updatedAt: timestamp
    });
  });
}

function domainForEvent(eventType: LifeEvent["eventType"]): LifeDomain {
  if (eventType === "exam_test" || eventType === "submission") return "academics";
  if (eventType === "interview") return "skills_career";
  if (eventType === "bill_due") return "finance";
  if (eventType === "birthday_anniversary") return "personality_social_confidence";
  return "discipline_routine";
}

function statWeightsForDomain(domain: LifeDomain): Partial<Record<StatName, number>> {
  if (domain === "academics" || domain === "skills_career") return { focus: 40, intelligence: 60 };
  if (domain === "finance") return { discipline: 40, perception: 60 };
  if (domain === "personality_social_confidence") return { discipline: 40, perception: 60 };
  return { discipline: 70, focus: 30 };
}

import type { LifeEvent } from "@/types/domain";

export type EventPrepStep = {
  purpose: string;
  scheduledDate: string;
  title: string;
};

type EventType = LifeEvent["eventType"];

const templates: Record<EventType, Array<{ daysBefore: number; purpose: string; title: string }>> = {
  exam_test: [
    { daysBefore: 14, purpose: "Expose weak topics before urgency becomes dominant.", title: "Diagnostic review" },
    { daysBefore: 7, purpose: "Practice under realistic conditions.", title: "Timed practice" },
    { daysBefore: 2, purpose: "Close the highest-impact gaps.", title: "Final weak-area review" }
  ],
  submission: [
    { daysBefore: 10, purpose: "Define scope and remove ambiguity.", title: "Submission outline" },
    { daysBefore: 5, purpose: "Create a complete working draft.", title: "Draft checkpoint" },
    { daysBefore: 1, purpose: "Check requirements and submit safely.", title: "Final review" }
  ],
  interview: [
    { daysBefore: 10, purpose: "Understand the role and expected evidence.", title: "Role research" },
    { daysBefore: 5, purpose: "Practice high-probability questions.", title: "Mock interview" },
    { daysBefore: 1, purpose: "Prepare logistics and recovery.", title: "Interview readiness check" }
  ],
  bill_due: [
    { daysBefore: 5, purpose: "Verify amount and available balance.", title: "Payment readiness check" },
    { daysBefore: 1, purpose: "Prevent a missed due date.", title: "Payment reminder" }
  ],
  birthday_anniversary: [
    { daysBefore: 7, purpose: "Decide the intended gesture or plan.", title: "Plan occasion" },
    { daysBefore: 1, purpose: "Confirm the final details.", title: "Occasion reminder" }
  ],
  user_defined: [
    { daysBefore: 7, purpose: "Define what ready looks like.", title: "Preparation checkpoint" },
    { daysBefore: 1, purpose: "Resolve remaining details.", title: "Final readiness check" }
  ]
};

export function generateEventPrepPlan(
  event: Pick<LifeEvent, "eventDate" | "eventType" | "importance" | "title">,
  today = new Date().toISOString().slice(0, 10)
) {
  const todayTime = parseDate(today).getTime();
  const steps = templates[event.eventType]
    .map((template) => ({
      purpose: template.purpose,
      scheduledDate: subtractDays(event.eventDate, template.daysBefore),
      title: `${event.title}: ${template.title}`
    }))
    .filter((step) => parseDate(step.scheduledDate).getTime() >= todayTime);

  if (event.importance === "critical" && parseDate(event.eventDate).getTime() >= todayTime) {
    steps.push({
      purpose: "Confirm that the critical event is ready and no blocker is hidden.",
      scheduledDate: event.eventDate,
      title: `${event.title}: final confirmation`
    });
  }

  return steps.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

function subtractDays(date: string, days: number) {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() - days);

  return value.toISOString().slice(0, 10);
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

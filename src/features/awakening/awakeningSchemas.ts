import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const realitySchema = z.object({
  currentState: z.string().trim().min(10, "Describe the current situation in at least 10 characters."),
  displayName: z.string().trim().min(1, "Enter a name for the System to use.")
});

export const scheduleSchema = z
  .object({
    commitments: z.array(
      z
        .object({
          dayOfWeeks: z.array(z.number().min(0).max(6)).min(1, "Select at least one day."),
          endTime: z.string().regex(timePattern),
          startTime: z.string().regex(timePattern),
          title: z.string().trim().min(1)
        })
        .refine((item) => item.endTime > item.startTime, "Commitment end time must be after its start.")
    ),
    fixedBlocks: z.array(
      z
        .object({
          dayOfWeeks: z.array(z.number().min(0).max(6)).min(1, "Select at least one day."),
          endTime: z.string().regex(timePattern),
          startTime: z.string().regex(timePattern),
          title: z.string().trim().min(1)
        })
        .refine((item) => item.endTime > item.startTime, "Fixed-block end time must be after its start.")
    )
  })
  .refine((value) => value.fixedBlocks.length + value.commitments.length > 0, {
    message: "Add at least one fixed block or commitment."
  });

export const goalsSchema = z.object({
  goals: z
    .array(
      z.object({
        level: z.enum(["primary", "secondary"]),
        reason: z.string().trim().min(3, "Each goal needs a reason."),
        title: z.string().trim().min(2, "Each goal needs a title.")
      })
    )
    .refine((goals) => goals.some((goal) => goal.level === "primary"), "At least one primary goal is required.")
});

export const personalitySchema = z.object({
  agreeableness: z.number().min(0).max(100),
  conscientiousness: z.number().min(0).max(100),
  extraversion: z.number().min(0).max(100),
  neuroticism: z.number().min(0).max(100),
  openness: z.number().min(0).max(100),
  problemAreasText: z.string().trim().min(3, "Add at least one blocker or weak area.")
});

export const eventsSchema = z.object({
  events: z.array(
    z.object({
      eventDate: z.string().min(10, "Each event needs a date."),
      title: z.string().trim().min(2, "Each event needs a title.")
    })
  )
});

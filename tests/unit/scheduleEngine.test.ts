import { describe, expect, it } from "vitest";
import { adjustFlexibleDurations } from "@/system/scheduling/scheduleEngine";
import { detectFreeBlocks } from "@/system/scheduling/slotDetection";
import { createRecoveryDirective } from "@/system/scheduling/recoveryEngine";
import { calculateWeeklyPersonalTime } from "@/system/scheduling/weeklyReviewEngine";

describe("schedule engines", () => {
  it("merges occupied time and detects real free blocks", () => {
    expect(
      detectFreeBlocks(
        [
          { startMinutes: 480, endMinutes: 540 },
          { startMinutes: 530, endMinutes: 600 },
          { startMinutes: 900, endMinutes: 960 }
        ],
        { dayStartMinutes: 360, dayEndMinutes: 1320 }
      )
    ).toEqual([
      { startMinutes: 360, endMinutes: 480 },
      { startMinutes: 600, endMinutes: 900 },
      { startMinutes: 960, endMinutes: 1320 }
    ]);
  });

  it("adjusts flexible tasks while preserving locked durations", () => {
    expect(
      adjustFlexibleDurations(
        [
          { id: "exercise", locked: true, minimumMinutes: 45, preferredMinutes: 45, maximumMinutes: 45 },
          { id: "bath", minimumMinutes: 10, preferredMinutes: 15, maximumMinutes: 20 },
          { id: "coding", minimumMinutes: 110, preferredMinutes: 120, maximumMinutes: 130 }
        ],
        175
      )
    ).toEqual([
      { id: "exercise", minutes: 45 },
      { id: "bath", minutes: 15 },
      { id: "coding", minutes: 115 }
    ]);
  });

  it("adapts personal time from behavior while protecting recovery", () => {
    expect(
      calculateWeeklyPersonalTime({
        basePersonalTimeHours: 7,
        completionRate: 0.9,
        currentPersonalTimeHours: 7,
        postponementRate: 0.05
      }).nextPersonalTimeHours
    ).toBe(8);
    expect(
      calculateWeeklyPersonalTime({
        averageStress: 8,
        basePersonalTimeHours: 7,
        completionRate: 0.4,
        currentPersonalTimeHours: 6,
        postponementRate: 0.5
      })
    ).toMatchObject({ carryoverPolicy: "protect_recovery", mode: "recovery_protected", nextPersonalTimeHours: 7 });
  });

  it("uses midweek review for calibration and recovery directives for pressure", () => {
    expect(
      calculateWeeklyPersonalTime({
        basePersonalTimeHours: 7,
        completionRate: 0.9,
        currentPersonalTimeHours: 7,
        postponementRate: 0.05,
        reviewType: "midweek_calibration"
      })
    ).toMatchObject({ adjustmentHours: 0, reviewType: "midweek_calibration" });

    expect(
      createRecoveryDirective({
        completionRate: 0.55,
        postponementRate: 0.2,
        sundayMode: "heavy_catchup",
        unfinishedImportantCount: 4
      })
    ).toMatchObject({ intensity: "deadline_first", recoveryMinutes: 90 });
  });
});

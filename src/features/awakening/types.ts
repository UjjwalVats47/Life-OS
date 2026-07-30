import type { LifeDomain } from "@/types/enums";
import type { Commitment, LifeEvent, ScheduleBlock } from "@/types/domain";
import type { IdentityOption } from "@/system/identity/identityEngine";

export type AwakeningBlock = Pick<
  ScheduleBlock,
  "blockType" | "dayOfWeek" | "endTime" | "startTime" | "title"
> & {
  dayOfWeeks: number[];
  draftId: string;
};

export type AwakeningCommitment = Pick<
  Commitment,
  "commitmentType" | "dayOfWeek" | "endTime" | "startTime" | "title"
> & {
  domain?: LifeDomain;
  dayOfWeeks: number[];
  draftId: string;
};

export type AwakeningGoal = {
  domain: LifeDomain;
  draftId: string;
  level: "primary" | "secondary";
  reason: string;
  timelineMonths: 3 | 6 | 9 | 12 | 18;
  title: string;
};

export type AwakeningEvent = Pick<
  LifeEvent,
  "eventDate" | "eventType" | "importance" | "title"
> & {
  draftId: string;
};

export type AwakeningDraft = {
  agreeableness: number;
  conscientiousness: number;
  currentState: string;
  desiredDirection: string;
  displayName: string;
  events: AwakeningEvent[];
  extraversion: number;
  fixedBlocks: AwakeningBlock[];
  goals: AwakeningGoal[];
  identityConfidence: "low" | "medium" | "high";
  identityOptions: IdentityOption[];
  mbtiType: string;
  neuroticism: number;
  openness: number;
  problemAreasText: string;
  selectedIdentityName?: string;
  commitments: AwakeningCommitment[];
};

export function createInitialAwakeningDraft(): AwakeningDraft {
  return {
    agreeableness: 50,
    commitments: [],
    conscientiousness: 50,
    currentState: "",
    desiredDirection: "",
    displayName: "Hunter",
    events: [],
    extraversion: 50,
    fixedBlocks: [],
    goals: [
      {
        domain: "skills_career",
        draftId: "primary-goal",
        level: "primary",
        reason: "",
        timelineMonths: 6,
        title: ""
      }
    ],
    identityConfidence: "medium",
    identityOptions: [],
    mbtiType: "",
    neuroticism: 50,
    openness: 50,
    problemAreasText: "",
    selectedIdentityName: undefined
  };
}

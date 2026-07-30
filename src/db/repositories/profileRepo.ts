import { db } from "@/db/lifeOsDb";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import type { UserProfile } from "@/types/domain";

export const defaultUserProfileId = "local-user";

export async function ensureDefaultProfile(): Promise<UserProfile> {
  const existing = await db.userProfiles.get(defaultUserProfileId);

  if (existing) {
    return existing;
  }

  const timestamp = nowIso();
  const profile: UserProfile = {
    id: defaultUserProfileId || createId(),
    activeIdentityPathId: undefined,
    basePersonalTimeHoursPerWeek: 7,
    createdAt: timestamp,
    currentPersonalTimeHoursPerWeek: 7,
    displayName: "Hunter",
    onboardingCompleted: false,
    updatedAt: timestamp
  };

  await db.userProfiles.put(profile);
  return profile;
}

export async function getDefaultProfile() {
  return ensureDefaultProfile();
}

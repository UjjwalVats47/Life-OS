import { describe, expect, it } from "vitest";
import { createStarterIdentityOptions } from "@/system/identity/identityEngine";

describe("identityEngine", () => {
  it("returns two or three options according to confidence", () => {
    const domains = ["skills_career", "discipline_routine", "personality_social_confidence"] as const;

    expect(createStarterIdentityOptions([...domains], { confidence: "high" })).toHaveLength(2);
    expect(createStarterIdentityOptions([...domains], { confidence: "low" })).toHaveLength(3);
  });

  it("uses desired direction when regenerating options", () => {
    const [option] = createStarterIdentityOptions(["skills_career", "discipline_routine"], {
      desiredDirection: "becoming a dependable software engineer"
    });

    expect(option.systemReason).toContain("dependable software engineer");
  });
});

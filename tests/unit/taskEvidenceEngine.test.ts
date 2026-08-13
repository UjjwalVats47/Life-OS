import { describe, expect, it } from "vitest";
import {
  createTaskEvidenceFields,
  deriveEvidenceScore,
  validateTaskEvidence
} from "@/system/tasks/taskEvidenceEngine";

describe("taskEvidenceEngine", () => {
  it("creates attempted and correct measurements for coding and academic practice", () => {
    const fields = createTaskEvidenceFields("baseline_assessment", "skills_career");

    expect(fields.map((field) => field.key)).toEqual(["items_attempted", "items_correct"]);
    expect(fields.every((field) => field.required)).toBe(true);
  });

  it("normalizes values and derives quality from correct versus attempted items", () => {
    const fields = createTaskEvidenceFields("timed_practice", "academics");
    const evidence = validateTaskEvidence(fields, { items_attempted: "10", items_correct: "8" });

    expect(evidence.valid).toBe(true);
    expect(evidence.normalized).toEqual({ items_attempted: 10, items_correct: 8 });
    expect(deriveEvidenceScore(evidence.normalized, 20)).toBe(80);
  });

  it("rejects missing required evidence and impossible count relationships", () => {
    const fields = createTaskEvidenceFields("guided_practice", "skills_career");

    expect(validateTaskEvidence(fields, {}).errors).toContain("Items attempted is required.");
    expect(validateTaskEvidence(fields, { items_attempted: 5, items_correct: 8 }).errors).toContain(
      "Items correct cannot exceed items attempted."
    );
  });

  it("uses domain-specific evidence for fitness and social exposure", () => {
    const fitness = createTaskEvidenceFields("guided_practice", "fitness_health");
    const social = createTaskEvidenceFields("real_world_exposure", "personality_social_confidence");

    expect(fitness.map((field) => field.key)).toEqual(["quantity_completed", "quantity_unit"]);
    expect(social.map((field) => field.key)).toContain("external_feedback");
  });

  it("allows partial evidence on an incomplete attempt without fabricating missing values", () => {
    const fields = createTaskEvidenceFields("project_output", "skills_career");
    const result = validateTaskEvidence(fields, { artifact_reference: "repo/local-project" }, false);

    expect(result.valid).toBe(true);
    expect(result.normalized).toEqual({ artifact_reference: "repo/local-project" });
  });
});

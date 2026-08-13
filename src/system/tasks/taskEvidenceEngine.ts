import type { LifeDomain } from "@/types/enums";
import type { TaskEvidenceField, TaskEvidenceValue, TaskTemplate } from "@/types/domain";

export type EvidenceValidationResult = {
  errors: string[];
  normalized: Record<string, TaskEvidenceValue>;
  valid: boolean;
};

export function createTaskEvidenceFields(
  actionType: TaskTemplate["actionType"],
  domain: LifeDomain
): TaskEvidenceField[] {
  if (actionType === "resource_setup") {
    return [
      textField("resource_reference", "Saved resource or location", "artifact", true, "File, URL, book, app, or location"),
      numberField("resource_count", "Usable items found", "volume", true, 1, undefined, "items")
    ];
  }

  if (actionType === "review_mistakes") {
    return [
      numberField("issues_identified", "Mistakes identified", "volume", true, 1, undefined, "mistakes"),
      numberField("issues_resolved", "Mistakes resolved", "quality", true, 0, undefined, "mistakes"),
      textField("artifact_reference", "Mistake log location", "artifact", false, "File, note, or page")
    ];
  }

  if (actionType === "project_output") {
    return [
      textField("artifact_reference", "Output location", "artifact", true, "File, repository, document, or photo"),
      numberField("acceptance_checks_passed", "Checks passed", "quality", true, 1, undefined, "checks")
    ];
  }

  if (actionType === "real_world_exposure" || domain === "personality_social_confidence") {
    return [
      numberField("exposures_completed", "Real interactions completed", "volume", true, 1, undefined, "interactions"),
      textField("external_feedback", "Feedback received", "external_feedback", false, "What another person said or did")
    ];
  }

  if (domain === "fitness_health") {
    return [
      numberField("quantity_completed", "Quantity completed", "volume", true, 0.1),
      textField("quantity_unit", "Measurement unit", "context", true, "repetitions, sets, km, minutes, or kg")
    ];
  }

  if (domain === "finance") {
    return [
      numberField("amount_measured", "Amount reviewed or changed", "volume", true, 0, undefined, "currency units"),
      booleanField("decision_recorded", "Decision recorded", "quality", true)
    ];
  }

  if (domain === "discipline_routine" || actionType === "routine") {
    return [
      numberField("planned_units_completed", "Planned units completed", "volume", true, 1, undefined, "units"),
      numberField("interruptions", "Interruptions", "context", false, 0, undefined, "interruptions")
    ];
  }

  if (actionType === "supporting_skill") {
    return [
      numberField("repetitions_completed", "Repetitions completed", "volume", true, 1, undefined, "repetitions"),
      numberField("errors_recorded", "Errors recorded", "context", false, 0, undefined, "errors")
    ];
  }

  return [
    numberField("items_attempted", "Items attempted", "volume", true, 1, undefined, "items"),
    numberField("items_correct", "Items correct", "quality", true, 0, undefined, "items")
  ];
}

export function validateTaskEvidence(
  fields: TaskEvidenceField[],
  values: Record<string, unknown> = {},
  requireComplete = true
): EvidenceValidationResult {
  const errors: string[] = [];
  const normalized: Record<string, TaskEvidenceValue> = {};

  fields.forEach((field) => {
    const raw = values[field.key];
    const missing = raw === undefined || raw === null || raw === "";
    if (missing) {
      if (requireComplete && field.required) errors.push(`${field.label} is required.`);
      return;
    }

    if (field.valueType === "number") {
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(value)) {
        errors.push(`${field.label} must be a number.`);
        return;
      }
      if (field.min !== undefined && value < field.min) errors.push(`${field.label} must be at least ${field.min}.`);
      if (field.max !== undefined && value > field.max) errors.push(`${field.label} must be no more than ${field.max}.`);
      normalized[field.key] = value;
      return;
    }

    if (field.valueType === "boolean") {
      if (raw !== true && raw !== false && raw !== "true" && raw !== "false") {
        errors.push(`${field.label} must be confirmed or declined.`);
        return;
      }
      normalized[field.key] = raw === true || raw === "true";
      return;
    }

    const value = String(raw).trim();
    if (!value && requireComplete && field.required) errors.push(`${field.label} is required.`);
    else if (value) normalized[field.key] = value;
  });

  compareCounts(normalized, "items_correct", "items_attempted", "Items correct cannot exceed items attempted.", errors);
  compareCounts(normalized, "issues_resolved", "issues_identified", "Mistakes resolved cannot exceed mistakes identified.", errors);

  return { errors, normalized, valid: errors.length === 0 };
}

export function deriveEvidenceScore(values: Record<string, TaskEvidenceValue>, providedScore?: number) {
  const ratioPairs: Array<[string, string]> = [
    ["items_correct", "items_attempted"],
    ["issues_resolved", "issues_identified"]
  ];
  for (const [numeratorKey, denominatorKey] of ratioPairs) {
    const numerator = asNumber(values[numeratorKey]);
    const denominator = asNumber(values[denominatorKey]);
    if (numerator !== undefined && denominator !== undefined && denominator > 0) {
      return Math.round(Math.min(100, Math.max(0, (numerator / denominator) * 100)));
    }
  }
  if (values.decision_recorded === true) return 100;
  if (providedScore === undefined || !Number.isFinite(providedScore)) return undefined;
  return Math.min(100, Math.max(0, Math.round(providedScore)));
}

export function summarizeEvidence(values: Record<string, TaskEvidenceValue>) {
  return Object.entries(values)
    .map(([key, value]) => `${key.split("_").join(" ")}: ${String(value)}`)
    .join(", ");
}

function numberField(
  key: string,
  label: string,
  metricRole: TaskEvidenceField["metricRole"],
  required: boolean,
  min?: number,
  max?: number,
  unit?: string
): TaskEvidenceField {
  return { key, label, max, metricRole, min, required, unit, valueType: "number" };
}

function textField(
  key: string,
  label: string,
  metricRole: TaskEvidenceField["metricRole"],
  required: boolean,
  placeholder?: string
): TaskEvidenceField {
  return { key, label, metricRole, placeholder, required, valueType: "text" };
}

function booleanField(
  key: string,
  label: string,
  metricRole: TaskEvidenceField["metricRole"],
  required: boolean
): TaskEvidenceField {
  return { key, label, metricRole, required, valueType: "boolean" };
}

function compareCounts(
  values: Record<string, TaskEvidenceValue>,
  numeratorKey: string,
  denominatorKey: string,
  message: string,
  errors: string[]
) {
  const numerator = asNumber(values[numeratorKey]);
  const denominator = asNumber(values[denominatorKey]);
  if (numerator !== undefined && denominator !== undefined && numerator > denominator) errors.push(message);
}

function asNumber(value: TaskEvidenceValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

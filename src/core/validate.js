import { verifyEventId } from "./canonical.js";

export const EVENT_TYPES = new Set([
  "object.publish",
  "relation.assert",
  "activity.record",
  "attestation.issue",
  "profile.publish",
]);

const ACTOR_KINDS = new Set(["human", "ai", "organization", "software"]);

function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateEvent(event, { checkHash = true } = {}) {
  const errors = [];
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return ["event must be an object"];
  }
  if (event.protocol !== "scholarstate/0.1") errors.push("unsupported protocol");
  if (!EVENT_TYPES.has(event.type)) errors.push("unsupported event type");
  if (!present(event.createdAt) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(event.createdAt) || Number.isNaN(Date.parse(event.createdAt))) {
    errors.push("createdAt must be an ISO-8601 timestamp");
  }
  if (!present(event.actor?.id) || !ACTOR_KINDS.has(event.actor?.kind)) {
    errors.push("actor must have an id and a supported kind");
  }
  if (!event.payload || typeof event.payload !== "object") errors.push("payload is required");
  if (!Array.isArray(event.humanAnchors)) errors.push("humanAnchors must be an array");
  if (checkHash && (!present(event.eventId) || !verifyEventId(event))) {
    errors.push("eventId does not match canonical event content");
  }

  if (event.type === "object.publish") {
    for (const key of ["objectId", "objectType", "versionId", "title"]) {
      if (!present(event.payload?.[key])) errors.push(`object.publish payload.${key} is required`);
    }
    if (!Array.isArray(event.payload?.artifacts)) errors.push("object.publish payload.artifacts must be an array");
    else event.payload.artifacts.forEach((artifact, index) => {
      for (const key of ["mediaType", "url", "role"]) {
        if (!present(artifact?.[key])) errors.push(`artifact ${index} requires ${key}`);
      }
    });
  }
  if (event.type === "relation.assert") {
    for (const key of ["relationId", "relationType", "subject", "object"]) {
      if (!present(event.payload?.[key])) errors.push(`relation.assert payload.${key} is required`);
    }
    if (!present(event.payload?.basis)) errors.push("relation.assert payload.basis is required");
  }
  if (event.type === "activity.record") {
    for (const key of ["activityId", "activityType"]) {
      if (!present(event.payload?.[key])) errors.push(`activity.record payload.${key} is required`);
    }
    for (const key of ["inputs", "outputs"]) {
      if (!Array.isArray(event.payload?.[key])) errors.push(`activity.record payload.${key} must be an array`);
    }
    if (!event.payload?.environment || typeof event.payload.environment !== "object") errors.push("activity.record payload.environment is required");
  }
  if (event.type === "attestation.issue") {
    for (const key of ["attestationId", "attestationType", "subject", "position", "statement"]) {
      if (!present(event.payload?.[key])) errors.push(`attestation.issue payload.${key} is required`);
    }
    if (!Array.isArray(event.payload?.evidence)) errors.push("attestation.issue payload.evidence must be an array");
    if (event.payload?.authority?.decisive === true) {
      if (!present(event.payload.authority.jurisdiction)) errors.push("decisive attestation requires a jurisdiction");
      if (!present(event.payload.authority.policy)) errors.push("decisive attestation requires a policy reference");
      if (event.actor?.kind !== "human" && (event.humanAnchors?.length ?? 0) === 0) {
        errors.push("decisive attestation requires an identifiable human anchor");
      }
    }
  }
  if (event.type === "profile.publish") {
    for (const key of ["profileId", "version", "title"]) {
      if (!present(event.payload?.[key])) errors.push(`profile.publish payload.${key} is required`);
    }
  }
  return errors;
}

export function assertValidEvent(event, options) {
  const errors = validateEvent(event, options);
  if (errors.length) throw new Error(errors.join("; "));
  return event;
}

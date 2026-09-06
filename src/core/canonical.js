import { createHash } from "node:crypto";

export function canonicalize(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON cannot contain non-finite numbers");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") throw new TypeError(`canonical JSON cannot contain ${typeof value}`);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(",")}}`;
}

export function sha256(value) {
  const input = typeof value === "string" ? value : canonicalize(value);
  return createHash("sha256").update(input).digest("hex");
}

export function sealEvent(draft) {
  const event = {
    protocol: "scholarstate/0.1",
    ...draft,
  };
  delete event.eventId;
  canonicalize(event);
  return {
    ...event,
    eventId: `sha256:${sha256(event)}`,
  };
}

export function verifyEventId(event) {
  const candidate = { ...event };
  delete candidate.eventId;
  return event.eventId === `sha256:${sha256(candidate)}`;
}

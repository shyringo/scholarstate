import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { sealEvent } from "./canonical.js";
import { assertValidEvent } from "./validate.js";

export async function readEvents(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`invalid JSON on line ${index + 1}`);
      }
    });
}

export async function appendEvent(path, draft) {
  const event = assertValidEvent(sealEvent(draft));
  const existing = await readEvents(path);
  if (existing.some((item) => item.eventId === event.eventId)) return event;
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export async function verifyStore(path) {
  const events = await readEvents(path);
  const seen = new Set();
  const failures = [];
  events.forEach((event, index) => {
    const errors = validateLine(event, seen);
    if (errors.length) failures.push({ line: index + 1, eventId: event.eventId, errors });
    seen.add(event.eventId);
  });
  return { valid: failures.length === 0, count: events.length, failures };
}

function validateLine(event, seen) {
  const errors = [];
  try {
    assertValidEvent(event);
  } catch (error) {
    errors.push(error.message);
  }
  if (seen.has(event.eventId)) errors.push("duplicate eventId");
  return errors;
}

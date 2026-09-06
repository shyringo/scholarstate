import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { canonicalize, sealEvent, verifyEventId } from "../src/core/canonical.js";
import { project } from "../src/core/project.js";
import { readEvents, verifyStore } from "../src/core/store.js";
import { validateEvent } from "../src/core/validate.js";

const examplePath = resolve("examples/flashattention/events.jsonl");

function baseDraft(overrides = {}) {
  return {
    type: "attestation.issue",
    createdAt: "2026-09-07T01:00:00.000Z",
    actor: { id: "urn:test:agent", kind: "ai" },
    humanAnchors: [],
    payload: {
      attestationId: "attestation:test",
      attestationType: "review",
      subject: "claim:test",
      position: "supports",
      statement: "Bounded test statement",
      evidence: [],
      authority: { decisive: false },
    },
    ...overrides,
  };
}

test("canonicalization is independent of object key order", () => {
  assert.equal(canonicalize({ b: 2, a: { d: 4, c: 3 } }), canonicalize({ a: { c: 3, d: 4 }, b: 2 }));
});

test("canonicalization rejects values that JSON cannot preserve", () => {
  assert.throws(() => canonicalize({ value: Number.NaN }), /non-finite/);
  assert.throws(() => canonicalize({ value: undefined }), /cannot contain undefined/);
});

test("sealed events expose content mutation", () => {
  const event = sealEvent(baseDraft());
  assert.equal(verifyEventId(event), true);
  event.payload.statement = "Changed after publication";
  assert.equal(verifyEventId(event), false);
});

test("decisive AI attestation needs jurisdiction, policy, and a human anchor", () => {
  const event = sealEvent(baseDraft({
    payload: {
      ...baseDraft().payload,
      position: "decides",
      authority: { decisive: true },
    },
  }));
  const errors = validateEvent(event);
  assert.ok(errors.some((error) => error.includes("jurisdiction")));
  assert.ok(errors.some((error) => error.includes("policy")));
  assert.ok(errors.some((error) => error.includes("human anchor")));
});

test("bundled example verifies and projects without overstating replication", async () => {
  const verification = await verifyStore(examplePath);
  assert.deepEqual(verification, { valid: true, count: 12, failures: [] });
  const state = project(await readEvents(examplePath));
  const claim = state.objects["claim:flashattention-io-aware-exact"];
  assert.equal(claim.status, "supported");
  assert.equal(state.decisions.length, 0);
  assert.equal(state.attestations[0].accountability, "unanchored");
  assert.equal(state.attestations[0].proofStatus, "absent");
});

test("a scoped human decision is structurally eligible, not declared valid", () => {
  const object = sealEvent({
    type: "object.publish",
    createdAt: "2026-09-07T01:00:00.000Z",
    actor: { id: "urn:test:human", kind: "human" },
    humanAnchors: ["urn:test:human"],
    payload: { objectId: "claim:test", objectType: "test:claim", versionId: "claim:test@1", title: "Test claim", artifacts: [] },
  });
  const decision = sealEvent(baseDraft({
    actor: { id: "urn:test:human", kind: "human" },
    humanAnchors: ["urn:test:human"],
    payload: {
      ...baseDraft().payload,
      position: "decides",
      authority: { decisive: true, jurisdiction: "urn:test:community", policy: "urn:test:policy@1" },
    },
  }));
  const state = project([object, decision]);
  assert.equal(state.decisions[0].recognition, "structurally-eligible");
  assert.equal(state.decisions[0].proofStatus, "absent");
});

test("projection is stable across event arrival order", async () => {
  const events = await readEvents(examplePath);
  const forward = project(events);
  const reverse = project([...events].reverse());
  assert.deepEqual(reverse, forward);
});

test("concurrent object versions remain visible as a conflict", () => {
  const publish = (versionId, createdAt) => sealEvent({
    type: "object.publish",
    createdAt,
    actor: { id: "urn:test:human", kind: "human" },
    humanAnchors: ["urn:test:human"],
    payload: { objectId: "claim:fork", objectType: "test:claim", versionId, title: versionId, artifacts: [] },
  });
  const state = project([
    publish("claim:fork@left", "2026-09-07T01:00:00.000Z"),
    publish("claim:fork@right", "2026-09-07T01:00:01.000Z"),
  ]);
  assert.equal(state.objects["claim:fork"].versionConflict, true);
  assert.deepEqual(state.objects["claim:fork"].headVersions, ["claim:fork@left", "claim:fork@right"]);
  assert.match(state.integrity.warnings[0], /2 version heads/);
});

import { assertValidEvent } from "./validate.js";

const STATUS_ORDER = ["retracted", "superseded", "contested", "replicated", "supported", "proposed"];

export function project(events) {
  const state = {
    protocol: "scholarstate/0.2",
    eventCount: 0,
    objects: {},
    relations: [],
    activities: [],
    attestations: [],
    profiles: {},
    decisions: [],
    integrity: { warnings: [] },
    workload: {
      sourceObjects: 0,
      crystallizedObjects: 0,
      unspecifiedObjects: 0,
      machineProposedClaims: 0,
      claimsWithoutHumanAttestation: 0,
    },
  };

  const orderedEvents = [...events].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt) || left.eventId.localeCompare(right.eventId));
  for (const event of orderedEvents) {
    assertValidEvent(event);
    state.eventCount += 1;
    const payload = event.payload;
    if (event.type === "object.publish") {
      const current = state.objects[payload.objectId] ?? {
        id: payload.objectId,
        type: payload.objectType,
        versions: [],
      };
      current.type = payload.objectType;
      current.versions.push({
        id: payload.versionId,
        title: payload.title,
        summary: payload.summary ?? "",
        content: payload.content ?? null,
        attributes: payload.attributes ?? {},
        artifacts: payload.artifacts,
        replaces: payload.replaces ?? null,
        eventId: event.eventId,
        createdAt: event.createdAt,
        actor: event.actor,
      });
      state.objects[payload.objectId] = current;
    } else if (event.type === "relation.assert") {
      state.relations.push({ ...payload, eventId: event.eventId, actor: event.actor, createdAt: event.createdAt });
    } else if (event.type === "activity.record") {
      state.activities.push({ ...payload, eventId: event.eventId, actor: event.actor, createdAt: event.createdAt });
    } else if (event.type === "attestation.issue") {
      const accountability = event.actor.kind === "human" || event.humanAnchors.length
        ? "human-anchored"
        : "unanchored";
      const proofStatus = event.proof ? "present-unverified" : "absent";
      const attestation = {
        ...payload,
        eventId: event.eventId,
        actor: event.actor,
        humanAnchors: event.humanAnchors,
        accountability,
        proofStatus,
        createdAt: event.createdAt,
      };
      state.attestations.push(attestation);
      if (payload.authority?.decisive) {
        state.decisions.push({
          ...attestation,
          recognition: accountability === "human-anchored" ? "structurally-eligible" : "ineligible",
        });
      }
    } else if (event.type === "profile.publish") {
      state.profiles[`${payload.profileId}@${payload.version}`] = {
        ...payload,
        eventId: event.eventId,
        actor: event.actor,
      };
    }
  }

  for (const object of Object.values(state.objects)) {
    const replaced = new Set(object.versions.map((version) => version.replaces).filter(Boolean));
    const heads = object.versions.filter((version) => !replaced.has(version.id));
    object.headVersions = heads.map((version) => version.id);
    object.versionConflict = heads.length !== 1;
    object.latest = [...heads].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.eventId.localeCompare(right.eventId)).at(-1);
    if (object.versionConflict) state.integrity.warnings.push(`object ${object.id} has ${heads.length} version heads`);
    object.status = deriveStatus(object.id, state);
    object.incoming = state.relations.filter((relation) => relation.object === object.id).length;
    object.outgoing = state.relations.filter((relation) => relation.subject === object.id).length;
    object.attestationCount = state.attestations.filter((item) => item.subject === object.id).length;
    const resolution = object.latest.attributes.resolution ?? "unspecified";
    if (resolution === "source") state.workload.sourceObjects += 1;
    else if (resolution === "crystallized") state.workload.crystallizedObjects += 1;
    else state.workload.unspecifiedObjects += 1;
    if (object.type.endsWith(":claim") && object.latest.actor.kind === "ai") {
      state.workload.machineProposedClaims += 1;
      const humanAttestation = state.attestations.some((item) =>
        item.subject === object.id &&
        item.accountability === "human-anchored" &&
        item.attestationType !== "source-report" &&
        ["supports", "opposes", "decides"].includes(item.position));
      if (!humanAttestation) state.workload.claimsWithoutHumanAttestation += 1;
    }
    const origin = object.latest.attributes.crystallization?.source;
    if (origin) {
      const source = state.objects[origin.objectId];
      if (!source) state.integrity.warnings.push(`object ${object.id} crystallized from unknown source ${origin.objectId}`);
      else if (!source.versions.some((version) => version.id === origin.versionId)) {
        state.integrity.warnings.push(`object ${object.id} crystallized from unknown version ${origin.versionId}`);
      }
    }
  }
  for (const relation of state.relations) {
    if (!state.objects[relation.subject]) state.integrity.warnings.push(`relation ${relation.relationId} has unknown subject ${relation.subject}`);
    if (!state.objects[relation.object]) state.integrity.warnings.push(`relation ${relation.relationId} has unknown object ${relation.object}`);
  }
  for (const attestation of state.attestations) {
    if (!state.objects[attestation.subject]) state.integrity.warnings.push(`attestation ${attestation.attestationId} has unknown subject ${attestation.subject}`);
  }
  state.statusCounts = Object.values(state.objects).reduce((counts, object) => {
    counts[object.status] = (counts[object.status] ?? 0) + 1;
    return counts;
  }, {});
  return state;
}

function deriveStatus(objectId, state) {
  const statuses = ["proposed"];
  const attestations = state.attestations.filter((item) => item.subject === objectId);
  if (attestations.some((item) => item.position === "supports")) statuses.push("supported");
  if (attestations.some((item) => item.attestationType === "replication" && item.position === "supports")) statuses.push("replicated");
  if (attestations.some((item) => item.position === "opposes")) statuses.push("contested");
  if (attestations.some((item) => item.attestationType === "retraction" && item.position === "decides")) statuses.push("retracted");
  if (state.relations.some((relation) => relation.relationType === "supersedes" && relation.object === objectId)) {
    statuses.push("superseded");
  }
  return STATUS_ORDER.find((status) => statuses.includes(status));
}

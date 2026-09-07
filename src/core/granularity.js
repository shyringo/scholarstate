export const MATERIALIZATION_TRIGGERS = new Set([
  "author-declaration",
  "human-request",
  "external-reference",
  "evidence-attachment",
  "downstream-dependency",
  "contestation",
  "replication",
  "formal-decision",
  "resource-allocation",
  "independent-versioning",
]);

export function recognizedMaterializationTriggers(triggers = []) {
  return [...new Set(triggers)].filter((trigger) => MATERIALIZATION_TRIGGERS.has(trigger));
}

export function assessMaterialization(candidate) {
  const triggers = [...new Set(candidate.triggers ?? [])];
  const recognized = recognizedMaterializationTriggers(triggers);
  const source = candidate.source;
  const hasAddress = Boolean(source?.objectId && source?.versionId && source?.selector);
  return {
    eligible: hasAddress && recognized.length > 0,
    recognizedTriggers: recognized,
    reason: !hasAddress
      ? "candidate needs an exact source version and selector"
      : recognized.length === 0
        ? "machine extraction alone does not justify a durable research object"
        : "candidate crossed an independent-use threshold",
  };
}

export function focusProjection(state, { roots = [], depth = 1, limit = 200 } = {}) {
  const boundedDepth = Math.max(0, Math.min(Number(depth) || 0, 6));
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 200, 2_000));
  const selected = new Set(roots.filter((id) => state.objects[id]));
  let frontier = [...selected];

  for (let level = 0; level < boundedDepth && frontier.length && selected.size < boundedLimit; level += 1) {
    const next = [];
    for (const id of frontier) {
      for (const relation of state.relations) {
        const neighbor = relation.subject === id
          ? relation.object
          : relation.object === id
            ? relation.subject
            : null;
        if (neighbor && state.objects[neighbor] && !selected.has(neighbor)) {
          selected.add(neighbor);
          next.push(neighbor);
          if (selected.size >= boundedLimit) break;
        }
      }
      if (selected.size >= boundedLimit) break;
    }
    frontier = next;
  }

  const ids = [...selected];
  const idSet = new Set(ids);
  return {
    roots: roots.filter((id) => state.objects[id]),
    depth: boundedDepth,
    limit: boundedLimit,
    truncated: selected.size >= boundedLimit,
    objects: Object.fromEntries(ids.map((id) => [id, state.objects[id]])),
    relations: state.relations.filter((relation) => idSet.has(relation.subject) && idSet.has(relation.object)),
    attestations: state.attestations.filter((attestation) => idSet.has(attestation.subject)),
  };
}

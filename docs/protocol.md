# ScholarState Protocol 0.1

## Purpose

ScholarState is an interchange protocol for recording research actions without requiring every discipline to share one ontology. Its source of truth is a set of immutable events. Knowledge graphs, feeds, reviews, credit records, living syntheses, and current epistemic states are projections over that record.

Normative terms such as MUST, SHOULD, and MAY are interpreted as described by RFC 2119.

## Invariants

1. A conforming event MUST be immutable after publication. Its `eventId` MUST equal the SHA-256 digest of the RFC 8785 JSON Canonicalization Scheme representation of the event without `eventId`. Protocol 0.1 accepts only ordinary JSON values and rejects non-finite numbers and non-JSON runtime values.
2. An object identifier MUST remain stable across versions. A version identifier MUST identify exact content or an exact recorded observation.
3. A new object version MUST NOT erase or mutate a previous version.
4. An artifact reference MUST identify its media type, location, and role. A structured interpretation MUST NOT silently replace the source artifact.
5. Every event MUST identify its actor and actor kind. AI and software actors MUST remain distinguishable from people and organizations.
6. A relation MUST name its subject, object, type, basis, actor, and time. Relation types MAY be introduced by profiles.
7. A decisive attestation MUST name its jurisdiction and policy version and MUST terminate in at least one human responsibility anchor.
8. A projection MUST be reproducible from the events it consumes and MUST identify the profile or projection rules used when those rules affect meaning.
9. A profile MUST be versioned. Reinterpreting old records with a new profile MUST NOT alter the old records.

## Envelope

Every event uses this common envelope:

```json
{
  "protocol": "scholarstate/0.1",
  "type": "attestation.issue",
  "createdAt": "2026-09-07T00:11:00.000Z",
  "actor": {
    "id": "https://orcid.org/0000-0000-0000-0000",
    "kind": "human",
    "name": "Researcher name"
  },
  "humanAnchors": ["https://orcid.org/0000-0000-0000-0000"],
  "payload": {},
  "eventId": "sha256:..."
}
```

`humanAnchors` records responsibility, not necessarily authorship and not proof of identity. Cryptographic or institutional proofs MAY appear in `proof`; verifiers must report whether they actually verified those proofs.

## Event Semantics

### `object.publish`

Publishes one immutable version of a stable research object. The kernel treats `objectType` as an extensible identifier. Profiles can define types such as a theorem, oral history, specimen, simulation, dataset, model checkpoint, instrument, or claim without changing the kernel.

### `relation.assert`

Asserts a typed relation. The event records the assertion, not eternal truth. A later event may contradict the relation without deleting it.

### `activity.record`

Connects inputs, outputs, actors, and environment. It covers experiments, proof checking, data collection, review, extraction, synthesis, and future activities introduced by profiles.

### `attestation.issue`

Records what a subject says about an object. Review, replication, endorsement, contradiction, conflict disclosure, and acceptance are profile-defined attestation types. `authority.decisive` marks an intended formal decision; it is structurally eligible only when jurisdiction, policy, and human accountability are present. Eligibility does not prove that a jurisdiction recognizes the actor.

### `profile.publish`

Publishes a versioned disciplinary or community interpretation layer. A profile may define object types, relation types, validation rules, evidence classes, status projections, decision procedures, and UI vocabulary. Profiles are research objects in the conceptual model and should become ordinary versioned objects in a later protocol revision.

## Ordering And Merge

Event identity does not depend on arrival order. Consumers MUST preserve `createdAt` but MUST NOT treat clocks alone as causal proof. When order matters, an event SHOULD name input event IDs or prior object versions explicitly.

Two stores merge by set union on verified `eventId`. Conflicting assertions remain present and are resolved only in a named projection or jurisdiction. The protocol has no global last-writer-wins rule. Object heads are calculated from explicit `replaces` references. Multiple unreplaced heads are a visible version conflict; timestamps may provide stable display order but MUST NOT silently resolve the conflict.

## Status

The reference implementation provides a deliberately weak generic projection:

```text
proposed -> supported -> replicated
                \-> contested
any state -> superseded or retracted
```

This is useful for navigation but is not normative science. A replication may fail to address the same population, apparatus, theorem assumptions, model version, or metric. Profiles must define equivalence and evidence rules before claiming stronger semantics.

## Compatibility Direction

Future adapters should map the kernel to W3C PROV for provenance exchange, RO-Crate for artifact packaging, CRediT for contributor roles, nanopublications for atomic RDF assertions, and COAR Notify or ActivityPub-family protocols for cross-service notifications. Interoperability adapters belong outside the universal kernel.

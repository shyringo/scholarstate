# ScholarState

ScholarState turns papers, code, data, reviews, and replications into a versioned research record whose current state can be inspected and rebuilt. It is a local-first protocol, reference implementation, and working web interface for moving from publishing documents to maintaining accountable knowledge.

The bundled FlashAttention record contains 12 hash-verified events, 5 research objects, and 4 typed relations. Its visible status is explicitly a projection, not a platform-issued truth score or formal academic decision.

## Quick Start

Requires Node.js 22 or newer. No package installation is needed.

```powershell
npm run demo
npm run serve
```

Open <http://127.0.0.1:4317>. Select the main claim to inspect its exact source version, evidence class, machine extraction history, and attestations. Use **Record attestation** to append a human-accountable review, replication report, contradiction, or jurisdiction-scoped decision to your local record.

Run these commands from the repository root. When a public repository exists, the clone command will be added here.

## What Is Different

A PDF is preserved as source material, but it is no longer the system's unit of change. ScholarState records immutable events about stable research objects:

```text
source materials -> immutable events -> deterministic projections
                      |                    |
                      |                    +-- evidence map
                      |                    +-- current status
                      |                    +-- living synthesis
                      |
                      +-- objects and versions
                      +-- typed relations
                      +-- activities and provenance
                      +-- attestations and scoped decisions
```

The small kernel does not decide what counts as evidence in physics, history, mathematics, or AI. Versioned community profiles define those vocabularies and rules. Raw records remain available when profiles change.

## Guarantees And Boundaries

- Events are content-addressed and append-only; changing any recorded field invalidates its identifier.
- Research objects have stable identities and immutable versions. A new version does not overwrite an old one.
- Machine work and human work use the same provenance envelope but remain distinguishable.
- A decisive attestation must name a jurisdiction, policy version, and human responsibility anchor.
- Authority is never global by default. A decision can be recognized inside one community without becoming universal truth.
- The current prototype verifies structural integrity, not real-world identity or cryptographic signatures. `human-anchored` means a human identifier is present, not that the identity has been authenticated.
- The generic status projection is a navigation aid. Communities must define profile-specific status semantics before using it institutionally.
- The JSONL store is designed for a single local writer in this prototype. Concurrent writers need transactional storage or an append coordinator before production use.

## Protocol Kernel

| Event | What it preserves |
| --- | --- |
| `object.publish` | Stable object identity, immutable version, original artifacts, and extensible type |
| `relation.assert` | A typed, sourced relation between research objects |
| `activity.record` | Inputs, outputs, actor, and environment for a research action |
| `attestation.issue` | A subject's bounded statement, stance, evidence, responsibility, and authority scope |
| `profile.publish` | A versioned community vocabulary and policy that can be discussed or forked |

See [protocol specification](docs/protocol.md), [constitutional design](docs/constitutional-design.md), [human authority model](docs/authority.md), and the machine-readable [event schema](protocol/event.schema.json).

## Commands

```powershell
npm run demo
node src/cli.js verify examples/flashattention/events.jsonl
node src/cli.js project examples/flashattention/events.jsonl
npm test
```

`npm run serve -- --port 4318` selects another local port. The server exposes `GET /api/state`, `GET /api/events`, and `POST /api/events` for local tools and agents.

## Why Another Protocol

ScholarState does not replace mature work on packaging, provenance, atomic publication, contributor roles, or repository notifications. It uses those systems as interoperability targets and focuses on the missing composition: replayable research state plus explicit, jurisdiction-scoped human decisions. The [standards landscape](docs/landscape.md) records the boundary and sources.

## Provenance And Originality

The project adapts established ideas including content addressing, event sourcing, W3C provenance, research objects, and nanopublications. Its project-specific contribution is their composition into a deliberately ontology-light research-state protocol where authority is computed from scoped policy and accountable attestations rather than attached to content globally. This is an early design claim, not a claim of academic novelty. See [provenance](docs/provenance.md).

## License

Licensed under Apache-2.0. External research artifacts linked by the example retain their own licenses and are not redistributed here.

# Granularity Without Combinatorial Explosion

The protocol must not require a complete claim graph before research becomes useful. Converting every sentence, table cell, parameter, citation, and possible implication into a permanent node would multiply storage, identity, review, synchronization, and attention costs. AI makes extraction cheap, but it does not make those downstream obligations free.

## The Addressability Threshold

The universal atom is not the smallest meaningful statement. It is the smallest unit that currently needs an independent identity and lifecycle.

A fragment should remain inside its source when nobody needs to cite, revise, contest, verify, depend on, allocate resources to, or decide upon it independently. A fragment becomes a durable research object only when it crosses one of those boundaries.

This produces four resolution levels:

| Level | Persistence | Identity | Typical use |
| --- | --- | --- | --- |
| Source | Durable | Stable object and exact version | Lossless entry of a paper, dataset, notebook, recording, or repository snapshot |
| Candidate | Ephemeral or local cache | Exact source selector only | AI extraction, search result, suggested claim, tentative relation |
| Crystallized object | Durable | Stable object plus immutable versions | Independently cited, tested, disputed, reused, or governed unit |
| Focus view | Recomputable | Query and projection identity | A bounded subgraph needed for one question or decision |

Fine granularity is therefore available everywhere but materialized only where scientific activity creates a reason for it.

## Materialization Rule

A candidate is eligible for crystallization when both conditions hold:

1. It identifies an exact source object, source version, and selector.
2. It has at least one independent-use trigger: author declaration, human request, external reference, evidence attachment, downstream dependency, contestation, replication, formal decision, resource allocation, or independent versioning.

AI extraction by itself is not a trigger. Model confidence is not a trigger. Popularity is not a trigger. These may help rank a private candidate queue, but they cannot impose permanent public verification debt.

Crystallization does not certify truth. It says only that the unit now has enough independent scientific life to justify stable addressability.

## Complexity Shape

Let:

- `S` be source versions ingested;
- `Q` be questions actually asked;
- `K` be candidates computed while answering them;
- `C` be candidates that cross the materialization threshold;
- `E` be durable evidence, dependency, and attestation relations;
- `F` be the configured focus-view limit.

The intended persistent growth is `O(S + C + E)`, not `O(all possible claims in S)`. Candidate computation may be large, but it is cacheable, disposable, and attributable to demand. A user-facing projection is bounded by `F`, so rendering and attention do not scale with the global graph.

This does not solve the growth of science. It prevents one implementation choice from multiplying that growth unnecessarily.

## The Costs Must Stay Separate

A single object count conceals the actual bottleneck. Systems should report at least:

- durable storage and synchronization load;
- machine extraction and recomputation load;
- unresolved human verification queue;
- experimental, compute, and reviewer commitments;
- number and age of contested high-dependency objects;
- projection size presented to a person.

These are a workload vector, not a credibility score. Optimizing one can worsen another. For example, aggressive extraction improves recall while increasing review debt; aggressive pruning reduces interface load while hiding neglected contradictions.

## Migration From The Document Era

Legacy migration should proceed in waves:

1. Register source identity, exact version, provenance, and available artifacts. Stop there by default.
2. Build disposable indexes and candidate interpretations for retrieval. Do not publish every extraction as protocol history.
3. Start from live questions, systematic reviews, disputed results, heavily depended-on claims, and active resource decisions.
4. Crystallize only the relevant fragments and preserve their source selectors.
5. Expand the graph outward when new evidence or use creates demand.

The goal is not to finish converting the literature. There is no such finish line. The goal is to make the parts of the record touched by present inquiry progressively more explicit and accountable.

## The Network Is Not One Global Database

Granularity control is necessary but insufficient. Relations, competing extractions, event history, and spam can still grow without bound. A distributed ScholarState ecosystem must keep four conditions separate:

1. **Exists:** an actor has produced a content-addressed record.
2. **Available:** at least one repository serves it.
3. **Indexed:** a service chooses to make it discoverable under explicit inclusion rules.
4. **Recognized:** a community gives it some procedural or epistemic standing.

Creation at one layer does not compel the next. Open publication rights therefore do not impose unlimited storage, indexing, review, or display obligations on every participant.

Repositories should replicate by subscription to communities, questions, object dependencies, retention mandates, or explicit collections. A global identifier makes cross-repository reference possible; it does not require a global physical graph. Cold records can move out of active indexes while their identifiers, provenance, and archival locations remain resolvable.

## Relations And Duplicate Meaning

Candidate relations are subject to the same rule as candidate objects: search systems may compute millions of possible links without publishing millions of permanent assertions. A relation becomes durable when an actual projection, argument, dependency, review, or decision relies on it.

Semantic duplicates must not be merged destructively. Two claims that look equivalent to a model may differ in scope, population, assumptions, metric, or version. Equivalence and subsumption should be attributable assertions used by a projection. This permits deduplicated views without pretending that identity resolution is infallible.

## Summaries And Checkpoints

People should usually encounter a living synthesis or bounded decision record before individual nodes. A synthesis must state its question, coverage window, profile, source frontier, omissions, and update time, then permit drill-down to exact events. It is a map with declared coverage, not a replacement for the territory.

Large stores may publish verified projection checkpoints to avoid replaying all history for every query. A checkpoint is a cache: it names the event frontier and projection code or rules that produced it. Consumers can accept it operationally, audit a sample, or replay from source according to their trust and cost constraints.

## Failure Modes

- **Premature atomization:** precomputing a universal graph creates enormous unowned verification debt.
- **Invisible candidates:** presenting machine-extracted candidates as established objects launders uncertainty.
- **Granularity gaming:** splitting one contribution into many objects to gain credit must not increase standing.
- **Permanent promotion:** a crystallized object's history remains durable, but cold objects can leave active indexes and focus views without deletion.
- **Summary capture:** high-level syntheses must expose coverage, omissions, projection rules, and source versions.
- **Hotspot neglect:** bounded views need explicit truncation indicators so relevance filters do not masquerade as completeness.
- **Replication coercion:** open creation must not be interpreted as an obligation for every repository to host or index every event.
- **False deduplication:** model-inferred equivalence must remain attributable and reversible.

## Open Question

The correct threshold is empirical and community-specific. A mathematical lemma, a clinical endpoint, an archival interpretation, and a benchmark result acquire independent scientific life in different ways. The kernel freezes the need for an exact source address and an explicit trigger; profiles and field trials determine the useful triggers and budgets in each domain.

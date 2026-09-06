# Standards Landscape And Project Boundary

ScholarState should compose with existing infrastructure rather than rename it.

| Existing work | What it already solves | ScholarState boundary |
| --- | --- | --- |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | Interchange of entities, activities, agents, derivation, and provenance | Reuse its conceptual mappings; add replayable research events and scoped decision projections |
| [RO-Crate 1.3](https://www.researchobject.org/ro-crate/specification/1.3/) | Packaging and describing research artifacts with extensible JSON-LD profiles | Treat crates as artifact-bearing research objects, not as the whole institutional state machine |
| [Nanopublications](https://nanopub.net/) | Small RDF assertions with assertion provenance and publication provenance | Support import/export while retaining activities, object versions, plural profiles, and jurisdictional decisions |
| [ResearchEquals modules](https://docs.researchequals.com/chapters/modules.html) | Publishing citable modules for steps and outputs of research | Learn from modular publication; focus the kernel on append-only state transitions and recomputable views |
| [CRediT](https://credit.niso.org/) | A standard taxonomy of contributor roles | Use as one profile vocabulary; never assume its article-centered roles exhaust future contributions |
| [COAR Notify](https://coar-notify.net/) | Linking repositories and review or endorsement services through notifications | Use as a transport adapter; do not make delivery messages the source of epistemic truth |

## Gap Hypothesis

The unfilled product gap is not a missing metadata field. It is the absence of a practical, user-facing composition where:

- raw research materials remain losslessly reachable;
- all meaningful changes are replayable;
- disciplinary meaning can evolve without migrating the universal core;
- contradictory evidence stays representable;
- human institutional responsibility is explicit at decisive nodes;
- AI can increase production and synthesis capacity without silently gaining authority;
- a researcher can inspect all of this without learning RDF, ontology engineering, or repository administration first.

This is a hypothesis to test with research communities, not a declaration that no related system exists.

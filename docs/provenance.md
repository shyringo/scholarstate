# Project Provenance

## Reused Standards And Concepts

- SHA-256 content addressing and append-only event logs are established distributed-systems techniques.
- The entity, activity, and agent distinction follows the direction of [W3C PROV](https://www.w3.org/TR/prov-overview/).
- Research objects and extensible profiles build on the work of the [RO-Crate community](https://www.researchobject.org/ro-crate/about_ro_crate).
- Atomic assertions with separate provenance are established by [nanopublications](https://nanopub.net/guidelines/working_draft/).
- Contributor-role vocabularies can be supplied by [CRediT](https://credit.niso.org/contributor-roles/).

No upstream code is copied into the current implementation.

## Adaptations

- Event sourcing is applied to research records so state views can be recomputed instead of edited in place.
- Domain vocabularies are moved into versioned profiles so the core can remain discipline-neutral.
- Attestations unify review-like statements while leaving their institutional meaning to profiles and jurisdictions.

## Project-Specific Work

- The five-event minimal kernel and its concrete JSON envelope.
- The separation of statement, human responsibility, and jurisdictional recognition in one replayable record.
- The rule that scientific status is always an identified projection, never the source of truth.
- The zero-dependency reference implementation, CLI, local append API, and evidence-map interface.

These combinations may overlap with prior research. They are documented as project-specific implementation choices, not asserted as novel academic inventions without a systematic literature review.

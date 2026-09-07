# Protocol Migration Notes

## 0.1 To 0.2

Protocol 0.2 introduces progressive crystallization and bounded focus projections. It is intentionally not declared wire-compatible with the unpublished 0.1 prototype because durable relations now require an independent-use materialization trigger, and crystallized objects require an exact source selector.

The reference server opens a new versioned local store for 0.2. It does not overwrite 0.1 JSONL files. A future migration command should read a 0.1 store, preserve every original event, and emit separate 0.2 interpretation events whose actor, policy, and assumptions are explicit. Simply editing old event payloads would invalidate their content identities and is forbidden.

Until that command exists, old stores remain archival records and can be inspected with the source revision that created them.

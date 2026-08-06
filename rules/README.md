# Loyalty Nest Domain Rules

This directory records implemented business flows and the invariants they rely on. The API remains the source of truth; these documents explain the behavior but do not replace database constraints, validation, or tests.

## Endpoint flows

- [Tag scan](./tag-scan-flow.md)
- [Loyalty accounts](./loyalty-accounts-flow.md)
- [Loyalty rewards](./loyalty-rewards-flow.md)

When a documented flow changes, update its rules, Mermaid diagram, API examples, and the corresponding functional tests in the same change.

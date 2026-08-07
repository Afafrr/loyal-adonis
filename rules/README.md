# Loyalty Nest Domain Rules

This directory records implemented business flows and the invariants they rely on. The API remains the source of truth; these documents explain the behavior but do not replace database constraints, validation, or tests.

## Backend

- [Tag scan](./backend/tag-scan-flow.md)
- [Loyalty accounts](./backend/loyalty-accounts-flow.md)
- [Loyalty rewards](./backend/loyalty-rewards-flow.md)

## Frontend

- [Reward balance visibility](./frontend/reward-balance-visibility.md)

When a documented flow changes, update its rules, Mermaid diagram, API examples, and the corresponding functional tests in the same change.

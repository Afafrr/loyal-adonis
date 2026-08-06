# Loyalty Rewards Flow

`GET /api/v1/me/loyalty_rewards` returns the signed-in user's unredeemed rewards, newest first.

```mermaid
flowchart TD
    request([GET loyalty rewards]) --> auth[Read signed-in user]
    auth --> rewards[Load unredeemed rewards]
    rewards --> ownership[Keep rewards owned by user]
    ownership --> context[Load account program and company]
    context --> sort[Sort newest first]
    sort --> response([Return rewards])
```

## Response rules

- A reward is available when `redeemed_at` is `NULL`.
- Every returned reward includes its loyalty account, program, and company context.
- The first returned item is the latest available reward for a future dashboard view.

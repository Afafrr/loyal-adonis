# Loyalty Accounts Flow

`GET /api/v1/me/loyalty_accounts` returns the user's stamp cards and recent locations. It does not return rewards.

```mermaid
flowchart TD
    request([GET loyalty accounts]) --> auth[Read signed-in user]
    auth --> accounts[Load user accounts]
    accounts --> program[Load program and company]
    accounts --> stamps[Count all stamps]
    accounts --> earned[Load earned reward snapshots]
    stamps --> progress[Calculate current-card stamps]
    earned --> progress
    accounts --> locations[Load recent locations for first 3 accounts]
    program --> response([Return loyalty accounts])
    progress --> response
    locations --> response
```

## Response rules

- `program.stampCount` is the number of stamps on the current card.
- `program.stampsRequired` is the card threshold.
- Current-card progress is all account stamps minus stamps assigned to earned rewards.
- All user accounts are returned. Only the first three accounts include up to two recent locations.

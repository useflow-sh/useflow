---
"@useflow/react": patch
---

Ensure the internal action state is set to `RESTORE` when loading saved state to properly update `previousStateRef` and prevent stale source values in navigation callbacks.

---
"@useflow/core": minor
---

`validatePersistedState` no longer requires a saved path to begin at the flow's `start` step, so progress from flows entered or reset at another step can be restored. The `allowedInitialStepIds` option and `ValidatePersistedStateOptions` type are removed. Missing steps, a mismatched current step and an inconsistent status are still rejected.

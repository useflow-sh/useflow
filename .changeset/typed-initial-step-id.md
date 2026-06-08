---
"@useflow/core": minor
"@useflow/react": minor
---

Add typed initial step overrides for brand-new flow state.

`createInitialState` now accepts an optional `initialStepId`, and React `Flow` exposes a type-safe `initialStepId` prop. Restored persisted state still takes precedence when available.

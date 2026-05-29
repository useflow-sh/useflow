---
"@useflow/react": patch
---

Decouple consumer callback props (such as `onSave`, `onRestore`, and navigation callbacks) from internal hook dependency arrays to prevent parent re-renders from triggering unnecessary state synchronization effects.

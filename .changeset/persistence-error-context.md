---
"@useflow/core": minor
"@useflow/react": minor
---

Report every persistence failure once, with the flow it came from.

- `onPersistenceError` now receives `(error, { flowId, operation, instanceId, variantId })`, where `operation` is `"save"`, `"restore"` or `"remove"`. One-argument handlers keep working.
- `onPersistenceError` now also receives store failures that `createPersister` catches itself. Previously those only reached the persister's `onError`. When a Flow or provider handler is set, it replaces the persister's `onError` for that flow instead of both firing.
- `persister.save()`, `restore()` and `remove()` accept a per-call `onError` that replaces the persister's `onError`. Custom persisters should call it when an operation fails.
- `incompatible_state` is reported once: to `onDiscard` when one is set, otherwise to `onPersistenceError`. Previously it went to both.
- `kvStorageAdapter` (and the localStorage, sessionStorage and AsyncStorage stores built on it) now throws from `get` when the storage read fails or stored data can't be deserialized, instead of returning `null`. The persister reports the error and restores nothing, so corrupted state is no longer indistinguishable from missing state.

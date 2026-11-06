# @useflow/core

## 0.6.0

### Minor Changes

- 778299f: Report every persistence failure once, with the flow it came from.

  - `onPersistenceError` now receives `(error, { flowId, operation, instanceId, variantId })`, where `operation` is `"save"`, `"restore"` or `"remove"`. One-argument handlers keep working.
  - `onPersistenceError` now also receives store failures that `createPersister` catches itself. Previously those only reached the persister's `onError`. When a Flow or provider handler is set, it replaces the persister's `onError` for that flow instead of both firing.
  - `persister.save()`, `restore()` and `remove()` accept a per-call `onError` that replaces the persister's `onError`. Custom persisters should call it when an operation fails.
  - `incompatible_state` is reported once: to `onDiscard` when one is set, otherwise to `onPersistenceError`. Previously it went to both.
  - `kvStorageAdapter` (and the localStorage, sessionStorage and AsyncStorage stores built on it) now throws from `get` when the storage read fails or stored data can't be deserialized, instead of returning `null`. The persister reports the error and restores nothing, so corrupted state is no longer indistinguishable from missing state.

## 0.5.0

### Minor Changes

- 827436d: `validatePersistedState` no longer requires a saved path to begin at the flow's `start` step, so progress from flows entered or reset at another step can be restored. The `allowedInitialStepIds` option and `ValidatePersistedStateOptions` type are removed. Missing steps, a mismatched current step and an inconsistent status are still rejected.
- ad272a5: Add typed restore discard events for expired, unmigrated, migration_rejected, and validation_rejected saved progress. Support a per-restore callback override and isolate callback failures without changing restore results or storage cleanup.
- cb4290d: Run the persister's `validate` on migrated state too. Previously a successful migration skipped `validate`; migrated progress that fails it is now discarded and reported as `validation_rejected`.

## 0.4.0

### Minor Changes

- a220de0: Add typed initial step overrides for brand-new flow state.

  `createInitialState` now accepts an optional `initialStepId`, and React `Flow` exposes a type-safe `initialStepId` prop. Restored persisted state still takes precedence when available.

## 0.3.2

## 0.3.1

## 0.3.0

## 0.2.0

### Minor Changes

- 5d85e63: Refactor useFlow to useFlowState

## 0.1.1

### Patch Changes

- 419ec23: Fix workspace version package resolution

## 0.1.0

### Minor Changes

- 62e2376: Initial public release of useflow - a type-safe, declarative multi-step flow library for React and beyond.

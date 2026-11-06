# @useflow/core

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

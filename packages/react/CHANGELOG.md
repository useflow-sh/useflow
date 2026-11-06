# @useflow/react

## 0.6.0

### Minor Changes

- 778299f: Report every persistence failure once, with the flow it came from.

  - `onPersistenceError` now receives `(error, { flowId, operation, instanceId, variantId })`, where `operation` is `"save"`, `"restore"` or `"remove"`. One-argument handlers keep working.
  - `onPersistenceError` now also receives store failures that `createPersister` catches itself. Previously those only reached the persister's `onError`. When a Flow or provider handler is set, it replaces the persister's `onError` for that flow instead of both firing.
  - `persister.save()`, `restore()` and `remove()` accept a per-call `onError` that replaces the persister's `onError`. Custom persisters should call it when an operation fails.
  - `incompatible_state` is reported once: to `onDiscard` when one is set, otherwise to `onPersistenceError`. Previously it went to both.
  - `kvStorageAdapter` (and the localStorage, sessionStorage and AsyncStorage stores built on it) now throws from `get` when the storage read fails or stored data can't be deserialized, instead of returning `null`. The persister reports the error and restores nothing, so corrupted state is no longer indistinguishable from missing state.

### Patch Changes

- Updated dependencies [778299f]
  - @useflow/core@0.6.0

## 0.5.0

### Minor Changes

- 81e7cc4: `reset()` accepts optional `context` and `initialStepId` overrides to start the flow over with new data or at a different step. Calling `reset()` with no arguments behaves as before.
- ad272a5: Add Flow and FlowProvider onDiscard callbacks for rejected saved progress, including incompatible flow definitions. Re-export discard event types, resolve callback overrides without duplicate notifications, and preserve existing persistence error reporting.

### Patch Changes

- Updated dependencies [827436d]
- Updated dependencies [ad272a5]
- Updated dependencies [cb4290d]
  - @useflow/core@0.5.0

## 0.4.0

### Minor Changes

- a220de0: Add typed initial step overrides for brand-new flow state.

  `createInitialState` now accepts an optional `initialStepId`, and React `Flow` exposes a type-safe `initialStepId` prop. Restored persisted state still takes precedence when available.

### Patch Changes

- Updated dependencies [a220de0]
  - @useflow/core@0.4.0

## 0.3.2

### Patch Changes

- ac56e70: Clear the internal action state on early return paths in `save()` and the persistence effect when the persister is disabled or non-navigation modes are active, preventing action ref leaks.
- a2d63ae: Ensure the internal action state is set to `RESTORE` when loading saved state to properly update `previousStateRef` and prevent stale source values in navigation callbacks.
  - @useflow/core@0.3.2

## 0.3.1

### Patch Changes

- c7ba44e: Clear internal action state after save operations settle to prevent duplicate saves on subsequent non-navigation component updates.
- 019aea3: Decouple consumer callback props (such as `onSave`, `onRestore`, and navigation callbacks) from internal hook dependency arrays to prevent parent re-renders from triggering unnecessary state synchronization effects.
  - @useflow/core@0.3.1

## 0.3.0

### Minor Changes

- 62e40f6: Improve Flow render-prop typing so step IDs, next steps, and explicit next/skip targets are inferred from the flow definition and narrowed by the current step.

### Patch Changes

- @useflow/core@0.3.0

## 0.2.0

### Minor Changes

- 5d85e63: Refactor useFlow to useFlowState

### Patch Changes

- Updated dependencies [5d85e63]
  - @useflow/core@0.2.0

## 0.1.1

### Patch Changes

- 419ec23: Fix workspace version package resolution
- Updated dependencies [419ec23]
  - @useflow/core@0.1.1

## 0.1.0

### Minor Changes

- 62e2376: Initial public release of useflow - a type-safe, declarative multi-step flow library for React and beyond.

### Patch Changes

- Updated dependencies [62e2376]
  - @useflow/core@0.1.0

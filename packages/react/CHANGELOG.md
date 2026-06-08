# @useflow/react

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

# @useflow/react

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

# @useflow/core

[![npm version](https://img.shields.io/npm/v/@useflow/core.svg)](https://www.npmjs.com/package/@useflow/core)
[![npm downloads](https://img.shields.io/npm/dm/@useflow/core.svg)](https://www.npmjs.com/package/@useflow/core)
[![license](https://img.shields.io/npm/l/@useflow/core.svg)](https://github.com/useflow-sh/useflow/blob/main/LICENSE)

**Framework-agnostic core for building type-safe multi-step flows**

Pure TypeScript flow state machine with no framework dependencies. Powers `@useflow/react` and future framework adapters.

## Installation

```bash
npm install @useflow/core
```

> **Note:** Most users should install [`@useflow/react`](https://www.npmjs.com/package/@useflow/react) instead, which includes this package and provides React-specific hooks and components.

## What is this?

This is the framework-agnostic core that powers useFlow. It provides:

- **Flow state machine** - Pure reducer for managing multi-step flow state
- **Type definitions** - Full TypeScript types for flows, steps, and context
- **Persistence utilities** - Save and restore flow progress with custom storage adapters
- **Zero dependencies** - Lightweight and portable

## When to use this package

Use `@useflow/core` directly if you:
- Want to build a custom framework adapter (Vue, Svelte, Angular, etc.)
- Need framework-agnostic flow logic for testing
- Are building a non-UI flow system

For React applications, use [`@useflow/react`](https://www.npmjs.com/package/@useflow/react) instead.

## Usage

```typescript
import { flowReducer, createInitialState } from "@useflow/core";

const definition = {
  id: "onboarding",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: { next: "complete" },
    complete: {},
  },
};

let state = createInitialState(definition, { name: "" });

// Navigate forward
state = flowReducer(state, { type: "NEXT" }, definition);

// Update context
state = flowReducer(
  state,
  { type: "SET_CONTEXT", update: { name: "John" } },
  definition
);

// Navigate back
state = flowReducer(state, { type: "BACK" }, definition);
```

## Documentation

- **[Full Documentation](https://docs.useflow.sh)** - Complete guides and API reference
- **[Core Concepts](https://docs.useflow.sh/core-concepts/flows)** - Understanding flows
- **[Custom Stores](https://docs.useflow.sh/api-reference/custom-stores)** - Building custom adapters

## Why Separate Core?

- **Portability** - Same flow logic works across React, Vue, Svelte, etc.
- **Testability** - Test flow logic without framework overhead
- **Flexibility** - Build custom framework adapters on a solid foundation

## License

MIT

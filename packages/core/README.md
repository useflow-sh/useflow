# @useflow/core

Framework-agnostic flow state machine for multi-step experiences.

## Installation

```bash
npm install @useflow/core
```

**Note:** Most users should install `@useflow/react` instead, which includes this package.

## What is this?

Pure TypeScript flow logic with no framework dependencies. Powers the React adapter and future framework adapters (Vue, Svelte, etc.).

**Key exports:**
- `flowReducer` - Pure reducer for managing flow state
- Type definitions for flows, steps, and context
- Persistence utilities

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

- **Portability** - Same flow works in React, Vue, Svelte
- **Testability** - Test logic without framework overhead
- **Flexibility** - Build custom framework adapters

## License

MIT

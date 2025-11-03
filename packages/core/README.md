# @useflow/core

**Framework-agnostic flow logic for multi-step experiences**

The core library powering useflow. This package contains the pure TypeScript flow logic with no framework dependencies.

## Installation

```bash
bun add @useflow/core
# or
npm install @useflow/core
```

**Note:** Most users should install the framework-specific package (e.g. `@useflow/react`) instead, which includes this package.

## What is @useflow/core?

This package provides the fundamental building blocks for creating multi-step flows:

- **`flowReducer`** - Pure reducer function for managing flow state
- **Type definitions** - TypeScript types for flows, steps, context, and navigation
- **Framework agnostic** - Works with React, Vue, Svelte, or vanilla JS

## Core Concepts

A flow is a **state machine** for multi-step experiences with three key concepts:

### 1. Steps
Abstract stages in your flow. Each step represents a point in the user's journey.

### 2. Context
Shared data that flows through all steps. This is your application state for the flow.

### 3. Transitions
Rules for moving between steps - can be static strings, arrays, or functions.

## API Reference

### Types

```typescript
import type {
  FlowDefinition,
  FlowState,
  FlowAction,
  StepDefinition,
  StepTransition,
  ContextUpdate,
} from "@useflow/core";
```

#### `FlowDefinition`

The flow configuration object defining your steps and transitions:

```typescript
type FlowDefinition = {
  id: string;     // Unique flow identifier
  start: string;  // Initial step ID
  version?: string; // Optional version for migrations
  variantId?: string; // Optional variant identifier
  steps: Record<string, StepDefinition>;
};
```

#### `StepDefinition`

Configuration for a single step:

```typescript
type StepDefinition = {
  next?: StepTransition;
};
```

#### `StepTransition`

How to navigate from this step:

```typescript
type StepTransition =
  | string           // Single static destination
  | string[];        // Multiple options (component-driven or context-driven)
```

For context-driven navigation with arrays, use the `resolve` property on `StepDefinition`.

#### `FlowState<TContext>`

The current state of a flow:

```typescript
type FlowState<TContext> = {
  stepId: string;                // Current step ID
  context: TContext;             // Current context data
  history: string[];             // Navigation history
  status: "active" | "complete"; // Flow status
};
```

#### `FlowAction<TContext>`

Actions that can be dispatched to modify flow state:

```typescript
type FlowAction<TContext> =
  | { type: "NEXT"; target?: string; update?: ContextUpdate<TContext> }
  | { type: "BACK" }
  | { type: "SET_CONTEXT"; update: ContextUpdate<TContext> };
```

#### `ContextUpdate<TContext>`

How to update context:

```typescript
type ContextUpdate<TContext> =
  | Partial<TContext>                  // Merge object
  | ((current: TContext) => TContext); // Updater function
```

### Functions

#### `flowReducer<TContext>(state, action, definition)`

Pure reducer function that processes actions and returns new state:

```typescript
import { flowReducer, createInitialState } from "@useflow/core";

const definition = {
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

#### `createInitialState<TContext>(definition, initialContext)`

Creates the initial flow state:

```typescript
const state = createInitialState(definition, { name: "", age: 0 });
// Returns: { stepId: "welcome", context: { name: "", age: 0 }, history: ["welcome"], status: "active" }
```



## Examples

### Linear Flow

Simple step-to-step navigation:

```typescript
const flow: FlowDefinition = {
  id: "linear-flow",
  start: "step1",
  steps: {
    step1: { next: "step2" },
    step2: { next: "step3" },
    step3: {}, // No next = final step
  },
};
```

### Context-Driven navigation

Conditional navigation based on context using runtime resolvers (implemented by framework adapters like `@useflow/react`):

```typescript
type Context = {
  accountType: "business" | "personal";
  name: string;
};

const config: FlowDefinition = {
  id: "account-flow",
  start: "userType",
  steps: {
    userType: {
      next: ["businessDetails", "personalDetails"],
    },
    businessDetails: { next: "complete" },
    personalDetails: { next: "complete" },
    complete: {},
  },
};

// Runtime resolvers (passed to flowReducer)
const resolvers = {
  userType: (ctx: Context) => 
    ctx.accountType === "business" ? "businessDetails" : "personalDetails",
};
```

**Note:** Framework adapters like `@useflow/react` provide the `defineFlow()` function with a `runtimeConfig` parameter for defining resolvers with type-safe step references.

### Component-Driven navigation (Array Navigation)

Component explicitly chooses which step to navigate to:

```typescript
const flow: FlowDefinition = {
  id: "setup-flow",
  start: "setup",
  steps: {
    setup: {
      // Component can navigate to any of these steps
      next: ["advanced", "quick", "skip"],
    },
    advanced: { next: "complete" },
    quick: { next: "complete" },
    skip: { next: "complete" },
    complete: {},
  },
};

// Navigate with explicit target
state = flowReducer(
  state,
  { type: "NEXT", target: "advanced" },
  flow
);
```

### Navigation with Context Updates

Update context while navigating:

```typescript
// Merge update
state = flowReducer(
  state,
  { type: "NEXT", update: { name: "Alice" } },
  definition
);

// Updater function
state = flowReducer(
  state,
  {
    type: "NEXT",
    update: (ctx) => ({ ...ctx, timestamp: Date.now() })
  },
  definition
);
```

## Type Safety

Full TypeScript support with type inference:

```typescript
type MyContext = {
  name: string;
  age: number;
  preferences: {
    theme: "light" | "dark";
  };
};

const flow: FlowDefinition = {
  id: "age-check-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: ["adult", "minor"],
    },
    adult: { next: "complete" },
    minor: { next: "complete" },
    complete: {},
  },
};

// Runtime resolvers (passed to flowReducer by framework adapters)
const resolvers = {
  welcome: (ctx: MyContext) => (ctx.age >= 18 ? "adult" : "minor"),
};
```

## Design Principles

1. **Framework Agnostic** - No React, Vue, or Svelte dependencies
2. **Pure Functions** - No side effects, easy to test
3. **Type Safe** - Full TypeScript support with no `any` types
4. **Minimal** - Small API surface, focused on flow logic only
5. **Composable** - Framework adapters build on top of this core

## Framework Adapters

- **[@useflow/react](../react)** - React hooks and components
- **@useflow/vue** - Coming soon
- **@useflow/svelte** - Coming soon

The same flow definition works across all frameworks - only the UI layer changes!

## Testing

The core library is thoroughly tested with 20+ tests covering:

- Flow creation and initialization
- Step navigation (linear and conditional)
- Context updates (merge and updater functions)
- Array-based navigation with targets
- Guard conditions
- Navigation history
- Type safety and inference
- Edge cases (missing steps, final steps, etc.)

Run tests:

```bash
bun test
```

## Why Separate Core Package?

Separating the flow logic from framework-specific code provides:

1. **Portability** - Same flow definition works in React, Vue, Svelte, etc.
2. **Testability** - Test flow logic without framework overhead
3. **Flexibility** - Build custom integrations for any framework
4. **Size** - Framework adapters only include what they need

## License

MIT

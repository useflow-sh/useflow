# useflow

**Type-safe, declarative multi-step flows for React applications**

useflow is a lightweight library for building multi-step flows like onboarding, checkout, surveys, and wizards with full TypeScript support.

## Features

- 🎯 **Declarative flow definitions** - Define your flow steps once, components show/hide automatically
- 🔒 **Type-safe** - Full TypeScript support with intelligent type inference
- 🔄 **Flexible navigation** - Linear flows, conditional branching, and component-driven routing
- 🎨 **Intuitive API** - Simple `defineFlow()` and `<Flow>` component pattern
- 📦 **Framework agnostic core** - React adapter included, other frameworks coming soon
- ⚡ **Lightweight** - Minimal dependencies, tree-shakeable
- 🧪 **Well tested** - Comprehensive test coverage

## Packages

- [`@useflow/core`](./packages/core) - Framework-agnostic flow logic
- [`@useflow/react`](./packages/react) - React hooks and components

## Quick Start

```bash
bun add @useflow/react
# or
npm install @useflow/react
```

> **Note:** `@useflow/core` is automatically included as a dependency of `@useflow/react`

### 1. Define Your Flow

Create a flow definition with your steps and context type:

```tsx
import { defineFlow, type FlowConfig } from "@useflow/react";

type OnboardingContext = {
  name: string;
  email: string;
  theme: "light" | "dark";
};

export const onboardingFlow = defineFlow({
  id: "onboarding-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: "profile",
    },
    profile: {
      next: "preferences",
    },
    preferences: {
      next: "complete",
    },
    complete: {
      // No next = final step
    },
  },
} as const satisfies FlowConfig<OnboardingContext>);
```

### 2. Render Your Flow

Use the `<Flow>` component to render your flow:

```tsx
import { Flow, FlowStep } from "@useflow/react";

function App() {
  return (
    <Flow
      flow={onboardingFlow}
      components={(flowState) => ({
        welcome: WelcomeStep,
        profile: ProfileStep,
        preferences: PreferencesStep,
        complete: () => <CompleteStep name={flowState.context.name} />,
      })}
      initialContext={{
        name: "",
        email: "",
        theme: "light",
      }}
      onComplete={() => {
        console.log("Flow completed!");
      }}
    >
      {/* Optional: Custom layout */}
      <Header />
      <FlowStep /> {/* Renders the current step */}
      <Footer />
    </Flow>
  );
}
```

### 3. Build Your Step Components

Create React components for each step:

```tsx
import { useFlow } from "@useflow/react";

function ProfileStep() {
  const { context, next, back, setContext } = useFlow<OnboardingContext>();

  return (
    <div>
      <h1>Profile Setup</h1>

      <input
        value={context.name}
        onChange={(e) => setContext({ name: e.target.value })}
        placeholder="Your name"
      />

      <input
        type="email"
        value={context.email}
        onChange={(e) => setContext({ email: e.target.value })}
        placeholder="Your email"
      />

      <button onClick={back}>Back</button>
      <button onClick={() => next()}>Next</button>
    </div>
  );
}
```

## Advanced Features

### Conditional Branching (Context-Driven)

Navigate to different steps based on context values:

```tsx
const flow = defineFlow({
  id: "flow",
  start: "userType",
  steps: {
    userType: {
      // Flow decides next step based on context
      next: (ctx) =>
        ctx.accountType === "business" ? "businessDetails" : "preferences",
    },
    businessDetails: {
      next: "preferences",
    },
    preferences: {
      next: "complete",
    },
    complete: {},
  },
} as const satisfies FlowConfig<Context>);
```

### Component-Driven Branching (Array Navigation)

Let components explicitly choose which step to navigate to:

```tsx
const flow = defineFlow({
  id: "flow",
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
} as const satisfies FlowConfig<Context>);

function SetupStep() {
  const { next } = useFlow();

  return (
    <div>
      <h1>Choose your setup experience</h1>
      <button onClick={() => next("advanced")}>Advanced Setup</button>
      <button onClick={() => next("quick")}>Quick Setup</button>
      <button onClick={() => next("skip")}>Skip Setup</button>
    </div>
  );
}
```

### Context Updates with Updater Functions

Update context with object merging or updater functions (like React's `setState`):

```tsx
const { next, setContext } = useFlow();

// Merge updates
setContext({ name: "John" });

// Updater function for complex updates
next((ctx) => ({
  ...ctx,
  preferences: {
    ...ctx.preferences,
    theme: "dark",
  },
  timestamp: Date.now(),
}));
```

### Type-Safe Navigation

Use the flow's custom hook for type-safe navigation:

```tsx
function WelcomeStep() {
  // Type-safe: TypeScript knows valid next steps for 'welcome'
  const { next } = onboardingFlow.useFlow({ step: "welcome" });

  next("profile"); // ✅ Valid
  next("invalid"); // ❌ TypeScript error
}
```

### Flow Callbacks

React to navigation and context changes:

```tsx
<Flow
  flow={myFlow}
  components={...}
  initialContext={...}
  onNext={({ from, to, oldContext, newContext }) => {
    console.log(`Navigated from ${from} to ${to}`);
    // oldContext: context before navigation
    // newContext: context after navigation (may include updates from next())
  }}
  onBack={({ from, to, oldContext, newContext }) => {
    console.log(`Went back from ${from} to ${to}`);
  }}
  onTransition={({ from, to, direction, oldContext, newContext }) => {
    console.log(`Transitioned ${direction} from ${from} to ${to}`);
    // direction: "forward" or "backward"
    // Unified callback for all navigation
  }}
  onContextUpdate={({ oldContext, newContext }) => {
    console.log("Context changed");
  }}
  onComplete={() => {
    console.log("Flow completed!");
  }}
/>
```

**Callback Types:**
- `onNext` - Fires on forward navigation only (includes oldContext and newContext)
- `onBack` - Fires on backward navigation only (includes oldContext and newContext)
- `onTransition` - Fires on all navigation (forward or backward, includes direction, oldContext, and newContext)
- `onContextUpdate` - Fires when context changes
- `onComplete` - Fires when flow reaches completion

Perfect for analytics, animations, and external state synchronization.

### Custom Layouts

Control where the current step renders:

```tsx
<Flow flow={myFlow} components={...} initialContext={...}>
  <div className="layout">
    <Sidebar />
    <main>
      <ProgressBar />
      <FlowStep /> {/* Current step renders here */}
    </main>
  </div>
</Flow>
```

## Examples

See the [vite-react example](./examples/vite-react) for complete working implementations:

- **Simple Flow** - Linear step-by-step navigation
- **Advanced Flow** - Conditional branching with business/personal paths
- Hook-based patterns with full TypeScript integration

## How It Works

useflow uses a **step-based architecture**:

1. **Steps** - Abstract stages in your flow (defined in configuration)
2. **Components** - React components that render the UI for each step
3. **Context** - Shared state that flows through all steps
4. **Transitions** - Rules for moving between steps

```
Flow Definition (Abstract)          React Implementation (Concrete)
━━━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
steps: {                            components: {
  welcome: { next: "profile" }  →     welcome: WelcomeStep
  profile: { next: "complete" } →     profile: ProfileStep
  complete: {}                  →     complete: CompleteStep
}                                   }
```

This separation means:

- Your flow logic is **framework-agnostic** (defined in `@useflow/core`)
- Your UI is **framework-specific** (React components)
- Future: The same flow config can work with Vue, Svelte, etc.

## API Overview

### Core Exports (`@useflow/react`)

```tsx
// Define flows
import { defineFlow, type FlowConfig } from "@useflow/react";

// Render flows
import { Flow, FlowStep, useFlow } from "@useflow/react";
```

### Main Components

- **`defineFlow(config)`** - Create a type-safe flow definition
- **`<Flow />`** - Main component that runs your flow
- **`<FlowStep />`** - Renders the current step (optional for custom layouts)
- **`useFlow()`** - Hook to access flow state and navigation

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build all packages
bun run build

# Run example app
cd examples/vite-react
bun dev
```

## Architecture

useflow follows a clean, layered architecture:

1. **@useflow/core** - Pure TypeScript flow state machine (no framework dependencies)
2. **@useflow/react** - React-specific hooks and components
3. **Future**: @useflow/vue, @useflow/svelte, etc.

This separation allows the core flow logic to be reusable across frameworks while keeping framework-specific implementations clean and focused.

## Inspiration

useflow is inspired by:

- **XState** - State machine patterns for flows
- **React Hook Form** - Type-safe context management
- **TanStack Query** - Updater function patterns
- **React Router** - Declarative navigation API

## Why useflow?

**vs Building from scratch:**

- ✅ Type-safe navigation out of the box
- ✅ History management included
- ✅ Well-tested state management
- ✅ Conditional branching built-in

**vs XState:**

- ✅ Simpler API for linear/branching flows
- ✅ Better TypeScript inference
- ✅ Built specifically for multi-step UI flows

**vs Form libraries:**

- ✅ Not just for forms - works for any multi-step experience
- ✅ Flexible component patterns
- ✅ Shared context across steps

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

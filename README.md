# useflow

**Type-safe, declarative multi-step flows for React applications**

useflow is a lightweight library for building multi-step flows like onboarding, checkout, surveys, and wizards with full TypeScript support.

## Features

- 🎯 **Declarative flow definitions** - Define your flow steps once, components show/hide automatically
- 🔒 **Type-safe** - Full TypeScript support with intelligent type inference
- 🔄 **Flexible navigation** - Linear flows, conditional branching, and component-driven routing
- 💾 **Built-in persistence** - Save and restore flow progress with localStorage, sessionStorage, or custom storage
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
import { defineFlow } from "@useflow/react";

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
});
```

### 2. Render Your Flow

Use the `<Flow>` component with render props to render your flow:

```tsx
import { Flow } from "@useflow/react";

function App() {
  return (
    <Flow
      flow={onboardingFlow}
      initialContext={{
        name: "",
        email: "",
        theme: "light",
      }}
      onComplete={() => {
        console.log("Flow completed!");
      }}
    >
      {({ renderStep }) => (
        <>
          <Header />
          {renderStep({
            welcome: <WelcomeStep />,
            profile: <ProfileStep />,
            preferences: <PreferencesStep />,
            complete: () => {
              const { context } = useFlow();
              return <CompleteStep name={context.name} />;
            },
          })}
          <Footer />
        </>
      )}
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

### 4. Configure Globally (Optional)

For apps with multiple flows, use `FlowProvider` to set defaults once:

```tsx
import { FlowProvider, createLocalStorageStore, createPersister } from "@useflow/react";

// Set up persistence once
const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
const persister = createPersister({ store });

function App() {
  return (
    <FlowProvider
      config={{
        persister,           // All flows use this persister
        saveMode: "always",  // All flows auto-save by default
        callbacks: {
          onFlowComplete: ({ flowId }) => {
            analytics.track("flow_completed", { flowId });
          },
        },
      }}
    >
      {/* All flows automatically use global config */}
      <Flow flow={onboardingFlow} initialContext={{...}} />
      <Flow flow={checkoutFlow} initialContext={{...}} />
    </FlowProvider>
  );
}
```

**Benefits:**

- Configure once, use everywhere - no repetitive props
- Global callbacks to track all flow lifecycle events
- Individual flows can override when needed

See the [`@useflow/react` README](./packages/react/README.md#global-configuration-with-flowprovider) for full documentation.

## Advanced Features

### Context-Driven Branching

Navigate to different steps based on context values using resolver functions in `runtimeConfig`:

```tsx
import { defineFlow } from "@useflow/react";

type Context = {
  accountType: "business" | "personal";
};

const flow = defineFlow(
  {
    id: "flow",
    start: "userType",
    steps: {
      userType: {
        next: ["businessDetails", "preferences"],
      },
      businessDetails: {
        next: "preferences",
      },
      preferences: {
        next: "complete",
      },
      complete: {},
    },
  },
  (steps) => ({
    resolve: {
      // Type annotation on ctx parameter for type safety
      userType: (ctx: Context) =>
        ctx.accountType === "business"
          ? steps.businessDetails
          : steps.preferences,
    },
  })
);
```

**Type Safety:** By annotating the `ctx` parameter with your context type, you get full type safety. Resolvers return type-safe step references (`steps.businessDetails`) instead of string IDs.

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
});

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
>
  {({ renderStep }) =>
    renderStep({
      welcome: <WelcomeStep />,
      profile: <ProfileStep />,
      complete: <CompleteStep />,
    })
  }
</Flow>
```

**Callback Types:**

- `onNext` - Fires on `next()` navigation (includes oldContext and newContext)
- `onSkip` - Fires on `skip()` navigation (includes oldContext and newContext)
- `onBack` - Fires on `back()` navigation (includes oldContext and newContext)
- `onTransition` - Fires on all navigation (forward or backward, includes direction, oldContext, and newContext)
- `onContextUpdate` - Fires when context changes via `setContext()`
- `onComplete` - Fires when flow reaches completion

Perfect for analytics, animations, and external state synchronization.

### Persistence & Progress Restore

Save and restore flow progress automatically with built-in persisters:

```tsx
import { Flow, defineFlow, createPersister, createLocalStorageStore } from "@useflow/react";

// Define your flow with an ID
export const onboardingFlow = defineFlow({
  id: "user-onboarding", // Unique ID for this flow
  start: "welcome",
  steps: { /* ... */ },
});

// Create store and persister
const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
const persister = createPersister({ store });

// Storage keys use format: prefix:flowId:variantId:instanceId
// Examples: "myapp:onboarding:default:default" and "myapp:checkout:default:default"
<Flow flow={onboardingFlow} persister={persister} {...props} />
<Flow flow={checkoutFlow} persister={persister} {...props} />
```

**Reusable Flows (Multiple Instances):**

Use `instanceId` when you need multiple instances of the same flow with separate persistence:

```tsx
// Define a reusable feedback flow
const feedbackFlow = defineFlow({
  id: "feedback",
  /* ... */
});

const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
const persister = createPersister({ store });

// Multiple instances with separate state
// Storage keys: "myapp:feedback:default:task-123" and "myapp:feedback:default:task-456"
<Flow
  flow={feedbackFlow}
  instanceId="task-123"  // Unique instance
  persister={persister}
  {...props}
/>

<Flow
  flow={feedbackFlow}
  instanceId="task-456"  // Different instance
  persister={persister}
  {...props}
/>
```

Perfect for:

- 📝 **Task-specific feedback** - Same flow, different tasks
- 🎫 **Multi-item checkout** - Per-item configuration flows
- 📊 **Per-entity forms** - Reusable forms for different entities
- 🔄 **Parallel workflows** - Multiple instances of the same workflow

**React Native:**

Use `createAsyncStorageStore` with AsyncStorage:

```tsx
import { createPersister, createAsyncStorageStore } from "@useflow/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const store = createAsyncStorageStore(AsyncStorage, { prefix: "myapp" });
const persister = createPersister({
  store,
  ttl: 7 * 24 * 60 * 60 * 1000,
});
```

**Custom Storage Backends:**

Implement the `FlowStore` interface for complete control:

```tsx
import type { FlowStore } from "@useflow/react";
import { createPersister } from "@useflow/react";

const remoteApiStore: FlowStore = {
  async get(flowId, instanceId, variantId) {
    // Construct API path from flow ID, instance ID, and variant ID
    const params = new URLSearchParams({
      instanceId: instanceId || "default",
      variantId: variantId || "default",
    });
    const response = await fetch(`/api/flows/${flowId}?${params}`);
    return response.ok ? response.json() : null;
  },
  async set(flowId, state, instanceId, variantId) {
    const params = new URLSearchParams({
      instanceId: instanceId || "default",
      variantId: variantId || "default",
    });
    await fetch(`/api/flows/${flowId}?${params}`, {
      method: "PUT",
      body: JSON.stringify(state),
    });
  },
  async remove(flowId, instanceId, variantId) {
    const params = new URLSearchParams({
      instanceId: instanceId || "default",
      variantId: variantId || "default",
    });
    await fetch(`/api/flows/${flowId}?${params}`, { method: "DELETE" });
  },
};

const persister = createPersister({ store: remoteApiStore });
```

Or use `kvStorageAdapter` with IndexedDB:

```tsx
import {
  createPersister,
  kvStorageAdapter,
  JsonSerializer,
} from "@useflow/react";

// Wrap IndexedDB with Storage interface
const indexedDBStore = {
  async getItem(key: string) {
    return await db.get(key);
  },
  async setItem(key: string, value: string) {
    await db.put(key, value);
  },
  async removeItem(key: string) {
    await db.delete(key);
  },
};

const store = kvStorageAdapter({
  storage: indexedDBStore,
  formatKey: (flowId, instanceId, variantId) => {
    const vid = variantId || "default";
    const iid = instanceId || "default";
    return `myapp:${flowId}:${vid}:${iid}`;
  },
  listKeys: async (flowId) => {
    const allKeys = await db.getAllKeys();
    if (!flowId) return allKeys.filter((k) => k.startsWith("myapp:"));
    const baseKey = `myapp:${flowId}:`;
    return allKeys.filter((k) => k.startsWith(baseKey));
  },
  // JsonSerializer is the default
});

const persister = createPersister({
  store,
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

**Advanced Options:**

```tsx
import { createPersister } from "@useflow/react";

// Assuming you have a store already created (see above)
const persister = createPersister({
  store,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
  validate: (state) => {
    // Custom validation
    return state.context.email?.includes("@");
  },
  onError: (error) => {
    console.error("Persistence error:", error);
  },
});
```

Perfect for:

- 📝 **Long forms** - Don't lose user input on page refresh
- 🛒 **Checkout flows** - Resume where users left off
- 📊 **Surveys** - Save progress between sessions
- 🎓 **Onboarding** - Let users complete at their own pace

### Custom Layouts

Control where the current step renders:

```tsx
<Flow flow={myFlow} initialContext={...}>
  {({ renderStep }) => (
    <div className="layout">
      <Sidebar />
      <main>
        <ProgressBar />
        {renderStep({
          welcome: <WelcomeStep />,
          profile: <ProfileStep />,
          complete: <CompleteStep />,
        })}
      </main>
    </div>
  )}
</Flow>
```

## Examples

See the [react-examples](./examples/react-examples) directory for complete working implementations:

- **Simple Flow** - Linear step-by-step navigation
- **Branching Flow** - Conditional navigation with context-driven branching
- **Task Flow** - Multiple flow instances with separate state
- **Survey Flow** - Event hooks (onNext, onBack, onTransition)
- **Flow Variants** - Runtime flow switching
- **Remote Configuration** - Load flow configs from external sources

All examples include full TypeScript integration and persistence.

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
import { defineFlow } from "@useflow/react";

// Render flows
import { Flow, useFlow } from "@useflow/react";
```

### Main Components

- **`defineFlow(config)`** - Create a type-safe flow definition
- **`<Flow />`** - Main component that runs your flow with render props
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
cd examples/react-examples
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

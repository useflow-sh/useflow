# @useflow/react

**React hooks and components for building type-safe multi-step flows**

React adapter for useflow with hooks, components, and helpers for building onboarding, checkout, surveys, wizards, and more.

## Installation

```bash
bun add @useflow/react
# or
npm install @useflow/react
```

> **Note:** `@useflow/core` is automatically included as a dependency

## Quick Start

### 1. Define Your Flow

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
      {({ renderStep }) =>
        renderStep({
          welcome: <WelcomeStep />,
          profile: <ProfileStep />,
          preferences: <PreferencesStep />,
          complete: () => {
            const { context } = useFlow();
            return <CompleteStep name={context.name} />;
          },
        })
      }
    </Flow>
  );
}
```

### 3. Build Your Step Components

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

## API Reference

### `defineFlow<TConfig>(config)`

Define a flow configuration with type-safe navigation. Returns a `RuntimeFlowDefinition` with a custom `useFlow` hook.

**Usage with TypeScript:**

```tsx
import { defineFlow } from "@useflow/react";

type MyContext = {
  userType?: "business" | "personal";
};

export const myFlow = defineFlow(
  {
    id: "my-flow",
    start: "welcome",
    steps: {
      welcome: {
        next: ["business", "personal"],
      },
      business: { next: "complete" },
      personal: { next: "complete" },
      complete: {},
    },
  },
  (steps) => ({
    resolve: {
      welcome: (ctx: MyContext) => 
        ctx.userType === "business" ? steps.business : steps.personal,
    },
  })
);
```

**Returns:**

- `config` - The flow configuration
- `useFlow` - Type-safe hook for this specific flow

### `<Flow />`

Main component that runs your flow using a render props pattern.

**Props:**

```tsx
type FlowProps<TConfig> = {
  flow: RuntimeFlowDefinition<TConfig>; // From defineFlow()
  initialContext: ExtractFlowContext<TConfig>;
  instanceId?: string; // Optional unique identifier for reusable flows
  onComplete?: () => void;
  onNext?: (event: {
    from: string;
    to: string;
    oldContext: ExtractFlowContext<TConfig>;
    newContext: ExtractFlowContext<TConfig>;
  }) => void;
  onSkip?: (event: {
    from: string;
    to: string;
    oldContext: ExtractFlowContext<TConfig>;
    newContext: ExtractFlowContext<TConfig>;
  }) => void;
  onBack?: (event: {
    from: string;
    to: string;
    oldContext: ExtractFlowContext<TConfig>;
    newContext: ExtractFlowContext<TConfig>;
  }) => void;
  onTransition?: (event: {
    from: string;
    to: string;
    direction: "forward" | "backward";
    oldContext: ExtractFlowContext<TConfig>;
    newContext: ExtractFlowContext<TConfig>;
  }) => void;
  onContextUpdate?: (event: {
    oldContext: ExtractFlowContext<TConfig>;
    newContext: ExtractFlowContext<TConfig>;
  }) => void;
  persister?: FlowPersister; // Optional persistence
  saveMode?: "always" | "navigation" | "manual"; // Save strategy (default: "navigation")
  saveDebounce?: number; // Debounce delay in ms (default: 300)
  onSave?: (state: PersistedFlowState<ExtractFlowContext<TConfig>>) => void;
  onRestore?: (state: PersistedFlowState<ExtractFlowContext<TConfig>>) => void;
  onPersistenceError?: (error: Error) => void;
  loadingComponent?: ReactNode; // Show while restoring
  children: (state: UseFlowReturn<ExtractFlowContext<TConfig>>) => ReactNode; // Render props function
};
```

**Example:**

```tsx
<Flow
  flow={myFlow}
  initialContext={{ name: "" }}
  onComplete={() => console.log("Done!")}
>
  {({ renderStep }) =>
    renderStep({
      welcome: <WelcomeStep />,
      profile: <ProfileStep />,
      complete: () => {
        const { context } = useFlow();
        return <CompleteStep name={context.name} />;
      },
    })
  }
</Flow>
```

**Custom Layout:**

```tsx
<Flow flow={myFlow} initialContext={...}>
  {({ renderStep, stepId, context }) => (
    <div className="layout">
      <Sidebar />
      <main>
        <ProgressBar currentStep={stepId} />
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

### `useFlow()`

Hook to access flow state and navigation. Use directly in components or use the type-safe version from `defineFlow`.

**Returns:**

```tsx
{
  context: TContext;                 // Current context
  stepId: string;                    // Current step ID
  status: "active" | "complete";     // Flow status
  path: PathEntry[];                 // Back navigation path
  history: HistoryEntry[];           // Complete history with timestamps
  startedAt: number;                 // When flow started
  completedAt?: number;              // When flow completed (if complete)
  next: (update?) => void;           // Navigate forward
  skip: (update?) => void;           // Skip forward (fires onSkip)
  back: () => void;                  // Navigate back
  setContext: (update) => void;      // Update context
  save: () => Promise<void>;         // Manually save (for saveMode="manual")
  isRestoring: boolean;              // True while restoring from persister
  steps: Record<string, StepInfo>;   // All steps in the flow
  nextSteps: readonly string[] | undefined; // Valid next steps from current
  renderStep: (elements) => ReactElement;   // Render current step
}
```

**Example:**

```tsx
function MyStep() {
  const { context, next, back, setContext } = useFlow<MyContext>();

  return (
    <div>
      <input
        value={context.name}
        onChange={(e) => setContext({ name: e.target.value })}
      />
      <button onClick={back}>Back</button>
      <button onClick={() => next()}>Next</button>
    </div>
  );
}
```

**Type-safe version from defineFlow:**

```tsx
function WelcomeStep() {
  // TypeScript knows valid next steps for 'welcome'
  const { next } = myFlow.useFlow({ step: "welcome" });

  next("profile"); // ✅ Valid
  next("invalid"); // ❌ TypeScript error
}
```

## Advanced Usage

### Context-Driven Branching

Flow decides next step based on context using resolver functions in `runtimeConfig`:

```tsx
import { defineFlow } from "@useflow/react";

type Context = {
  accountType: "business" | "enterprise" | "personal";
};

const flow = defineFlow(
  {
    id: "flow",
    start: "userType",
    steps: {
      userType: {
        next: ["businessDetails", "enterpriseDetails", "preferences"],
      },
      businessDetails: {
        next: "preferences",
      },
      enterpriseDetails: {
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
      userType: (ctx: Context) => {
        if (ctx.accountType === "business") return steps.businessDetails;
        if (ctx.accountType === "enterprise") return steps.enterpriseDetails;
        return steps.preferences;
      },
    },
  })
);
```

**Type Safety:** By annotating the `ctx` parameter with your context type (`ctx: Context`), you get full type safety. The resolver returns type-safe step references (`steps.businessDetails`) instead of string IDs.

### Component-Driven Branching (Array Navigation)

Component explicitly chooses which step to navigate to:

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

### Context Updates

#### Merge Updates

```tsx
const { setContext } = useFlow();

// Simple merge
setContext({ name: "John" });

// Multiple fields
setContext({ name: "John", email: "john@example.com" });
```

#### Updater Functions

```tsx
const { next, setContext } = useFlow();

// Update with function (like React's setState)
setContext((ctx) => ({
  ...ctx,
  preferences: {
    ...ctx.preferences,
    theme: "dark",
  },
}));

// Update while navigating
next((ctx) => ({
  ...ctx,
  timestamp: Date.now(),
}));
```

### Dynamic Components

Use `useFlow()` in inline components for dynamic rendering:

```tsx
<Flow flow={myFlow} initialContext={...}>
  {({ renderStep, context }) =>
    renderStep({
      welcome: <WelcomeStep />,
      profile: <ProfileStep />,
      // Pass context to component using useFlow()
      complete: () => {
        const { context } = useFlow();
        return <CompleteStep name={context.name} theme={context.theme} />;
      },
      // Conditional component selection
      dashboard: () => {
        const { context } = useFlow();
        return context.isPremium ? <PremiumDashboard /> : <FreeDashboard />;
      },
    })
  }
</Flow>
```

### Custom Layouts

Full control over layout and step placement:

```tsx
function MyFlowLayout() {
  return (
    <Flow flow={myFlow} initialContext={...}>
      {({ renderStep }) => (
        <div className="app-layout">
          <Sidebar />

          <main>
            <ProgressIndicator />
            {renderStep({
              welcome: <WelcomeStep />,
              profile: <ProfileStep />,
              complete: <CompleteStep />,
            })}
          </main>

          <Footer />
        </div>
      )}
    </Flow>
  );
}
```

### Flow Callbacks

React to flow navigation events:

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
    console.log("Context changed:", { oldContext, newContext });
    // Sync to external state, localStorage, etc.
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
- `onTransition` - **Unified callback** that fires on all navigation (forward or backward, includes direction, oldContext, and newContext)
- `onContextUpdate` - Fires when context changes via `setContext()`
- `onComplete` - Fires when flow reaches completion

**Callback Ordering:**
When navigating, callbacks fire in this order:

1. Specific callback (`onNext`, `onSkip`, or `onBack`)
2. General callback (`onTransition`)
3. Context callback (`onContextUpdate` - if context changed via navigation or `setContext()`)

**Use cases:**

- **Analytics tracking** - Log step transitions with `onTransition`
- **Animations** - Use `onTransition` with `direction` to animate forward/backward
- **Data persistence** - Save context to localStorage with `onContextUpdate`
- **External state sync** - Update Redux/Zustand stores

### Custom Step Rendering

Build custom transitions and animations with `renderStep`:

```tsx
function AnimatedFlowStep({ children }: { children: React.ReactNode }) {
  const { stepId } = useFlow();

  return (
    <div className="animated-container">
      <div key={stepId} className="slide-in">
        {children}
      </div>
    </div>
  );
}

// Use in Flow
<Flow flow={myFlow} initialContext={...}>
  {({ renderStep }) => (
    <AnimatedFlowStep>
      {renderStep({
        welcome: <WelcomeStep />,
        profile: <ProfileStep />,
        complete: <CompleteStep />,
      })}
    </AnimatedFlowStep>
  )}
</Flow>
```

This allows you to:

- Build custom transitions/animations
- Add loading states
- Implement cross-fade effects
- Control component lifecycle

### Persistence & Progress Restore

Save and restore flow progress automatically across sessions.

> **⚠️ IMPORTANT:** Once you enable persistence, you MUST handle migrations properly when making breaking changes to your flow configuration. Breaking changes (renaming steps, changing context shape, etc.) without proper migrations will cause errors for users with old persisted state. See [Schema Versioning & Migration](#schema-versioning--migration) for details.

#### Quick Start

```tsx
import {
  defineFlow,
  Flow,
  createPersister,
  createLocalStorageStore,
} from "@useflow/react";

// Define your flow with a unique ID
export const onboardingFlow = defineFlow({
  id: "user-onboarding", // Required for persistence
  start: "welcome",
  steps: {
    /* ... */
  },
});

// Create store and persister
const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
const persister = createPersister({
  store,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

function App() {
  return (
    <Flow
      flow={onboardingFlow}
      initialContext={{ name: "", email: "" }}
      persister={persister}
      onSave={(state) => {
        console.log("Progress saved at step:", state.stepId);
      }}
      onRestore={(state) => {
        console.log("Welcome back! Resuming from step:", state.stepId);
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
  );
}
```

When users return, they'll automatically resume from where they left off!

#### Storage Adapters

**Pre-configured Storage Helpers (Recommended)**

Use these helpers for common storage backends:

```tsx
import {
  createLocalStorageStore,
  createSessionStorageStore,
  createPersister,
} from "@useflow/react";

// localStorage (recommended for most use cases)
const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
const persister = createPersister({ store });

// sessionStorage (cleared when tab closes)
const store2 = createSessionStorageStore(sessionStorage, { prefix: "myapp" });
const persister2 = createPersister({ store: store2 });

// With custom serializer (advanced)
import { MyCustomSerializer } from "./serializers";
const store3 = createLocalStorageStore(localStorage, {
  prefix: "myapp",
  serializer: MyCustomSerializer,
});
```

**Storage Key Format:**

Keys follow the pattern: `prefix:flowId:variantId:instanceId`

- Without `instanceId`: `"myapp:onboarding:default:default"`
- With `instanceId`: `"myapp:feedback:default:task-123"`

The `variantId` segment is reserved for future use (currently always "default").

**Custom Key Generation (Advanced)**

For advanced use cases like user-scoped keys, use `kvStorageAdapter`:

```tsx
import { kvStorageAdapter, createPersister } from "@useflow/react";

// User-scoped storage keys
const store = kvStorageAdapter({
  storage: localStorage,
  formatKey: (flowId, instanceId, variantId) => {
    const userId = getCurrentUserId();
    const vid = variantId || "default";
    const iid = instanceId || "default";
    return `user:${userId}:${flowId}:${vid}:${iid}`;
  },
  listKeys: (flowId) => {
    const allKeys = Object.keys(localStorage);
    const userId = getCurrentUserId();
    const prefix = `user:${userId}:`;
    if (!flowId) return allKeys.filter((k) => k.startsWith(prefix));
    const baseKey = `${prefix}${flowId}:`;
    return allKeys.filter((k) => k.startsWith(baseKey));
  },
  // JsonSerializer is the default, no need to specify
});

const persister = createPersister({
  store,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});
```

**React Native AsyncStorage:**

```tsx
import { createAsyncStorageStore, createPersister } from "@useflow/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Simplified AsyncStorage setup
const store = createAsyncStorageStore(AsyncStorage, { prefix: "myapp" });
const persister = createPersister({ store });
```

**Memory Storage (for testing):**

```tsx
import { createMemoryStore, createPersister } from "@useflow/react";

const store = createMemoryStore();
const persister = createPersister({ store });
```

**Multiple Flows, One Persister:**

```tsx
const onboardingFlow = defineFlow({ id: "onboarding", /* ... */ });
const checkoutFlow = defineFlow({ id: "checkout", /* ... */ });

// One store and persister for all flows
const store = createLocalStorageStore(localStorage, { prefix: "myapp" });
const persister = createPersister({ store });

// Storage keys use format: prefix:flowId:variantId:instanceId
// With defaults: "myapp:onboarding:default:default" and "myapp:checkout:default:default"
<Flow flow={onboardingFlow} persister={persister} {...props} />
<Flow flow={checkoutFlow} persister={persister} {...props} />
```

> **Note:** For reusable flows with multiple instances (same flow, different tasks/items), see [Instance IDs for Reusable Flows](#instance-ids-for-reusable-flows) below.

#### Advanced Configuration

```tsx
import { createLocalStorageStore, createPersister } from "@useflow/react";

// Create your store (using simplified helper or kvStorageAdapter)
const store = createLocalStorageStore(localStorage, { prefix: "myapp" });

const persister = createPersister({
  store,

  // Time-to-live: auto-clear old data
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days

  // Custom validation (read-only check)
  validate: (state) => {
    // Return false to reject invalid state
    // Note: Do NOT mutate state here - it's readonly
    // For transformations, define a 'migrate' function in your flow config
    return state.context.email?.includes("@");
  },

  // Called when state is saved
  onSave: (flowId, state) => {
    console.log(`Saved ${flowId} at step ${state.stepId}`);
    // Track saves, sync to analytics, etc.
  },

  // Called when state is restored
  onRestore: (flowId, state) => {
    console.log(`Restored ${flowId} from step ${state.stepId}`);
    // Track restores, log analytics events, etc.
  },

  // Error handling
  onError: (error) => {
    console.error("Persistence error:", error);
    // Send to error tracking service
  },
});
```

#### Custom Stores

Implement the `FlowStore` interface for custom storage backends. Store methods can be either synchronous or asynchronous:

```tsx
import type { FlowStore, PersistedFlowState } from "@useflow/react";
import { createPersister } from "@useflow/react";

// remote API-based storage
const remoteApiStore: FlowStore = {
  async get(flowId: string) {
    const response = await fetch(`/api/flows/${flowId}`);
    if (!response.ok) return null;
    return response.json();
  },

  async set(flowId: string, state: PersistedFlowState<MyContext>) {
    await fetch(`/api/flows/${flowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  },

  async remove(flowId: string) {
    await fetch(`/api/flows/${flowId}`, { method: "DELETE" });
  },
};

const persister = createPersister({ store: remoteApiStore });

// Use with Flow
<Flow
  flow={myFlow} // Flow must have an ID defined
  initialContext={...}
  persister={persister}
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

**Custom storage examples:**

- Database persistence (PostgreSQL, MongoDB)
- IndexedDB for large data
- Cloud storage (AWS S3, Firebase)
- Redis or other key-value stores
- React Native AsyncStorage

#### What Gets Persisted?

Persisted state includes:

```tsx
{
  stepId: "profile",                    // Current step
  context: { name: "John" },            // Full context
  
  // Path: Stack of steps for back() navigation
  // When you call back(), it pops from this stack
  path: [
    { stepId: "welcome", startedAt: 1234567890 }
  ],
  
  // History: Complete chronological record of all steps visited
  // Includes timestamps and how user left each step
  history: [
    { stepId: "welcome", startedAt: 1234567890, completedAt: 1234567900, action: "next" },
    { stepId: "profile", startedAt: 1234567900 } // Current step - no completedAt/action yet
  ],
  
  status: "active",                     // Flow status
  startedAt: 1234567890,                // When flow started
  completedAt: undefined,               // When flow completed (if complete)
  
  __meta: {                             // Internal (do not access directly)
    version: "v1",
    savedAt: 1234567890,
  }
}
```

**Note:** 
- `path` is the navigation stack - used by `back()` to know where to go
- `history` is the complete chronological log - includes all movements with timestamps
- The `__meta` field is internal-only and automatically managed by the framework. Use `startedAt`, `completedAt`, and `history` for timestamps instead.

#### Manual Persistence Control

**Manual Save Mode:**

Use `saveMode="manual"` to disable automatic saves and control when state is persisted:

```tsx
import { Flow, useFlow } from "@useflow/react";

function MyStep() {
  const { context, next, save } = useFlow();

  const handleSave = async () => {
    await save(); // Manually trigger save
    toast.success("Progress saved!");
  };

  return (
    <div>
      <input
        value={context.name}
        onChange={(e) => setContext({ name: e.target.value })}
      />
      <button onClick={handleSave}>Save Draft</button>
      <button onClick={() => next()}>Next</button>
    </div>
  );
}

<Flow
  flow={myFlow}
  initialContext={...}
  persister={persister}
  saveMode="manual"  // Disable auto-save
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

**Save Strategies:**

- `saveMode="navigation"` (default) - Auto-save on step changes only
- `saveMode="always"` - Auto-save on every context update
- `saveMode="manual"` - No auto-save, use `save()` method to save manually

#### Instance IDs for Reusable Flows

When you need to use the same flow definition multiple times with separate persistence, use the `instanceId` prop:

```tsx
const feedbackFlow = defineFlow({
  id: "feedback",
  start: "rating",
  steps: {
    rating: { next: "comments" },
    comments: { next: "complete" },
    complete: {},
  },
});

// Assuming you have a store already created (see Storage Adapters section)
const persister = createPersister({ store });

// In your app - multiple instances with separate state
function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <>
      {tasks.map((task) => (
        <Flow
          key={task.id}
          flow={feedbackFlow}
          instanceId={task.id} // ← Unique per task
          persister={persister}
          initialContext={{
            taskId: task.id,
            taskName: task.name,
            rating: 0,
            comments: "",
          }}
        />
      ))}
    </>
  );
}
```

**How it works:**

- **Without `instanceId`**: Storage key is `prefix:flowId:default:default`
- **With `instanceId`**: Storage key is `prefix:flowId:default:instanceId`

Example with prefix "myapp":
- Without instanceId: `"myapp:feedback:default:default"`
- With instanceId: `"myapp:feedback:default:task-123"`

**When to use:**

- ✅ Multiple feedback forms (per task, per item)
- ✅ Reusable configuration wizards (per user, per project)
- ✅ Per-entity onboarding (per feature, per module)
- ✅ Parallel workflow instances

**When NOT to use:**

- ❌ Single-instance flows (onboarding, checkout) - just use `flowId`
- ❌ Different flow types - use different `flowId` values instead

#### Clearing Persisted Data

**Via restart button:**

```tsx
import { useFlow } from "@useflow/react";

function MyStep() {
  const handleRestart = () => {
    // Clear persisted state using flow ID (or flow ID + instance ID)
    await persister.remove?.(myFlow.id, instanceId);
    // Then restart the flow
    window.location.reload(); // Or use your own state management
  };

  return <button onClick={handleRestart}>Start Over</button>;
}
```

**Programmatically:**

```tsx
// Clear specific flow
await persister.remove?.(myFlow.id);

// Clear specific instance
await persister.remove?.(myFlow.id, instanceId);

// Clear all instances of a flow
await persister.removeFlow?.(myFlow.id);

// Clear all flows (e.g., on logout)
await persister.removeAll?.();
```

#### Loading States

Handle async restoration with loading states:

```tsx
function App() {
  return (
    <Flow
      flow={myFlow}
      initialContext={...}
      persister={persister}
      loadingComponent={<div>Loading your progress...</div>}
    >
      {({ renderStep }) =>
        renderStep({
          welcome: <WelcomeStep />,
          profile: <ProfileStep />,
          complete: <CompleteStep />,
        })
      }
    </Flow>
  );
}
```

#### Persistence Callbacks

Track save and restore events for analytics, debugging, or custom logic.

**Option 1: Flow-level callbacks** (recommended for UI feedback):

```tsx
import { Flow } from "@useflow/react";

function App() {
  const [showSaved, setShowSaved] = useState(false);

  return (
    <>
      {showSaved && <div className="toast">Progress saved!</div>}

      <Flow
        flow={myFlow}
        initialContext={...}
        persister={persister}

        // Called after each save
        onSave={(state) => {
          console.log("Saved at step:", state.stepId);
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2000);
        }}

        // Called when state is restored on mount
        onRestore={(state) => {
          console.log("Welcome back! Resuming from:", state.stepId);
          analytics.track("Flow Resumed", {
            stepId: state.stepId,
            contextData: state.context,
          });
        }}

        // Called on persistence errors
        onPersistenceError={(error) => {
          console.error("Persistence error:", error);
          showErrorToast("Failed to save progress");
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
    </>
  );
}
```

**Option 2: Persister-level callbacks** (recommended for global tracking):

```tsx
import { createPersister } from "@useflow/react";

// Assuming you have a store already created (see Storage Adapters section)
const persister = createPersister({
  store,

  // Track ALL saves across ALL flows
  onSave: (flowId, state) => {
    console.log(`[${flowId}] Saved at step:`, state.stepId);
    analytics.track("Flow Progress Saved", {
      flowId,
      stepId: state.stepId,
      stepCount: state.history.length,
    });
  },

  // Track ALL restores across ALL flows
  onRestore: (flowId, state) => {
    console.log(`[${flowId}] Restored from step:`, state.stepId);
    analytics.track("Flow Progress Restored", {
      flowId,
      stepId: state.stepId,
      stepCount: state.history.length,
    });
  },

  // Error handling
  onError: (error) => {
    console.error("[Persistence] Error:", error);
    Sentry.captureException(error);
  },
});
```

**When to use which:**

- **Flow-level** (`onSave`, `onRestore`, `onPersistenceError` props) - For UI feedback, flow-specific logic
- **Persister-level** (`onSave`, `onRestore`, `onError` options) - For analytics, global tracking, monitoring

**Use cases:**

- 📊 **Analytics** - Track save/restore rates, completion patterns, drop-off points
- 🐛 **Debugging** - Log persistence events during development
- 💾 **UI feedback** - Show "Saving...", "Saved", or "Welcome back" messages
- 🔔 **Notifications** - Alert users when progress is restored
- 🔄 **Sync** - Trigger external syncs (e.g., to backend, cloud storage)

#### Debouncing

Persistence is automatically debounced (300ms) to avoid excessive writes:

```tsx
// These rapid updates trigger only one save
setContext({ name: "J" });
setContext({ name: "Jo" });
setContext({ name: "Joh" });
setContext({ name: "John" });
// → Single save after 300ms (onSave called once)
```

#### Schema Versioning & Migration

Handle breaking changes to your flow structure (context, step names, etc.).

> **⚠️ CRITICAL:** If you use persistence, you MUST implement migrations when making breaking changes. Without migrations, users with old persisted state will encounter errors or lose their progress. Always update `version` (e.g., "v1" → "v2") and provide a `migrate` function when making breaking changes.

**Breaking changes include:**

- ✗ Renaming or removing context fields
- ✗ Renaming or removing steps
- ✗ Changing step transition logic that affects saved stepId
- ✗ Changing the start step
- ✗ Restructuring the flow in incompatible ways

**Non-breaking changes (safe without migration):**

- ✓ Adding new optional context fields (with defaults)
- ✓ Adding new steps (that aren't in existing paths)
- ✓ Changing UI/components without affecting flow structure
- ✓ Updating logic that doesn't change persisted state structure

```tsx
import {
  defineFlow,
  Flow,
  createPersister,
  kvStorageAdapter,
} from "@useflow/react";

// Define flow with version and migration
const onboardingFlow = defineFlow({
  id: "onboarding",
  version: "v2", // Current version

  // Migration function receives full persisted state
  // You can migrate context, stepId, history, or any other field
  migrate: (state, fromVersion) => {
    // v1 -> v2: renamed 'email' to 'emailAddress' in context
    if (fromVersion === "v1") {
      return {
        ...state,
        context: {
          ...state.context,
          emailAddress: state.context.email, // Transform old field
        },
      };
    }

    // Unknown version - discard old state
    return null;
  },

  start: "welcome",
  steps: {
    /* ... */
  },
});

// Persister doesn't need version config - it's on the flow
// Assuming you have a store and persister already created (see Storage Adapters section)
<Flow flow={onboardingFlow} persister={persister} {...props} />;
```

**Example: Migrating step names**

If you rename steps in your flow, you need to update both `stepId` and `history`:

```tsx
const onboardingFlow = defineFlow({
  id: "onboarding",
  version: "v3",

  migrate: (state, fromVersion) => {
    if (fromVersion === "v2") {
      // Renamed step: 'userProfile' -> 'profile'
      return {
        ...state,
        stepId: state.stepId === "userProfile" ? "profile" : state.stepId,
        path: state.path.map((entry) => ({
          ...entry,
          stepId: entry.stepId === "userProfile" ? "profile" : entry.stepId,
        })),
        history: state.history.map((entry) => ({
          ...entry,
          stepId: entry.stepId === "userProfile" ? "profile" : entry.stepId,
        })),
      };
    }
    return null;
  },

  start: "welcome",
  steps: {
    welcome: { next: "profile" }, // renamed from 'userProfile'
    profile: { next: "complete" },
    complete: {},
  },
});
```

**How it works:**

1. Define `version` and `migrate` in your flow config (not on the persister)
2. When state is restored, the framework automatically checks if versions match
3. If versions differ, your `migrate` function is called automatically
4. The `migrate` function receives the **full state** `(stepId, context, history, status)` and `fromVersion`
5. Return the transformed state, or `null` to discard old data

**Key Points:**

- ⚠️ **Always version your flow** - Set `version` (e.g., "v1") when using persistence
- ⚠️ **Always provide migrations** - Update `version` (e.g., "v1" → "v2") and add migration logic for breaking changes
- The `migrate` function is **called automatically** - you never invoke it manually
- Define version at the **flow config level**, not persister level
- You receive the **full persisted state**, not just context - you can migrate any field
- Common migrations: context fields, step names (stepId + history), or entire flow structure
- Return transformed state or `null` to discard incompatible versions
- You don't need to manually update `__meta.version` - the framework handles it
- **Test your migrations** - Ensure old state can be successfully migrated to new structure

#### Best Practices

**1. Always use versioning with persistence:**

```tsx
// ✅ Good - versioned flow with migrations
const flow = defineFlow({
  id: "onboarding",
  version: "v1", // Start with v1
  migrate: (state, fromVersion) => {
    // Handle future migrations here
    return null; // No old versions yet
  },
  start: "welcome",
  steps: {
    /* ... */
  },
});

// ⚠️ Risky - no version means no migration support
const flow = defineFlow({
  id: "onboarding",
  // No version - any breaking changes will break users!
  start: "welcome",
  steps: {
    /* ... */
  },
});
```

**2. Use descriptive flow IDs:**

```tsx
// ✅ Good
id: "user-onboarding";
id: "checkout-flow";
id: "survey-2024";

// ❌ Bad
id: "flow1";
id: "f";
```

**3. Test migrations before deploying:**

```tsx
// Create test cases for your migrations
import { describe, it, expect } from "vitest";

describe("onboarding flow migrations", () => {
  it("should migrate v1 to v2", () => {
    const oldState = {
      stepId: "profile",
      context: { email: "user@example.com" },
      history: ["welcome", "profile"],
      status: "active",
      __meta: { version: "v1" },
    };

    const migrated = onboardingFlow.migrate(oldState, "v1");

    expect(migrated).toEqual({
      ...oldState,
      context: { emailAddress: "user@example.com" },
    });
  });
});
```

**4. Set appropriate TTL:**

```tsx
// Assuming you have a store already created (see Storage Adapters section)

// Short forms: 1 day
const persister = createPersister({
  store,
  ttl: 1000 * 60 * 60 * 24,
});

// Long onboarding: 30 days
const persister2 = createPersister({
  store,
  ttl: 1000 * 60 * 60 * 24 * 30,
});

// Session-only: use sessionStorage instead of localStorage
const sessionStore = kvStorageAdapter({
  storage: sessionStorage,
  // ... other options
});
const persister3 = createPersister({ store: sessionStore });
```

**5. Handle sensitive data:**

```tsx
// Assuming you have a store already created (see Storage Adapters section)

// Validate sensitive data isn't in state
const persister = createPersister({
  store,
  validate: (state) => {
    // Reject if sensitive fields are present
    if (state.context.creditCard || state.context.password) {
      console.error("Sensitive data in persisted state!");
      return false; // Discard this state
    }
    return true;
  },
});

// Better: Don't put sensitive data in context at all
// Keep it in local component state instead
```

#### Use Cases

Perfect for:

- 📝 **Long forms** - Multi-step forms users complete over time
- 🛒 **Checkout flows** - Shopping cart and payment info across sessions
- 📊 **Surveys** - Long questionnaires users can pause and resume
- 🎓 **Onboarding** - Complex setup flows users complete at their own pace
- 🎮 **Tutorials** - Interactive guides users can return to later

### Multiple Flows

Run multiple flows in the same app:

```tsx
function App() {
  const [currentFlow, setCurrentFlow] = useState<"onboarding" | "settings">("onboarding");

  return (
    <>
      {currentFlow === "onboarding" && (
        <Flow
          flow={onboardingFlow}
          initialContext={...}
          onComplete={() => setCurrentFlow("settings")}
        >
          {({ renderStep }) =>
            renderStep({
              welcome: <WelcomeStep />,
              profile: <ProfileStep />,
              complete: <CompleteStep />,
            })
          }
        </Flow>
      )}

      {currentFlow === "settings" && (
        <Flow
          flow={settingsFlow}
          initialContext={...}
        >
          {({ renderStep }) =>
            renderStep({
              general: <GeneralSettingsStep />,
              privacy: <PrivacySettingsStep />,
              complete: <SettingsCompleteStep />,
            })
          }
        </Flow>
      )}
    </>
  );
}
```

## Type Safety

### Fully Type-Safe Context

```tsx
type MyContext = {
  name: string;
  age: number;
  preferences: {
    theme: "light" | "dark";
    notifications: boolean;
  };
};

const flow = defineFlow({
  id: "flow",
  start: "welcome",
  steps: {
    welcome: {
      // TypeScript knows ctx has all MyContext properties
      next: ["adult", "minor"],
      resolve: (ctx) => (ctx.age >= 18 ? "adult" : "minor"),
    },
    adult: { next: "complete" },
    minor: { next: "complete" },
    complete: {},
  },
});

function MyStep() {
  const { context, setContext } = useFlow<MyContext>();

  // ✅ TypeScript knows context.name is string
  context.name.toUpperCase();

  // ✅ TypeScript knows preferences.theme is "light" | "dark"
  context.preferences.theme === "dark";

  // ❌ TypeScript error - 'foo' doesn't exist
  // setContext({ foo: "bar" });
}
```

### Type-Safe Navigation

```tsx
const myFlow = defineFlow({
  id: "my-flow",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: { next: ["preferences", "skip"] },
    preferences: { next: "complete" },
    skip: { next: "complete" },
    complete: {},
  },
});

function ProfileStep() {
  const { next } = myFlow.useFlow({ step: "profile" });

  next("preferences"); // ✅ Valid next step
  next("skip"); // ✅ Valid next step
  next("invalid"); // ❌ TypeScript error
}
```

## Examples

See the [react-examples](../../examples/react-examples) directory for complete implementations:

- **Simple Flow** - Linear step-by-step navigation
- **Branching Flow** - Conditional navigation with context-driven and component-driven branching
- **Task Flow** - Multiple flow instances with separate state
- **Survey Flow** - Event hooks (onNext, onBack, onTransition)
- **Flow Variants** - Runtime flow switching for A/B testing
- **Remote Configuration** - Load flow configs from external sources

All examples include full TypeScript integration and persistence.

## Testing

Write tests for your step components:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Flow } from "@useflow/react";

test("ProfileStep collects user input", () => {
  render(
    <Flow flow={myFlow} initialContext={{ name: "" }}>
      {({ renderStep }) =>
        renderStep({
          welcome: <WelcomeStep />,
          profile: <ProfileStep />,
          complete: <CompleteStep />,
        })
      }
    </Flow>
  );

  // Start at welcome
  expect(screen.getByText("Welcome")).toBeInTheDocument();

  // Navigate to profile
  fireEvent.click(screen.getByText("Next"));

  // Test profile step
  const input = screen.getByPlaceholderText("Your name");
  fireEvent.change(input, { target: { value: "John" } });

  expect(input).toHaveValue("John");
});
```

## Migration Guide

If you're migrating from a custom flow solution:

1. **Extract flow logic** - Move step definitions to `defineFlow()`
2. **Simplify components** - Use `useFlow()` hook instead of prop drilling
3. **Type your context** - Define context type for full type safety
4. **Use transitions** - Replace manual navigation with `next()` and `back()`

## Performance

useflow is optimized for performance:

- **Minimal re-renders** - Only affected components re-render on state changes
- **Efficient memoization** - Internal state is memoized to prevent unnecessary updates
- **Small bundle size** - Tree-shakeable, only ~13KB gzipped (including core)
- **No dependencies** - Only React as peer dependency

## License

MIT

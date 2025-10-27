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
    />
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

Define a flow configuration with type-safe navigation. Returns a `FlowDefinition` with a custom `useFlow` hook.

**Usage with TypeScript:**

```tsx
import { defineFlow, type FlowConfig } from "@useflow/react";

type MyContext = {
  userType?: "business" | "personal";
};

export const myFlow = defineFlow({
  id: "my-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: (ctx) => (ctx.userType === "business" ? "business" : "personal"),
    },
    business: { next: "complete" },
    personal: { next: "complete" },
    complete: {},
  },
} as const satisfies FlowConfig<MyContext>);
```

**Returns:**

- `config` - The flow configuration
- `useFlow` - Type-safe hook for this specific flow

### `<Flow />`

Main component that runs your flow.

**Props:**

```tsx
type FlowProps<TConfig> = {
  flow: FlowDefinition<TConfig>; // From defineFlow()
  components: (flowState) => Record<StepNames, ComponentType>;
  initialContext: ExtractContext<TConfig>;
  onComplete?: () => void;
  onNext?: (event: {
    from: StepName;
    to: StepName;
    oldContext: TContext;
    newContext: TContext;
  }) => void;
  onBack?: (event: {
    from: StepName;
    to: StepName;
    oldContext: TContext;
    newContext: TContext;
  }) => void;
  onTransition?: (event: {
    from: StepName;
    to: StepName;
    direction: "forward" | "backward";
    oldContext: TContext;
    newContext: TContext;
  }) => void;
  onContextUpdate?: (event: { oldContext: TContext; newContext: TContext }) => void;
  children?: ReactNode; // Optional for custom layout
};
```

**Example:**

```tsx
<Flow
  flow={myFlow}
  components={(flowState) => ({
    welcome: WelcomeStep,
    profile: ProfileStep,
    complete: () => <CompleteStep {...flowState.context} />,
  })}
  initialContext={{ name: "" }}
  onComplete={() => console.log("Done!")}
/>
```

**Auto-render vs Custom Layout:**

```tsx
// Auto-render (default) - step renders automatically
<Flow flow={myFlow} components={...} initialContext={...} />

// Custom layout - use <FlowStep /> to control placement
<Flow flow={myFlow} components={...} initialContext={...}>
  <Header />
  <FlowStep />  {/* Current step renders here */}
  <Footer />
</Flow>
```

### `<FlowStep />`

Renders the current step component. Use this for custom layouts.

**Example:**

```tsx
<Flow flow={myFlow} components={...} initialContext={...}>
  <div className="layout">
    <Sidebar />
    <main>
      <ProgressBar />
      <FlowStep />  {/* Current step renders here */}
    </main>
  </div>
</Flow>
```

### `useFlow()`

Hook to access flow state and navigation. Use directly in components or use the type-safe version from `defineFlow`.

**Returns:**

```tsx
{
  context: TContext;           // Current context
  stepId: string;              // Current step ID
  status: "active" | "complete"; // Flow status
  component: ComponentType | undefined; // Current step's component
  next: (update?) => void;     // Navigate forward
  back: () => void;            // Navigate back
  setContext: (update) => void; // Update context
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

### Conditional Branching (Context-Driven)

Flow decides next step based on context:

```tsx
const flow = defineFlow({
  id: "flow",
  start: "userType",
  steps: {
    userType: {
      next: (ctx) => {
        if (ctx.accountType === "business") return "businessDetails";
        if (ctx.accountType === "enterprise") return "enterpriseDetails";
        return "preferences";
      },
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
} as const satisfies FlowConfig<Context>);
```

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

### Guard Conditions

Prevent navigation until conditions are met:

```tsx
const flow = defineFlow({
  id: "flow",
  start: "form",
  steps: {
    form: {
      // Only navigate if form is valid
      next: (ctx) => (ctx.isValid ? "complete" : undefined),
    },
    complete: {},
  },
} as const satisfies FlowConfig<Context>);

function FormStep() {
  const { context, next, setContext } = useFlow<Context>();

  const handleSubmit = () => {
    // Validate
    const isValid = context.name.length > 0;
    setContext({ isValid });

    // Try to navigate (will stay on current step if invalid)
    next();
  };

  return (
    <div>
      <input
        value={context.name}
        onChange={(e) => setContext({ name: e.target.value })}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

### Dynamic Components

Pass flow state to components for dynamic rendering:

```tsx
<Flow
  flow={myFlow}
  components={(flowState) => ({
    welcome: WelcomeStep,
    profile: ProfileStep,
    // Pass context to component
    complete: () => (
      <CompleteStep
        name={flowState.context.name}
        theme={flowState.context.theme}
      />
    ),
    // Conditional component selection
    dashboard: flowState.context.isPremium
      ? PremiumDashboard
      : FreeDashboard,
  })}
  initialContext={...}
/>
```

### Custom Layouts

Full control over layout and step placement:

```tsx
function MyFlowLayout() {
  return (
    <Flow flow={myFlow} components={...} initialContext={...}>
      <div className="app-layout">
        <Sidebar />

        <main>
          <ProgressIndicator />
          <FlowStep />  {/* Current step renders here */}
        </main>

        <Footer />
      </div>
    </Flow>
  );
}
```

### Flow Callbacks

React to flow navigation events:

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
    console.log("Context changed:", { oldContext, newContext });
    // Sync to external state, localStorage, etc.
  }}
  onComplete={() => {
    console.log("Flow completed!");
  }}
/>
```

**Callback Types:**
- `onNext` - Fires on forward navigation only (includes oldContext and newContext)
- `onBack` - Fires on backward navigation only (includes oldContext and newContext)
- `onTransition` - **Unified callback** that fires on all navigation (forward or backward, includes direction, oldContext, and newContext)
- `onContextUpdate` - Fires when context changes
- `onComplete` - Fires when flow reaches completion

**Callback Ordering:**
When navigating, callbacks fire in this order:
1. Specific callback (`onNext` or `onBack`)
2. General callback (`onTransition`)
3. Context callback (`onContextUpdate` - if context changed)

**Use cases:**
- **Analytics tracking** - Log step transitions with `onTransition`
- **Animations** - Use `onTransition` with `direction` to animate forward/backward
- **Data persistence** - Save context to localStorage with `onContextUpdate`
- **External state sync** - Update Redux/Zustand stores

**Example: Animations with `onTransition`**

```tsx
function App() {
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  return (
    <Flow
      flow={myFlow}
      components={...}
      initialContext={...}
      onTransition={({ direction }) => {
        setDirection(direction);
      }}
    >
      <AnimatedFlowStep direction={direction} />
    </Flow>
  );
}
```

### Custom Step Rendering

Access the current component directly for custom rendering:

```tsx
function AnimatedFlowStep() {
  const { component: CurrentComponent, stepId } = useFlow();
  
  return (
    <div className="animated-container">
      {CurrentComponent && (
        <div key={stepId} className="slide-in">
          <CurrentComponent />
        </div>
      )}
    </div>
  );
}

// Use in Flow
<Flow flow={myFlow} components={...} initialContext={...}>
  <AnimatedFlowStep />
</Flow>
```

This allows you to:
- Build custom transitions/animations
- Add loading states
- Implement cross-fade effects
- Control component lifecycle

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
          components={...}
          initialContext={...}
          onComplete={() => setCurrentFlow("settings")}
        />
      )}

      {currentFlow === "settings" && (
        <Flow
          flow={settingsFlow}
          components={...}
          initialContext={...}
        />
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
      next: (ctx) => (ctx.age >= 18 ? "adult" : "minor"),
    },
    adult: { next: "complete" },
    minor: { next: "complete" },
    complete: {},
  },
} as const satisfies FlowConfig<MyContext>);

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
} as const satisfies FlowConfig<Context>);

function ProfileStep() {
  const { next } = myFlow.useFlow({ step: "profile" });

  next("preferences"); // ✅ Valid next step
  next("skip"); // ✅ Valid next step
  next("invalid"); // ❌ TypeScript error
}
```

## Examples

See the [vite-react example](../../examples/vite-react) for complete implementations:

- **Simple Flow** - Linear step-by-step navigation
- **Advanced Flow** - Conditional branching with business/personal paths
- Component-driven navigation with array-based steps
- Full TypeScript integration

## Testing

Write tests for your step components:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Flow } from "@useflow/react";

test("ProfileStep collects user input", () => {
  render(
    <Flow
      flow={myFlow}
      components={() => ({
        welcome: WelcomeStep,
        profile: ProfileStep,
        complete: CompleteStep,
      })}
      initialContext={{ name: "" }}
    />
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

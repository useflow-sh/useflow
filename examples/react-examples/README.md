# Vite + React Onboarding Flow Example

This example demonstrates complete user onboarding flows using `@useflow/react`.

## Features

- **Two complete flows**:

  - **Simple Flow**: Linear 4-step onboarding (Welcome → Profile → Preferences → Complete)
  - **Advanced Flow**: Conditional and component-driven branching

- **Multiple navigation patterns demonstrated**:

  - Hook-based components (`useFlow`)
  - Context-driven branching (flow decides based on context)
  - Component-driven branching (component chooses from array of steps)

- **Type-safe state management** with full TypeScript support
- **Declarative flow control** - define your flow steps once, components render automatically
- **Conditional routing** - different paths based on user choices
- **Component reusability** - same `CompleteStep` used in both flows

## Running the Example

From the repository root:

```bash
bun install
cd examples/react-examples
bun run dev
```

Or from this directory:

```bash
bun run dev
```

## Project Structure

```
src/
  flows/
    simple-flow.ts       - Linear onboarding flow
    advanced-flow.ts     - Flow with conditional branching
  components/
    WelcomeStep.tsx           - Hook-based component
    ProfileStep.tsx           - Hook-based component
    UserTypeStep.tsx          - Hook-based component (advanced flow)
    BusinessDetailsStep.tsx    - Hook-based component (advanced flow)
    SetupPreferenceStep.tsx   - Component-driven branching example
    PreferencesStep.tsx       - Hook-based component
    CompleteStep.tsx          - Presentational component (shared)
    OptionSelector.tsx        - Reusable UI component
  App.tsx                - Flow renderer and UI
  App.css                - Styling
```

## Flow Definitions

### Simple Flow (simple-flow.ts)

Linear progression through 4 steps:

```tsx
export const simpleFlow = defineFlow({
  id: "simple-flow",
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
} as const satisfies FlowConfig<SimpleFlowContext>);
```

**Components defined at render time:**

```tsx
<Flow
  flow={simpleFlow}
  components={(flowState) => ({
    welcome: WelcomeStep,
    profile: ProfileStep,
    preferences: PreferencesStep,
    complete: () => <CompleteStep {...flowState.context} />,
  })}
  initialContext={{ name: "", ... }}
/>
```

### Advanced Flow (advanced-flow.ts)

Demonstrates both context-driven and component-driven branching:

```tsx
export const advancedFlow = defineFlow({
  id: "advanced-flow",
  start: "welcome",
  steps: {
    welcome: {
      next: "profile",
    },
    profile: {
      next: "userType",
    },
    userType: {
      // Context-driven: Flow decides based on context
      next: (ctx) =>
        ctx.userType === "business" ? "businessDetails" : "setupPreference",
    },
    businessDetails: {
      next: "setupPreference",
    },
    setupPreference: {
      // Component-driven: Component explicitly chooses from array
      next: ["preferences", "complete"],
    },
    preferences: {
      next: "complete",
    },
    complete: {},
  },
} as const satisfies FlowConfig<AdvancedFlowContext>);
```

## Navigation Patterns

### Pattern 1: Context-Driven Branching

Flow automatically routes based on context values:

```tsx
// In flow definition
userType: {
  next: (ctx) =>
    ctx.userType === "business" ? "businessDetails" : "setupPreference",
}

// In component
function UserTypeStep() {
  const { next, setContext } = useFlow();

  const handleSelect = (type: "business" | "personal") => {
    setContext({ userType: type });
    next(); // Flow decides where to go
  };
}
```

### Pattern 2: Component-Driven Branching

Component explicitly chooses which step to navigate to:

```tsx
// In flow definition
setupPreference: {
  next: ["preferences", "complete"],  // Array of possible steps
}

// In component
function SetupPreferenceStep() {
  const { next } = useFlow();

  return (
    <>
      <button onClick={() => next("preferences")}>
        Configure Preferences
      </button>
      <button onClick={() => next("complete")}>
        Skip Setup
      </button>
    </>
  );
}
```

### Pattern 3: Hook-Based Components

Most steps use hooks for simplicity:

```tsx
function ProfileStep() {
  const { context, next, back, setContext } = useFlow<FlowContext>();

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

**Pros:**

- Direct and simple
- Less boilerplate
- Good for flow-specific steps

**Cons:**

- Harder to test in isolation
- Can't easily reuse across flows

## Key Concepts

### Type Safety

Each flow has its own context type:

```tsx
type SimpleFlowContext = {
  name: string;
  theme?: "light" | "dark";
  notifications: boolean;
  startedAt?: number;
};

type AdvancedFlowContext = {
  name: string;
  userType?: "business" | "personal";
  theme?: "light" | "dark";
  notifications: boolean;
  startedAt?: number;
  // Business-specific fields
  businessIndustry?: string;
  companyName?: string;
};
```

### Custom Layouts

This example uses `<FlowStep />` to control layout:

```tsx
<Flow flow={simpleFlow} components={...} initialContext={...}>
  <FlowState />  {/* Debug component showing current state */}
  <FlowStep />   {/* Current step renders here */}
</Flow>
```

### Component Function

Components are defined as a function receiving `flowState`:

```tsx
components={(flowState) => ({
  welcome: WelcomeStep,
  profile: ProfileStep,
  // Access flow state for dynamic rendering
  complete: () => (
    <CompleteStep
      name={flowState.context.name}
      theme={flowState.context.theme}
    />
  ),
})}
```

This allows:

- Access to current context
- Access to current stepId
- Dynamic component selection based on state

## Rendering the Flow

```tsx
function App() {
  const [flowType, setFlowType] = useState<"simple" | "advanced">("simple");
  const [flowKey, setFlowKey] = useState(0);

  return (
    <>
      {flowType === "simple" ? (
        <Flow
          key={flowKey}
          flow={simpleFlow}
          components={(flowState) => ({ ... })}
          initialContext={{ name: "", theme: undefined, notifications: false }}
          onComplete={() => alert("Completed!")}
        >
          <FlowState />
          <FlowStep />
        </Flow>
      ) : (
        <Flow
          key={flowKey}
          flow={advancedFlow}
          components={(flowState) => ({ ... })}
          initialContext={{ ... }}
          onComplete={() => alert("Completed!")}
        >
          <FlowState />
          <FlowStep />
        </Flow>
      )}
    </>
  );
}
```

## Building

```bash
bun run build
```

The built files will be in the `dist/` directory.

## Learning Resources

After exploring this example, check out:

- [@useflow/react documentation](../../packages/react/README.md)
- [@useflow/core documentation](../../packages/core/README.md)
- [Main README](../../README.md) for more patterns

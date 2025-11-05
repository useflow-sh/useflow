# @useflow/react

**Type-safe, declarative multi-step flows for React**

Build onboarding, checkout, surveys, and wizards with full TypeScript support. useFlow handles the multi-step navigation and state management while you focus on building great UI.

## Installation

```bash
npm install @useflow/react
```

## Quick Example

```tsx
import { defineFlow, Flow, useFlow } from "@useflow/react";

const onboardingFlow = defineFlow({
  id: "onboarding",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: { next: "complete" },
    complete: {},
  },
});

function App() {
  return (
    <Flow flow={onboardingFlow} initialContext={{ name: "" }}>
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

function ProfileStep() {
  const { context, next, setContext } = useFlow();
  return (
    <div>
      <input
        value={context.name}
        onChange={(e) => setContext({ name: e.target.value })}
      />
      <button onClick={() => next()}>Next</button>
    </div>
  );
}
```

## Features

- 🎯 **Declarative flow definitions** - Define your flow in one place
- 🔒 **Type-safe** - Full TypeScript support with autocomplete
- 🔄 **Flexible navigation** - Linear flows and conditional branching
- 💾 **Built-in persistence** - Save and restore flow progress
- ⚡ **Lightweight** - Zero dependencies

## Documentation

- **[Full Documentation](https://docs.useflow.sh)** - Complete guides and API reference
- **[Live Demos](https://demo.useflow.sh)** - Interactive examples
- **[Quick Start](https://docs.useflow.sh/getting-started/quick-start)** - Get started in 5 minutes

## What's Included

This package includes:
- React hooks (`useFlow`, `useFlowReducer`)
- Components (`<Flow>`, `<FlowProvider>`)
- Flow definition utilities
- Built on `@useflow/core` (framework-agnostic core)

## License

MIT

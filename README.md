# useFlow

**Type-safe, declarative multi-step flows for React**

useFlow is a lightweight library for building multi-step flows like onboarding, checkout, surveys, and wizards with full TypeScript support.

## Why useflow?

**Start simple, scale up.** Begin with a linear flow and add conditional navigation, persistence, or callbacks as needed without refactoring your architecture.

**Built for multi-step UI flows.** Unlike general-purpose state machines (XState), useflow is designed specifically for sequential user flows with simple, intuitive APIs for common patterns like navigation, history, and persistence.

**Type-safe by default.** Full TypeScript inference - step names autocomplete, invalid navigation throws compile-time errors, and context is fully typed throughout your flow.

**Complements form libraries.** useflow works great with TanStack Form, React Hook Form, or any form library - useflow handles the multi-step navigation and state while your form library handles validation. Perfect for multi-page forms, checkouts, onboarding, and surveys.

## Features

- 🎯 **Declarative flow definitions** - Define your flow in one place. Navigation logic lives in your flow config, not scattered across components.
- 🔒 **Type-safe** - Full TypeScript support: Autocomplete for step names, compile-time navigation errors.
- 🔄 **Flexible navigation** - Linear flows and conditional navigation.
- 💾 **Built-in persistence** - Save and restore flow progress automatically.
- 🔧 **Framework-agnostic core** - Built on a pure TypeScript core.
- ⚡ **Lightweight** - Zero dependencies.

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

## Documentation

- 📚 **[Documentation](https://docs.useflow.sh)** - Complete guides and API reference
- 🎮 **[Live Demos](https://demo.useflow.sh)** - Interactive examples
- 🚀 **[Quick Start](https://docs.useflow.sh/getting-started/quick-start)** - Get started in 5 minutes

## License

Distributed under the MIT License. See [LICENSE](./LICENSE)

## Contributing

Contributions welcome! Please open an issue or PR.

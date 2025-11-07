# @useflow/react

[![npm version](https://img.shields.io/npm/v/@useflow/react.svg)](https://www.npmjs.com/package/@useflow/react)
[![npm downloads](https://img.shields.io/npm/dm/@useflow/react.svg)](https://www.npmjs.com/package/@useflow/react)
[![license](https://img.shields.io/npm/l/@useflow/react.svg)](https://github.com/useflow-sh/useflow/blob/main/LICENSE)

**Type-safe, declarative multi-step flows for React**

Build onboarding, checkout, surveys, and wizards with full TypeScript support. useFlow handles the multi-step navigation and state management while you focus on building great UI.

## Installation

```bash
npm install @useflow/react
```

## Quick Example

Build a complete onboarding flow with conditional navigation:

### 1. Define your flow with navigation logic

```tsx
import { defineFlow } from "@useflow/react";

type OnboardingContext = {
  email?: string;
  accountType?: "business" | "personal";
  company?: string;
};

const onboardingFlow = defineFlow({
  id: "onboarding",
  start: "welcome",
  steps: {
    welcome: { next: "userType" },
    userType: { next: ["business", "personal"] }, // 💡 Define all possible next steps
    business: { next: "complete" },
    personal: { next: "complete" },
    complete: {}
  }
   // 💡 Set the context type
}).with<OnboardingContext>((steps) => ({
  resolvers: {
    // 💡 Type-safe: can only return steps in next array
    userType: (ctx) => 
      ctx.accountType === "business" 
        ? steps.business  // ✅ Valid
        : steps.personal  // ✅ Valid
       // steps.complete would be a TypeScript error ❌
  }
}));
```

### 2. Create your step components

```tsx
import { onboardingFlow } from "./flow";

function UserTypeStep() {
  const { context, setContext, next } = onboardingFlow.useFlow({ step: "userType" });
  
  const handleSubmit = () => {
    next(); // ✅ Automatically navigates based on accountType
  };

  return (
    <div>
      <h1>Get Started</h1>
      <input
        type="email"
        placeholder="Email address"
        value={context.email || ""} // 💡 TypeScript knows this is a string
        onChange={(e) => setContext({ email: e.target.value })}
      />
      <select 
        value={context.accountType || ""} // 💡 TypeScript knows this is a string
        onChange={(e) => setContext({ accountType: e.target.value })}
      >
        <option value="">Choose account type</option>
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
      <button 
        onClick={handleSubmit}
        disabled={!context.email || !context.accountType}
      >
        Continue
      </button>
    </div>
  );
}
```

```tsx
import { onboardingFlow } from "./flow";

function BusinessStep() {
  const { context, setContext, next, back } = onboardingFlow.useFlow({ step: "business" });
  
  return (
    <div>
      <h1>Business Details</h1>
      <p>Welcome {context.email}!</p>
      <input
        placeholder="Company name"
        value={context.company || ""} // 💡 TypeScript knows this is a string
        onChange={(e) => setContext({ company: e.target.value })}
      />
      <button onClick={back}>Back</button> 
      <button onClick={next}>Continue</button> 
    </div>
  );
}
```

```tsx
import { onboardingFlow } from "./flow";

function CompleteStep() {
  const { context } = onboardingFlow.useFlow({ step: "complete" });

  return (
   <div>
     <h1>All Set, {context.name}!</h1>
     <p>Email: {context.email}</p>
     {context.userType === "business" && (
       <p>Company: {context.business?.companyName}</p>
     )}
   </div>
 );
}
```

### 3. Map your steps to components & add persistence

```tsx
import { Flow, createLocalStorageStore, createPersister } from "@useflow/react";
import { onboardingFlow } from "./flow";

function App() {
  return (
    <Flow 
      flow={onboardingFlow} 
      // ✅ Add persistence in 1 line!
      persister={createPersister({ store: createLocalStorageStore() })} 
    >
      {({ renderStep }) => renderStep({
        // 💡 TypeScript enforces all steps must be provided - can't miss any!
        welcome: <WelcomeStep />,
        userType: <UserTypeStep />,
        business: <BusinessStep />,
        personal: <PersonalStep />,
        complete: <CompleteStep />
      })}
    </Flow>
  );
}
```

**That's it!** Users can now close their browser and return exactly where they left off.
No manual state management, no confusing navigation logic scattered across components.

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

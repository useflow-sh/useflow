# React Examples - useFlow Demo

This example demonstrates multiple complete user onboarding flows using `@useflow/react` with a navigatable gallery interface.

## Features

- **Multiple Flow Examples** with a home page gallery
- **URL-based Navigation** using React Router v7 (routes persist on page refresh)
- **Scalable Structure** - easy to add new flow examples
- **Two complete flows**:
  - **Simple Flow**: Linear 4-step onboarding (Welcome → Profile → Preferences → Complete)
  - **Branching Flow**: Conditional and component-driven branching
- **Multiple navigation patterns**:
  - Hook-based components (`useFlow`)
  - Context-driven branching (flow decides based on context)
  - Component-driven branching (component chooses from array of steps)
- **Type-safe state management** with full TypeScript support
- **State persistence** with localStorage
- **Smooth animations** between steps
- **Flow debugging tools** with FlowInspector

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

Navigate to `http://localhost:5173` to see the flow gallery.

## Flow Examples

### 1. Simple Flow (Linear Progression)

**Complexity:** Simple  
**Path:** `/simple`

A basic linear 4-step onboarding flow demonstrating core concepts.

**Features:**

- Linear step progression
- Context updates with `setContext`
- Navigation control (next/back)
- State persistence with `persister`

**Flow Structure:**

```
Welcome → Profile → Preferences → Complete
```

**Key Concepts:**

- Basic flow definition
- Hook-based components (`useFlow`)
- State management across steps

---

### 2. Branching Flow (Conditional Navigation)

**Complexity:** Intermediate  
**Path:** `/branching`

Demonstrates dynamic routing based on user choices.

**Features:**

- Context-driven branching (flow decides path)
- Component-driven navigation (component chooses)
- Conditional steps
- State persistence

**Flow Structure:**

```
Welcome → Profile → User Type
                      ├─→ Business → Business Details → Setup
                      └─→ Personal → Setup
Setup: Skip to Complete OR Configure Preferences → Complete
```

**Key Concepts:**

- Context-driven branching: `next: (ctx) => ctx.userType === "business" ? "details" : "setup"`
- Component-driven branching: `next: ["preferences", "complete"]` + `next("complete")`
- Multiple navigation patterns in one flow

---

### 3. Task Flow (Multi-Instance)

**Complexity:** Intermediate  
**Path:** `/task`

Demonstrates reusable flow instances for creating multiple independent tasks.

**Features:**

- Reusable flow instances with unique `instanceId`
- Independent state per instance
- Resume incomplete flows (drafts)
- Per-instance persistence
- localStorage for completed tasks

**Flow Structure:**

```
Task Type → Details → Assign → Review → Complete
```

**Key Concepts:**

- `instanceId` prop for multi-instance flows
- `storage.list()` to load all instances
- Draft management (save incomplete flows)
- Completed task tracking

**UI Features:**

- Draft tasks list with resume/delete
- Created tasks list with expandable details
- Animated task detail expansion
- Back to task manager button

---

### 4. Survey Flow (Event Hooks)

**Complexity:** Intermediate  
**Path:** `/survey`

Showcases event hooks for tracking and reacting to flow transitions.

**Features:**

- Event hooks: `onNext`, `onBack`, `onTransition`, `onComplete`
- Progress tracking with visual indicators
- State persistence
- Real-time event logging

**Flow Structure:**

```
Intro → Question 1 → Question 2 → Question 3 → Question 4 → Results
```

**Key Concepts:**

- `onNext` - Triggered when moving forward
- `onBack` - Triggered when moving backward
- `onTransition` - Triggered on any navigation (with direction info)
- `onComplete` - Triggered when flow finishes
- Event-driven UI updates (progress bar, event log)

**UI Features:**

- Progress tracker with step indicators
- Event hooks demo panel (bottom-left)
- Real-time event logging
- Score calculation

---

## Project Structure

```
src/
├── flows/
│   ├── simple/
│   │   ├── flow.ts              # Simple flow definition
│   │   ├── FlowDemo.tsx         # Simple flow demo component
│   │   └── components/          # Components only used in simple flow (currently empty)
│   └── branching/
│       ├── flow.ts              # Branching flow definition
│       ├── FlowDemo.tsx         # Branching flow demo component
│       └── components/          # Components only used in advanced flow
│           ├── BusinessDetailsStep.tsx
│           ├── SetupPreferenceStep.tsx
│           └── UserTypeStep.tsx
├── shared-steps/                # Step components shared across flows
│   ├── CompleteStep.tsx
│   ├── PreferencesStep.tsx
│   ├── ProfileStep.tsx
│   └── WelcomeStep.tsx
├── components/                  # Reusable UI components
│   ├── AnimatedFlowStep.css
│   ├── AnimatedFlowStep.tsx     # Step transition animations
│   ├── FlowGallery.tsx          # Home page with flow cards
│   ├── FlowInspector.tsx        # Debug panel for flow state
│   ├── LoadingView.tsx          # Loading indicator
│   └── OptionSelector.tsx       # Reusable option selector UI
├── App.css                       # Global styles
├── App.tsx                       # React Router setup
├── index.css                     # Base styles
└── main.tsx                      # App entry point with BrowserRouter
```

## URL Routes

- `/` - Flow gallery home page
- `/simple` - Simple flow demo
- `/branching` - Branching flow demo

## Adding a New Flow

1. **Create a new flow directory:**

   ```bash
   mkdir -p src/flows/my-flow/components
   ```

2. **Define your flow:**

   ```typescript
   // src/flows/my-flow/flow.ts
   import { defineFlow } from "@useflow/react";

   export const myFlow = defineFlow({
     id: "my-flow",
     start: "step1",
     steps: {
       step1: { next: "step2" },
       step2: { next: "complete" },
       complete: {},
     },
   } as const);
   ```

3. **Create the FlowDemo component:**

   ```tsx
   // src/flows/my-flow/FlowDemo.tsx
   import { Flow } from "@useflow/react";
   import { myFlow } from "./flow";

   export function MyFlowDemo() {
     return (
       <Flow
         flow={myFlow}
         components={
           {
             /* ... */
           }
         }
         initialContext={
           {
             /* ... */
           }
         }
       />
     );
   }
   ```

4. **Add the route to App.tsx:**

   ```tsx
   import { MyFlowDemo } from "./flows/my-flow/FlowDemo";

   <Route path="/my-flow" element={<MyFlowDemo />} />;
   ```

5. **Add to the gallery in FlowGallery.tsx:**
   ```tsx
   const flows: FlowCard[] = [
     // ... existing flows
     {
       id: "my-flow",
       title: "My Flow",
       description: "Description of my flow",
       path: "/my-flow",
       complexity: "Simple",
       features: ["Feature 1", "Feature 2"],
     },
   ];
   ```

## Flow Definitions

### Simple Flow

Linear progression through 4 steps:

```tsx
export const simpleFlow = defineFlow({
  id: "simple-flow",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: { next: "preferences" },
    preferences: { next: "complete" },
    complete: {},
  },
} as const);
```

### Advanced Flow

Demonstrates both context-driven and component-driven branching:

```tsx
export const advancedFlow = defineFlow({
  id: "advanced-flow",
  start: "welcome",
  steps: {
    welcome: { next: "profile" },
    profile: { next: "userType" },
    // Context-driven branching
    userType: {
      next: (ctx) =>
        ctx.userType === "business" ? "businessDetails" : "setupPreference",
    },
    businessDetails: { next: "setupPreference" },
    // Component-driven branching
    setupPreference: {
      next: ["preferences", "complete"],
    },
    preferences: { next: "complete" },
    complete: {},
  },
} as const);
```

## Navigation Patterns

### Pattern 1: Context-Driven Branching

Flow automatically routes based on context values:

```tsx
// In flow definition
userType: {
  next: (ctx) => ctx.userType === "business" ? "businessDetails" : "setupPreference",
}

// In component
function UserTypeStep() {
  const { next, setContext } = useFlow();

  const handleSelect = (type: "business" | "personal") => {
    setContext({ userType: type });
    next(); // Flow decides where to go based on context
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
  const { context, next, back, setContext } = useFlow();

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

## State Persistence

Each flow uses localStorage to persist state across page refreshes:

```tsx
const persister = useMemo(() => {
  return createPersister({
    storage: kvJsonStorageAdapter({
      store: localStorage,
      prefix: "myapp",
    }),
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}, []);
```

## Building

```bash
bun run build
```

The built files will be in the `dist/` directory.

## Learning Resources

- [@useflow/react documentation](../../packages/react/README.md)
- [@useflow/core documentation](../../packages/core/README.md)
- [Main README](../../README.md)

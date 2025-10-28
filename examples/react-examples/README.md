# React Examples - useFlow Demo

Interactive demonstration of `@useflow/react` featuring multiple complete flow examples with a navigatable gallery interface.

## Features

- **4 Complete Flow Examples** showcasing different patterns and use cases
- **Interactive Gallery** with flow cards and descriptions
- **Drawer Navigation** for easy switching between flows
- **URL-based Routing** using React Router v7 (routes persist on refresh)
- **localStorage Persistence** - all flows save state automatically (try refreshing!)
- **Smooth Animations** - slide-up transitions between steps
- **Debug Tools** - FlowInspector and FlowVisualizer overlays
- **Type-safe** - Full TypeScript support throughout
- **Reset Functionality** - Clear all flow progress from home page

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
│   │   └── FlowDemo.tsx         # Flow demo component
│   ├── branching/
│   │   ├── flow.ts              # Branching flow definition
│   │   ├── FlowDemo.tsx         # Flow demo component
│   │   └── components/          # Branching-specific steps
│   │       ├── BusinessDetailsStep.tsx
│   │       ├── SetupPreferenceStep.tsx
│   │       └── UserTypeStep.tsx
│   ├── task/
│   │   ├── flow.ts              # Task flow definition
│   │   ├── FlowDemo.tsx         # Flow demo component
│   │   └── components/          # Task-specific steps
│   │       ├── AssignStep.tsx
│   │       ├── DetailsStep.tsx
│   │       ├── ReviewStep.tsx
│   │       ├── TaskCompleteStep.tsx
│   │       └── TaskTypeStep.tsx
│   └── survey/
│       ├── flow.ts              # Survey flow definition
│       ├── FlowDemo.tsx         # Flow demo component
│       └── components/          # Survey-specific steps
│           ├── IntroStep.tsx
│           ├── QuestionStep.tsx
│           ├── RatingInput.tsx
│           └── ResultsStep.tsx
├── shared-steps/                # Steps shared across flows
│   ├── CompleteStep.tsx
│   ├── PreferencesStep.tsx
│   ├── ProfileStep.tsx
│   └── WelcomeStep.tsx
├── components/                  # Reusable UI components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── switch.tsx
│   ├── AnimatedFlowStep.tsx     # Step transition animations
│   ├── FlowGallery.tsx          # Home page gallery
│   ├── FlowInspector.tsx        # Debug panel (bottom-right)
│   ├── FlowVisualizer.tsx       # Flow structure diagram (bottom-left)
│   ├── LoadingView.tsx          # Loading indicator
│   ├── OptionSelector.tsx       # Option selector UI
│   └── SideNav.tsx              # Drawer navigation
├── lib/
│   ├── storage.ts               # Storage and persister setup
│   └── utils.ts                 # Utility functions
├── App.tsx                      # React Router setup
├── index.css                    # Global styles + animations
└── main.tsx                     # App entry point
```

## URL Routes

- `/` - Flow gallery home page
- `/simple` - Simple flow demo
- `/branching` - Branching flow demo
- `/task` - Task flow demo
- `/survey` - Survey flow demo

## Navigation

### Drawer Menu

- Hamburger button (top-left) opens navigation drawer
- All flows accessible from any page
- Auto-closes on navigation
- Shows active flow

### Home Page

- Flow cards with descriptions and features
- Complexity badges (Simple, Intermediate, Advanced)
- "Reset All Flows" button to clear all saved data
- Persistence notice

## Debug Tools

### FlowInspector (Bottom-Right)

- Current flow state (status, step, history, context)
- Persisted state (with storage key)
- Clear current flow button
- Clear all flows button
- Collapsible with smooth animation

### FlowVisualizer (Bottom-Left - Simple & Branching Flows)

- Visual flow structure diagram
- Current step highlighting
- Completed steps marked with checkmarks
- Connection bars show traversed paths
- Branching paths displayed
- Semi-transparent overlay

### Event Log (Bottom-Left - Survey Flow)

- Real-time event tracking
- Color-coded event types (NEXT, BACK, TRANSITION, COMPLETE)
- Timestamps for each event
- Shows last 10 events
- Semi-transparent overlay

## State Persistence

All flows use `saveMode="always"` for instant localStorage persistence:

```tsx
<Flow
  flow={myFlow}
  persister={persister}
  saveMode="always" // Saves on every state change
  {...props}
/>
```

**Persistence Strategy:**

- `saveMode="always"` - Saves immediately on every update (no debounce)
- Perfect for localStorage (fast, synchronous)
- Progress survives page refreshes
- Can be cleared via FlowInspector or home page button

## Animations

### Step Transitions

Smooth slide-up animations defined in `index.css`:

```css
.flow-step-enter {
  opacity: 0;
  transform: translateY(20px);
}

.flow-step-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}
```

### Component Animations

- FlowInspector: Smooth expand/collapse with rotating arrow
- Task details: Animated accordion expansion
- Navigation drawer: Slide-in from left
- All use CSS transitions for 60fps performance

## Adding a New Flow

1. **Create flow directory:**

   ```bash
   mkdir -p src/flows/my-flow/components
   ```

2. **Define flow:**

   ```typescript
   // src/flows/my-flow/flow.ts
   import { defineFlow } from "@useflow/react";

   export type MyFlowContext = {
     // Define your context type
   };

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

3. **Create demo component:**

   ```tsx
   // src/flows/my-flow/FlowDemo.tsx
   import { Flow } from "@useflow/react";
   import { persister, storage } from "../../lib/storage";
   import { AnimatedFlowStep } from "../../components/AnimatedFlowStep";
   import { FlowInspector } from "../../components/FlowInspector";
   import { LoadingView } from "../../components/LoadingView";
   import { myFlow } from "./flow";

   export function MyFlowDemo() {
     return (
       <Flow
         flow={myFlow}
         components={{
           step1: Step1Component,
           step2: Step2Component,
           complete: CompleteComponent,
         }}
         initialContext={{}}
         persister={persister}
         saveMode="always"
         loadingComponent={<LoadingView />}
       >
         <FlowInspector flowId={myFlow.id} storage={storage} position="right" />
         <AnimatedFlowStep />
       </Flow>
     );
   }
   ```

4. **Add route:**

   ```tsx
   // App.tsx
   import { MyFlowDemo } from "./flows/my-flow/FlowDemo";

   <Route path="/my-flow" element={<MyFlowDemo />} />;
   ```

5. **Add to gallery and navigation:**

   ```tsx
   // components/FlowGallery.tsx
   const flows: FlowCard[] = [
     // ... existing flows
     {
       id: "my-flow",
       title: "My Flow",
       description: "Description here",
       path: "/my-flow",
       complexity: "Simple",
       features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
       icon: <YourIcon className="h-6 w-6" />,
     },
   ];
   ```

   ```tsx
   // components/SideNav.tsx
   const navItems = [
     // ... existing items
     {
       id: "my-flow",
       label: "My Flow",
       path: "/my-flow",
       icon: <YourIcon className="h-5 w-5" />,
       description: "Short description",
     },
   ];
   ```

## Navigation Patterns

### Pattern 1: Context-Driven Branching

Flow automatically routes based on context:

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
    next(); // Flow decides destination
  };
}
```

### Pattern 2: Component-Driven Branching

Component explicitly chooses destination:

```tsx
// In flow definition
setupPreference: {
  next: ["preferences", "complete"],  // Array of options
}

// In component
function SetupPreferenceStep() {
  const { next } = useFlow();

  return (
    <>
      <button onClick={() => next("preferences")}>Configure</button>
      <button onClick={() => next("complete")}>Skip</button>
    </>
  );
}
```

### Pattern 3: Multi-Instance Flows

Reusable flows with independent state:

```tsx
// Generate unique instance ID
const taskId = `task-${Date.now()}`;

<Flow
  flow={taskFlow}
  instanceId={taskId} // Each instance has separate storage
  persister={persister}
  {...props}
/>;

// List all instances
const instances = await storage.listInstances?.(taskFlow.id);
```

### Pattern 4: Event Hooks

React to flow transitions:

```tsx
<Flow
  flow={surveyFlow}
  onNext={({ from, to, newContext }) => {
    console.log(`Moving from ${from} to ${to}`);
  }}
  onBack={({ from, to }) => {
    console.log(`Going back from ${from} to ${to}`);
  }}
  onTransition={({ from, to, direction }) => {
    console.log(`Transition: ${from} → ${to} (${direction})`);
  }}
  onComplete={() => {
    console.log("Flow completed!");
  }}
  {...props}
/>
```

## Building

```bash
bun run build
```

Built files will be in `dist/`.

## Key Learnings

Each flow demonstrates different aspects of `@useflow/react`:

1. **Simple Flow** - Foundation (linear steps, hooks, persistence)
2. **Branching Flow** - Advanced routing (dynamic paths, multiple patterns)
3. **Task Flow** - Scalability (multi-instance, draft management)
4. **Survey Flow** - Observability (event hooks, progress tracking)

Together they showcase a complete picture of building production-ready flows.

## Learning Resources

- [@useflow/react documentation](../../packages/react/README.md)
- [@useflow/core documentation](../../packages/core/README.md)
- [Main README](../../README.md)

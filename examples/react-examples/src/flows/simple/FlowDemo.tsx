import { Flow } from "@useflow/react";
import { useState } from "react";
import { AnimatedFlowStep } from "../../components/AnimatedFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
import { FlowVisualizer } from "../../components/FlowVisualizer";
import { LoadingView } from "../../components/LoadingView";
import { persister, storage } from "../../lib/storage";
import { CompleteStep } from "../../shared-steps/CompleteStep";
import { PreferencesStep } from "../../shared-steps/PreferencesStep";
import { ProfileStep } from "../../shared-steps/ProfileStep";
import { WelcomeStep } from "../../shared-steps/WelcomeStep";
import { simpleFlow } from "./flow";

export function SimpleFlowDemo() {
  const [flowKey, setFlowKey] = useState(0);

  const handleRestart = () => {
    persister.remove?.(simpleFlow.id);
    setFlowKey((k) => k + 1);
  };

  return (
    <Flow
      key={flowKey}
      flow={simpleFlow}
      components={({ context }) => ({
        welcome: WelcomeStep,
        profile: ProfileStep,
        preferences: PreferencesStep,
        complete: () => (
          <CompleteStep
            name={context.name}
            theme={context.theme}
            notifications={context.notifications}
            startedAt={context.startedAt}
            skippedPreferences={context.skippedPreferences}
            onRestart={handleRestart}
          />
        ),
      })}
      initialContext={{
        name: "",
        theme: undefined,
        notifications: false,
      }}
      persister={persister}
      saveMode="always"
      loadingComponent={<LoadingView />}
    >
      {/* Flow Visualizer - Fixed on bottom left */}
      <div className="hidden xl:block fixed left-4 bottom-4 w-80">
        <FlowVisualizer
          steps={{
            welcome: { label: "Welcome", next: "profile" },
            profile: { label: "Profile", next: "preferences" },
            preferences: { label: "Preferences", next: "complete" },
            complete: { label: "Complete" },
          }}
        />
      </div>

      <FlowInspector
        flowId={simpleFlow.id}
        storage={storage}
        position="right"
      />

      {/* Main content - centered in viewport */}
      <div className="flex items-center justify-center min-h-screen">
        <AnimatedFlowStep />
      </div>
    </Flow>
  );
}

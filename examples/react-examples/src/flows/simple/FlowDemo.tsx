import { Flow } from "@useflow/react";
import { useState } from "react";
import { AnimatedFlowStep } from "../../components/AnimatedFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
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
      saveDebounce={300}
      loadingComponent={<LoadingView />}
    >
      <FlowInspector flowId={simpleFlow.id} storage={storage} />
      <AnimatedFlowStep />
    </Flow>
  );
}

import { createPersister, Flow, kvJsonStorageAdapter } from "@useflow/react";
import { useMemo, useState } from "react";
import {
  AnimatedFlowStep,
  type Direction,
} from "../../components/AnimatedFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
import { LoadingView } from "../../components/LoadingView";
import { CompleteStep } from "../../shared-steps/CompleteStep";
import { PreferencesStep } from "../../shared-steps/PreferencesStep";
import { ProfileStep } from "../../shared-steps/ProfileStep";
import { WelcomeStep } from "../../shared-steps/WelcomeStep";
import { BusinessDetailsStep } from "./components/BusinessDetailsStep";
import { SetupPreferenceStep } from "./components/SetupPreferenceStep";
import { UserTypeStep } from "./components/UserTypeStep";
import { advancedFlow } from "./flow";

export function AdvancedFlowDemo() {
  const [flowKey, setFlowKey] = useState(0);
  const [direction, setDirection] = useState<Direction>("initial");

  const storage = useMemo(
    () =>
      kvJsonStorageAdapter({
        store: localStorage,
        prefix: "myapp",
      }),
    [],
  );
  // Create a persister for this flow
  const persister = useMemo(() => {
    return createPersister({
      storage,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }, [storage]);

  const handleRestart = () => {
    persister.remove?.(advancedFlow.id);
    setFlowKey((k) => k + 1);
  };

  const handleComplete = () => alert("Onboarding completed! 🎉");

  const handleTransition = ({ direction }: { direction: Direction }) => {
    setDirection(direction);
  };

  return (
    <Flow
      key={flowKey}
      flow={advancedFlow}
      components={({ context }) => ({
        welcome: WelcomeStep,
        profile: ProfileStep,
        userType: UserTypeStep,
        businessDetails: BusinessDetailsStep,
        setupPreference: SetupPreferenceStep,
        preferences: PreferencesStep,
        complete: () => (
          <CompleteStep
            name={context.name}
            theme={context.theme}
            notifications={context.notifications}
            userType={context.userType || undefined}
            businessIndustry={context.businessIndustry}
            companyName={context.companyName}
            startedAt={context.startedAt}
            onRestart={handleRestart}
          />
        ),
      })}
      initialContext={{
        name: "",
        userType: undefined,
        theme: undefined,
        notifications: false,
        businessIndustry: undefined,
        companyName: undefined,
        startedAt: undefined,
      }}
      onComplete={handleComplete}
      onTransition={handleTransition}
      persister={persister}
      saveDebounce={300}
      loadingComponent={<LoadingView />}
    >
      <FlowInspector flowId={advancedFlow.id} storage={storage} />
      <AnimatedFlowStep direction={direction} />
    </Flow>
  );
}

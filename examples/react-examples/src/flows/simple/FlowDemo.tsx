import { Flow } from "@useflow/react";
import { AnimateFlowStep } from "@/components/AnimateFlowStep";
import { LoadingView } from "@/components/LoadingView";
import { FlowDemoLayout } from "@/components/layout";
import { CompleteStep } from "@/shared-steps/CompleteStep";
import { PreferencesStep } from "@/shared-steps/PreferencesStep";
import { ProfileStep } from "@/shared-steps/ProfileStep";
import { WelcomeStep } from "@/shared-steps/WelcomeStep";
import { simpleFlow } from "./flow";

export function SimpleFlowDemo() {
  return (
    <Flow
      flow={simpleFlow}
      initialContext={{
        name: "",
        theme: undefined,
        notifications: false,
      }}
      loadingComponent={<LoadingView />}
    >
      {({ renderStep, context, reset }) => (
        <FlowDemoLayout flowId={simpleFlow.id}>
          <AnimateFlowStep>
            {renderStep({
              welcome: <WelcomeStep />,
              profile: <ProfileStep />,
              preferences: <PreferencesStep />,
              complete: (
                <CompleteStep
                  name={context.name}
                  theme={context.theme}
                  notifications={context.notifications}
                  startedAt={context.startedAt}
                  skippedPreferences={context.skippedPreferences}
                  onRestart={reset}
                />
              ),
            })}
          </AnimateFlowStep>
        </FlowDemoLayout>
      )}
    </Flow>
  );
}

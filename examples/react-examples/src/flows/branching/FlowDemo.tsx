import { Flow } from "@useflow/react";
import { AnimateFlowStep } from "@/components/AnimateFlowStep";
import { LoadingView } from "@/components/LoadingView";
import { FlowDemoLayout } from "@/components/layout";
import { CompleteStep } from "@/shared-steps/CompleteStep";
import { PreferencesStep } from "@/shared-steps/PreferencesStep";
import { ProfileStep } from "@/shared-steps/ProfileStep";
import { WelcomeStep } from "@/shared-steps/WelcomeStep";
import { BusinessDetailsStep } from "./components/BusinessDetailsStep";
import { SetupPreferenceStep } from "./components/SetupPreferenceStep";
import { UserTypeStep } from "./components/UserTypeStep";
import { branchingFlow } from "./flow";

export function BranchingFlowDemo() {
  return (
    <Flow
      flow={branchingFlow}
      initialContext={{
        name: "",
        userType: undefined,
        theme: undefined,
        notifications: false,
        businessIndustry: undefined,
        companyName: undefined,
        startedAt: undefined,
      }}
      loadingComponent={<LoadingView />}
    >
      {({ renderStep, context, reset }) => (
        <FlowDemoLayout flowId={branchingFlow.id}>
          <AnimateFlowStep>
            {renderStep({
              welcome: <WelcomeStep />,
              profile: <ProfileStep />,
              userType: <UserTypeStep />,
              businessDetails: <BusinessDetailsStep />,
              setupPreference: <SetupPreferenceStep />,
              preferences: <PreferencesStep />,
              complete: (
                <CompleteStep
                  name={context.name}
                  theme={context.theme}
                  notifications={context.notifications}
                  userType={context.userType || undefined}
                  businessIndustry={context.businessIndustry}
                  companyName={context.companyName}
                  startedAt={context.startedAt}
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

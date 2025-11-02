import { Flow } from "@useflow/react";
import { AnimateFlowStep } from "../../components/AnimateFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
import { FlowVisualizer } from "../../components/FlowVisualizer";
import { LoadingView } from "../../components/LoadingView";
import { CompleteStep } from "../../shared-steps/CompleteStep";
import { PreferencesStep } from "../../shared-steps/PreferencesStep";
import { ProfileStep } from "../../shared-steps/ProfileStep";
import { WelcomeStep } from "../../shared-steps/WelcomeStep";
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
        <>
          {/* Flow Visualizer - Fixed on bottom left */}
          <div className="hidden xl:block fixed left-4 bottom-4 w-80">
            <FlowVisualizer />
          </div>

          <FlowInspector flowId={branchingFlow.id} position="right" />

          {/* Main content - centered in viewport */}
          <div className="flex items-center justify-center min-h-screen">
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
          </div>
        </>
      )}
    </Flow>
  );
}

import { Flow } from "@useflow/react";
import { AnimatedFlowStep } from "../../components/AnimatedFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
import { FlowVisualizer } from "../../components/FlowVisualizer";
import { LoadingView } from "../../components/LoadingView";
import { persister, store } from "../../lib/storage";
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
      components={({ context, reset }) => ({
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
            onRestart={() => reset()}
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
      persister={persister}
      saveMode="always"
      loadingComponent={<LoadingView />}
    >
      {/* Flow Visualizer - Fixed on bottom left */}
      <div className="hidden xl:block fixed left-4 bottom-4 w-80">
        <FlowVisualizer />
      </div>

      <FlowInspector flowId={branchingFlow.id} store={store} position="right" />

      {/* Main content - centered in viewport */}
      <div className="flex items-center justify-center min-h-screen">
        <AnimatedFlowStep />
      </div>
    </Flow>
  );
}

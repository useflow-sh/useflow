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
import { BusinessDetailsStep } from "./components/BusinessDetailsStep";
import { SetupPreferenceStep } from "./components/SetupPreferenceStep";
import { UserTypeStep } from "./components/UserTypeStep";
import { branchingFlow } from "./flow";

export function BranchingFlowDemo() {
  const [flowKey, setFlowKey] = useState(0);

  const handleRestart = () => {
    persister.remove?.(branchingFlow.id);
    setFlowKey((k) => k + 1);
  };

  return (
    <Flow
      key={flowKey}
      flow={branchingFlow}
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
      persister={persister}
      saveMode="always"
      loadingComponent={<LoadingView />}
    >
      {/* Flow Visualizer - Fixed on bottom left */}
      <div className="hidden xl:block fixed left-4 bottom-4 w-80">
        <FlowVisualizer
          steps={{
            welcome: { label: "Welcome", next: "profile" },
            profile: { label: "Profile", next: "userType" },
            userType: {
              label: "User Type",
              next: ["businessDetails", "setupPreference"],
            },
            businessDetails: {
              label: "Business Details",
              next: "setupPreference",
            },
            setupPreference: {
              label: "Setup Preference",
              next: ["preferences", "complete"],
            },
            preferences: { label: "Preferences", next: "complete" },
            complete: { label: "Complete" },
          }}
        />
      </div>

      <FlowInspector
        flowId={branchingFlow.id}
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

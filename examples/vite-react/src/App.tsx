import { Flow, FlowStep } from "@useflow/react";
import { useState } from "react";
import { BusinessDetailsStep } from "./components/BusinessDetailsStep";
import { CompleteStep } from "./components/CompleteStep";
import { FlowState } from "./components/FlowState";
import { PreferencesStep } from "./components/PreferencesStep";
import { ProfileStep } from "./components/ProfileStep";
import { SetupPreferenceStep } from "./components/SetupPreferenceStep";
import { UserTypeStep } from "./components/UserTypeStep";
import { WelcomeStep } from "./components/WelcomeStep";
import { advancedFlow } from "./flows/advanced-flow";
import { simpleFlow } from "./flows/simple-flow";
import "./App.css";

type FlowType = "simple" | "advanced";

function App() {
  const [flowType, setFlowType] = useState<FlowType>("simple");
  const [flowKey, setFlowKey] = useState(0);

  const handleFlowTypeChange = (type: FlowType) => {
    setFlowType(type);
    setFlowKey((k) => k + 1);
  };

  const handleRestart = () => setFlowKey((k) => k + 1);
  const handleComplete = () => alert("Onboarding completed! 🎉");

  return (
    <div className="app-container">
      <FlowTypeSelector
        flowType={flowType}
        onFlowTypeChange={handleFlowTypeChange}
      />

      {flowType === "simple" ? (
        <Flow
          key={flowKey}
          flow={simpleFlow}
          components={({ context }) => ({
            // requires all steps to be defined
            // missing steps will raise a type error
            welcome: WelcomeStep,
            profile: ProfileStep,
            preferences: PreferencesStep,
            complete: () => (
              <CompleteStep
                name={context.name}
                theme={context.theme}
                notifications={context.notifications}
                startedAt={context.startedAt}
                onRestart={handleRestart}
              />
            ),
          })}
          initialContext={{
            name: "",
            theme: undefined,
            notifications: false,
          }}
          onComplete={handleComplete}
        >
          <FlowState />
          <FlowStep />
        </Flow>
      ) : (
        <Flow
          key={flowKey}
          flow={advancedFlow}
          components={({ context }) => ({
            // requires all steps to be defined
            // missing steps will raise a type error
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
        >
          <FlowState />
          <FlowStep />
        </Flow>
      )}
    </div>
  );
}

function FlowTypeSelector({
  flowType,
  onFlowTypeChange,
}: {
  flowType: FlowType;
  onFlowTypeChange: (type: FlowType) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        left: "1rem",
        padding: "0.75rem",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        borderRadius: "8px",
        fontSize: "0.875rem",
        zIndex: 1000,
        width: "300px",
        textAlign: "left",
      }}
    >
      <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
        Example Type:
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => onFlowTypeChange("simple")}
          style={{
            background: flowType === "simple" ? "#646cff" : "#333",
            border: "none",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Simple
        </button>
        <button
          onClick={() => onFlowTypeChange("advanced")}
          style={{
            background: flowType === "advanced" ? "#646cff" : "#333",
            border: "none",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Advanced
        </button>
      </div>
      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.8 }}>
        {flowType === "simple"
          ? "Linear flow: welcome → profile → preferences → complete"
          : "Branching flow: business vs personal paths"}
      </div>
    </div>
  );
}

export default App;

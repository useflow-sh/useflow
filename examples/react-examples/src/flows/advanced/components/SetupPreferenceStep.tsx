import { OptionSelector } from "../../../components/OptionSelector";
import { advancedFlow } from "../flow";

const setupOptions = [
  {
    value: "advanced" as const,
    title: "Advanced Setup",
    description: "Customize all preferences in detail",
  },
  {
    value: "quick" as const,
    title: "Quick Setup",
    description: "Use recommended defaults",
  },
] as const;

export function SetupPreferenceStep() {
  // Use the hook for automatic type inference!
  const { context, next, back, setContext } = advancedFlow.useFlow({
    step: "setupPreference",
  });

  const handleContinue = () => {
    // Component-driven branching: component explicitly chooses destination
    // next() is now typed as: (target: "preferences" | "complete") => void
    const target =
      context.setupPreference === "advanced" ? "preferences" : "complete";

    next(target); // ✅ Type-safe! Only "preferences" | "complete" allowed
  };

  return (
    <div className="container">
      <h1>How would you like to proceed?</h1>
      <p>Choose your setup path.</p>

      <div className="form-group">
        <OptionSelector
          options={setupOptions}
          selectedValue={context.setupPreference}
          onSelect={(value) => setContext({ setupPreference: value })}
        />
      </div>

      <div className="button-group">
        <button type="button" className="secondary" onClick={() => back()}>
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!context.setupPreference}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

import { OptionSelector } from "@/components/OptionSelector";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { branchingFlow } from "../flow";

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
  const { context, next, back, setContext } = branchingFlow.useFlowState({
    step: "setupPreference",
  });

  const handleContinue = () => {
    // Component-driven navigation: component explicitly chooses destination
    // next() is now typed as: (target: "preferences" | "complete") => void
    const target =
      context.setupPreference === "advanced" ? "preferences" : "complete";

    next(target); // ✅ Type-safe! Only "preferences" | "complete" allowed
  };

  return (
    <StepCard
      title="How would you like to proceed?"
      description="Choose your setup path."
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!context.setupPreference}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      }
    >
      <OptionSelector
        options={setupOptions}
        selectedValue={context.setupPreference}
        onSelect={(value) => setContext({ setupPreference: value })}
      />
    </StepCard>
  );
}

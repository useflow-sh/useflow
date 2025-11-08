import { OptionSelector } from "@/components/OptionSelector";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { branchingFlow } from "../flow";

const userTypeOptions = [
  {
    value: "business",
    title: "Business",
    description: "Business account with advanced features",
  },
  {
    value: "personal",
    title: "Personal",
    description: "Personal account for individual use",
  },
] as const;

export function UserTypeStep() {
  const { context, next, back, setContext } = branchingFlow.useFlowState({
    step: "userType",
  });

  return (
    <StepCard
      title="How will you use this app?"
      description="Choose your account type to customize your experience."
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => next()}
            disabled={!context.userType}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      }
    >
      <OptionSelector
        options={userTypeOptions}
        selectedValue={context.userType}
        onSelect={(value) => setContext({ userType: value })}
      />
    </StepCard>
  );
}

import { OptionSelector } from "@/components/OptionSelector";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { taskFlow } from "../flow";

const priorityOptions = [
  {
    value: "low" as const,
    title: "Low Priority",
    description: "Can be done when time allows",
  },
  {
    value: "medium" as const,
    title: "Medium Priority",
    description: "Should be done soon",
  },
  {
    value: "high" as const,
    title: "High Priority",
    description: "Needs immediate attention",
  },
] as const;

export function PriorityStep() {
  const { context, next, back, setContext } = taskFlow.useFlow({
    step: "priority",
  });

  const canProceed = context.priority !== undefined;

  return (
    <StepCard
      title="Set Priority"
      description="Choose the priority level for this task"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => next()}
            disabled={!canProceed}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      }
    >
      <OptionSelector
        options={priorityOptions}
        selectedValue={context.priority}
        onSelect={(value) => setContext({ priority: value })}
      />
    </StepCard>
  );
}

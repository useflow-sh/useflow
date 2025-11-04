import { OptionSelector } from "@/components/OptionSelector";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { taskFlow } from "../flow";

const taskTypeOptions = [
  {
    value: "bug" as const,
    title: "Bug",
    description: "Report a problem or issue",
  },
  {
    value: "feature" as const,
    title: "Feature",
    description: "Request a new feature",
  },
  {
    value: "improvement" as const,
    title: "Improvement",
    description: "Enhance existing functionality",
  },
] as const;

export function TaskTypeStep() {
  const { context, next, setContext } = taskFlow.useFlow({
    step: "taskType",
  });

  const handleNext = () => {
    // Add timestamp when creating task
    next((ctx) => ({ ...ctx, createdAt: Date.now() }));
  };

  return (
    <StepCard
      title="Create New Task"
      description="What type of task would you like to create?"
      footer={
        <Button
          onClick={handleNext}
          disabled={!context.taskType}
          className="w-full"
        >
          Continue
        </Button>
      }
    >
      <OptionSelector
        options={taskTypeOptions}
        selectedValue={context.taskType}
        onSelect={(value) => setContext({ taskType: value })}
      />
    </StepCard>
  );
}

import { OptionSelector } from "@/components/OptionSelector";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { taskFlow } from "../flow";

const assigneeOptions = [
  { value: "alice", title: "Alice", description: "Frontend Developer" },
  { value: "bob", title: "Bob", description: "Backend Developer" },
  { value: "charlie", title: "Charlie", description: "Full Stack Developer" },
  {
    value: "unassigned",
    title: "Unassigned",
    description: "Will assign later",
  },
] as const;

export function AssignStep() {
  const { context, next, back, setContext } = taskFlow.useFlowState({
    step: "assign",
  });

  return (
    <StepCard
      title="Assign Task"
      description="Choose who will work on this task"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Continue
          </Button>
        </div>
      }
    >
      <OptionSelector
        options={assigneeOptions}
        selectedValue={context.assignee}
        onSelect={(value) => setContext({ assignee: value })}
      />
    </StepCard>
  );
}

import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { taskFlow } from "../flow";

export function ReviewStep() {
  const { context, next, back } = taskFlow.useFlow({
    step: "review",
  });

  return (
    <StepCard
      title="Review Task"
      description="Review the details before creating"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Create Task
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-3">Task Summary:</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type:</dt>
              <dd className="font-medium capitalize">{context.taskType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Priority:</dt>
              <dd className="font-medium capitalize">{context.priority}</dd>
            </div>
            {context.assignee && context.assignee !== "unassigned" && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Assigned To:</dt>
                <dd className="font-medium capitalize">{context.assignee}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Title:</h4>
          <p className="text-sm">{context.title}</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Description:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {context.description}
          </p>
        </div>
      </div>
    </StepCard>
  );
}

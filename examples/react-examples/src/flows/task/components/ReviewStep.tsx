import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { taskFlow } from "../flow";

export function ReviewStep() {
  const { context, next, back } = taskFlow.useFlow({
    step: "review",
  });

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Review Task</CardTitle>
        <CardDescription>Review the details before creating</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button onClick={() => next()} className="flex-1">
          Create Task
        </Button>
      </CardFooter>
    </Card>
  );
}

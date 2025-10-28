import { OptionSelector } from "@/components/OptionSelector";
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
  const { context, next, back, setContext } = taskFlow.useFlow({
    step: "assign",
  });

  const canProceed = context.priority !== undefined;

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Priority & Assignment</CardTitle>
        <CardDescription>Set priority and assign this task</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Priority *</h3>
          <OptionSelector
            options={priorityOptions}
            selectedValue={context.priority}
            onSelect={(value) => setContext({ priority: value })}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Assign To</h3>
          <OptionSelector
            options={assigneeOptions}
            selectedValue={context.assignee}
            onSelect={(value) => setContext({ assignee: value })}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
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
      </CardFooter>
    </Card>
  );
}

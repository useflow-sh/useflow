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
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
        <CardDescription>
          What type of task would you like to create?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OptionSelector
          options={taskTypeOptions}
          selectedValue={context.taskType}
          onSelect={(value) => setContext({ taskType: value })}
        />
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleNext}
          disabled={!context.taskType}
          className="w-full"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

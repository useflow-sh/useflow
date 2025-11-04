import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TaskCompleteStepProps = {
  title: string;
  taskType?: string;
  onCreateAnother: () => void;
  onViewAll: () => void;
};

export function TaskCompleteStep({
  title,
  taskType,
  onCreateAnother,
  onViewAll,
}: TaskCompleteStepProps) {
  return (
    <Card className="w-full border-0">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">Task Created!</CardTitle>
        <CardDescription className="text-base">
          Your {taskType} has been successfully created
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          <strong>{title}</strong> is now in the system
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onViewAll} className="flex-1">
          View All Tasks
        </Button>
        <Button onClick={onCreateAnother} className="flex-1">
          Create Another
        </Button>
      </CardFooter>
    </Card>
  );
}

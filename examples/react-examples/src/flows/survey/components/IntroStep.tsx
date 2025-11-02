import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { surveyFlow } from "../flow";

export function IntroStep() {
  const { next } = surveyFlow.useFlow({ step: "intro" });

  const handleStart = () => {
    // Initialize tracking (startedAt is automatically tracked by the flow)
    next({ questionsAnswered: 0 });
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Customer Satisfaction Survey</CardTitle>
        <CardDescription className="text-base">
          Help us improve by answering 4 quick questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-sm">What to expect:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• 4 questions about your experience</li>
            <li>• Rate each aspect from 1-5 stars</li>
            <li>• Takes less than 2 minutes</li>
            <li>• Your feedback helps us improve</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={handleStart} size="lg">
          Start Survey
        </Button>
      </CardFooter>
    </Card>
  );
}

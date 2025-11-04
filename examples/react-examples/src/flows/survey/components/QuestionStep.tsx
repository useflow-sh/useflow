import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { surveyFlow } from "../flow";
import { RatingInput } from "./RatingInput";

type QuestionStepProps = {
  stepId: "question1" | "question2" | "question3" | "question4";
  questionNumber: number;
  title: string;
  description: string;
  contextKey: "q1_satisfaction" | "q2_recommend" | "q3_features" | "q4_support";
};

export function QuestionStep({
  stepId,
  questionNumber,
  title,
  description,
  contextKey,
}: QuestionStepProps) {
  const { context, next, back, setContext } = surveyFlow.useFlow({
    step: stepId,
  });

  const currentValue = context[contextKey];

  const handleRatingChange = (rating: number) => {
    setContext({
      [contextKey]: rating,
      questionsAnswered:
        (context.questionsAnswered || 0) + (currentValue ? 0 : 1),
    });
  };

  const canProceed = currentValue !== undefined;

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {questionNumber} of 4
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full ${
                  i <= questionNumber ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <RatingInput value={currentValue} onChange={handleRatingChange} />
          <div className="flex justify-between w-full text-xs text-muted-foreground px-1">
            <span>Not at all</span>
            <span>Extremely</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => next()}
            disabled={!canProceed}
            className="flex-1"
          >
            {questionNumber === 4 ? "View Results" : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

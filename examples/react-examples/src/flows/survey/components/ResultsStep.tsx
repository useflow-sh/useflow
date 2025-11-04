import { CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ResultsStepProps = {
  satisfaction?: number;
  recommend?: number;
  features?: number;
  support?: number;
  startedAt?: number;
  completedAt?: number;
  onRestart: () => void;
};

export function ResultsStep({
  satisfaction = 0,
  recommend = 0,
  features = 0,
  support = 0,
  startedAt,
  completedAt,
  onRestart,
}: ResultsStepProps) {
  const totalScore = satisfaction + recommend + features + support;
  const averageScore = (totalScore / 4).toFixed(1);
  const percentage = ((totalScore / 20) * 100).toFixed(0);

  const timeSpent =
    startedAt && completedAt ? Math.round((completedAt - startedAt) / 1000) : 0;

  const getFeedbackMessage = () => {
    const avg = parseFloat(averageScore);
    if (avg >= 4.5)
      return "Outstanding! Thank you for the excellent feedback! 🌟";
    if (avg >= 3.5)
      return "Great! We're glad you're satisfied with our service! 👍";
    if (avg >= 2.5)
      return "Thank you! We'll work on improving your experience. 💪";
    return "We appreciate your honest feedback and will do better! 🙏";
  };

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">Survey Complete!</CardTitle>
        <CardDescription className="text-base">
          {getFeedbackMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="bg-primary/5 p-6 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Overall Score</h3>
          </div>
          <div className="text-4xl font-bold text-primary mb-1">
            {averageScore} / 5.0
          </div>
          <div className="text-sm text-muted-foreground">
            {percentage}% satisfaction
          </div>
        </div>

        {/* Breakdown */}
        <div>
          <h3 className="font-semibold mb-3 text-sm">Score Breakdown:</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">Overall Satisfaction:</dt>
              <dd className="font-medium">{satisfaction}/5 ⭐</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">
                Likelihood to Recommend:
              </dt>
              <dd className="font-medium">{recommend}/5 ⭐</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">
                Features & Functionality:
              </dt>
              <dd className="font-medium">{features}/5 ⭐</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">Customer Support:</dt>
              <dd className="font-medium">{support}/5 ⭐</dd>
            </div>
          </dl>
        </div>

        {timeSpent > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            Completed in {timeSpent} seconds
          </div>
        )}
        <div className="flex justify-center">
          <Button variant="outline" onClick={onRestart}>
            Take Survey Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

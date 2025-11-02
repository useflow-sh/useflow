import { useFlow } from "@useflow/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function WelcomeStep() {
  const { next } = useFlow({ step: "welcome" });

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Welcome to Dynamic Flows</CardTitle>
        <CardDescription>
          This demo shows how the same step components can be used in different
          flow configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The flow you experience will be determined by your selections. All
          steps use the same components, but the navigation order and logic can
          differ between flows.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => next()} className="w-full">
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}

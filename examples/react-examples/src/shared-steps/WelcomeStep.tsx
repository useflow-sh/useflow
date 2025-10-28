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
  const { next } = useFlow();

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Welcome to useFlow!</CardTitle>
        <CardDescription>
          Let's get you started with a quick onboarding process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We'll help you set up your profile and preferences in just a few
          steps.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() =>
            // Demonstrate updater function - add timestamp when starting
            next((ctx) => ({ ...ctx, startedAt: Date.now() }))
          }
        >
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}

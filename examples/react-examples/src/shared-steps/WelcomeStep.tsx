import { useFlowState } from "@useflow/react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";

export function WelcomeStep() {
  const { next } = useFlowState();

  return (
    <StepCard
      title="Welcome to useFlow!"
      description="Let's get you started with a quick onboarding process."
      footer={
        <Button
          onClick={() =>
            // Demonstrate updater function - add timestamp when starting
            next((ctx) => ({ ...ctx, startedAt: Date.now() }))
          }
        >
          Get Started
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">
        We'll help you set up your profile and preferences in just a few steps.
      </p>
    </StepCard>
  );
}

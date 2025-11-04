import { useFlow } from "@useflow/react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";

export function WelcomeStep() {
  const { next } = useFlow({ step: "welcome" });

  return (
    <StepCard
      title="Welcome to Dynamic Flows"
      description="This demo shows how the same step components can be used in different flow configurations"
      footer={
        <Button onClick={() => next()} className="w-full">
          Get Started
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">
        The flow you experience will be determined by your selections. All steps
        use the same components, but the navigation order and logic can differ
        between flows.
      </p>
    </StepCard>
  );
}

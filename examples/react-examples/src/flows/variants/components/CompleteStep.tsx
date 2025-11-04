import { useFlow } from "@useflow/react";
import { Clock, Zap } from "lucide-react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";

export function CompleteStep() {
  const { context, reset } = useFlow({ step: "complete" });

  // Determine which flow was used based on whether verification was completed
  const isStandardFlow = context.verificationCode !== undefined;
  const hasPreferences = context.newsletter !== undefined;

  return (
    <StepCard
      title="All Set! 🎉"
      description="Your onboarding is complete"
      footer={
        <Button onClick={() => reset()} variant="outline" className="w-full">
          Start Over
        </Button>
      }
    >
      {/* Flow Path Info */}
      <div
        className={`rounded-lg border p-3 ${
          isStandardFlow
            ? "bg-primary/5 border-primary/20"
            : "bg-blue-500/5 border-blue-500/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {isStandardFlow ? (
            <Zap className="h-4 w-4 text-primary" />
          ) : (
            <Clock className="h-4 w-4 text-blue-500" />
          )}
          <h3 className="font-semibold text-sm">
            {isStandardFlow ? "Standard Flow" : "Express Flow"} Completed
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {isStandardFlow
            ? "Full onboarding with verification and preferences"
            : "Quick onboarding - skipped verification and preferences"}
        </p>
      </div>

      {/* Account Summary */}
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <h3 className="font-medium">Account Summary:</h3>
        <dl className="space-y-1 text-sm">
          {context.email && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Email:</dt>
              <dd className="font-medium">{context.email}</dd>
            </div>
          )}
          {context.username && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Username:</dt>
              <dd className="font-medium">{context.username}</dd>
            </div>
          )}
          {context.name && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Name:</dt>
              <dd className="font-medium">{context.name}</dd>
            </div>
          )}
          {context.bio && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Bio:</dt>
              <dd className="font-medium">{context.bio}</dd>
            </div>
          )}
          {isStandardFlow && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Email Verified:</dt>
              <dd className="font-medium">✓ Yes</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Notifications:</dt>
            <dd className="font-medium">
              {context.notifications ? "Enabled" : "Disabled"}
            </dd>
          </div>
          {hasPreferences && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Newsletter:</dt>
              <dd className="font-medium">
                {context.newsletter ? "Subscribed" : "Not subscribed"}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Key Concept */}
      <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-4">
        <h3 className="font-semibold text-sm mb-2">💡 What You Just Saw</h3>
        <p className="text-xs text-muted-foreground">
          The same step components (AccountStep, ProfileStep, etc.) were used by
          both flows. Only the flow definition changed - the navigation order
          and which steps were included. This demonstrates how you can A/B test
          different onboarding experiences or use feature flags to
          enable/disable steps without rewriting components.
        </p>
      </div>
    </StepCard>
  );
}

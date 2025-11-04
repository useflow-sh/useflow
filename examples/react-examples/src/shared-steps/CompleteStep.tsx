import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";

type CompleteStepProps = {
  name: string;
  notifications: boolean;
  theme?: "light" | "dark";
  userType?: "business" | "personal";
  businessIndustry?: string;
  companyName?: string;
  startedAt?: number;
  skippedPreferences?: boolean;
  onRestart?: () => void;
};

export function CompleteStep({
  name,
  theme,
  notifications,
  userType,
  businessIndustry,
  companyName,
  startedAt,
  skippedPreferences,
  onRestart,
}: CompleteStepProps) {
  return (
    <StepCard
      title={`Welcome, ${name}!`}
      description="Your onboarding is complete."
      footer={
        onRestart ? (
          <div className="flex justify-center w-full">
            <Button variant="outline" onClick={onRestart}>
              Restart Onboarding
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Your Profile:</h3>
          <dl className="space-y-1 text-sm">
            {userType && (
              <div>
                <dt className="inline text-muted-foreground">Account Type: </dt>
                <dd className="inline font-medium">
                  {userType === "business" ? "Business" : "Personal"}
                </dd>
              </div>
            )}
            {businessIndustry && (
              <div>
                <dt className="inline text-muted-foreground">Industry: </dt>
                <dd className="inline font-medium">{businessIndustry}</dd>
              </div>
            )}
            {companyName && (
              <div>
                <dt className="inline text-muted-foreground">Company: </dt>
                <dd className="inline font-medium">{companyName}</dd>
              </div>
            )}
            {theme && !skippedPreferences && (
              <div>
                <dt className="inline text-muted-foreground">Theme: </dt>
                <dd className="inline font-medium capitalize">{theme}</dd>
              </div>
            )}
            {skippedPreferences && (
              <div>
                <dt className="inline text-muted-foreground">Preferences: </dt>
                <dd className="inline font-medium">Used defaults (skipped)</dd>
              </div>
            )}
            <div>
              <dt className="inline text-muted-foreground">Notifications: </dt>
              <dd className="inline font-medium">
                {notifications ? "Enabled" : "Disabled"}
              </dd>
            </div>
            {startedAt && (
              <div>
                <dt className="inline text-muted-foreground">Started: </dt>
                <dd className="inline font-medium">
                  {new Date(startedAt).toLocaleTimeString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <p className="text-sm text-muted-foreground">
          You're ready to start using the app!
        </p>
      </div>
    </StepCard>
  );
}

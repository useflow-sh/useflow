import { useFlow } from "@useflow/react";
import { OptionSelector } from "@/components/OptionSelector";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const themeOptions = [
  {
    value: "light" as const,
    title: "Light Mode",
    description: "Clean and bright interface",
  },
  {
    value: "dark" as const,
    title: "Dark Mode",
    description: "Easy on the eyes",
  },
] as const;

export function PreferencesStep() {
  const { context, next, back, skip, setContext } = useFlow<{
    theme?: "light" | "dark";
    notifications: boolean;
    skippedPreferences?: boolean;
  }>();

  const handleSkip = () => {
    // Use skip() to mark this step as skipped in history
    skip((ctx) => ({ ...ctx, skippedPreferences: true }));
  };

  return (
    <StepCard
      title="Set Your Preferences"
      description="Customize your experience (or skip to use defaults)"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <Label>Choose Your Theme</Label>
          <OptionSelector
            options={themeOptions}
            selectedValue={context.theme}
            onSelect={(value) => setContext({ theme: value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications" className="mb-0">
              Enable Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about your account
            </p>
          </div>
          <Switch
            id="notifications"
            checked={context.notifications}
            onCheckedChange={(checked) =>
              setContext({ notifications: checked })
            }
          />
        </div>
      </div>
    </StepCard>
  );
}

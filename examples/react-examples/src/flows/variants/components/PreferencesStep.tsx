import { useFlow } from "@useflow/react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function PreferencesStep() {
  const { context, next, back, setContext } = useFlow({ step: "preferences" });

  const handleNotificationsChange = (checked: boolean) => {
    setContext({ notifications: checked });
  };

  const handleNewsletterChange = (checked: boolean) => {
    setContext({ newsletter: checked });
  };

  return (
    <StepCard
      title="Your Preferences"
      description="Customize your experience (you can change these later)"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Continue
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="notifications">Email Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive updates about your account activity
          </p>
        </div>
        <Switch
          id="notifications"
          checked={context.notifications ?? true}
          onCheckedChange={handleNotificationsChange}
        />
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="newsletter">Newsletter</Label>
          <p className="text-sm text-muted-foreground">
            Get weekly updates and tips
          </p>
        </div>
        <Switch
          id="newsletter"
          checked={context.newsletter ?? false}
          onCheckedChange={handleNewsletterChange}
        />
      </div>
    </StepCard>
  );
}

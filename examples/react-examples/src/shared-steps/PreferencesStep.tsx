import { useFlow } from "@useflow/react";
import { OptionSelector } from "@/components/OptionSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const { context, next, back, setContext } = useFlow<{
    theme?: "light" | "dark";
    notifications: boolean;
    skippedPreferences?: boolean;
  }>();

  const handleSkip = () => {
    // Use updater function to mark as skipped and proceed
    next((ctx) => ({ ...ctx, skippedPreferences: true }));
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Set Your Preferences</CardTitle>
        <CardDescription>
          Customize your experience (or skip to use defaults)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Choose Your Theme</Label>
          <OptionSelector
            options={themeOptions}
            selectedValue={context.theme}
            onSelect={(value) => setContext({ theme: value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Enable Notifications</Label>
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
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="flex-1">
          Skip
        </Button>
        <Button onClick={() => next()} className="flex-1">
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

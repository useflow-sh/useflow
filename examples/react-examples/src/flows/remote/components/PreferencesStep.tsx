import { useFlow } from "@useflow/react";
import { useState } from "react";
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
import type { RemoteOnboardingContext } from "../types";

const themeOptions = [
  {
    value: "light" as const,
    title: "Light",
    description: "Clean and bright interface",
  },
  {
    value: "dark" as const,
    title: "Dark",
    description: "Easy on the eyes",
  },
] as const;

/**
 * Preferences setup step for remote flows
 *
 * This component appears in some remote configurations but not others:
 * - Standard flow: includes preferences
 * - Express flow: skips preferences for faster conversion
 * - Business flow: includes preferences with business-specific options
 */
export function PreferencesStep() {
  const { context, next, back, setContext } =
    useFlow<RemoteOnboardingContext>();

  const [preferences, setPreferences] = useState(
    context.preferences || {
      theme: "light" as const,
      notifications: true,
    },
  );

  const handleContinue = () => {
    setContext({ preferences });
    next(); // Remote config determines where this goes
  };

  const updatePreference = <K extends keyof typeof preferences>(
    key: K,
    value: (typeof preferences)[K],
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Customize Your Experience</CardTitle>
        <CardDescription>
          Set your preferences to customize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Theme Preference</Label>
          <OptionSelector
            options={themeOptions}
            selectedValue={preferences.theme}
            onSelect={(value) => updatePreference("theme", value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about new features and important changes
            </p>
          </div>
          <Switch
            id="notifications"
            checked={preferences.notifications}
            onCheckedChange={(checked) =>
              updatePreference("notifications", checked)
            }
          />
        </div>

        {context.userType === "business" && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Business Features
            </h4>
            <p className="text-sm text-blue-800">
              Additional business-specific preferences will be available in the
              next update.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Complete Setup
        </Button>
      </CardFooter>
    </Card>
  );
}

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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function PreferencesStep() {
  const { context, next, back, setContext } = useFlow<{
    theme?: "light" | "dark";
    notifications: boolean;
  }>();

  const canProceed = context.theme !== undefined;

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Customize Your Experience</CardTitle>
        <CardDescription>
          Choose your preferences to personalize the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={context.theme === "light" ? "default" : "outline"}
              onClick={() => setContext({ theme: "light" })}
            >
              Light
            </Button>
            <Button
              type="button"
              variant={context.theme === "dark" ? "default" : "outline"}
              onClick={() => setContext({ theme: "dark" })}
            >
              Dark
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Enable notifications</Label>
          <Switch
            id="notifications"
            checked={context.notifications}
            onCheckedChange={(checked) =>
              setContext({ notifications: checked })
            }
          />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" onClick={() => back()}>
          Back
        </Button>
        <Button onClick={() => next()} disabled={!canProceed}>
          Finish
        </Button>
      </CardFooter>
    </Card>
  );
}

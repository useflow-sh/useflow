import { useFlow } from "@useflow/react";
import {
  Bell,
  BookOpen,
  CheckCircle,
  FileCheck,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RemoteOnboardingContext } from "../types";

/**
 * Completion step for remote flows
 *
 * This component is required in all remote configurations as it's marked
 * as protected in the schema. It provides a summary of the completed flow
 * and adapts to show different information based on what steps were taken.
 */
export function CompleteStep() {
  const { context, reset, history } = useFlow<RemoteOnboardingContext>();

  const handleRestart = () => {
    reset();
  };

  // Map of all possible steps with their display information
  const stepInfo: Record<
    string,
    { icon: typeof Mail; label: string; description: string }
  > = {
    welcome: {
      icon: CheckCircle,
      label: "Welcome",
      description: "Started onboarding",
    },
    tutorial: {
      icon: BookOpen,
      label: "Tutorial",
      description: "Completed product tutorial",
    },
    "tutorial-short": {
      icon: BookOpen,
      label: "Quick Tutorial",
      description: "Completed quick start guide",
    },
    terms: {
      icon: FileCheck,
      label: "Terms & Conditions",
      description: "Accepted terms of service",
    },
    account: {
      icon: Mail,
      label: "Account Creation",
      description: context.email
        ? `Created account: ${context.email}`
        : "Account created",
    },
    verification: {
      icon: Shield,
      label: "Email Verification",
      description: "Verified email address",
    },
    profile: {
      icon: User,
      label: "Profile Setup",
      description: context.name
        ? `Set name: ${context.name}`
        : "Customized profile",
    },
    survey: {
      icon: MessageSquare,
      label: "Survey",
      description: "Provided feedback",
    },
    notifications: {
      icon: Bell,
      label: "Notifications",
      description: "Configured notification settings",
    },
    "notifications-detailed": {
      icon: Bell,
      label: "Notification Preferences",
      description: "Configured detailed notification preferences",
    },
    newsletter: {
      icon: Mail,
      label: "Newsletter",
      description: "Subscribed to newsletter",
    },
    confirmation: {
      icon: CheckCircle,
      label: "Confirmation",
      description: "Confirmed setup",
    },
    preferences: {
      icon: Settings,
      label: "Preferences",
      description: context.preferences
        ? `Set ${context.preferences.theme} theme, notifications ${context.preferences.notifications ? "enabled" : "disabled"}`
        : "Set app preferences",
    },
  };

  // Get the steps from history (excluding the current 'complete' step)
  const completedSteps = history
    .filter((step) => step !== "complete")
    .map((stepId) => ({
      stepId,
      ...stepInfo[stepId],
    }))
    .filter((step) => step.icon); // Only include steps we have info for
  const userTypeLabel =
    context.userType === "business" ? "Business" : "Personal";

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-green-900">
          Welcome to UseFlow!
        </CardTitle>
        <CardDescription>
          Your {userTypeLabel.toLowerCase()} account is ready to use
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">
            Onboarding Journey ({completedSteps.length}{" "}
            {completedSteps.length === 1 ? "step" : "steps"} completed)
          </h3>
          <div className="space-y-2">
            {completedSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.stepId}
                  className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700">
                      {index + 1}
                    </div>
                    <Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900">{step.label}</p>
                    <p className="text-sm text-green-700">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={handleRestart} className="flex-1">
          Restart
        </Button>
      </CardFooter>
    </Card>
  );
}

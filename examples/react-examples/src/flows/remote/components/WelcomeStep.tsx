import { useFlow } from "@useflow/react";
import { useState } from "react";
import { FormField } from "@/components/FormField";
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
import type { RemoteOnboardingContext } from "../types";

const userTypeOptions = [
  {
    value: "personal" as const,
    title: "Personal",
    description: "For individual use",
  },
  {
    value: "business" as const,
    title: "Business",
    description: "For business or team use",
  },
] as const;

/**
 * Welcome step component for remote flows
 *
 * This component works with ANY valid remote configuration
 * that includes a 'welcome' step. It doesn't depend on
 * specific flow structure - just uses the generic useFlow hook.
 *
 * This demonstrates how components can be flow-agnostic
 * while still being type-safe for context operations.
 */
export function WelcomeStep() {
  const { context, next, setContext } = useFlow<RemoteOnboardingContext>();
  const [email, setEmail] = useState(context.email || "");
  const [emailError, setEmailError] = useState("");

  const handleContinue = () => {
    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Update context and navigate (determined by remote configuration)
    next({
      email,
      userType: context.userType,
    });
  };

  // Clear error when user types
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError("");
  };

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-2xl font-bold">
          Welcome! Let's Get Started
        </CardTitle>
        <CardDescription>
          Let's get you set up with a personalized experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleEmailChange}
          error={emailError}
        />

        <div className="space-y-3">
          <Label>What type of account do you need?</Label>
          <OptionSelector
            options={userTypeOptions}
            selectedValue={context.userType}
            onSelect={(value) => setContext({ userType: value })}
          />
          {!context.userType && (
            <p className="text-sm text-muted-foreground">
              Please select an account type
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleContinue} className="w-full" size="lg">
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}

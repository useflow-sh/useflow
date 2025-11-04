import { useFlow } from "@useflow/react";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RemoteOnboardingContext } from "../types";

/**
 * Account creation step for remote flows
 *
 * Works with any remote configuration that includes an 'account' step.
 * The next step depends on the remote configuration:
 * - Could go to verification (standard flow)
 * - Could go to profile (express flow)
 * - Could have branching logic (business flow)
 */
export function AccountStep() {
  const { context, next, back } = useFlow<RemoteOnboardingContext>();
  const [name, setName] = useState(context.name || "");
  const [nameError, setNameError] = useState("");

  const handleContinue = () => {
    if (!name.trim()) {
      setNameError("Full name is required");
      return;
    }
    next({ name }); // Remote config determines where this goes
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) setNameError("");
  };

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>Complete your profile to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={context.email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>User Type</Label>
          <Input
            value={context.userType === "business" ? "Business" : "Personal"}
            disabled
            className="bg-muted"
          />
        </div>

        <FormField
          id="name"
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChange={handleNameChange}
          error={nameError}
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

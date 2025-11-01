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
import type { RemoteOnboardingContext } from "../types";

/**
 * Email verification step for remote flows
 *
 * This step only appears in certain remote configurations:
 * - Standard flow: always includes verification
 * - Express flow: skips verification entirely
 * - Business flow: includes verification for business users only
 *
 * The component doesn't need to know which flow it's in -
 * it just handles the verification logic when present.
 */
export function VerificationStep() {
  const { context, next, back, skip } = useFlow<RemoteOnboardingContext>();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setCodeError("Verification code must be 6 digits");
      return;
    }

    setIsVerifying(true);

    // Simulate verification API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In real app, you'd validate the code with your backend
    const isValid = code === "123456"; // Demo code

    if (isValid) {
      next({ verified: true }); // Remote config determines next step
    } else {
      setCodeError("Invalid verification code. Try 123456");
    }

    setIsVerifying(false);
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (codeError) setCodeError("");
  };

  const handleSkip = () => {
    skip({ verified: false });
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification code to {context.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          id="code"
          label="Verification Code"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={handleCodeChange}
          maxLength={6}
          error={codeError}
          helperText="For demo purposes, use code: 123456"
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex-1"
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>
      </CardFooter>
    </Card>
  );
}

import { useFlowState } from "@useflow/react";
import { useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerificationStep() {
  const { context, next, back } = useFlowState({
    step: "verification",
  });

  const [code, setCode] = useState(context.verificationCode || "");
  const [showErrors, setShowErrors] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    if (showErrors) setShowErrors(false);
  };

  const canProceed = code.length === 6;

  const handleContinue = () => {
    if (canProceed) {
      next({ verificationCode: code });
    } else {
      setShowErrors(true);
    }
  };

  return (
    <StepCard
      title="Verify Your Email"
      description={`We sent a verification code to ${context.email}`}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Verify
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="code">Verification Code *</Label>
        <Input
          id="code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="000000"
          maxLength={6}
          className={`text-center text-2xl tracking-widest ${showErrors && !canProceed ? "border-red-500" : ""}`}
        />
        {showErrors && !canProceed ? (
          <p className="text-xs text-red-500">
            Please enter a 6-digit verification code
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code from your email
          </p>
        )}
      </div>

      <Button variant="link" className="text-sm px-0">
        Resend code
      </Button>
    </StepCard>
  );
}

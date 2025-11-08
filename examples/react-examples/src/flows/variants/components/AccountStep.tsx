import { useFlowState } from "@useflow/react";
import { useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountStep() {
  const { context, next, back } = useFlowState({ step: "account" });

  const [email, setEmail] = useState(context.email || "");
  const [username, setUsername] = useState(context.username || "");
  const [showErrors, setShowErrors] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (showErrors) setShowErrors(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (showErrors) setShowErrors(false);
  };

  const emailValid = email.trim() !== "" && email.includes("@");
  const usernameValid = username.trim().length >= 3;
  const canProceed = emailValid && usernameValid;

  const handleContinue = () => {
    if (canProceed) {
      next({ email, username });
    } else {
      setShowErrors(true);
    }
  };

  return (
    <StepCard
      title="Account Information"
      description="Set up your account details"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="you@example.com"
          className={showErrors && !emailValid ? "border-red-500" : ""}
        />
        {showErrors && !emailValid && (
          <p className="text-xs text-red-500">
            {email.trim() === ""
              ? "Email is required"
              : "Please enter a valid email address"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="At least 3 characters"
          className={showErrors && !usernameValid ? "border-red-500" : ""}
        />
        {showErrors && !usernameValid ? (
          <p className="text-xs text-red-500">
            Username must be at least 3 characters
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {username.length}/3 minimum characters
          </p>
        )}
      </div>
    </StepCard>
  );
}

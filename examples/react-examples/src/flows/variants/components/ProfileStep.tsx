import { useFlow } from "@useflow/react";
import { useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileStep() {
  const { context, next, back } = useFlow({ step: "profile" });

  const [name, setName] = useState(context.name || "");
  const [bio, setBio] = useState(context.bio || "");
  const [showErrors, setShowErrors] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (showErrors) setShowErrors(false);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBio(value);
  };

  const canProceed = name.trim() !== "";

  const handleContinue = () => {
    if (canProceed) {
      next({ name, bio });
    } else {
      setShowErrors(true);
    }
  };

  return (
    <StepCard
      title="Your Profile"
      description="Tell us about yourself"
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
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="John Doe"
          className={showErrors && !canProceed ? "border-red-500" : ""}
        />
        {showErrors && !canProceed && (
          <p className="text-xs text-red-500">Full name is required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={handleBioChange}
          placeholder="A short bio about yourself..."
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </StepCard>
  );
}

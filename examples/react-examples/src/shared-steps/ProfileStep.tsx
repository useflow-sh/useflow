import { useFlowState } from "@useflow/react";
import { useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileStep() {
  const { context, next, back } = useFlowState<{ name: string }>();

  const [nameInput, setNameInput] = useState(context.name);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameInput(value);
  };

  const canProceed = nameInput !== "";

  return (
    <StepCard
      title="Tell us about yourself"
      description="What should we call you?"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()}>
            Back
          </Button>
          <Button
            onClick={() => next({ name: nameInput })}
            disabled={!canProceed}
          >
            Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          type="text"
          value={nameInput}
          onChange={handleNameChange}
          placeholder="Enter your name"
        />
      </div>
    </StepCard>
  );
}

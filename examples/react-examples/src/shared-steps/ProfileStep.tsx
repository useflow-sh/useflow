import { useFlow } from "@useflow/react";
import { useState } from "react";
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

export function ProfileStep() {
  const { context, next, back, setContext } = useFlow<{ name: string }>();

  const [nameInput, setNameInput] = useState(context.name);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameInput(value);
    setContext({ name: value });
  };

  const canProceed = context.name !== "";

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Tell us about yourself</CardTitle>
        <CardDescription>What should we call you?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" onClick={() => back()}>
          Back
        </Button>
        <Button onClick={() => next()} disabled={!canProceed}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

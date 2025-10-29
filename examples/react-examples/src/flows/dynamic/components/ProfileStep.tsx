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
  const { context, next, back, setContext } = useFlow({ step: "profile" });

  const [name, setName] = useState(context.name || "");
  const [bio, setBio] = useState(context.bio || "");
  const [showErrors, setShowErrors] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setContext({ name: value });
    if (showErrors) setShowErrors(false);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBio(value);
    setContext({ bio: value });
  };

  const canProceed = name.trim() !== "";

  const handleContinue = () => {
    if (canProceed) {
      next();
    } else {
      setShowErrors(true);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Tell us about yourself</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
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

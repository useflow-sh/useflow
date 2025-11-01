import { useFlow } from "@useflow/react";
import { Building2, User } from "lucide-react";
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
import type { RemoteOnboardingContext } from "../types";

/**
 * Profile customization step for remote flows
 *
 * This step focuses on additional profile details beyond basic account info.
 * It's distinct from AccountStep which handles core account creation (name, email).
 * This step adds personalization and optional profile enhancements.
 */
export function ProfileStep() {
  const { context, next, back } = useFlow<RemoteOnboardingContext>();

  // Profile fields not covered in AccountStep
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");

  const handleContinue = () => {
    // For demo purposes, we'll just show that profile was customized
    // In a real app, this would save additional profile fields
    next();
  };

  const handleSkip = () => {
    next();
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Customize Your Profile
        </CardTitle>
        <CardDescription>
          Add additional details to personalize your experience (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{context.name || "User"}</strong> • {context.email} •{" "}
            {context.userType} account
          </p>
          {context.verified && (
            <p className="text-xs text-blue-600 mt-1">✓ Email verified</p>
          )}
        </div>

        {context.userType === "business" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Job Title
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Product Manager, Developer, CEO"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Your company or organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="bio">
            {context.userType === "business" ? "Professional Bio" : "About You"}
          </Label>
          <textarea
            id="bio"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={
              context.userType === "business"
                ? "Brief description of your role and expertise..."
                : "Tell us a bit about your interests..."
            }
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

import { useFlow } from "@useflow/react";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { RemoteOnboardingContext } from "../types";

export function SurveyStep() {
  const { next } = useFlow<RemoteOnboardingContext>();
  const [hearAbout, setHearAbout] = useState("");
  const [primaryUse, setPrimaryUse] = useState("");

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle>Quick Survey</CardTitle>
        <CardDescription>
          Help us understand how we can serve you better (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            How did you hear about us?
          </Label>
          <RadioGroup value={hearAbout} onValueChange={setHearAbout}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="search" id="search" />
              <Label htmlFor="search">Search Engine</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="social" id="social" />
              <Label htmlFor="social">Social Media</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friend" id="friend" />
              <Label htmlFor="friend">Friend/Colleague</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">
            What will you primarily use this for?
          </Label>
          <RadioGroup value={primaryUse} onValueChange={setPrimaryUse}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="work" id="work" />
              <Label htmlFor="work">Work/Business</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal">Personal Projects</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="learning" id="learning" />
              <Label htmlFor="learning">Learning/Education</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => next()} className="flex-1">
            Skip Survey
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Submit & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

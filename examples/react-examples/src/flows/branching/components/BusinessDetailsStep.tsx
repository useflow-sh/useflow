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
import { branchingFlow } from "../flow";

export function BusinessDetailsStep() {
  const { context, next, back, setContext } = branchingFlow.useFlow({
    step: "businessDetails",
  });

  const [industryInput, setIndustryInput] = useState(
    context.businessIndustry || "",
  );
  const [companyInput, setCompanyInput] = useState(context.companyName || "");

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIndustryInput(value);
    setContext({ businessIndustry: value });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanyInput(value);
    setContext({ companyName: value });
  };

  const canProceed = industryInput !== "";

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          Help us personalize your business experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            value={industryInput}
            onChange={handleIndustryChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">Select an industry...</option>
            <option value="tech">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company Name (optional)</Label>
          <Input
            id="company"
            type="text"
            value={companyInput}
            onChange={handleCompanyChange}
            placeholder="Your Company Inc."
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => next()}
          disabled={!canProceed}
          className="flex-1"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

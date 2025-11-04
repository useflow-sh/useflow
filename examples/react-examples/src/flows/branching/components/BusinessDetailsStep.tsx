import { useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { branchingFlow } from "../flow";

export function BusinessDetailsStep() {
  const { context, next, back } = branchingFlow.useFlow({
    step: "businessDetails",
  });

  const [industryInput, setIndustryInput] = useState(
    context.businessIndustry || "",
  );
  const [companyInput, setCompanyInput] = useState(context.companyName || "");

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIndustryInput(value);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanyInput(value);
  };

  const canProceed = industryInput !== "";

  return (
    <StepCard
      title="Tell us about your business"
      description="Help us personalize your business experience."
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() =>
              next({
                businessIndustry: industryInput,
                companyName: companyInput,
              })
            }
            disabled={!canProceed}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
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
      </div>
    </StepCard>
  );
}

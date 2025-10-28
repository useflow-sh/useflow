import { useState } from "react";
import { advancedFlow } from "../flow";

export function BusinessDetailsStep() {
  // Use the hook for automatic type inference!
  const { context, next, back, setContext } = advancedFlow.useFlow({
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
    <div className="container">
      <h1>Tell us about your business</h1>
      <p>Help us personalize your business experience.</p>

      <div className="form-group">
        <label htmlFor="industry">Industry</label>
        <select
          id="industry"
          value={industryInput}
          onChange={handleIndustryChange}
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

      <div className="form-group">
        <label htmlFor="company">Company Name (optional)</label>
        <input
          id="company"
          type="text"
          value={companyInput}
          onChange={handleCompanyChange}
          placeholder="Your Company Inc."
        />
      </div>

      <div className="button-group">
        <button type="button" className="secondary" onClick={() => back()}>
          Back
        </button>
        <button type="button" onClick={() => next()} disabled={!canProceed}>
          Continue
        </button>
      </div>
    </div>
  );
}

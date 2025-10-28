import { OptionSelector } from "../../../components/OptionSelector";
import { advancedFlow } from "../flow";

const userTypeOptions = [
  {
    value: "business",
    title: "Business",
    description: "Business account with advanced features",
  },
  {
    value: "personal",
    title: "Personal",
    description: "Personal account for individual use",
  },
] as const;

export function UserTypeStep() {
  const { context, next, back, setContext } = advancedFlow.useFlow({
    step: "userType",
  });

  return (
    <div className="container">
      <h1>How will you use this app?</h1>
      <p>Choose your account type to customize your experience.</p>

      <div className="form-group">
        <OptionSelector
          options={userTypeOptions}
          selectedValue={context.userType}
          onSelect={(value) => setContext({ userType: value })}
        />
      </div>

      <div className="button-group">
        <button type="button" className="secondary" onClick={() => back()}>
          Back
        </button>
        <button
          type="button"
          onClick={() => next()}
          disabled={!context.userType}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

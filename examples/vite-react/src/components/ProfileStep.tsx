import { useFlow } from "@useflow/react";
import { useState } from "react";

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
    <div className="container">
      <h1>Tell us about yourself</h1>
      <p>What should we call you?</p>

      <div className="form-group">
        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          value={nameInput}
          onChange={handleNameChange}
          placeholder="Enter your name"
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

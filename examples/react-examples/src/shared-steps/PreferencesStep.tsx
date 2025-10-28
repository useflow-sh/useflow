import { useFlow } from "@useflow/react";

export function PreferencesStep() {
  const { context, next, back, setContext } = useFlow<{
    theme?: "light" | "dark";
    notifications: boolean;
  }>();

  const canProceed = context.theme !== undefined;

  return (
    <div className="container">
      <h1>Customize Your Experience</h1>
      <p>Choose your preferences to personalize the app.</p>

      <div className="form-group">
        <label htmlFor="theme">Theme</label>
        <div className="theme-options">
          <button
            type="button"
            className={`theme-button ${context.theme === "light" ? "selected" : ""}`}
            onClick={() => setContext({ theme: "light" })}
          >
            Light
          </button>
          <button
            type="button"
            className={`theme-button ${context.theme === "dark" ? "selected" : ""}`}
            onClick={() => setContext({ theme: "dark" })}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={context.notifications}
            onChange={() =>
              setContext({ notifications: !context.notifications })
            }
          />
          <span>Enable notifications</span>
        </label>
      </div>

      <div className="button-group">
        <button type="button" className="secondary" onClick={() => back()}>
          Back
        </button>
        <button type="button" onClick={() => next()} disabled={!canProceed}>
          Finish
        </button>
      </div>
    </div>
  );
}

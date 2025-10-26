/**
 * CompleteStep - Pure Presentational Component
 *
 * This component demonstrates the "dumb component" pattern:
 * - Accepts all data as props (no hooks)
 * - Fully type-safe
 * - Easily testable in isolation
 * - Can be reused across different flows
 *
 * The flow definitions show how to connect this to flow state inline.
 */

type CompleteStepProps = {
  // Required fields (common to all flows)
  name: string;
  notifications: boolean;

  // Optional fields (may vary by flow)
  theme?: "light" | "dark";
  userType?: "business" | "personal";
  businessIndustry?: string;
  companyName?: string;
  startedAt?: number;

  // Actions
  onRestart?: () => void;
};

export function CompleteStep({
  name,
  theme,
  notifications,
  userType,
  businessIndustry,
  companyName,
  startedAt,
  onRestart,
}: CompleteStepProps) {
  return (
    <div className="container">
      <h1>🎉 Welcome, {name}!</h1>
      <p>Your onboarding is complete.</p>

      <div className="summary">
        <h3>Your Profile:</h3>
        <ul>
          {userType && (
            <li>
              Account Type:{" "}
              <strong>
                {userType === "business" ? "Business" : "Personal"}
              </strong>
            </li>
          )}
          {businessIndustry && (
            <li>
              Industry: <strong>{businessIndustry}</strong>
            </li>
          )}
          {companyName && (
            <li>
              Company: <strong>{companyName}</strong>
            </li>
          )}
          {theme && (
            <li>
              Theme: <strong>{theme}</strong>
            </li>
          )}
          <li>
            Notifications:{" "}
            <strong>{notifications ? "Enabled" : "Disabled"}</strong>
          </li>
          {startedAt && (
            <li>
              Started:{" "}
              <strong>{new Date(startedAt).toLocaleTimeString()}</strong>
            </li>
          )}
        </ul>
      </div>

      <p>You're ready to start using the app!</p>

      {onRestart && <button onClick={onRestart}>Restart Onboarding</button>}
    </div>
  );
}

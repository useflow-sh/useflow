import { useFlow } from "@useflow/react";

export function WelcomeStep() {
  const { next } = useFlow();

  return (
    <div className="container">
      <h1>Welcome to a useFlow demo!</h1>
      <p>Let's get you started with a quick onboarding process.</p>
      <p>
        We'll help you set up your profile and preferences in just a few steps.
      </p>
      <button
        onClick={() =>
          // Demonstrate updater function - add timestamp when starting
          next((ctx) => ({ ...ctx, startedAt: Date.now() }))
        }
      >
        Get Started
      </button>
    </div>
  );
}

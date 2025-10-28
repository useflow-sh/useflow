import { FlowStep, useFlow } from "@useflow/react";

export function AnimatedFlowStep() {
  const { stepId } = useFlow();

  return (
    <div
      key={stepId}
      className="w-full max-w-3xl mx-auto px-16 py-8 animate-[fadeIn_0.7s_ease-in-out_both]"
    >
      <FlowStep />
    </div>
  );
}

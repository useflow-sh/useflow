import { useFlowState } from "@useflow/react";
import type { ReactElement } from "react";

/**
 * AnimateFlowStep - A wrapper component that adds fade-in animations when steps change
 *
 * This component uses the useFlowState hook to automatically get stepId and trigger animations
 * when transitioning between steps.
 *
 * @example
 * ```tsx
 * <Flow flow={myFlow} >
 *   {({ renderStep }) => (
 *     <AnimateFlowStep>
 *       {renderStep({
 *         welcome: <WelcomeStep />,
 *         profile: <ProfileStep />,
 *       })}
 *     </AnimateFlowStep>
 *   )}
 * </Flow>
 * ```
 */
export function AnimateFlowStep({ children }: { children: ReactElement }) {
  const { stepId } = useFlowState();

  return (
    <div
      key={stepId}
      className="animate-[fadeIn_0.7s_ease-in-out_both]"
      style={{ scrollMarginTop: "2rem" }}
    >
      {children}
    </div>
  );
}

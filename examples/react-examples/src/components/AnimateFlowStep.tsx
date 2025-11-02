import { useFlow } from "@useflow/react";
import type { ReactElement } from "react";

/**
 * AnimateFlowStep - A wrapper component that adds fade-in animations when steps change
 *
 * This component uses the useFlow hook to automatically get stepId and trigger animations
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
  const { stepId } = useFlow();

  return (
    <div
      key={stepId}
      className="w-full max-w-3xl mx-auto px-16 py-8 animate-[fadeIn_0.7s_ease-in-out_both]"
    >
      {children}
    </div>
  );
}

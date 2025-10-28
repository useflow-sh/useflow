import { useFlow } from "@useflow/react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import "./AnimatedFlowStep.css";

export type Direction = "forward" | "backward" | "initial";

type AnimatedFlowStepProps = {
  direction: Direction;
};

export function AnimatedFlowStep({ direction }: AnimatedFlowStepProps) {
  const { stepId, component: CurrentComponent } = useFlow();
  const previousStepRef = useRef<string>(stepId);
  const previousComponentRef = useRef(CurrentComponent);
  const [exitingStep, setExitingStep] = useState<{
    id: string;
    // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
    Component: ComponentType<any>;
  } | null>(null);

  // Initialize with current component on first render
  const [enteringStep, setEnteringStep] = useState<{
    id: string;
    // biome-ignore lint/suspicious/noExplicitAny: Components can accept arbitrary props defined by users
    Component: ComponentType<any>;
  } | null>(
    CurrentComponent ? { id: stepId, Component: CurrentComponent } : null,
  );

  useEffect(() => {
    if (previousStepRef.current !== stepId) {
      // Preserve the previous step's component for exit animation
      if (previousComponentRef.current) {
        setExitingStep({
          id: previousStepRef.current,
          Component: previousComponentRef.current,
        });
      }

      // Set the new component to enter
      if (CurrentComponent) {
        setEnteringStep({
          id: stepId,
          Component: CurrentComponent,
        });
      }

      // Remove exiting step after animation completes
      const timer = setTimeout(() => {
        setExitingStep(null);
      }, 900);

      previousStepRef.current = stepId;
      previousComponentRef.current = CurrentComponent;

      return () => clearTimeout(timer);
    }
  }, [stepId, CurrentComponent]);

  const shouldAnimate = direction !== "initial";

  return (
    <div className="animated-flow-container">
      {/* Exiting component */}
      {exitingStep && shouldAnimate && (
        <div
          key={`exiting-${exitingStep.id}`}
          className={`animated-flow-step animated-flow-step-exit slide-exit-${direction}`}
        >
          <exitingStep.Component />
        </div>
      )}

      {/* Entering component */}
      {enteringStep && (
        <div
          key={`entering-${enteringStep.id}`}
          className={`animated-flow-step ${shouldAnimate ? `slide-${direction}` : ""}`}
        >
          <enteringStep.Component />
        </div>
      )}
    </div>
  );
}

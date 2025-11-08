import { useFlowState } from "@useflow/react";
import type { ReactNode } from "react";
import { FlowInspector } from "@/components/FlowInspector";
import { FlowVisualizer } from "@/components/FlowVisualizer";
import { FlowContainer, PageLayout } from "./FlowContainer";

interface FlowDemoLayoutProps {
  children: ReactNode;
  flowId: string;
  instanceId?: string;
  variantId?: string;
  showVisualizer?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

/**
 * Standard layout wrapper for flow demos
 *
 * Provides consistent structure with:
 * - PageLayout wrapper
 * - FlowContainer with maxWidth
 * - Optional FlowVisualizer (fixed bottom-left)
 * - FlowInspector (fixed bottom-right)
 *
 * Note: Does NOT include AnimateFlowStep - add it in your demo for animations
 */
export function FlowDemoLayout({
  children,
  flowId,
  instanceId,
  variantId,
  showVisualizer = true,
  maxWidth = "2xl",
}: FlowDemoLayoutProps) {
  const { stepId } = useFlowState();

  return (
    <>
      {/* Flow Visualizer - Fixed on bottom left */}
      {showVisualizer && (
        <div className="hidden xl:block fixed left-4 bottom-4 w-80">
          <FlowVisualizer />
        </div>
      )}

      <FlowInspector
        flowId={flowId}
        instanceId={instanceId}
        variantId={variantId}
        position="right"
      />

      {/* Main content - horizontally centered with responsive padding */}
      <PageLayout>
        <FlowContainer key={stepId} maxWidth={maxWidth}>
          {children}
        </FlowContainer>
      </PageLayout>
    </>
  );
}

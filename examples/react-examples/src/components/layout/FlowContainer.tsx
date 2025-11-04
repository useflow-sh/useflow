import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FlowContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

/**
 * Generic container for flow content with consistent spacing and centering
 * Use this for the main flow content area
 */
export function FlowContainer({
  children,
  className,
  maxWidth = "3xl",
}: FlowContainerProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className={cn("w-full mx-auto", maxWidthClass, className)}>
      {children}
    </div>
  );
}

interface CenteredLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Centers content vertically and horizontally in the viewport
 * Use this as the outer wrapper for centered flow experiences
 */
export function CenteredLayout({ children, className }: CenteredLayoutProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen px-4 py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard page layout with consistent padding
 * Use this for flows that don't need to be vertically centered
 * Includes bottom padding to prevent FlowInspector from blocking content
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen p-4 lg:p-8 pb-24", className)}>
      {children}
    </div>
  );
}

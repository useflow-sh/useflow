import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StepCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * StepCard - A consistent wrapper for flow step components
 *
 * Provides a unified styling for all step cards across flows.
 * Can be easily modified to change the appearance of all steps at once.
 */
export function StepCard({
  title,
  description,
  children,
  footer,
}: StepCardProps) {
  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="pb-2 sm:pb-2 space-y-1">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4 pt-4 sm:pt-4">{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

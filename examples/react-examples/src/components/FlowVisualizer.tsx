import { useFlow } from "@useflow/react";
import { Check, Circle } from "lucide-react";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FlowNode = {
  id: string;
  label: string;
  next?: string | readonly string[];
  isActive: boolean;
  isCompleted: boolean;
  isVisited: boolean;
};

/**
 * FlowVisualizer - Visual flow structure diagram
 *
 * Automatically reads flow structure from useFlow().steps metadata
 * No need to manually pass in step configurations!
 */
export function FlowVisualizer() {
  const { stepId, history, status, steps } = useFlow();

  const nodes = useMemo((): FlowNode[] => {
    return Object.entries(steps).map(([id, config]) => ({
      id,
      label: id
        .split(/(?=[A-Z])/) // Split on capital letters (camelCase)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "), // Convert to "Title Case"
      next: config.next,
      isActive: stepId === id,
      isCompleted: status === "complete" && history.includes(id),
      isVisited: history.includes(id),
    }));
  }, [steps, stepId, history, status]);

  return (
    <Card className="w-full bg-background/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Flow Structure</CardTitle>
        <CardDescription className="text-xs">
          Visual map of the flow
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {nodes.map((node, index) => {
            const hasMultipleNext = Array.isArray(node.next);
            const nextNodes = hasMultipleNext
              ? (node.next as string[])
              : node.next
                ? [node.next as string]
                : [];

            return (
              <div key={node.id} className="space-y-1">
                {/* Node */}
                <div
                  className={`flex items-center gap-2 p-2 rounded-md border transition-all ${
                    node.isActive
                      ? "bg-primary/10 border-primary"
                      : node.isVisited
                        ? "bg-muted/50 border-muted"
                        : "bg-background border-border"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      node.isActive
                        ? "bg-primary text-primary-foreground"
                        : node.isVisited
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {node.isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Circle
                        className={`h-2 w-2 ${node.isActive ? "fill-current" : ""}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-xs truncate ${
                        node.isActive ? "text-primary" : ""
                      }`}
                    >
                      {node.label}
                    </p>
                  </div>
                </div>

                {/* Connections */}
                {nextNodes.length > 0 && index < nodes.length - 1 && (
                  <div className="ml-3 space-y-1">
                    {hasMultipleNext ? (
                      <div className="pl-3 border-l-2 border-muted relative">
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-0.5 bg-primary transition-all duration-300 ${
                            nextNodes.some((id) => {
                              const nextNode = nodes.find((n) => n.id === id);
                              return nextNode?.isVisited;
                            })
                              ? "h-full"
                              : "h-0"
                          }`}
                        />
                        <div className="space-y-0.5 text-[0.65rem] py-0.5">
                          <div className="font-semibold text-muted-foreground">
                            Branches to:
                          </div>
                          <div className="text-primary">
                            {nextNodes
                              .map((id) => {
                                const nextNode = nodes.find((n) => n.id === id);
                                return nextNode?.label || id;
                              })
                              .join(", ")}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-3 border-l-2 border-muted relative h-4">
                        <div
                          className={`absolute left-0 top-0 w-0.5 bg-primary transition-all duration-300 ${
                            nextNodes.length > 0 &&
                            nodes.find((n) => n.id === nextNodes[0])?.isVisited
                              ? "h-full"
                              : "h-0"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

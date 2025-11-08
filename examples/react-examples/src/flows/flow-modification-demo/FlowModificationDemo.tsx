import { defineFlow, Flow, useFlowState } from "@useflow/react";
import React, { useMemo, useState } from "react";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Step components that work with any flow
const StepA = () => {
  const { next } = useFlowState();
  return (
    <StepCard title="Step A" description="This is the first step">
      <Button onClick={() => next()} className="w-full">
        Continue to Next Step
      </Button>
    </StepCard>
  );
};

const StepB = () => {
  const { next, back } = useFlowState();
  return (
    <StepCard title="Step B" description="This is step B">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button onClick={() => next()} className="flex-1">
          Continue
        </Button>
      </div>
    </StepCard>
  );
};

const StepC = () => {
  const { next, back } = useFlowState();
  return (
    <StepCard title="Step C" description="This is step C">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button onClick={() => next()} className="flex-1">
          Continue
        </Button>
      </div>
    </StepCard>
  );
};

const StepD = () => {
  const { next, back } = useFlowState();
  return (
    <StepCard title="Step D" description="This is step D">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button onClick={() => next()} className="flex-1">
          Continue
        </Button>
      </div>
    </StepCard>
  );
};

const FinalStep = () => {
  return (
    <StepCard
      title="🎉 Flow Complete!"
      description="You've reached the end of the flow"
    >
      <Button onClick={() => window.location.reload()} className="w-full">
        Restart Demo
      </Button>
    </StepCard>
  );
};

// Flow step names
type DemoStepName = "stepA" | "stepB" | "stepC" | "stepD" | "final";

// Type for dynamically built steps
type DemoFlowSteps = Partial<
  Record<
    DemoStepName,
    {
      next?: DemoStepName | readonly DemoStepName[];
    }
  >
>;

// Demo configuration type
type DemoConfig = {
  includeStepD: boolean;
  swapBC: boolean;
  skipB: boolean;
};

const defaultConfig: DemoConfig = {
  includeStepD: false,
  swapBC: false,
  skipB: false,
};

export function FlowModificationDemo() {
  const [config, setConfig] = useState<DemoConfig>(defaultConfig);
  const [flowKey, setFlowKey] = useState(0);

  // Generate flow definition based on config - this is the key magic!
  const demoFlow = useMemo(() => {
    const steps: DemoFlowSteps = {};

    // Step A always starts the flow
    steps.stepA = {
      next: (() => {
        if (config.skipB) {
          return "stepC"; // Skip B, go straight to C
        }
        return config.swapBC ? "stepC" : "stepB"; // Normal or swapped
      })(),
    };

    // Handle Step B (only if not skipped)
    if (!config.skipB) {
      steps.stepB = {
        next: (() => {
          if (config.swapBC) {
            // B comes after C, so B goes to D or final
            return config.includeStepD ? "stepD" : "final";
          } else {
            // Normal order: B always goes to C
            return "stepC";
          }
        })(),
      };
    }

    // Handle Step C
    steps.stepC = {
      next: (() => {
        if (config.swapBC && !config.skipB) {
          // C comes before B when swapped (and B exists), so C goes to B
          return "stepB";
        } else {
          // Normal order OR B is skipped: C goes to D or final
          return config.includeStepD ? "stepD" : "final";
        }
      })(),
    };

    // Handle Step D (optional)
    if (config.includeStepD) {
      steps.stepD = {
        next: "final",
      };
    }

    // Final step
    steps.final = {};

    return defineFlow({
      id: `demo-flow-${flowKey}`,
      start: "stepA",
      steps,
    });
  }, [config, flowKey]);

  const updateConfig = (updates: Partial<DemoConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setFlowKey((prev) => prev + 1); // Force flow restart to see changes
  };

  // Calculate the current flow path for display
  const currentPath = useMemo(() => {
    const path = ["Step A"];

    if (config.skipB) {
      // Skip B entirely
      path.push("Step C");
    } else if (config.swapBC) {
      path.push("Step C", "Step B");
    } else {
      path.push("Step B", "Step C");
    }

    if (config.includeStepD) {
      path.push("Step D");
    }

    path.push("Final");
    return path;
  }, [config]);

  // Generate code example based on current config
  const codeExample = useMemo(() => {
    const lines: string[] = [
      "export const demoFlow = defineFlow({",
      '  id: "demo-flow",',
      '  start: "stepA",',
      "  steps: {",
    ];

    // Step A logic
    if (config.skipB) {
      lines.push('    stepA: { next: "stepC"  // Skip to C },');
    } else if (config.swapBC) {
      lines.push('    stepA: { next: "stepC"  // C before B },');
    } else {
      lines.push('    stepA: { next: "stepB" },');
    }

    // Step B logic (only if not skipped)
    if (!config.skipB) {
      if (config.swapBC) {
        lines.push(
          `    stepB: { next: ${config.includeStepD ? '"stepD"' : '"final"'} },`,
        );
      } else {
        lines.push('    stepB: { next: "stepC" },');
      }
    }

    // Step C logic
    if (config.swapBC && !config.skipB) {
      lines.push('    stepC: { next: "stepB" },');
    } else {
      lines.push(
        `    stepC: { next: ${config.includeStepD ? '"stepD"' : '"final"'} },`,
      );
    }

    // Step D logic (only if included)
    if (config.includeStepD) {
      lines.push('    stepD: { next: "final" },');
    }

    lines.push("    final: {}");
    lines.push("  }");
    lines.push("});");

    return lines.join("\n");
  }, [config]);

  const scenarios = [
    {
      name: "Add Step D",
      description: "Insert a new step",
      active: config.includeStepD,
      action: () => updateConfig({ includeStepD: !config.includeStepD }),
    },
    {
      name: "Swap B & C",
      description: "Change the order of existing steps",
      active: config.swapBC,
      action: () => updateConfig({ swapBC: !config.swapBC }),
    },
    {
      name: "Skip Step B",
      description: "Skip Step B and go straight to C",
      active: config.skipB,
      action: () => updateConfig({ skipB: !config.skipB }),
    },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 max-w-6xl mx-auto">
      <div className="mb-4 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1 lg:mb-2">
          Flow Modification Demo
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Toggle options to add, remove, or reorder steps dynamically.
        </p>
      </div>

      <div className="space-y-4 lg:space-y-6">
        {/* Controls and Current Path Combined */}
        <Card className="border-border/40">
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="text-base lg:text-lg">
              Configure Flow
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">
              Toggle options to modify the flow in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.name}
                className="flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <Label
                    htmlFor={scenario.name}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {scenario.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {scenario.description}
                  </p>
                </div>
                <Switch
                  id={scenario.name}
                  checked={scenario.active}
                  onCheckedChange={scenario.action}
                />
              </div>
            ))}

            {/* Current Path inline on mobile, more compact */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium mb-2 text-muted-foreground">
                Current Path
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {currentPath.map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                      {step}
                    </div>
                    {index < currentPath.length - 1 && (
                      <span className="text-muted-foreground text-xs">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Flow and Code side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Live Flow */}
          <Card className="border-border/40">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="text-base lg:text-lg">Live Flow</CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Experience the flow with the current configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Flow key={flowKey} flow={demoFlow}>
                {({ renderStep }) =>
                  renderStep({
                    stepA: <StepA />,
                    stepB: <StepB />,
                    stepC: <StepC />,
                    stepD: <StepD />,
                    final: <FinalStep />,
                  })
                }
              </Flow>
            </CardContent>
          </Card>

          {/* Code */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base lg:text-lg">
                Generated Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-[0.65rem] bg-muted p-3 rounded-lg overflow-x-auto">
                {codeExample}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

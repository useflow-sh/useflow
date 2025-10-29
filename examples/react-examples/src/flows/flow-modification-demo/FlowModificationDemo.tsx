import { defineFlow, Flow, useFlow } from "@useflow/react";
import React, { useMemo, useState } from "react";
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
  const { next } = useFlow();
  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle>Step A</CardTitle>
        <CardDescription>This is the first step</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => next()} className="w-full">
          Continue to Next Step
        </Button>
      </CardContent>
    </Card>
  );
};

const StepB = () => {
  const { next, back } = useFlow();
  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle>Step B</CardTitle>
        <CardDescription>This is step B</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const StepC = () => {
  const { next, back } = useFlow();
  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle>Step C</CardTitle>
        <CardDescription>This is step C</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const StepD = () => {
  const { next, back } = useFlow();
  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle>Step D</CardTitle>
        <CardDescription>This is step D</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => back()} className="flex-1">
            Back
          </Button>
          <Button onClick={() => next()} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FinalStep = () => {
  return (
    <Card className="w-full max-w-md border-0">
      <CardHeader>
        <CardTitle>🎉 Flow Complete!</CardTitle>
        <CardDescription>You've reached the end of the flow</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => window.location.reload()} className="w-full">
          Restart Demo
        </Button>
      </CardContent>
    </Card>
  );
};

// Configuration type
type FlowConfig = {
  includeStepD: boolean;
  swapBC: boolean;
  skipB: boolean;
};

const defaultConfig: FlowConfig = {
  includeStepD: false,
  swapBC: false,
  skipB: false,
};

export function FlowModificationDemo() {
  const [config, setConfig] = useState<FlowConfig>(defaultConfig);
  const [flowKey, setFlowKey] = useState(0);

  // Generate flow definition based on config - this is the key magic!
  const demoFlow = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic flow definition
    const steps: any = {};

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
    } as const);
  }, [config, flowKey]);

  const updateConfig = (updates: Partial<FlowConfig>) => {
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
      lines.push("    stepA: {");
      lines.push('      next: "stepC"  // Skip to C');
      lines.push("    },");
    } else if (config.swapBC) {
      lines.push("    stepA: {");
      lines.push('      next: "stepC"  // C before B');
      lines.push("    },");
    } else {
      lines.push("    stepA: {");
      lines.push('      next: "stepB"');
      lines.push("    },");
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
    lines.push("} as const);");

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flow Modification Demo</h1>
        <p className="text-lg text-muted-foreground mb-4">
          See how easy it is to modify flows with useFlow. Toggle options below
          to see different flow configurations.
        </p>
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Try This:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Toggle "Add Step D" - see how easy it is to add a new step</li>
            <li>
              Toggle "Swap B & C" - notice how simple it is to change the order
            </li>
            <li>Enable "Skip Step B" - removing steps is just as easy</li>
            <li>Watch the code block update to show the new flow definition</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-3">
            With vanilla React, each of these changes would require updating
            multiple functions and careful testing of edge cases. With useFlow,
            you just modify your flow definition.
          </p>
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Runtime Configuration:</strong> This demo also shows
            flows can be configured dynamically at runtime (e.g.based on feature
            flags, API responses, or user permissions).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modification Controls</CardTitle>
              <CardDescription>
                Modify the flow structure. This demonstrates how you can modify
                flows as your requirements change. This also demonstrates how
                flows can be configured remotely based on feature flags, API
                responses, or user permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scenarios.map((scenario) => (
                <div key={scenario.name}>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={scenario.name}
                      className="text-base font-medium"
                    >
                      {scenario.name}
                    </Label>
                    <Switch
                      id={scenario.name}
                      checked={scenario.active}
                      onCheckedChange={scenario.action}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {scenario.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Static Flow Definition</CardTitle>
              <CardDescription>
                See how easy it is to understand and modify your flow structure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                {codeExample}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Live Flow Demo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Flow Path</CardTitle>
              <CardDescription>
                This path updates automatically as you modify the flow
                structure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {currentPath.map((step, index) => (
                  <React.Fragment key={step}>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {step}
                    </div>
                    {index < currentPath.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Flow</CardTitle>
              <CardDescription>
                The actual flow running with the current configuration. Toggle
                options above to see different flow structures in action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Flow
                key={flowKey}
                flow={demoFlow}
                components={{
                  stepA: StepA,
                  stepB: StepB,
                  stepC: StepC,
                  stepD: StepD,
                  final: FinalStep,
                }}
                initialContext={{}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

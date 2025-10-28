import { OptionSelector } from "@/components/OptionSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { branchingFlow } from "../flow";

const setupOptions = [
  {
    value: "advanced" as const,
    title: "Advanced Setup",
    description: "Customize all preferences in detail",
  },
  {
    value: "quick" as const,
    title: "Quick Setup",
    description: "Use recommended defaults",
  },
] as const;

export function SetupPreferenceStep() {
  const { context, next, back, setContext } = branchingFlow.useFlow({
    step: "setupPreference",
  });

  const handleContinue = () => {
    // Component-driven branching: component explicitly chooses destination
    // next() is now typed as: (target: "preferences" | "complete") => void
    const target =
      context.setupPreference === "advanced" ? "preferences" : "complete";

    next(target); // ✅ Type-safe! Only "preferences" | "complete" allowed
  };

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>How would you like to proceed?</CardTitle>
        <CardDescription>Choose your setup path.</CardDescription>
      </CardHeader>
      <CardContent>
        <OptionSelector
          options={setupOptions}
          selectedValue={context.setupPreference}
          onSelect={(value) => setContext({ setupPreference: value })}
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!context.setupPreference}
          className="flex-1"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

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
import { advancedFlow } from "../flow";

const userTypeOptions = [
  {
    value: "business",
    title: "Business",
    description: "Business account with advanced features",
  },
  {
    value: "personal",
    title: "Personal",
    description: "Personal account for individual use",
  },
] as const;

export function UserTypeStep() {
  const { context, next, back, setContext } = advancedFlow.useFlow({
    step: "userType",
  });

  return (
    <Card className="w-full max-w-2xl border-0">
      <CardHeader>
        <CardTitle>How will you use this app?</CardTitle>
        <CardDescription>
          Choose your account type to customize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OptionSelector
          options={userTypeOptions}
          selectedValue={context.userType}
          onSelect={(value) => setContext({ userType: value })}
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={() => back()} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => next()}
          disabled={!context.userType}
          className="flex-1"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

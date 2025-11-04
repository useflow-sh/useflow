import { Flow } from "@useflow/react";
import { Clock, Zap } from "lucide-react";
import { useState } from "react";
import { AnimateFlowStep } from "@/components/AnimateFlowStep";
import { FlowInspector } from "@/components/FlowInspector";
import { FlowVisualizer } from "@/components/FlowVisualizer";
import { LoadingView } from "@/components/LoadingView";
import { FlowContainer, PageLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AccountStep } from "./components/AccountStep";
import { CompleteStep } from "./components/CompleteStep";
import { PreferencesStep } from "./components/PreferencesStep";
import { ProfileStep } from "./components/ProfileStep";
import { VerificationStep } from "./components/VerificationStep";
import { WelcomeStep } from "./components/WelcomeStep";
import { expressFlow, standardFlow } from "./flow";

export function FlowVariantsDemo() {
  const [isStarted, setIsStarted] = useState(false);
  const [useExpressFlow, setUseExpressFlow] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
  };

  if (!isStarted) {
    return (
      <PageLayout>
        <FlowContainer maxWidth="2xl">
          <Card className="w-full border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Flow Variants Demo</CardTitle>
              <CardDescription className="text-base">
                Switch between flow definitions using the same components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Flow Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setUseExpressFlow(false)}
                  className={`p-4 rounded-lg border-2 transition-all text-left flex flex-col items-start ${
                    !useExpressFlow
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Standard Flow</h3>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground flex-1">
                    <li>→ Welcome</li>
                    <li>→ Account</li>
                    <li>→ Verification</li>
                    <li>→ Profile</li>
                    <li>→ Preferences</li>
                    <li>→ Complete</li>
                  </ul>
                  <p className="text-xs font-medium mt-2">6 steps total</p>
                </button>

                <button
                  onClick={() => setUseExpressFlow(true)}
                  className={`p-4 rounded-lg border-2 transition-all text-left flex flex-col items-start ${
                    useExpressFlow
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Express Flow</h3>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground flex-1">
                    <li>→ Welcome</li>
                    <li>→ Account</li>
                    <li>→ Profile</li>
                    <li>→ Complete</li>
                  </ul>
                  <p className="text-xs font-medium mt-2">4 steps total</p>
                </button>
              </div>

              <Button onClick={handleStart} className="w-full" size="lg">
                Start {useExpressFlow ? "Express" : "Standard"} Flow
              </Button>
            </CardContent>
          </Card>
        </FlowContainer>
      </PageLayout>
    );
  }

  // Select flow based on user choice
  const selectedFlow = useExpressFlow ? expressFlow : standardFlow;

  return (
    <Flow
      key={selectedFlow.id}
      flow={selectedFlow}
      initialContext={{
        email: "",
        username: "",
        name: "",
        notifications: true,
      }}
      loadingComponent={<LoadingView />}
    >
      {({ renderStep }) => (
        <>
          {/* Flow Visualizer - Fixed on bottom left */}
          <div className="hidden xl:block fixed left-4 bottom-4 w-80">
            <FlowVisualizer />
          </div>

          <FlowInspector flowId={selectedFlow.id} position="right" />

          {/* Main content - horizontally centered with responsive padding */}
          <PageLayout>
            <FlowContainer maxWidth="2xl">
              {/* Flow Type Indicator - Static at top of content */}
              <div className="mb-4 flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50">
                  {useExpressFlow ? (
                    <>
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Express Flow</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Standard Flow</span>
                    </>
                  )}
                </div>
              </div>

              <AnimateFlowStep>
                {renderStep({
                  welcome: <WelcomeStep />,
                  account: <AccountStep />,
                  verification: <VerificationStep />,
                  profile: <ProfileStep />,
                  preferences: <PreferencesStep />,
                  complete: <CompleteStep />,
                })}
              </AnimateFlowStep>
            </FlowContainer>
          </PageLayout>
        </>
      )}
    </Flow>
  );
}

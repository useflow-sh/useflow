import { useQuery } from "@tanstack/react-query";
import { defineFlow, Flow, type FlowDefinition } from "@useflow/react";
import { useMemo, useState } from "react";
import { FlowInspector } from "@/components/FlowInspector";
import { FlowVisualizer } from "@/components/FlowVisualizer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchFlowConfig } from "./api";
import {
  AccountStep,
  CompleteStep,
  NewsletterStep,
  PreferencesStep,
  ProfileStep,
  SurveyStep,
  VerificationStep,
  WelcomeStep,
} from "./components";

/**
 * Demo component showing remote flow configuration and variants
 *
 * This demonstrates:
 * 1. Loading flow configurations from external sources (database/API)
 * 2. Flow variants for A/B testing (standard, express, extended)
 * 3. Dynamic flow switching without code deployment
 * 4. Same component set working with different flow structures
 * 5. Integration with TanStack Query for data fetching
 */
export function RemoteFlowDemo() {
  const [selectedConfig, setSelectedConfig] = useState<string>("standard");

  // Fetch remote flow config using TanStack Query
  const { data: flowConfig, isLoading: loading } = useQuery({
    queryKey: ["flowConfig", "onboarding-flow", selectedConfig],
    queryFn: () => fetchFlowConfig("onboarding-flow", selectedConfig),
    staleTime: 1000 * 60,
  });

  // Convert remote config to RuntimeFlowDefinition
  // In production, validate flowConfig schema before casting
  const flowDefinition = useMemo(() => {
    if (!flowConfig) return null;
    return defineFlow(flowConfig as FlowDefinition);
  }, [flowConfig]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Remote Configuration Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Demonstrates loading flow configurations from external sources and
          using variants for A/B testing. Change onboarding flows without code
          deployment to optimize conversion rates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Flow Variant</CardTitle>
          <CardDescription>
            Choose a flow variant to test different onboarding experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedConfig} onValueChange={setSelectedConfig}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="express">Express</TabsTrigger>
              <TabsTrigger value="extended">Extended</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Standard Variant</h3>
                <p className="text-sm text-muted-foreground">
                  Balanced onboarding with verification and preferences. Good
                  baseline for A/B testing.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="express" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Express Variant</h3>
                <p className="text-sm text-muted-foreground">
                  Minimal friction flow optimized for conversion. Skips
                  verification and preferences.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="extended" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Extended Variant</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive onboarding for higher engagement. Includes
                  survey and newsletter signup.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">
              Loading flow configuration from remote source...
            </p>
          </div>
        </div>
      )}

      {!loading && flowDefinition && (
        <Flow
          flow={flowDefinition}
          initialContext={{
            email: "",
            userType: "business",
          }}
        >
          {({ renderStep }) => (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Flow Visualizer */}
              <div className="lg:col-span-1">
                <FlowVisualizer />
              </div>

              {/* Flow Execution */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Flow Execution</CardTitle>
                    <CardDescription>
                      Flow variant loaded from remote source. Same components,
                      different structure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderStep({
                      welcome: <WelcomeStep />,
                      account: <AccountStep />,
                      verification: <VerificationStep />,
                      profile: <ProfileStep />,
                      survey: <SurveyStep />,
                      newsletter: <NewsletterStep />,
                      preferences: <PreferencesStep />,
                      complete: <CompleteStep />,
                    })}
                    <FlowInspector
                      flowId={flowDefinition.id}
                      variantId={selectedConfig}
                      position="right"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </Flow>
      )}
    </div>
  );
}

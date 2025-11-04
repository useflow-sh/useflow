import { useQuery } from "@tanstack/react-query";
import { defineFlow, Flow, type FlowDefinition } from "@useflow/react";
import { useMemo, useState } from "react";
import { AnimateFlowStep } from "@/components/AnimateFlowStep";
import { FlowInspector } from "@/components/FlowInspector";
import { FlowVisualizer } from "@/components/FlowVisualizer";
import { FlowContainer, PageLayout } from "@/components/layout";
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
    <PageLayout>
      <div className="space-y-4 lg:space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-2 lg:space-y-4">
          <h1 className="text-2xl lg:text-3xl font-bold">Remote Config Demo</h1>
          <p className="text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto">
            Load flow configs from external sources and use variants for A/B
            testing.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3 lg:pb-6">
            <CardTitle className="text-base lg:text-lg">
              Select Flow Variant
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">
              Choose a variant to test different onboarding experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedConfig} onValueChange={setSelectedConfig}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="standard" className="text-xs lg:text-sm">
                  Standard
                </TabsTrigger>
                <TabsTrigger value="express" className="text-xs lg:text-sm">
                  Express
                </TabsTrigger>
                <TabsTrigger value="extended" className="text-xs lg:text-sm">
                  Extended
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="space-y-2 lg:space-y-4">
                <div className="p-3 lg:p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-sm lg:text-base">
                    Standard Variant
                  </h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Balanced onboarding with verification and preferences.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="express" className="space-y-2 lg:space-y-4">
                <div className="p-3 lg:p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-sm lg:text-base">
                    Express Variant
                  </h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Minimal friction flow. Skips verification and preferences.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="extended" className="space-y-2 lg:space-y-4">
                <div className="p-3 lg:p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-sm lg:text-base">
                    Extended Variant
                  </h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Comprehensive onboarding. Includes survey and newsletter.
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
            {({ renderStep, stepId }) => (
              <>
                {/* Flow Visualizer - Fixed on bottom left */}
                <div className="hidden xl:block fixed left-4 bottom-4 w-80">
                  <FlowVisualizer />
                </div>

                <FlowInspector
                  flowId={flowDefinition.id}
                  variantId={selectedConfig}
                  position="right"
                />

                <FlowContainer key={stepId} maxWidth="2xl">
                  <AnimateFlowStep>
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
                  </AnimateFlowStep>
                </FlowContainer>
              </>
            )}
          </Flow>
        )}
      </div>
    </PageLayout>
  );
}

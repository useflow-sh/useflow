import { useQuery } from "@tanstack/react-query";
import { defineFlow, Flow, type FlowConfig, FlowStep } from "@useflow/react";
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
import { persister, store } from "@/lib/storage";
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
 * Demo component showing remote flow configuration
 *
 * This demonstrates:
 * 1. Loading remote configurations from external source (database/API)
 * 2. Schema validation of remote configs
 * 3. Graceful fallback to default configuration
 * 4. Components working with any valid configuration
 * 5. Dynamic flow switching without code changes
 */
export function RemoteFlowDemo() {
  const [selectedConfig, setSelectedConfig] = useState<string>("standard");

  // Fetch remote flow config using TanStack Query
  const { data: flowConfig, isLoading: loading } = useQuery({
    queryKey: ["flowConfig", "onboarding-flow", selectedConfig],
    queryFn: () => fetchFlowConfig("onboarding-flow", selectedConfig),
    staleTime: 1000 * 60, // 1 minute
  });

  // Convert remote config to FlowDefinition using defineFlow
  // flowConfig comes from API as 'unknown', so we cast it to FlowConfig for type safety
  const flowDefinition = useMemo(() => {
    if (!flowConfig) return null;
    return defineFlow(flowConfig as FlowConfig);
  }, [flowConfig]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Remote Flow Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Flows loaded from external sources (database/API). Switch between
          different flow variations to see how they can be changed without code
          deployment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Configuration</CardTitle>
          <CardDescription>
            Choose which flow configuration to load from the database
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
                <h3 className="font-medium">Standard Onboarding</h3>
                <p className="text-sm text-muted-foreground">
                  Complete flow with email verification and preferences setup.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="express" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Express Onboarding</h3>
                <p className="text-sm text-muted-foreground">
                  Quick flow skipping verification and preferences for better
                  conversion.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="extended" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Extended Flow</h3>
                <p className="text-sm text-muted-foreground">
                  Extended onboarding with survey and newsletter signup.
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
          components={{
            welcome: WelcomeStep,
            account: AccountStep,
            verification: VerificationStep,
            profile: ProfileStep,
            survey: SurveyStep,
            newsletter: NewsletterStep,
            preferences: PreferencesStep,
            complete: CompleteStep,
          }}
          initialContext={{
            email: "",
            userType: "business",
          }}
          persister={persister}
          saveMode="always"
        >
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
                    The flow below is loaded from a remote source based on your
                    selection above
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FlowStep />
                  <FlowInspector
                    flowId={flowDefinition.id}
                    variantId={selectedConfig}
                    store={store}
                    position="right"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </Flow>
      )}
    </div>
  );
}

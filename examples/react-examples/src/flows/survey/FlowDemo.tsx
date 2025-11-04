import { Flow } from "@useflow/react";
import { BarChart3 } from "lucide-react";
import React, { useState } from "react";
import { AnimateFlowStep } from "@/components/AnimateFlowStep";
import { FlowInspector } from "@/components/FlowInspector";
import { LoadingView } from "@/components/LoadingView";
import { FlowContainer, PageLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { IntroStep } from "./components/IntroStep";
import { QuestionStep } from "./components/QuestionStep";
import { ResultsStep } from "./components/ResultsStep";
import { type SurveyFlowContext, surveyFlow } from "./flow";

/**
 * Event log entry for tracking flow events
 */
type EventLog = {
  id: string;
  timestamp: number;
  type: "next" | "back" | "transition" | "complete";
  from?: string;
  to?: string;
  message: string;
};

// Define the steps for progress tracking (outside component for stability)
const steps = [
  { id: "intro", label: "Introduction" },
  { id: "question1", label: "Question 1" },
  { id: "question2", label: "Question 2" },
  { id: "question3", label: "Question 3" },
  { id: "question4", label: "Question 4" },
  { id: "results", label: "Results" },
];

export function SurveyFlowDemo() {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

  /**
   * Log an event with timestamp and details
   */
  const logEvent = (
    type: EventLog["type"],
    message: string,
    from?: string,
    to?: string,
  ) => {
    const event: EventLog = {
      id: `event-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      from,
      to,
      message,
    };
    setEventLogs((prev) => [...prev, event]);
    console.log(`[Survey Event] ${message}`, { from, to });
  };

  /**
   * onNext: Triggered when moving forward
   * Use case: Analytics, validation, progress tracking
   */
  const handleNext = ({
    from,
    to,
    newContext,
  }: {
    from: string;
    to: string;
    oldContext: SurveyFlowContext;
    newContext: SurveyFlowContext;
  }) => {
    // Example: Track which questions have been answered
    if (from.startsWith("question")) {
      const questionNum = from.replace("question", "");
      const rating =
        newContext[`q${questionNum}_satisfaction` as keyof SurveyFlowContext] ||
        newContext[`q${questionNum}_recommend` as keyof SurveyFlowContext] ||
        newContext[`q${questionNum}_features` as keyof SurveyFlowContext] ||
        newContext[`q${questionNum}_support` as keyof SurveyFlowContext];
      logEvent(
        "next",
        `Question ${questionNum} answered with rating: ${rating}/5`,
      );
    } else {
      logEvent("next", `Moving forward from ${from} to ${to}`, from, to);
    }
  };

  /**
   * onBack: Triggered when moving backward
   * Use case: Track user hesitation, identify confusing steps
   */
  const handleBack = ({
    from,
    to,
  }: {
    from: string;
    to: string;
    oldContext: SurveyFlowContext;
    newContext: SurveyFlowContext;
  }) => {
    // Example: Track if users frequently go back to revise answers
    if (from.startsWith("question")) {
      const questionNum = from.replace("question", "");
      logEvent("back", `User revisiting question ${questionNum}`);
    } else {
      logEvent("back", `Moving backward from ${from} to ${to}`, from, to);
    }
  };

  /**
   * onTransition: Triggered on ANY navigation
   * Use case: Universal tracking, analytics, route changes
   */
  const handleTransition = ({
    from,
    to,
    direction,
  }: {
    from: string;
    to: string;
    direction: "forward" | "backward";
    oldContext: SurveyFlowContext;
    newContext: SurveyFlowContext;
  }) => {
    logEvent(
      "transition",
      `Transition: ${from} → ${to} (${direction})`,
      from,
      to,
    );
  };

  /**
   * onComplete: Triggered when flow finishes
   * Use case: Save data, show confirmation, redirect, analytics
   */
  const handleComplete = ({ context }: { context: SurveyFlowContext }) => {
    // Calculate final survey score
    const totalScore =
      (context.q1_satisfaction || 0) +
      (context.q2_recommend || 0) +
      (context.q3_features || 0) +
      (context.q4_support || 0);
    const averageScore = (totalScore / 4).toFixed(1);

    logEvent("complete", `Survey completed! Score: ${averageScore}/5.0`);

    // Example: Send analytics event to external service
    console.log("Survey completion:", {
      averageScore,
      responses: {
        satisfaction: context.q1_satisfaction,
        recommend: context.q2_recommend,
        features: context.q3_features,
        support: context.q4_support,
      },
    });
  };

  return (
    <Flow
      flow={surveyFlow}
      instanceId="survey-instance"
      onNext={handleNext}
      onBack={handleBack}
      onTransition={handleTransition}
      onComplete={handleComplete}
      loadingComponent={<LoadingView />}
    >
      {({ renderStep, context, reset, startedAt, completedAt, stepId }) => {
        // Calculate current step index from stepId
        const currentStepIndex = steps.findIndex((step) => step.id === stepId);

        /**
         * Restart the survey by resetting the flow state
         */
        const handleRestart = () => {
          reset();
          setEventLogs([]);
          logEvent("transition", "Survey restarted");
        };

        return (
          <>
            <FlowInspector
              flowId={surveyFlow.id}
              instanceId="survey-instance"
              position="right"
            />

            <PageLayout>
              {/* Progress Tracker - Fixed below header */}
              <div className="fixed top-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border/40 z-30">
                <div className="max-w-2xl mx-auto px-4 sm:px-8 py-3 sm:py-4">
                  <div className="flex items-start justify-between mb-2">
                    {steps.map((step, index) => (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-colors ${
                              index < currentStepIndex
                                ? "bg-primary text-primary-foreground"
                                : index === currentStepIndex
                                  ? "bg-primary text-primary-foreground ring-2 sm:ring-4 ring-primary/20"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="text-[10px] sm:text-xs mt-1 text-muted-foreground hidden md:block">
                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className="flex-1 h-0.5 mx-2 bg-muted relative self-start"
                            style={{ marginTop: "14px" }}
                          >
                            <div
                              className={`absolute inset-0 bg-primary transition-all duration-300 ${
                                index < currentStepIndex ? "w-full" : "w-0"
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event Log - Fixed to the bottom-left corner */}
              <div className="hidden lg:block fixed left-4 bottom-4 w-80 z-50">
                <Card className="bg-background/80 backdrop-blur-sm border-border/40">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Event Hooks Demo
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Tracking flow events in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {eventLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No events yet. Start the survey to see event tracking
                          in action!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {eventLogs
                            .slice(-10)
                            .reverse()
                            .map((log) => (
                              <div
                                key={log.id}
                                className="text-xs p-2 rounded-lg bg-muted/50 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`font-mono font-semibold ${
                                      log.type === "complete"
                                        ? "text-green-600 dark:text-green-400"
                                        : log.type === "next"
                                          ? "text-blue-600 dark:text-blue-400"
                                          : log.type === "back"
                                            ? "text-orange-600 dark:text-orange-400"
                                            : "text-purple-600 dark:text-purple-400"
                                    }`}
                                  >
                                    {log.type.toUpperCase()}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {new Date(
                                      log.timestamp,
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-muted-foreground">
                                  {log.message}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                      {eventLogs.length > 10 && (
                        <p className="text-xs text-center text-muted-foreground pt-2">
                          Showing last 10 events ({eventLogs.length} total)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Survey - with top padding for header + progress */}
              <div className="pt-24 sm:pt-28">
                <FlowContainer maxWidth="2xl">
                  <AnimateFlowStep>
                    {renderStep({
                      intro: <IntroStep />,
                      question1: (
                        <QuestionStep
                          stepId="question1"
                          questionNumber={1}
                          title="How satisfied are you with our product overall?"
                          description="Rate your overall experience from 1 (not satisfied) to 5 (very satisfied)"
                          contextKey="q1_satisfaction"
                        />
                      ),
                      question2: (
                        <QuestionStep
                          stepId="question2"
                          questionNumber={2}
                          title="How likely are you to recommend us to others?"
                          description="Rate from 1 (not likely) to 5 (very likely)"
                          contextKey="q2_recommend"
                        />
                      ),
                      question3: (
                        <QuestionStep
                          stepId="question3"
                          questionNumber={3}
                          title="How would you rate our features and functionality?"
                          description="Rate from 1 (poor) to 5 (excellent)"
                          contextKey="q3_features"
                        />
                      ),
                      question4: (
                        <QuestionStep
                          stepId="question4"
                          questionNumber={4}
                          title="How would you rate our customer support?"
                          description="Rate from 1 (poor) to 5 (excellent)"
                          contextKey="q4_support"
                        />
                      ),
                      results: (
                        <ResultsStep
                          satisfaction={context.q1_satisfaction}
                          recommend={context.q2_recommend}
                          features={context.q3_features}
                          support={context.q4_support}
                          startedAt={startedAt}
                          completedAt={completedAt}
                          onRestart={handleRestart}
                        />
                      ),
                    })}
                  </AnimateFlowStep>
                </FlowContainer>
              </div>
            </PageLayout>
          </>
        );
      }}
    </Flow>
  );
}

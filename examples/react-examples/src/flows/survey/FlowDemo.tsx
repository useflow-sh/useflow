import { Flow, useFlow } from "@useflow/react";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedFlowStep } from "../../components/AnimatedFlowStep";
import { FlowInspector } from "../../components/FlowInspector";
import { LoadingView } from "../../components/LoadingView";
import { persister, store } from "../../lib/storage";
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

export function SurveyFlowDemo() {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [surveyKey, setSurveyKey] = useState(0);
  const [lastContext, setLastContext] = useState<SurveyFlowContext | null>(
    null,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Define the steps for progress tracking
  const steps = [
    { id: "intro", label: "Introduction" },
    { id: "question1", label: "Question 1" },
    { id: "question2", label: "Question 2" },
    { id: "question3", label: "Question 3" },
    { id: "question4", label: "Question 4" },
    { id: "results", label: "Results" },
  ];

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
    newContext,
  }: {
    from: string;
    to: string;
    direction: "forward" | "backward";
    oldContext: SurveyFlowContext;
    newContext: SurveyFlowContext;
  }) => {
    // Update progress tracker
    const stepIndex = steps.findIndex((step) => step.id === to);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }

    logEvent(
      "transition",
      `Transition: ${from} → ${to} (${direction})`,
      from,
      to,
    );

    // Save context when reaching results
    if (to === "results") {
      const completedAt = Date.now();
      const totalScore =
        (newContext.q1_satisfaction || 0) +
        (newContext.q2_recommend || 0) +
        (newContext.q3_features || 0) +
        (newContext.q4_support || 0);
      const averageScore = (totalScore / 4).toFixed(1);
      const timeSpent = newContext.startedAt
        ? Math.round((completedAt - newContext.startedAt) / 1000)
        : 0;

      logEvent(
        "transition",
        `Survey score: ${averageScore}/5.0 completed in ${timeSpent}s`,
      );

      // Set immediately to avoid flash
      setLastContext({ ...newContext, completedAt });

      // Example: Send analytics event to external service
      console.log("Survey completion:", {
        averageScore,
        timeSpent,
        completedAt,
        responses: {
          satisfaction: newContext.q1_satisfaction,
          recommend: newContext.q2_recommend,
          features: newContext.q3_features,
          support: newContext.q4_support,
        },
      });
    }
  };

  /**
   * onComplete: Triggered when flow finishes
   * Use case: Save data, show confirmation, redirect, analytics
   */
  const handleComplete = () => {
    logEvent("complete", "Survey flow completed!");
  };

  /**
   * Restart the survey with a new instance
   */
  const handleRestart = () => {
    persister.remove?.(surveyFlow.id, { instanceId: "survey-instance" });
    setSurveyKey((prev) => prev + 1);
    setLastContext(null);
    setEventLogs([]);
    setCurrentStepIndex(0); // Reset progress tracker
    logEvent("transition", "Survey restarted");
  };

  return (
    <Flow
      key={surveyKey}
      flow={surveyFlow}
      instanceId="survey-instance"
      components={{
        intro: IntroStep,
        question1: () => (
          <QuestionStep
            stepId="question1"
            questionNumber={1}
            title="How satisfied are you with our product overall?"
            description="Rate your overall experience from 1 (not satisfied) to 5 (very satisfied)"
            contextKey="q1_satisfaction"
          />
        ),
        question2: () => (
          <QuestionStep
            stepId="question2"
            questionNumber={2}
            title="How likely are you to recommend us to others?"
            description="Rate from 1 (not likely) to 5 (very likely)"
            contextKey="q2_recommend"
          />
        ),
        question3: () => (
          <QuestionStep
            stepId="question3"
            questionNumber={3}
            title="How would you rate our features and functionality?"
            description="Rate from 1 (poor) to 5 (excellent)"
            contextKey="q3_features"
          />
        ),
        question4: () => (
          <QuestionStep
            stepId="question4"
            questionNumber={4}
            title="How would you rate our customer support?"
            description="Rate from 1 (poor) to 5 (excellent)"
            contextKey="q4_support"
          />
        ),
        results: () => {
          const { context } = useFlow();
          return (
            <ResultsStep
              satisfaction={context.q1_satisfaction}
              recommend={context.q2_recommend}
              features={context.q3_features}
              support={context.q4_support}
              startedAt={context.startedAt}
              completedAt={lastContext?.completedAt}
              onRestart={handleRestart}
            />
          );
        },
      }}
      initialContext={{}}
      onNext={handleNext}
      onBack={handleBack}
      onTransition={handleTransition}
      onComplete={handleComplete}
      persister={persister}
      saveMode="always"
      loadingComponent={<LoadingView />}
    >
      <FlowInspector
        flowId={surveyFlow.id}
        store={store}
        instanceId="survey-instance"
        position="right"
      />

      <div className="min-h-screen p-4 lg:p-8">
        {/* Progress Tracker - Fixed at the top */}
        <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-40 px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        index < currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : index === currentStepIndex
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 bg-muted relative">
                      <div
                        className={`absolute inset-0 bg-primary transition-all duration-300 ${
                          index < currentStepIndex ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Log - Fixed to the bottom-left corner */}
        <div className="hidden lg:block fixed left-4 bottom-4 w-80 z-50">
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Event Hooks Demo</CardTitle>
              </div>
              <CardDescription>
                Tracking flow events in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events yet. Start the survey to see event tracking in
                    action!
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
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{log.message}</p>
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

        {/* Main Survey - centered in viewport */}
        <div className="flex items-center justify-center min-h-screen">
          <AnimatedFlowStep />
        </div>
      </div>
    </Flow>
  );
}

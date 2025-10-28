import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  Layers,
  ListTodo,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { storage } from "@/lib/storage";

interface FlowCard {
  id: string;
  title: string;
  description: string;
  path: string;
  complexity: "Simple" | "Intermediate" | "Advanced";
  features: string[];
  icon: React.ReactNode;
}

const flows: FlowCard[] = [
  {
    id: "simple",
    title: "Simple Flow",
    description: "Basic linear step progression with persistence",
    path: "/simple",
    complexity: "Simple",
    features: [
      "Linear step progression",
      "Context updates (setContext)",
      "Navigation control (next/back)",
      "State persistence (persister)",
    ],
    icon: <Layers className="h-6 w-6" />,
  },
  {
    id: "branching",
    title: "Branching Flow",
    description:
      "Conditional navigation with context and component-driven branching",
    path: "/branching",
    complexity: "Intermediate",
    features: [
      "Context-driven branching",
      "Component-driven navigation",
      "Conditional steps",
      "State persistence (persister)",
    ],
    icon: <GitBranch className="h-6 w-6" />,
  },
  {
    id: "task",
    title: "Task Flow",
    description: "Multiple independent flow instances with separate state",
    path: "/task",
    complexity: "Intermediate",
    features: [
      "Reusable flow instances (instanceId)",
      "Independent state per instance",
      "Resume incomplete flows",
      "Per-instance persistence",
    ],
    icon: <ListTodo className="h-6 w-6" />,
  },
  {
    id: "survey",
    title: "Survey Flow",
    description:
      "Event hooks demonstration with onNext, onBack, onTransition, and onComplete",
    path: "/survey",
    complexity: "Intermediate",
    features: [
      "Event hooks (onNext, onBack, onTransition, onComplete)",
      "Progress tracking with transitions",
      "State persistence (persister)",
      "Event-driven UI updates",
    ],
    icon: <BarChart3 className="h-6 w-6" />,
  },
];

export function FlowGallery() {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetAll = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all flow progress? This will clear all saved data.",
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await storage.removeAll?.();
      // Give visual feedback
      setTimeout(() => {
        setIsResetting(false);
        alert("All flow progress has been reset!");
      }, 300);
    } catch (error) {
      console.error("Failed to reset flows:", error);
      setIsResetting(false);
      alert("Failed to reset flows. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            useFlow Examples
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Explore different flow patterns and implementations
          </p>
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto bg-muted/50 rounded-lg px-4 py-2 inline-block">
              💾 All flows use localStorage persistence — refresh the page to
              see your progress restored
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={isResetting}
              className="gap-2"
            >
              <RotateCcw
                className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`}
              />
              {isResetting ? "Resetting..." : "Reset All Flows"}
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {flows.map((flow) => (
            <Link key={flow.id} to={flow.path} className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {flow.icon}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        flow.complexity === "Simple"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : flow.complexity === "Intermediate"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {flow.complexity}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{flow.title}</CardTitle>
                  <CardDescription className="text-base">
                    {flow.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground/80">
                      Features
                    </h4>
                    <ul className="space-y-2">
                      {flow.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full group-hover:bg-primary/90">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>

        <footer className="text-center text-muted-foreground text-sm">
          <p>
            Built with{" "}
            <a
              href="https://github.com/yourusername/useflow"
              className="underline hover:text-foreground transition-colors"
            >
              @useflow/react
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

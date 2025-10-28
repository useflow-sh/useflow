import { ArrowRight, CheckCircle2, GitBranch, Layers } from "lucide-react";
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

interface FlowCard {
  id: string;
  title: string;
  description: string;
  path: string;
  complexity: "Simple" | "Advanced";
  features: string[];
  icon: React.ReactNode;
}

const flows: FlowCard[] = [
  {
    id: "simple",
    title: "Simple Flow",
    description: "Linear flow: welcome → profile → preferences → complete",
    path: "/simple",
    complexity: "Simple",
    features: [
      "Linear step progression",
      "Basic form handling",
      "State persistence",
      "Smooth animations",
    ],
    icon: <Layers className="h-6 w-6" />,
  },
  {
    id: "advanced",
    title: "Advanced Flow",
    description: "Branching flow with conditional paths based on user choices",
    path: "/advanced",
    complexity: "Advanced",
    features: [
      "Conditional branching",
      "Context-driven navigation",
      "Component-driven navigation",
      "Business vs personal paths",
    ],
    icon: <GitBranch className="h-6 w-6" />,
  },
];

export function FlowGallery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            useFlow Examples
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore different flow patterns and implementations
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {flows.map((flow) => (
            <Link key={flow.id} to={flow.path} className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {flow.icon}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        flow.complexity === "Simple"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
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
                <CardContent>
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

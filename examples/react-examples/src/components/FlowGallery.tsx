import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
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
import { getGalleryItems } from "@/config/pages";
import { EXTERNAL_LINKS } from "@/constants";
import { store } from "@/lib/storage";

const CATEGORY_INFO = {
  examples: {
    title: "Examples",
    description: "Learn the core concepts and patterns of useFlow",
  },
  interactive: {
    title: "Interactive Demos",
    description: "Explore advanced features with hands-on demonstrations",
  },
} as const;

export function FlowGallery() {
  const [isResetting, setIsResetting] = useState(false);
  const galleryItems = getGalleryItems();

  // Group items by category
  const itemsByCategory = galleryItems.reduce(
    (acc, item) => {
      const category = item.category || "examples";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof galleryItems>,
  );

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
      await store.removeAll?.();
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            useFlow Gallery
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Explore different flow patterns and implementations
          </p>
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto bg-muted/50 rounded-lg px-4 py-2 inline-block">
              💡 These are demo flows with no real backend. <br />
              Progress is stored in local storage and persists across page
              refreshes.
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

        <div className="max-w-5xl mx-auto space-y-16 mb-12">
          {(["interactive", "examples"] as const).map((category) => {
            const items = itemsByCategory[category];
            if (!items || items.length === 0) return null;

            const categoryInfo = CATEGORY_INFO[category];

            return (
              <section key={category}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">
                    {categoryInfo.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {categoryInfo.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {items.map((page) => {
                    const IconComponent = page.icon;
                    const features = page.features || [];

                    return (
                      <Link
                        key={page.id}
                        to={page.path}
                        className="block group relative"
                      >
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 bg-[length:200%_100%] rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 group-hover:animate-[gradient_3s_ease-in-out_infinite]" />
                        <Card className="relative h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col border-border/50">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-3">
                              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <IconComponent className="h-6 w-6" />
                              </div>
                              {page.complexityLabel && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    page.complexityLabel === "Simple"
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                      : page.complexityLabel === "Intermediate"
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                  }`}
                                >
                                  {page.complexityLabel}
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-2xl">
                              {page.galleryTitle || page.label}
                            </CardTitle>
                            <CardDescription className="text-base">
                              {page.galleryDescription || page.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-foreground/80">
                                Features
                              </h4>
                              <ul className="space-y-2">
                                {features.map((feature, index) => (
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
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="text-center text-muted-foreground text-sm">
          <p>
            Built with{" "}
            <a
              href={EXTERNAL_LINKS.find((link) => link.label === "GitHub")?.url}
              target="_blank"
              rel="noopener noreferrer"
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

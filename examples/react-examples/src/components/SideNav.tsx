import {
  BarChart3,
  GitBranch,
  Home,
  Layers,
  ListTodo,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const navItems = [
  {
    id: "home",
    label: "Home",
    path: "/",
    icon: <Home className="h-5 w-5" />,
    description: "Flow gallery",
  },
  {
    id: "simple",
    label: "Simple Flow",
    path: "/simple",
    icon: <Layers className="h-5 w-5" />,
    description: "Linear progression",
  },
  {
    id: "branching",
    label: "Branching Flow",
    path: "/branching",
    icon: <GitBranch className="h-5 w-5" />,
    description: "Conditional navigation",
  },
  {
    id: "task",
    label: "Task Flow",
    path: "/task",
    icon: <ListTodo className="h-5 w-5" />,
    description: "Multiple instances",
  },
  {
    id: "survey",
    label: "Survey Flow",
    path: "/survey",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Event hooks demo",
  },
];

export function SideNav() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button - Fixed top left, below drawer */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 bg-background"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        // biome-ignore lint/a11y/noStaticElementInteractions: ignore
        // biome-ignore lint/a11y/useKeyWithClickEvents: ignore
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-background border-r z-[60] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Card className="h-full border-0 rounded-none">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>useFlow Example Flows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-auto py-3 ${
                      isActive
                        ? ""
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {item.icon}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

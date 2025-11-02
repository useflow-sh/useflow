import {
  BarChart3,
  Cloud,
  GitBranch,
  Home,
  Layers,
  ListTodo,
  Settings,
  Workflow,
} from "lucide-react";
import type { ComponentType } from "react";

// Import all page components
import { FlowGallery } from "../components/FlowGallery";
import { BranchingFlowDemo } from "../flows/branching/FlowDemo";
import { DynamicFlowDemo } from "../flows/dynamic/FlowDemo";
import { FlowModificationDemo } from "../flows/flow-modification-demo/FlowModificationDemo";
import { RemoteFlowDemo } from "../flows/remote/RemoteFlowDemo";
import { SimpleFlowDemo } from "../flows/simple/FlowDemo";
import { SurveyFlowDemo } from "../flows/survey/FlowDemo";
import { TaskFlowDemo } from "../flows/task/FlowDemo";

export interface PageConfig {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  component: ComponentType;
  category?: "examples" | "interactive";
  isGalleryItem?: boolean;
  galleryTitle?: string;
  galleryDescription?: string;
  features?: string[];
  complexityLabel?: string;
}

export const pages: PageConfig[] = [
  {
    id: "home",
    label: "Home",
    path: "/",
    icon: Home,
    description: "Flow gallery",
    component: FlowGallery,
    category: "examples",
    isGalleryItem: false,
  },
  {
    id: "flow-modification-demo",
    label: "Flow Modification",
    path: "/flow-modification-demo",
    icon: Settings,
    description: "Modifying flows (static & dynamic)",
    component: FlowModificationDemo,
    category: "interactive",
    isGalleryItem: true,
    galleryTitle: "Flow Modification Demo",
    galleryDescription:
      "Interactive demo showing how easy it is to modify flows in real-time with useFlow.",
    features: ["Modifying flows (static & dynamic)", "Interactive live demo"],
  },
  {
    id: "simple",
    label: "Simple Flow",
    path: "/simple",
    icon: Layers,
    description: "Linear progression",
    component: SimpleFlowDemo,
    category: "examples",
    isGalleryItem: true,
    galleryTitle: "Simple Flow",
    galleryDescription: "Basic linear step progression with persistence",
    features: [
      "Linear step progression",
      "Context updates (setContext)",
      "Navigation control (next/back)",
      "State persistence (persister)",
    ],
    complexityLabel: "Simple",
  },
  {
    id: "branching",
    label: "Branching Flow",
    path: "/branching",
    icon: GitBranch,
    description: "Conditional navigation",
    component: BranchingFlowDemo,
    category: "examples",
    isGalleryItem: true,
    galleryTitle: "Branching Flow",
    galleryDescription:
      "Conditional navigation with context and component-driven branching",
    features: [
      "Context-driven branching",
      "Component-driven navigation",
      "Conditional steps",
      "State persistence (persister)",
    ],
    complexityLabel: "Intermediate",
  },
  {
    id: "task",
    label: "Task Flow",
    path: "/task",
    icon: ListTodo,
    description: "Multiple instances",
    component: TaskFlowDemo,
    category: "examples",
    isGalleryItem: true,
    galleryTitle: "Task Flow",
    galleryDescription:
      "Multiple independent flow instances with separate state",
    features: [
      "Reusable flow instances (instanceId)",
      "Independent state per instance",
      "Resume incomplete flows",
      "Per-instance persistence",
    ],
    complexityLabel: "Intermediate",
  },
  {
    id: "survey",
    label: "Survey Flow",
    path: "/survey",
    icon: BarChart3,
    description: "Event hooks demo",
    component: SurveyFlowDemo,
    category: "examples",
    isGalleryItem: true,
    galleryTitle: "Survey Flow",
    galleryDescription:
      "Event hooks demonstration with onNext, onBack, onTransition, and onComplete",
    features: [
      "Event hooks (onNext, onBack, onTransition, onComplete)",
      "Progress tracking with transitions",
      "State persistence (persister)",
      "Event-driven UI updates",
    ],
    complexityLabel: "Intermediate",
  },
  {
    id: "dynamic",
    label: "Flow Variants",
    path: "/dynamic",
    icon: Workflow,
    description: "Multiple flow definitions",
    component: DynamicFlowDemo,
    category: "examples",
    isGalleryItem: true,
    galleryTitle: "Flow Variants",
    galleryDescription:
      "Reuse components across multiple flow definitions with runtime switching",
    features: [
      "Multiple flow definitions",
      "Shared component library",
      "Runtime flow switching",
      "Role-based or feature-flagged flows",
    ],
    complexityLabel: "Advanced",
  },
  {
    id: "remote",
    label: "Remote Configuration",
    path: "/remote",
    icon: Cloud,
    description: "Load flows from database/API",
    component: RemoteFlowDemo,
    category: "examples",
    isGalleryItem: true,
    galleryTitle: "Remote Configuration",
    galleryDescription:
      "Load flow configurations from external sources and test variants without deployment",
    features: [
      "Fetch flows from database/API",
      "Flow variants for A/B testing",
      "TanStack Query integration",
      "Change flows without deployment",
    ],
    complexityLabel: "Advanced",
  },
];

// Helper functions
export const getPageById = (id: string) => pages.find((page) => page.id === id);
export const getPageByPath = (path: string) =>
  pages.find((page) => page.path === path);
export const getGalleryItems = () => pages.filter((page) => page.isGalleryItem);
export const getNavItems = () => pages;
export const getPagesByCategory = (category: PageConfig["category"]) =>
  pages.filter((page) => page.category === category);

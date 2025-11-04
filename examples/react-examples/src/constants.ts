import { BookOpen, Github as GithubIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface ExternalLink {
  label: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
}

export const EXTERNAL_LINKS: ExternalLink[] = [
  {
    label: "GitHub",
    url: "https://github.com/useflow-sh/useflow",
    icon: GithubIcon,
  },
  {
    label: "Documentation",
    url: "https://docs.useflow.sh",
    icon: BookOpen,
  },
];

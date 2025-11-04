import { BookOpen, Github as GithubIcon } from "lucide-react";
import type { ComponentType } from "react";

export const REPO_URL: string = import.meta.env.VITE_REPO_URL;
export const DOCS_URL: string = import.meta.env.VITE_DOCS_URL;

export interface ExternalLink {
  label: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
}

export const EXTERNAL_LINKS: ExternalLink[] = [
  {
    label: "GitHub",
    url: REPO_URL,
    icon: GithubIcon,
  },
  {
    label: "Documentation",
    url: DOCS_URL,
    icon: BookOpen,
  },
];

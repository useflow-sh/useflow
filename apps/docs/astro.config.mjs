// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightThemeObsidian from "starlight-theme-obsidian";

// Repository constants
const REPO_URL = "https://github.com/useflow-sh/useflow";

// https://astro.build/config
export default defineConfig({
  vite: {
    ssr: {
      noExternal: ["zod"],
    },
  },
  integrations: [
    starlight({
      plugins: [
        starlightThemeObsidian({
          graph: false,
        }),
      ],
      title: "useFlow",
      description:
        "Type-safe, declarative multi-step flows for React applications",
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: REPO_URL,
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Overview", link: "/getting-started/overview" },
            { label: "Why useFlow?", link: "/getting-started/why-useflow" },
            { label: "Installation", link: "/getting-started/installation" },
            { label: "Quick Start", link: "/getting-started/quick-start" },
            { label: "TypeScript", link: "/getting-started/typescript" },
            {
              label: "Decision Guide",
              link: "/getting-started/decision-guide",
            },
          ],
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Overview", link: "/core-concepts/" },
            { label: "Flows", link: "/core-concepts/flows" },
            { label: "Steps", link: "/core-concepts/steps" },
            { label: "Context", link: "/core-concepts/context" },
            { label: "Navigation", link: "/core-concepts/navigation" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Linear Flows", link: "/guides/linear-flows" },
            { label: "Branching", link: "/guides/branching" },
            { label: "Flow Variants", link: "/guides/flow-variants" },
            { label: "Persistence", link: "/guides/persistence" },
            { label: "Callbacks", link: "/guides/callbacks" },
            { label: "Custom Layouts", link: "/guides/custom-layouts" },
            {
              label: "Global Configuration",
              link: "/guides/global-configuration",
            },
            { label: "Migrations", link: "/guides/migrations" },
            { label: "Testing", link: "/guides/testing" },
            { label: "Troubleshooting", link: "/guides/troubleshooting" },
          ],
        },
        {
          label: "Recipes",
          items: [
            { label: "Overview", link: "/recipes/" },
            { label: "Onboarding", link: "/recipes/onboarding" },
            { label: "Checkout", link: "/recipes/checkout" },
            { label: "Survey", link: "/recipes/survey" },
          ],
        },
        {
          label: "API Reference",
          items: [
            { label: "Overview", link: "/api-reference/" },
            { label: "defineFlow", link: "/api-reference/define-flow" },
            { label: "Flow Component", link: "/api-reference/flow-component" },
            { label: "useFlow Hook", link: "/api-reference/use-flow" },
          ],
        },
      ],
    }),
  ],
});
